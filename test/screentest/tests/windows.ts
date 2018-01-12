import test from 'ava';
import { useSpectron } from '../../helpers/spectron';
import { getClient } from '../../helpers/api-client';
import { ISourcesServiceApi } from '../../../app/services/sources/sources-api';
import { useScreentest } from '../screenshoter';
import { ISettingsServiceApi } from '../../../app/services/settings';


useSpectron({ restartAppAfterEachTest: false });
useScreentest({ window: 'child' });


test('Sources showcase window', async t => {
  const client = await getClient();
  const sourcesService = client.getResource<ISourcesServiceApi>('SourcesService');
  sourcesService.showShowcase();
  t.pass();
});


test('Settings window', async t => {
  const client = await getClient();
  const settingsService = client.getResource<ISettingsServiceApi>('SettingsService');
  settingsService.showSettings();
  t.pass();
});