// app/utils/russianStemmer.ts
/**
 * Русский стеммер Портера (алгоритм Snowball, язык "Russian").
 *
 * Самодостаточная TypeScript-реализация, портированная из Snowball JS Library:
 *   - Snowball JavaScript Library v0.3, Copyright 2010 Oleg Mazko (MPL)
 *   - lunr-languages (Russian), Copyright 2014 Mihai Valentin (MPL)
 *   - http://snowball.tartarus.org/
 *
 * ⚠️ Стеммер ожидает на входе уже нормализованное слово:
 *    только строчные буквы, «ё» заменено на «е».
 *    (Snowball «не знает» букву «ё» и заглавные кириллические буквы.)
 *
 * Используется поиском по прайс-листу, чтобы «штукатуркой»/«штукатурки»
 * находили «штукатурка», как того требует русская морфология.
 */

// ============================================================
// Вспомогательный примитив Among (суффикс + правило перехода)
// ============================================================
class Among {
  readonly sSize: number
  readonly s: number[]
  readonly substringI: number
  readonly result: number
  readonly method: (() => boolean) | null

  constructor(s: string, substringI: number, result: number, method?: () => boolean) {
    this.sSize = s.length
    this.s = Array.from(s, ch => ch.charCodeAt(0))
    this.substringI = substringI
    this.result = result
    this.method = method ?? null
  }
}

// ============================================================
// SnowballProgram — минимальный исполнитель операций Snowball
// ============================================================
class SnowballProgram {
  private current = ''
  bra = 0
  ket = 0
  limit = 0
  cursor = 0
  limitBackward = 0

  setCurrent(word: string): void {
    this.current = word
    this.cursor = 0
    this.limit = word.length
    this.limitBackward = 0
    this.bra = this.cursor
    this.ket = this.limit
  }

  getCurrent(): string {
    return this.current
  }

  /** Идём вперёд, пока символ входит в группу (битовая маска диапазона [min..max]). */
  inGrouping(s: number[], min: number, max: number): boolean {
    if (this.cursor < this.limit) {
      let ch = this.current.charCodeAt(this.cursor)
      if (ch <= max && ch >= min) {
        ch -= min
        if (s[ch >> 3]! & (0x1 << (ch & 0x7))) {
          this.cursor++
          return true
        }
      }
    }
    return false
  }

  /** Идём вперёд, пока символ НЕ входит в группу. */
  outGrouping(s: number[], min: number, max: number): boolean {
    if (this.cursor < this.limit) {
      let ch = this.current.charCodeAt(this.cursor)
      if (ch > max || ch < min) {
        this.cursor++
        return true
      }
      ch -= min
      if (!(s[ch >> 3]! & (0x1 << (ch & 0x7)))) {
        this.cursor++
        return true
      }
    }
    return false
  }

  /** Сравнение строки s, примыкающей СПРАВА к cursor (двигает cursor назад при успехе). */
  eqSBackward(sSize: number, s: string): boolean {
    if (this.cursor - this.limitBackward < sSize) return false
    for (let i = 0; i < sSize; i++) {
      if (this.current.charCodeAt(this.cursor - sSize + i) !== s.charCodeAt(i)) return false
    }
    this.cursor -= sSize
    return true
  }

  /** Поиск суффикса из упорядоченного списка amoungs (бинарный поиск + досмотр). */
  findAmongBackward(v: Among[]): number {
    let i = 0
    let j = v.length
    const c = this.cursor
    const lb = this.limitBackward
    let commonI = 0
    let commonJ = 0
    let firstKeyInspected = false

    while (true) {
      const k = i + ((j - i) >> 1)
      let diff = 0
      let common = commonI < commonJ ? commonI : commonJ
      const w = v[k]!
      for (let i2 = w.sSize - 1 - common; i2 >= 0; i2--) {
        if (c - common === lb) {
          diff = -1
          break
        }
        diff = this.current.charCodeAt(c - 1 - common) - w.s[i2]!
        if (diff) break
        common++
      }
      if (diff < 0) {
        j = k
        commonJ = common
      } else {
        i = k
        commonI = common
      }
      if (j - i <= 1) {
        if (i > 0 || j === i || firstKeyInspected) break
        firstKeyInspected = true
      }
    }

    while (true) {
      const w = v[i]!
      if (commonI >= w.sSize) {
        this.cursor = c - w.sSize
        if (!w.method) return w.result
        const res = w.method()
        this.cursor = c - w.sSize
        if (res) return w.result
      }
      i = w.substringI
      if (i < 0) return 0
    }
  }

  private replaceS(cBra: number, cKet: number, s: string): number {
    const adjustment = s.length - (cKet - cBra)
    const left = this.current.substring(0, cBra)
    const right = this.current.substring(cKet)
    this.current = left + s + right
    this.limit += adjustment
    if (this.cursor >= cKet) this.cursor += adjustment
    else if (this.cursor > cBra) this.cursor = cBra
    return adjustment
  }

  private sliceCheck(): void {
    if (
      this.bra < 0 ||
      this.bra > this.ket ||
      this.ket > this.limit ||
      this.limit > this.current.length
    ) {
      throw new Error('faulty slice operation')
    }
  }

  sliceFrom(s: string): void {
    this.sliceCheck()
    this.replaceS(this.bra, this.ket, s)
  }

  sliceDel(): void {
    this.sliceFrom('')
  }
}

// ============================================================
// Русский стеммер
// ============================================================
class RussianStemmer {
  private readonly a0: Among[]
  private readonly a1: Among[]
  private readonly a2: Among[]
  private readonly a3: Among[]
  private readonly a4: Among[]
  private readonly a5: Among[]
  private readonly a6: Among[]
  private readonly a7: Among[]

  private pV = 0
  private p2 = 0
  private readonly program = new SnowballProgram()

  constructor() {
    // perfective gerund
    this.a0 = [
      new Among('в', -1, 1),
      new Among('ив', 0, 2),
      new Among('ыв', 0, 2),
      new Among('вши', -1, 1),
      new Among('ивши', 3, 2),
      new Among('ывши', 3, 2),
      new Among('вшись', -1, 1),
      new Among('ившись', 6, 2),
      new Among('ывшись', 6, 2),
    ]

    // adjective
    this.a1 = [
      new Among('ее', -1, 1),
      new Among('ие', -1, 1),
      new Among('ое', -1, 1),
      new Among('ые', -1, 1),
      new Among('ими', -1, 1),
      new Among('ыми', -1, 1),
      new Among('ей', -1, 1),
      new Among('ий', -1, 1),
      new Among('ой', -1, 1),
      new Among('ый', -1, 1),
      new Among('ем', -1, 1),
      new Among('им', -1, 1),
      new Among('ом', -1, 1),
      new Among('ым', -1, 1),
      new Among('его', -1, 1),
      new Among('ого', -1, 1),
      new Among('ему', -1, 1),
      new Among('ому', -1, 1),
      new Among('их', -1, 1),
      new Among('ых', -1, 1),
      new Among('ею', -1, 1),
      new Among('ою', -1, 1),
      new Among('ую', -1, 1),
      new Among('юю', -1, 1),
      new Among('ая', -1, 1),
      new Among('яя', -1, 1),
    ]

    // participle
    this.a2 = [
      new Among('ем', -1, 1),
      new Among('нн', -1, 1),
      new Among('вш', -1, 1),
      new Among('ивш', 2, 2),
      new Among('ывш', 2, 2),
      new Among('щ', -1, 1),
      new Among('ющ', 5, 1),
      new Among('ующ', 6, 2),
    ]

    // reflexive
    this.a3 = [
      new Among('сь', -1, 1),
      new Among('ся', -1, 1),
    ]

    // verb
    this.a4 = [
      new Among('ла', -1, 1),
      new Among('ила', 0, 2),
      new Among('ыла', 0, 2),
      new Among('на', -1, 1),
      new Among('ена', 3, 2),
      new Among('ете', -1, 1),
      new Among('ите', -1, 2),
      new Among('йте', -1, 1),
      new Among('ейте', 7, 2),
      new Among('уйте', 7, 2),
      new Among('ли', -1, 1),
      new Among('или', 10, 2),
      new Among('ыли', 10, 2),
      new Among('й', -1, 1),
      new Among('ей', 13, 2),
      new Among('уй', 13, 2),
      new Among('л', -1, 1),
      new Among('ил', 16, 2),
      new Among('ыл', 16, 2),
      new Among('ем', -1, 1),
      new Among('им', -1, 2),
      new Among('ым', -1, 2),
      new Among('н', -1, 1),
      new Among('ен', 22, 2),
      new Among('ло', -1, 1),
      new Among('ило', 24, 2),
      new Among('ыло', 24, 2),
      new Among('но', -1, 1),
      new Among('ено', 27, 2),
      new Among('нно', 27, 1),
      new Among('ет', -1, 1),
      new Among('ует', 30, 2),
      new Among('ит', -1, 2),
      new Among('ыт', -1, 2),
      new Among('ют', -1, 1),
      new Among('уют', 34, 2),
      new Among('ят', -1, 2),
      new Among('ны', -1, 1),
      new Among('ены', 37, 2),
      new Among('ть', -1, 1),
      new Among('ить', 39, 2),
      new Among('ыть', 39, 2),
      new Among('ешь', -1, 1),
      new Among('ишь', -1, 2),
      new Among('ю', -1, 2),
      new Among('ую', 44, 2),
    ]

    // noun
    this.a5 = [
      new Among('а', -1, 1),
      new Among('ев', -1, 1),
      new Among('ов', -1, 1),
      new Among('е', -1, 1),
      new Among('ие', 3, 1),
      new Among('ье', 3, 1),
      new Among('и', -1, 1),
      new Among('еи', 6, 1),
      new Among('ии', 6, 1),
      new Among('ами', 6, 1),
      new Among('ями', 6, 1),
      new Among('иями', 10, 1),
      new Among('й', -1, 1),
      new Among('ей', 12, 1),
      new Among('ией', 13, 1),
      new Among('ий', 12, 1),
      new Among('ой', 12, 1),
      new Among('ам', -1, 1),
      new Among('ем', -1, 1),
      new Among('ием', 18, 1),
      new Among('ом', -1, 1),
      new Among('ям', -1, 1),
      new Among('иям', 21, 1),
      new Among('о', -1, 1),
      new Among('у', -1, 1),
      new Among('ах', -1, 1),
      new Among('ях', -1, 1),
      new Among('иях', 26, 1),
      new Among('ы', -1, 1),
      new Among('ь', -1, 1),
      new Among('ю', -1, 1),
      new Among('ию', 30, 1),
      new Among('ью', 30, 1),
      new Among('я', -1, 1),
      new Among('ия', 33, 1),
      new Among('ья', 33, 1),
    ]

    // derivational
    this.a6 = [
      new Among('ост', -1, 1),
      new Among('ость', -1, 1),
    ]

    // tidy up
    this.a7 = [
      new Among('ейше', -1, 1),
      new Among('н', -1, 2),
      new Among('ейш', -1, 1),
      new Among('ь', -1, 3),
    ]
  }

  stem(word: string): string {
    const p = this.program
    p.setCurrent(word)
    this.markRegions()

    p.cursor = p.limit
    // если слово без гласных — RV пуст, суффиксы не трогаем
    if (p.cursor < this.pV) return p.getCurrent()
    p.limitBackward = this.pV

    if (!this.perfectiveGerund()) {
      p.cursor = p.limit
      if (!this.reflexive()) p.cursor = p.limit
      if (!this.adjectival()) {
        p.cursor = p.limit
        if (!this.verb()) {
          p.cursor = p.limit
          this.noun()
        }
      }
    }

    p.cursor = p.limit
    p.ket = p.cursor
    if (p.eqSBackward(1, 'и')) {
      p.bra = p.cursor
      p.sliceDel()
    } else {
      p.cursor = p.limit
    }

    this.derivational()
    p.cursor = p.limit
    this.tidyUp()

    return p.getCurrent()
  }

  private markRegions(): void {
    const p = this.program
    const G_V = [33, 65, 8, 232]
    this.pV = p.limit
    this.p2 = this.pV

    const findVowel = (): boolean => {
      while (!p.inGrouping(G_V, 1072, 1103)) {
        if (p.cursor >= p.limit) return false
        p.cursor++
      }
      return true
    }
    const skipVowels = (): boolean => {
      while (!p.outGrouping(G_V, 1072, 1103)) {
        if (p.cursor >= p.limit) return false
        p.cursor++
      }
      return true
    }

    if (findVowel()) {
      this.pV = p.cursor
      if (skipVowels()) {
        if (findVowel()) {
          if (skipVowels()) {
            this.p2 = p.cursor
          }
        }
      }
    }
  }

  private r2(): boolean {
    return this.p2 <= this.program.cursor
  }

  /** «Сложное» удаление суффикса: вариант 1 требует предшествующую «а»/«я». */
  private habr2(amongs: Among[]): boolean {
    const p = this.program
    p.ket = p.cursor
    const amongVar = p.findAmongBackward(amongs)
    if (amongVar) {
      p.bra = p.cursor
      switch (amongVar) {
        case 1: {
          const v1 = p.limit - p.cursor
          if (!p.eqSBackward(1, 'а')) {
            p.cursor = p.limit - v1
            if (!p.eqSBackward(1, 'я')) return false
          }
        }
        // eslint-disable-next-line no-fallthrough
        case 2:
          p.sliceDel()
          break
      }
      return true
    }
    return false
  }

  private habr1(amongs: Among[]): boolean {
    const p = this.program
    p.ket = p.cursor
    const amongVar = p.findAmongBackward(amongs)
    if (amongVar) {
      p.bra = p.cursor
      if (amongVar === 1) p.sliceDel()
      return true
    }
    return false
  }

  private perfectiveGerund(): boolean {
    return this.habr2(this.a0)
  }

  private adjective(): boolean {
    return this.habr1(this.a1)
  }

  private adjectival(): boolean {
    if (this.adjective()) {
      this.habr2(this.a2)
      return true
    }
    return false
  }

  private reflexive(): boolean {
    return this.habr1(this.a3)
  }

  private verb(): boolean {
    return this.habr2(this.a4)
  }

  private noun(): void {
    this.habr1(this.a5)
  }

  private derivational(): void {
    const p = this.program
    p.ket = p.cursor
    const amongVar = p.findAmongBackward(this.a6)
    if (amongVar) {
      p.bra = p.cursor
      if (this.r2() && amongVar === 1) p.sliceDel()
    }
  }

  private tidyUp(): void {
    const p = this.program
    p.ket = p.cursor
    const amongVar = p.findAmongBackward(this.a7)
    if (amongVar) {
      p.bra = p.cursor
      switch (amongVar) {
        case 1:
          p.sliceDel()
          p.ket = p.cursor
          if (!p.eqSBackward(1, 'н')) break
          p.bra = p.cursor
        // eslint-disable-next-line no-fallthrough
        case 2:
          if (!p.eqSBackward(1, 'н')) break
        // eslint-disable-next-line no-fallthrough
        case 3:
          p.sliceDel()
          break
      }
    }
  }
}

const russianStemmer = new RussianStemmer()

/**
 * Возвращает основу (стемму) русского слова по алгоритму Snowball.
 * Вход должен быть уже нормализован: строчные буквы, «ё» → «е».
 */
export function stemRussian(word: string): string {
  if (!word) return ''
  // Защитная нормализация (идемпотентна, безопасна при повторном вызове)
  return russianStemmer.stem(word.toLowerCase().replace(/ё/g, 'е'))
}

/** Нормализация текста для индекса и запросов: строчные буквы + «ё» → «е» + обрезка. */
export function normalizeRussian(text: string): string {
  return text.toLowerCase().replace(/ё/g, 'е').trim()
}
