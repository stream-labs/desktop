import { click, focusMain } from './core.mjs';

export async function showPage(page: string) {
  await focusMain();
  await click(`.side-nav div[title="${page}"]`);
}
