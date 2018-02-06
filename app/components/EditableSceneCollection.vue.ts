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
  deleting = false;

  get collection() {
    return this.sceneCollectionsService.collections.find(coll => coll.id === this.collectionId);
  }

  get modified() {
    return moment(this.collection.modified).fromNow();
  }

  get isActive() {
    return this.collection.id === this.sceneCollectionsService.activeCollection.id;
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
    if (!confirm(`Are you sure you want to remove ${this.collection.name}?`)) return;
    this.sceneCollectionsService.delete(this.collectionId);
  }

}
