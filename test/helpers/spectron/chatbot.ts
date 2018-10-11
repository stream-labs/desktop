// Source helper functions
import { focusMain, focusChild } from '.';
import { contextMenuClick } from './context-menu';
import { setFormDropdown, setFormInput } from './forms';

export async function openCustomCommandWindow(t) {
  await focusMain(t);
}
