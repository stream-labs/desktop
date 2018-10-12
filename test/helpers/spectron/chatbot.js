// Source helper functions
import { focusMain, focusChild } from '.';
import { contextMenuClick } from './context-menu';
import { setFormDropdown, setFormInput } from './forms';
import { GenericTestContext } from 'ava';
import { sleep } from '../sleep';
import { logIn } from './user';

export async function navigateToCustomCommandsTab(t) {
  const app = t.context.app;
  await app.client.click('.nav-item.Commands');
  await app.client.click('.nav-item.Custom_Commands');
  await sleep(1000);
  await app.client.click('.button--add-command');
}

export async function openCustomCommandWindow(t) {
  const app = t.context.app;

}

