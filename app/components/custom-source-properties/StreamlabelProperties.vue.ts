import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ISourceApi } from 'services/sources';
import { getDefinitions, IStreamlabelDefinition } from 'services/streamlabels/definitions';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import { Multiselect } from 'vue-multiselect';

@Component({
  components: { Multiselect }
})
export default class StreamlabelProperties extends Vue {

  @Prop() source: ISourceApi;

  @Inject() userService: UserService;

  get statOptions() {
    const definitions = getDefinitions(this.userService.platform.type);

    return Object.values(definitions);
  }

  currentlySelected: IStreamlabelDefinition = null;

  created() {
    this.refreshPropertyValues();
  }


  refreshPropertyValues() {
    const settings = this.source.getPropertiesManagerSettings();

    this.statOptions.forEach(category => {
      category.files.forEach(file => {
        if (file.name === settings.statname) {
          this.currentlySelected = file;
        }
      });
    });
  }

  handleInput(value: IStreamlabelDefinition) {
    this.source.setPropertiesManagerSettings({ statname: value.name });
  }

}
