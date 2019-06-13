import { sleep } from './sleep';
import { TExecutionContext } from './spectron';

export async function waitForWidgetSettingsSync(t: TExecutionContext) {
  await sleep(1000);
  await t.context.app.client.waitForVisible('.saving-indicator', 15000, true);
}
