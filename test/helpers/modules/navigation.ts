import { click, focusMain } from './core';

export async function showPage(page: string) {
  await focusMain();
  await click(`.side-nav div[title="${page}"]`);
}
