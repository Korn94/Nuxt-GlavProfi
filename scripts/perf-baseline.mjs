// scripts/perf-baseline.mjs
/**
 * 📊 Замер первой загрузки страниц (Фаза 0 / контроль регрессий).
 *
 * Измеряем:
 *   1. TTFB и полное время ответа HTML (3 попытки, медиана).
 *   2. Cache-Control HTML — работает ли bfcache.
 *   3. Вес критических ассетов `/_nuxt/*.js|*.css` из SSR-HTML.
 *   4. Вес медиа, на которое ссылается SSR-HTML (img src, video poster/source).
 *
 * Запуск:
 *   node scripts/perf-baseline.mjs
 *   node scripts/perf-baseline.mjs --base=http://localhost:3000
 *   node scripts/perf-baseline.mjs --out=logs/perf-after.md
 *
 * Скрипт ничего не меняет на сервере: только GET/HEAD.
 */

import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import zlib from 'node:zlib'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith('--' + name + '='))
  return hit ? hit.slice(name.length + 3) : fallback
}

const BASE = getArg('base', 'https://glavprofi.ru').replace(/\/+$/, '')
const OUT = getArg('out', 'logs/perf-baseline.md')
const ROUTES = getArg('routes', '/,/prices/otdelochnye-raboty,/projects,/remont-pomescheniy,/about')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean)

const ATTEMPTS = 3
const HEAD_CONCURRENCY = 6
const LOCAL_PUBLIC = path.resolve('.output/public')

const CRITICAL_RE = /\/_nuxt\/[^"' )]+\.(?:js|css)/g
const MEDIA_RE = /["'(](\/[^"' )]+\.(?:mp4|webm|jpe?g|png|webp|avif))["')]/g

/**
 * Реально запрашиваемые браузером ассеты — только из тегов разметки.
 * ⚠️ Нельзя сканировать «все пути `/_nuxt/…` в HTML»: Nuxt кладёт в payload
 * полный build-manifest, и в подсчёт попадали чанки, которые никто не грузит.
 */
function collectTags(html, tagName) {
  const re = new RegExp('<' + tagName + '\\b[^>]*>', 'gi')
  return [...html.matchAll(re)].map((m) => m[0])
}

function attr(tag, name) {
  const match = tag.match(new RegExp('\\b' + name + '="([^"]*)"', 'i'))
  return match ? match[1] : null
}

/** Критические JS/CSS: <script src>, <link rel=modulepreload|stylesheet|preload> */
function collectCriticalAssets(html) {
  const found = new Set()

  for (const tag of collectTags(html, 'script')) {
    const src = attr(tag, 'src')
    if (src && src.startsWith('/_nuxt/') && src.endsWith('.js')) found.add(src)
  }

  for (const tag of collectTags(html, 'link')) {
    const rel = (attr(tag, 'rel') || '').toLowerCase()
    const href = attr(tag, 'href')
    if (!href || !href.startsWith('/_nuxt/')) continue

    if (rel === 'modulepreload' && href.endsWith('.js')) found.add(href)
    else if (rel === 'stylesheet' && href.endsWith('.css')) found.add(href)
    else if (rel === 'preload' && /\.(?:js|css)$/.test(href)) found.add(href)
  }

  return [...found]
}

/**
 * Медиа из разметки: <img src|srcset>, <video poster>, <source src>, <link rel=preload as=image>.
 * Из srcset берётся ОДИН кандидат (960w, иначе самый широкий) — браузер тоже
 * скачивает ровно один вариант, а не все.
 */
function collectMediaAssets(html) {
  const found = new Set()
  const MEDIA_EXT = /\.(?:mp4|webm|jpe?g|png|webp|avif)$/i

  const pickCandidate = (srcset) => {
    const candidates = srcset
      .split(',')
      .map((item) => item.trim().split(/\s+/))
      .filter(([url]) => url)
    if (!candidates.length) return null
    const withWidth = candidates
      .map(([url, descriptor]) => ({ url, width: Number((descriptor || '').replace('w', '')) || 0 }))
      .sort((a, b) => a.width - b.width)
    const middle = withWidth.find((item) => item.width === 960) ?? withWidth[withWidth.length - 1]
    return middle?.url ?? null
  }

  for (const tag of [...collectTags(html, 'img'), ...collectTags(html, 'video'), ...collectTags(html, 'source')]) {
    const candidates = [
      attr(tag, 'src'),
      attr(tag, 'poster'),
      pickCandidate(attr(tag, 'srcset') || '')
    ]
    for (const url of candidates) {
      if (url && url.startsWith('/') && MEDIA_EXT.test(url)) found.add(url)
    }
  }

  for (const tag of collectTags(html, 'link')) {
    if ((attr(tag, 'rel') || '').toLowerCase() !== 'preload') continue
    if ((attr(tag, 'as') || '').toLowerCase() !== 'image') continue
    const href = attr(tag, 'href')
    if (href && MEDIA_EXT.test(href)) found.add(href)
  }

  return [...found]
}

async function timedFetch(url) {
  const started = performance.now()
  const res = await fetch(url, { redirect: 'manual', headers: { 'accept-encoding': 'gzip' } })
  let firstByteMs = 0
  const chunks = []
  if (res.body) {
    const reader = res.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!firstByteMs) firstByteMs = performance.now() - started
      chunks.push(Buffer.from(value))
    }
  }
  return { res, body: Buffer.concat(chunks), firstByteMs, totalMs: performance.now() - started }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function formatBytes(bytes) {
  if (!bytes) return '0'
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' МБ'
  return (bytes / 1024).toFixed(1) + ' КБ'
}

/** Точный gzip-размер локального файла из .output/public (имена с хэшами совпадают) */
function localGzipSize(urlPath) {
  const file = path.join(LOCAL_PUBLIC, urlPath.replace(/^\//, ''))
  if (!fs.existsSync(file)) return null
  try {
    return zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length
  } catch {
    return null
  }
}

/**
 * Точный сетевой вес ассета: считаем БАЙТЫ, реально пришедшие по сети.
 * fetch() не подходит — он прозрачно распаковывает gzip, а content-length при
 * gzip-сжатии «на лету» (nginx, chunked) вообще отсутствует.
 * node:https отдаёт сырой поток, поэтому длина = то, что скачает браузер.
 */
function assetSize(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https:') ? https : http
    const req = lib.request(url, { method: 'GET', headers: { 'accept-encoding': 'gzip' } }, (res) => {
      let bytes = 0
      res.on('data', (chunk) => {
        bytes += chunk.length
      })
      res.on('end', () => resolve(res.statusCode && res.statusCode < 400 ? bytes : null))
      res.on('error', () => resolve(null))
    })
    req.on('error', () => resolve(null))
    req.setTimeout(20000, () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
}

async function mapLimit(items, limit, worker) {
  const results = []
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor++
      if (index >= items.length) return
      results[index] = await worker(items[index])
    }
  })
  await Promise.all(runners)
  return results
}

/** Уникальные ассеты одного типа из HTML */
function collect(html, regex) {
  const found = new Set()
  for (const match of html.matchAll(regex)) {
    const value = match[1] ?? match[0]
    if (!value || value.startsWith('data:') || value.startsWith('http')) continue
    found.add(value.startsWith('/') ? value : '/' + value.replace(/^\.?\//, ''))
  }
  return [...found]
}

// ─────────────────────────────────────────────────────────────
// Замер одной страницы
// ─────────────────────────────────────────────────────────────

async function measurePage(route) {
  const url = BASE + route
  const runs = []
  let last = null

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const result = await timedFetch(url)
    runs.push({ ttfb: result.firstByteMs, total: result.totalMs })
    last = result
  }

  const { res, body } = last
  const html = body.toString('utf8')
  const cacheControl = res.headers.get('cache-control') || '—'
  // fetch (undici) уже распаковал тело, поэтому gzip считаем локально — иначе
  // в отчёте окажется несжатый размер.
  const htmlGzip = zlib.gzipSync(body, { level: 9 }).length

  const base = {
    route,
    status: res.status,
    location: res.headers.get('location'),
    cacheControl,
    ttfb: median(runs.map((r) => r.ttfb)),
    total: median(runs.map((r) => r.total)),
    htmlGzip,
    js: [],
    css: [],
    media: [],
    jsRaw: 0,
    jsGzip: 0,
    cssRaw: 0,
    cssGzip: 0,
    mediaRaw: 0
  }

  // Редирект (routeRules) или ошибка — ассеты не считаем
  if (res.status >= 300) return base

  const criticalAssets = collectCriticalAssets(html)
  const mediaAssets = collectMediaAssets(html)
  const jsPaths = criticalAssets.filter((p) => p.endsWith('.js'))
  const cssPaths = criticalAssets.filter((p) => p.endsWith('.css'))
  const all = [...new Set([...criticalAssets, ...mediaAssets])]

  const sizes = await mapLimit(all, HEAD_CONCURRENCY, async (assetPath) => {
    const local = localGzipSize(assetPath)
    // Приоритет: локальный gzip той же сборки (эталон) → реальный сетевой вес
    const size = local ?? (await assetSize(BASE + assetPath)) ?? 0
    return { assetPath, size }
  })
  const sizeMap = new Map(sizes.map((s) => [s.assetPath, s.size]))

  const pick = (list) =>
    list
      .map((assetPath) => ({ path: assetPath, size: sizeMap.get(assetPath) ?? 0 }))
      .sort((a, b) => b.size - a.size)

  const js = pick(jsPaths)
  const css = pick(cssPaths)
  const media = pick(mediaAssets)
  const sum = (list) => list.reduce((acc, item) => acc + (item.size || 0), 0)

  return {
    ...base,
    js,
    css,
    media,
    jsGzip: sum(js),
    cssGzip: sum(css),
    mediaRaw: sum(media)
  }
}


// ─────────────────────────────────────────────────────────────
// Отчёт
// ─────────────────────────────────────────────────────────────

function renderReport(rows) {
  const lines = []
  lines.push('# Замер первой загрузки — ' + new Date().toISOString())
  lines.push('')
  lines.push('База: `' + BASE + '`')
  lines.push('')
  lines.push('> Все размеры — сетевые, сжатые (gzip), как их получает браузер.')
  lines.push('>')
  lines.push('> ⚠️ Учтены только ассеты из SSR-HTML (`<script>`, `modulepreload`, `stylesheet`)')
  lines.push('> и медиа из разметки. Чанки, которые плагины запрашивают уже в рантайме через')
  lines.push('> `import()`, в эти цифры НЕ входят — например `@telegram-apps/sdk` (22.5 КБ gzip)')
  lines.push('> до изоляции грузился на каждой странице, но в отчёт не попадал.')
  lines.push('')
  lines.push('| Страница | TTFB, мс | HTML, мс | HTML gzip | JS | CSS | Медиа | Cache-Control |')
  lines.push('|---|---|---|---|---|---|---|---|')
  for (const r of rows) {
    lines.push(
      '| ' + r.route + ' | ' + r.ttfb.toFixed(0) + ' | ' + r.total.toFixed(0) + ' | ' +
        formatBytes(r.htmlGzip) + ' | ' + formatBytes(r.jsGzip) + ' | ' + formatBytes(r.cssGzip) + ' | ' +
        formatBytes(r.mediaRaw) + ' | `' + r.cacheControl + '` |'
    )
  }
  lines.push('')

  for (const r of rows) {
    lines.push('## ' + r.route + ' (HTTP ' + r.status + ')')
    if (r.status >= 300) {
      lines.push('- редирект → `' + r.location + '`')
      lines.push('')
      continue
    }

    lines.push('- JS: **' + formatBytes(r.jsGzip) + '** (' + r.js.length + ' файлов)')
    lines.push('| JS | gzip |')
    lines.push('|---|---|')
    for (const item of r.js.slice(0, 12)) {
      lines.push('| `' + item.path + '` | ' + formatBytes(item.size) + ' |')
    }
    lines.push('')

    lines.push('- CSS: **' + formatBytes(r.cssGzip) + '**')
    lines.push('| CSS | gzip |')
    lines.push('|---|---|')
    for (const item of r.css) {
      lines.push('| `' + item.path + '` | ' + formatBytes(item.size) + ' |')
    }
    lines.push('')

    lines.push('- медиа из разметки: **' + formatBytes(r.mediaRaw) + '** (' + r.media.length + ' файлов)')
    lines.push('| Медиа | размер |')
    lines.push('|---|---|')
    for (const item of r.media) {
      lines.push('| `' + item.path + '` | ' + formatBytes(item.size) + ' |')
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────

const rows = []
for (const route of ROUTES) {
  process.stdout.write('... ' + route + ' ')
  try {
    const row = await measurePage(route)
    rows.push(row)
    console.log(
      'TTFB ' + row.ttfb.toFixed(0) + ' ms | JS ' + formatBytes(row.jsGzip) + ' | CSS ' +
        formatBytes(row.cssGzip) + ' | media ' + formatBytes(row.mediaRaw)
    )
  } catch (error) {
    console.log('ERROR: ' + error.message)
    rows.push({
      route,
      status: 0,
      cacheControl: '—',
      ttfb: 0,
      total: 0,
      htmlGzip: 0,
      js: [],
      css: [],
      media: [],
      jsGzip: 0,
      cssGzip: 0,
      mediaRaw: 0
    })
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, renderReport(rows) + '\n', 'utf8')
console.log('\nReport: ' + OUT)

