import test from 'ava';
import { useSpectron } from '../helpers/spectron';
import { getClient } from '../helpers/api-client';
import { SceneBuilder } from '../helpers/scene-builder';
import { ISceneApi, ISceneItemApi, ISceneNodeApi, SceneItem } from '../../app/services/scenes';
import { ISelectionServiceApi } from 'services/selection';
import { IClipboardServiceApi } from 'services/clipboard';
import { ISceneCollectionsServiceApi } from 'services/scene-collections';
import { ISourcesServiceApi } from 'services/sources';
import { SourceFiltersService } from 'services/source-filters';
import { sleep } from '../helpers/sleep';

useSpectron({ restartAppAfterEachTest: false, afterStartCb: afterStart });

let sceneBuilder: SceneBuilder;
let getNode: (name: string) => ISceneNodeApi;
let getNodeId: (name: string) => string;
let selectionService: ISelectionServiceApi;
let clipboardService: IClipboardServiceApi;
let sourceFiltersService: SourceFiltersService;
let sceneCollectionsService: ISceneCollectionsServiceApi;
let sourcesService: ISourcesServiceApi;

async function afterStart() {
  const client = await getClient();
  sourcesService = client.getResource('SourcesService');
  selectionService = client.getResource('SelectionService');
  clipboardService = client.getResource('ClipboardService');
  sceneCollectionsService = client.getResource('SceneCollectionsService');
  sourceFiltersService = client.getResource('SourceFiltersService');
  sceneBuilder = new SceneBuilder(client);
  getNode = (name) => sceneBuilder.scene.getNodeByName(name);
  getNodeId = (name) => sceneBuilder.scene.getNodeByName(name).id;
}

test('Simple copy/paste', async t => {

  sceneBuilder.build(`
    Folder1
    Item1: color_source
    Item2: image
  `);

  selectionService.select([getNodeId('Folder1'), getNodeId('Item2')]);
  clipboardService.copy();
  clipboardService.paste();

  t.true(sceneBuilder.isEqualTo(`
    Folder1
    Item2: image
    Folder1
    Item1: color_source
    Item2: image
  `));


});


test('Copy/paste folder with items', async t => {

  sceneBuilder.build(`
    Folder1
    Folder2
      Item1:
      Folder3
        Item2:
  `);

  selectionService.select(getNodeId('Folder2'));
  clipboardService.copy();
  clipboardService.paste();

  t.true(sceneBuilder.isEqualTo(`
    Folder2
      Item1:
      Folder3
        Item2:
    Folder1
    Folder2
      Item1:
      Folder3
        Item2:
  `));
});



test('Clear clipboard', async t => {

  sceneBuilder.build(`
    Folder1
    Item1:
  `);

  selectionService.selectAll();
  clipboardService.copy();
  clipboardService.clear();
  clipboardService.paste();

  t.true(sceneBuilder.isEqualTo(`
    Folder1
    Item1:
  `));
});

test('Copy/paste nodes between scene collections', async t => {

  sceneBuilder.build(`
    Folder1
      Item1: color_source
      Item2: image_source
  `);

  selectionService.selectAll();
  clipboardService.copy();

  await sceneCollectionsService.create({ name: 'New Collection' });

  clipboardService.paste();

  t.true(sceneBuilder.isEqualTo(`
    Folder1
      Item1: color_source
      Item2: image_source
  `));

  const sourcesCount = sourcesService.getSources().length;

  clipboardService.paste();

  t.true(sceneBuilder.isEqualTo(`
    Folder1
      Item1: color_source
      Item2: image_source
    Folder1
      Item1: color_source
      Item2: image_source
  `));

  // the second paste call must not change the sources count
  t.is(sourcesService.getSources().length, sourcesCount);

});


test('Copy/paste filters between scene collections', async t => {

  sceneBuilder.build(`
      Item1: image_source
  `);

  sourceFiltersService.add(
    (getNode('Item1') as ISceneItemApi).sourceId,
    'chroma_key_filter',
    'MyFilter'
  );

  selectionService.selectAll();
  clipboardService.copyFilters();

  await sceneCollectionsService.create({ name: 'Collection 2' });

  sceneBuilder.build(`
      Item1: image_source
  `);

  const sourceId = (getNode('Item1') as ISceneItemApi).sourceId;

  selectionService.selectAll();
  clipboardService.pasteFilters();

  const filters = sourceFiltersService.getFilters(sourceId);

  t.is(filters.length, 1);

  const filter = filters[0];

  t.is(filter.name, 'MyFilter');
  t.is(filter.type, 'chroma_key_filter');

});


test('Copy/paste duplicate sources', async t => {

  sceneBuilder.build(`
    Folder1
      Item1: color_source
      Item2: image_source
  `);

  selectionService.selectAll();
  clipboardService.copy();
  const sourcesCount = selectionService.getSources().length;

  clipboardService.paste(true);

  t.true(sceneBuilder.isEqualTo(`
    Folder1
      Item1: color_source
      Item2: image_source
    Folder1
      Item1: color_source
      Item2: image_source
  `));

  // check that sources also have been duplicated
  selectionService.selectAll();
  t.is(selectionService.getSources().length, sourcesCount * 2);

});

