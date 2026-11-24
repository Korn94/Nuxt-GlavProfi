// app/utils/legalText.ts
/**
 * 📜 Инлайн-разметка юридических текстов: `**жирный**` → `<strong>`.
 *
 * Зачем: тексты живут в `app/components/pages/public/legal/data/*` в виде
 * markdown-подобных строк — их напрямую берёт сервер для `/privacy-policy.md`
 * и `/terms-of-service.md`. HTML-страницы рендерят ТЕ ЖЕ строки, поэтому нужен
 * один маленький конвертер, а не второй экземпляр текста.
 *
 * ⚠️ HTML экранируется ВСЕГДА, поэтому `v-html` в SFC безопасен: строки
 * статические, из репозитория, а не пользовательский ввод.
 */
import type { LegalBlock } from '~/components/pages/public/legal/types';

/** `**ИП Главацкий П.Е.**` → `<strong>ИП Главацкий П.Е.</strong>` (с escape HTML). */
export function toInlineHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Блок → view-model для шаблона.
 * Оба поля есть всегда (для «другого» вида — пустые): так шаблону не нужен
 * `v-else`-narrowing, на котором vue-tsc легко спотыкается.
 */
export interface LegalBlockView {
  /** 'text' — абзац, 'list' — маркированный список */
  kind: 'text' | 'list';
  /** HTML абзаца; для списка — пустая строка */
  html: string;
  /** HTML пунктов списка; для абзаца — пустой массив */
  items: string[];
}

/** Блоки раздела → view-model с готовым HTML. */
export function toLegalBlockViews(blocks: readonly LegalBlock[]): LegalBlockView[] {
  return blocks.map((block) => (typeof block === 'string'
    ? { kind: 'text', html: toInlineHtml(block), items: [] }
    : { kind: 'list', html: '', items: block.map((item) => toInlineHtml(item)) }));
}
