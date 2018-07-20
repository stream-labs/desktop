import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import DropdownMenu from './../shared/DropdownMenu.vue';

@Component({
  components: { DropdownMenu },
})
export default class DesignSystem extends Vue {

  dropdownItems =  {
    dropdownItem1: {
      id: '1',
      name: 'League of Legends'
    },
    dropdownItem2: {
      id: '2',
      name: 'IRL Exploring'
    }
  };

  activeDropdownItem = this.dropdownItems.dropdownItem1;
  activeId = this.dropdownItems.dropdownItem1.id;

  loadDropdownItems(id: string) {
    // this.sceneCollectionsService.load(id);
  }
}
