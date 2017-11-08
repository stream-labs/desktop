import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ISourceApi } from 'services/sources';
import { getDefinitions, IStreamlabelDefinition } from 'services/streamlabels/definitions';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import { Multiselect } from 'vue-multiselect';
import { StreamlabelsService, IStreamlabelSettings } from 'services/streamlabels';
import { debounce } from 'lodash';

@Component({
  components: { Multiselect }
})
export default class StreamlabelProperties extends Vue {

  @Prop() source: ISourceApi;

  @Inject() userService: UserService;
  @Inject() streamlabelsService: StreamlabelsService;

  get statOptions() {
    const definitions = getDefinitions(this.userService.platform.type);

    return Object.values(definitions);
  }

  currentlySelected: IStreamlabelDefinition = null;
  labelSettings: IStreamlabelSettings = null;

  created() {
    this.refreshPropertyValues();
    this.debouncedSetSettings = debounce(() => this.setSettings(), 1000);
  }


  refreshPropertyValues() {
    const settings = this.source.getPropertiesManagerSettings();

    this.statOptions.forEach(category => {
      category.files.forEach(file => {
        if (file.name === settings.statname) {
          this.currentlySelected = file;
          this.labelSettings = this.streamlabelsService.getSettingsForStat(settings.statname);
        }
      });
    });
  }

  handleInput(value: IStreamlabelDefinition) {
    this.source.setPropertiesManagerSettings({ statname: value.name });
    this.refreshPropertyValues();
  }


  debouncedSetSettings: () => void;

  setSettings() {
    this.streamlabelsService.setSettingsForStat(
      this.currentlySelected.name,
      this.labelSettings
    );
  }


  get preview() {
    return this.labelSettings.format
      .replace(/{name}/gi, 'Fishstickslol')
      .replace(/{title}/gi, 'New Computer')
      .replace(/{currentAmount}/gi, '$12')
      .replace(/{count}/gi, '123')
      .replace(/{goalAmount}/gi, '$47')
      .replace(/{amount}/gi, '$4.99')
      .replace(/{months}/gi, '3')
      .replace(/{either_amount}/gi, ['$4.99', '499 Bits'][Math.floor(Math.random() * 2)]);
  }

}
