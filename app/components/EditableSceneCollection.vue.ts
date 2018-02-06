import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { SceneCollectionsService } from 'services/scene-collections';
import { Inject } from 'util/injector';
import moment from 'moment';

@Component({})
export default class EditableSceneCollection extends Vue {
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Prop() collectionId: string;
  @Prop() selected: boolean;

  renaming = false;
  editableName = '';

  get collection() {
    return this.sceneCollectionsService.getCollection(this.collectionId);
  }

  get modified() {
    return moment(this.collection.modified).fromNow();
  }

  startRenaming() {
    this.renaming = true;
    this.editableName = this.collection.name;
  }

  submitRename() {
    this.sceneCollectionsService.rename(this.editableName, this.collectionId);
    this.renaming = false;
  }

  cancelRename() {
    this.renaming = false;
  }

  remove() {
    // TODO: Implement
  }

}
