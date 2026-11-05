#!/usr/bin/env node
/**
 * 🔍 Проверка sitemap.xml: все ли URL из карты сайта отдают 200.
 *
 * Зачем: sitemap — это обещание поисковику «эти страницы существуют».
 * Любой 404 внутри него ухудшает индексацию, поэтому проверку стоит гонять
 * после деплоя (и локально перед деплоем).
 *
 * Использование:
 *   node scripts/check-sitemap.mjs                        # прод (SITEMAP_BASE_URL или https://glavprofi.ru)
 *   node scripts/check-sitemap.mjs http://localhost:3000   # локальный dev / preview
 *   SITEMAP_BASE_URL=http://localhost:3000 npm run sitemap:check
 *
 * Код выхода:
 *   0 — все URL отвечают 200 (редиректы 301/302 считаются предупреждением);
 *   1 — есть битые URL или sitemap не удалось загрузить.
 */
import process from 'node:process'

const baseUrl = (process.argv[2] || process.env.SITEMAP_BASE_URL || 'https://glavprofi.ru').replace(/\/+$/, '')
const sitemapUrl = `${baseUrl}/sitemap.xml`

const CONCURRENCY = 6
const TIMEOUT_MS = 15_000
const USER_AGENT = 'GlavProfi-sitemap-checker'

const decodeXml = (value) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

/** Достаёт все <loc> из sitemap.xml (включая sitemap-индексы) и убирает дубли */
const extractLocs = (xml) => {
  const locs = []
  const re = /<loc>\s*([\s\S]*?)\s*<\/loc>/gi
  let match
  while ((match = re.exec(xml)) !== null) {
    const loc = decodeXml(match[1].trim())
    if (loc) locs.push(loc)
  }
  return [...new Set(locs)]
}

const checkUrl = async (url) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    })
    return {
      url,
      status: response.status,
      location: response.headers.get('location') || undefined,
    }
  } catch (error) {
    return { url, status: 0, error: error?.message || String(error) }
  } finally {
    clearTimeout(timer)
  }
}

/** Простой пул: не больше `concurrency` одновременных запросов */
const runPool = async (items, worker, concurrency) => {
  const results = []
  let index = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++]
      results.push(await worker(current))
    }
  })
  await Promise.all(runners)
  return results
}

const main = async () => {
  console.log(`🔍 Sitemap: ${sitemapUrl}\n`)

  let xml
  try {
    const response = await fetch(sitemapUrl, { headers: { 'User-Agent': USER_AGENT } })
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
    xml = await response.text()
  } catch (error) {
    console.error(`❌ Не удалось загрузить sitemap: ${error?.message || error}`)
    process.exit(1)
  }

  const locs = extractLocs(xml)
  if (locs.length === 0) {
    console.error('❌ В sitemap не найдено ни одного <loc>')
    process.exit(1)
  }

  console.log(`📄 URL в sitemap: ${locs.length}\n`)

  const results = await runPool(locs, checkUrl, CONCURRENCY)
  results.sort((a, b) => a.url.localeCompare(b.url))

  const problems = []
  const redirects = []

  for (const result of results) {
    const isOk = result.status === 200
    const isRedirect = result.status >= 300 && result.status < 400

    if (isRedirect) redirects.push(result)
    else if (!isOk) problems.push(result)

    const icon = isOk ? '✅' : isRedirect ? '↪️ ' : '❌'
    const status = result.status === 0 ? 'ERR' : String(result.status)
    const suffix = isRedirect && result.location
      ? ` → ${result.location}`
      : result.error
        ? ` (${result.error})`
        : ''

    console.log(`${icon} ${status.padStart(3)}  ${result.url}${suffix}`)
  }

  console.log('')
  if (redirects.length > 0) {
    console.log(`↪️  Редиректов: ${redirects.length} — в sitemap лучше указывать конечный URL`)
  }
  if (problems.length > 0) {
    console.error(`❌ Проблемных URL: ${problems.length}`)
    for (const problem of problems) {
      console.error(`   • ${problem.url}`)
    }
    process.exit(1)
  }

  console.log(`✅ Все ${results.length} URL отвечают 200`)
}

main()
