import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { ListInput } from '../../shared/forms';

@Component({
  components: {
    ListInput
  }
})
export default class BrowseOverlays extends Vue {

  view = 'browseOverlays';

  listInputValue = {
    name: 'type',
    value: 'My value',
    options: [
      { description: 'Most Popular', value: 'Most Popular' },
      { description: 'Newly Added', value: 'Newly Added' }
    ]
  };

  viewDetails() {
    this.view = 'overlayDetails';
  };

  viewOverlays() {
    this.view = 'browseOverlays';
  };

}
