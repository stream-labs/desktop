 import test from 'ava';
import { useSpectron, focusMain } from '../helpers/spectron/index';
import { addSource, selectSource, clickRemoveSource, addExistingSource } from '../helpers/spectron/sources';
import { addScene } from '../helpers/spectron/scenes';

useSpectron();


test('Adding and removing a AudioSource', async t => {
  const app = t.context.app;

  await addSource(t, 'ffmpeg_source', 'Source With Audio');
  await addSource(t, 'color_source', 'Source Without Audio');
  await focusMain(t);

  t.true(await app.client.$('.mixer-panel').isExisting('div=Source With Audio'));
  t.false(await app.client.$('.mixer-panel').isExisting('div=Source Without Audio'));
 
  await selectSource(t, 'Source With Audio');
  await clickRemoveSource(t);
 
  t.false(await app.client.$('.mixer-panel').isExisting('div=Source With Audio'));
});


test('Nested scenes should provide audio sources to mixer', async t => {
  const app = t.context.app;

  await addScene(t, '1st Scene');
  await addSource(t, 'ffmpeg_source', 'Nested Media Source');
  await focusMain(t);
  
  await addScene(t, '2nd Scene');
  await addSource(t, 'ffmpeg_source', 'Simple Media Source');
  await addExistingSource(t, 'scene', '1st Scene');

  await focusMain(t);
  t.true(await app.client.$('.mixer-panel').isExisting('div=Simple Media Source'));
  t.true(await app.client.$('.mixer-panel').isExisting('div=Nested Media Source'));

});
