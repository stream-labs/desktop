import { mutation, StatefulService } from 'services/stateful-service';
import {
  ScenesService,
  ISceneItem,
  ISceneItemFolder,
  SceneItem,
  SceneItemFolder,
  ISceneItemSettings
} from 'services/scenes';
import { ISource, SourcesService, TPropertiesManager } from 'services/sources';
import { shortcut } from 'services/shortcuts';
import { Inject } from '../../util/injector';
import { ISourceFilter, SourceFiltersService } from 'services/source-filters';
import { SelectionService } from 'services/selection';
import { SceneCollectionsService } from 'services/scene-collections';
import { IClipboardServiceApi } from './clipboard-api';
interface ISceneNodeInfo {
  folder?: ISceneItemFolder;
  item?: ISceneItem & ISource;
  settings?: ISceneItemSettings;
}

interface ISourceInfo {
  source: ISource;
  settings:  Dictionary<any>;
  filters: ISourceFilter[];
  propertiesManagerType: TPropertiesManager;
  propertiesManagerSettings: Dictionary<any>;
}

interface IUnloadedCollectionClipboard {
  sources: Dictionary<ISourceInfo>;
  sceneNodes: ISceneNodeInfo[];
}

interface IClipboardState {
  itemsSceneId: string;
  sceneNodesIds: string[];
  filterIds: string[];

  /**
   * stores stand-alone data for copy/paste
   * between scene collections
   */
  unloadedCollectionClipboard?: IUnloadedCollectionClipboard;
}

export class ClipboardService extends StatefulService<IClipboardState> implements IClipboardServiceApi {

  static initialState: IClipboardState = {
    itemsSceneId: '',
    sceneNodesIds: [],
    filterIds: [],
    unloadedCollectionClipboard: null
  };

  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private sourceFiltersService: SourceFiltersService;
  @Inject() private selectionService: SelectionService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

  init() {
    this.sceneCollectionsService.collectionWillSwitch.subscribe(() => {
      this.beforeCollectionSwitchHandler();
    });
  }


  @shortcut('Ctrl+C')
  copy() {
    this.SET_SCENE_ITEMS_IDS(this.selectionService.getIds());
    this.SET_SCENE_ITEMS_SCENE(this.scenesService.activeScene.id);
  }


  @shortcut('Ctrl+V')
  pasteReference() {
    if (!this.hasItems()) return;
    if (this.hasItemsInUnloadedClipboard()) {
      this.pasteFromUnloadedClipboard();
      return;
    }
    const insertedItems = this.scenesService
      .getScene(this.state.itemsSceneId)
      .getSelection(this.state.sceneNodesIds)
      .copyReferenceTo(this.scenesService.activeSceneId);
    if (insertedItems.length) this.selectionService.select(insertedItems);
  }


  pasteDuplicate() {
    if (!this.hasItems()) return;
    if (this.hasItemsInUnloadedClipboard()) {
      this.pasteFromUnloadedClipboard();
      return;
    }
    const insertedItems = this.scenesService
      .getScene(this.state.itemsSceneId)
      .getSelection(this.state.sceneNodesIds)
      .copyTo(this.scenesService.activeSceneId);
    if (insertedItems.length) this.selectionService.select(insertedItems);
  }


  copyFilters() {
    const source = this.selectionService.getLastSelected();
    if (!source) return;
    this.SET_FILTERS_IDS([source.sourceId]);
  }


  pasteFilters(toSourceId: string) {
    this.state.filterIds.forEach(fromSourceId => {
      const fromSource = this.sourcesService.getSource(fromSourceId);
      if (!fromSource) return;
      this.sourceFiltersService.copyFilters(fromSource.sourceId, toSourceId);
    });
  }


  hasItems(): boolean {
    return !!(
      this.state.sceneNodesIds.length ||
      this.hasItemsInUnloadedClipboard()
    );
  }

  hasFilters() {
    return !!this.state.filterIds.length;
  }

  clear() {
    this.SET_FILTERS_IDS([]);
    this.SET_SCENE_ITEMS_IDS([]);
    this.SET_SCENE_ITEMS_SCENE('');
    this.SET_UNLOADED_COLLECTION_CLIPBOARD(null);
  }

  private pasteFromUnloadedClipboard() {
    const sourceIdMap: Dictionary<string> = {};
    const folderIdMap: Dictionary<string> = {};
    const insertedNodesIds: string[] = [];
    const sources = this.state.unloadedCollectionClipboard.sources;
    const nodes = this.state.unloadedCollectionClipboard.sceneNodes.concat([]).reverse();
    const scene = this.scenesService.activeScene;

    // create sources
    Object.keys(sources).forEach(sourceId => {
      const sourceInfo = sources[sourceId];
      const sourceModel = sourceInfo.source;
      const createdSource = this.sourcesService.createSource(
        sourceModel.name, sourceModel.type, sourceInfo.settings,
        {
          propertiesManager: sourceInfo.propertiesManagerType,
          propertiesManagerSettings: sourceInfo.propertiesManagerSettings
        }
      );
      sourceIdMap[sourceModel.sourceId] = createdSource.sourceId;

      // add filters
      sourceInfo.filters.forEach(filter => {
        this.sourceFiltersService.add(
          createdSource.sourceId,
          filter.type,
          filter.name,
          filter.settings
        );
      });
    });

    // create folders
    nodes.filter(node => node.folder)
      .forEach(node => {
        const folderModel = node.folder as ISceneItemFolder;
        const folder = scene.createFolder(folderModel.name);
        folderIdMap[folderModel.id] = folder.id;
        insertedNodesIds.push(folder.id);
      });

    // create sceneItems and set parent nodes for folders and items
    nodes.forEach(node => {

      // set parent for folders
      if (node.folder) {
        const folderModel = node.folder as ISceneItemFolder;
        if (folderModel.parentId) {
          scene.getFolder(folderIdMap[folderModel.id])
            .setParent(folderIdMap[folderModel.parentId]);
        }
        return;
      }

      const itemModel = (node.item as ISceneItem & ISource);

      // add sceneItem and apply settings
      const sceneItem = scene.addSource(sourceIdMap[itemModel.sourceId]);
      sceneItem.setSettings(node.settings);

      // set parent for item
      if (itemModel.parentId) sceneItem.setParent(folderIdMap[itemModel.parentId]);

      insertedNodesIds.push(sceneItem.id);
    });

    // now we can convert unloadedCollectionClipboard to regular clipboard
    // to avoid duplication of sources
    this.SET_SCENE_ITEMS_IDS(insertedNodesIds);
    this.SET_SCENE_ITEMS_SCENE(scene.id);
    this.SET_UNLOADED_COLLECTION_CLIPBOARD(null);
  }

  private beforeCollectionSwitchHandler() {
    if (!this.hasItems()) {
      this.clear();
      return;
    }

    if (this.hasItemsInUnloadedClipboard()) return;

    // save nodes from clipboard in memory
    const nodes = this.scenesService
      .getScene(this.state.itemsSceneId)
      .getSelection(this.state.sceneNodesIds)
      .getNodes()
      // TODO: we don't support copy/paste scenes between collections yet
      .filter(node => !(node.isItem() && node.type === 'scene'));

    const sourcesInfo: Dictionary<ISourceInfo> = {};

    const nodesInfo: ISceneNodeInfo[] = nodes.map(node => {

      if (node.isFolder()) {
        return { folder: (node as SceneItemFolder).getModel() };
      }

      const item = node as SceneItem;

      if (!sourcesInfo[item.sourceId]) {
        const source = item.getSource();
        sourcesInfo[item.sourceId] = {
          source: item.getModel(),
          settings: source.getSettings(),
          propertiesManagerType: source.getPropertiesManagerType(),
          propertiesManagerSettings: source.getPropertiesManagerSettings(),
          filters: this.sourceFiltersService.getFilters(source.sourceId)
        };
      }

      return {
        item: (node as SceneItem).getModel(),
        settings: item.getSettings()
      };
    });

    this.SET_UNLOADED_COLLECTION_CLIPBOARD({
      sources: sourcesInfo,
      sceneNodes: nodesInfo
    });
  }

  private hasItemsInUnloadedClipboard(): boolean {
    return !!(
      this.state.unloadedCollectionClipboard &&
      this.state.unloadedCollectionClipboard.sceneNodes &&
      this.state.unloadedCollectionClipboard.sceneNodes.length
    );
  }

  @mutation()
  private SET_SCENE_ITEMS_IDS(ids: string[]) {
    this.state.sceneNodesIds = ids;
  }

  @mutation()
  private SET_FILTERS_IDS(filtersIds: string[]) {
    this.state.filterIds = filtersIds;
  }

  @mutation()
  private SET_SCENE_ITEMS_SCENE(sceneId: string) {
    this.state.itemsSceneId = sceneId;
  }

  @mutation()
  private SET_UNLOADED_COLLECTION_CLIPBOARD(clipboard: IUnloadedCollectionClipboard) {
    this.state.unloadedCollectionClipboard = clipboard;
  }
}
