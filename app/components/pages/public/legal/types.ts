// app/components/pages/public/legal/types.ts
/**
 * 📜 Типы юридических страниц (`/privacy-policy`, `/terms-of-service`).
 *
 * Один источник данных для HTML и для markdown-версии (`.md`): тексты живут
 * в `legal/data/*.ts`, а не внутри SFC, потому что Nitro не может импортировать
 * `.vue` — раньше markdown-версию пришлось бы дублировать и тексты бы разъехались.
 */

/**
 * Блок раздела: абзац (строка) или маркированный список (массив строк).
 * `**…**` внутри строки — жирный текст: в HTML он рендерится через
 * `app/utils/legalText.ts` (`<strong>`), в markdown уходит как есть.
 */
export type LegalBlock = string | readonly string[];

/** Раздел документа: заголовок `<h2>` и блоки в порядке вывода. */
export interface LegalSection {
  title: string;
  blocks: readonly LegalBlock[];
}

/** Юридическая страница целиком. */
export interface LegalPage {
  /** `<h1>` страницы и `#`-заголовок markdown-версии */
  title: string;
  /** Одна строка-описание: блок `>` в markdown-версии */
  summary: string;
  sections: readonly LegalSection[];
}
