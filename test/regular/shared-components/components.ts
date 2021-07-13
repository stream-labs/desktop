import { test, useSpectron } from '../../helpers/spectron';
import { showSettings } from '../../helpers/spectron/settings';
import { sleep } from '../../helpers/sleep';

useSpectron();

test('Shared components ', async t => {
  await showSettings(t, 'Experimental');
  await sleep(9999999);
  t.pass();
});
