import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';

import DropdownMenu from './../shared/DropdownMenu.vue';

import { inputComponents } from 'components/shared/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { metadata } from 'components/shared/inputs';

@Component({
  components: {
    DropdownMenu,
    HFormGroup,
    ...inputComponents,
  },
})
export default class DesignSystem extends Vue {
  dropdownItems = {
    dropdownItem1: {
      id: '1',
      name: 'League of Legends',
    },
    dropdownItem2: {
      id: '2',
      name: 'IRL Exploring',
    },
  };

  exampleSettings = {
    checkbox_standard: true,
    radio_standard: true,
    checkbox_1: true,
    checkbox_2: false,
    checkbox_3: true,
    checkbox_4: false,
    slider: 20,
  };

  activeDropdownItem = this.dropdownItems.dropdownItem1;
  activeId = this.dropdownItems.dropdownItem1.id;

  loadDropdownItems(id: string) {
    // this.sceneCollectionsService.load(id);
  }
}
