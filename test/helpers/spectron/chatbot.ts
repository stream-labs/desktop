// Source helper functions
import { focusMain, focusChild } from '.';
import { contextMenuClick } from './context-menu';
import { setFormDropdown, setFormInput } from './forms';
import { GenericTestContext } from 'ava';

export async function openCustomCommandWindow(t: GenericTestContext<any>) {
  const app = t.context.app;
  await focusMain(t);
  await app.client.click('.tab-button.Chatbot');
  await app.client.click('.nav-item.Commands');
  await app.client.click('.nav-item.Custom_Commands');
  await app.client.click('.button--add-command');
}

