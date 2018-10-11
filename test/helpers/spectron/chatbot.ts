// Source helper functions
import { focusMain, focusChild } from '.';
import { contextMenuClick } from './context-menu';
import { setFormDropdown, setFormInput } from './forms';
import { GenericTestContext } from 'ava';

export async function openCustomCommandWindow(t: GenericTestContext<any>) {
  await focusMain(t);
  await t.context.app.client.click('.nav-item.Commands');
  await t.context.app.client.click('.nav-item.Custom_Commands');
}

