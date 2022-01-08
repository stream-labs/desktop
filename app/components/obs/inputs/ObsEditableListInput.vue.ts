import cloneDeep from 'lodash/cloneDeep';
import Selector from '../../Selector.vue';
import { Component, Prop } from 'vue-property-decorator';
import { IObsEditableListInputValue, ObsInput, TObsType } from './ObsInput';
import { Menu } from '../../../util/menus/Menu';
import * as remote from '@electron/remote';

interface ISelectorSortEventData {
  change: any;
  order: string[];
}

@Component({
  components: { Selector },
})
class ObsEditableListProperty extends ObsInput<IObsEditableListInputValue> {
  static obsType: TObsType;

  @Prop()
  value: IObsEditableListInputValue;

  activeItem = '';
  menu = new Menu();

  created() {
    this.menu.append({
      label: 'Add Files',
      click: () => {
        this.showFileDialog();
      },
    });

    this.menu.append({
      label: 'Add Directory',
      click: () => {
        this.showDirDialog();
      },
    });
  }

  handleSelect(item: string) {
    this.activeItem = item;
  }

  handleSort(data: ISelectorSortEventData) {
    this.setList(data.order);
  }

  handleRemove() {
    this.setList(this.list.filter(item => item !== this.activeItem));
  }

  handleEdit() {
    this.showReplaceFileDialog();
  }

  async showReplaceFileDialog() {
    const { filePaths } = await remote.dialog.showOpenDialog({
      defaultPath: this.value.defaultPath,
      filters: this.value.filters,
      properties: ['openFile'],
    });

    if (filePaths) {
      const activeIndex = this.list.indexOf(this.activeItem);

      this.list[activeIndex] = filePaths[0];

      // Preserve this item as active
      this.activeItem = this.list[activeIndex];
      this.setList(this.list);
    }
  }

  async showFileDialog() {
    const { filePaths } = await remote.dialog.showOpenDialog({
      defaultPath: this.value.defaultPath,
      filters: this.value.filters,
      properties: ['openFile', 'multiSelections'],
    });

    if (filePaths) {
      this.setList(this.list.concat(filePaths));
    }
  }

  async showDirDialog() {
    const { filePaths } = await remote.dialog.showOpenDialog({
      defaultPath: this.value.defaultPath,
      properties: ['openDirectory'],
    });

    if (filePaths) {
      this.setList(this.list.concat(filePaths));
    }
  }

  setList(list: string[]) {
    this.emitInput({ ...this.value, value: list.map(item => ({ value: item })) });
  }

  get list(): string[] {
    const items = this.value.value || [];
    return cloneDeep(items.map(item => item.value));
  }
}

ObsEditableListProperty.obsType = 'OBS_PROPERTY_EDITABLE_LIST';

export default ObsEditableListProperty;
