// Source helper functions
import { focusMain } from './index';


export async function logOut(t) {
  await focusMain(t);
  await t.context.app.client.click('.icon-logout');
}
