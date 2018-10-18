import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ISourceApi } from 'services/sources';
import { getDefinitions, IStreamlabelDefinition } from 'services/streamlabels/definitions';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import { Multiselect } from 'vue-multiselect';
import { StreamlabelsService, IStreamlabelSettings } from 'services/streamlabels';
import { debounce, pick } from 'lodash';

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
          let settingsStat = file.name;

          if (file.settings.settingsStat) settingsStat = file.settings.settingsStat;

          this.labelSettings = this.streamlabelsService.getSettingsForStat(settingsStat);

          if (file.settings.settingsWhitelist) {
            this.labelSettings = pick(this.labelSettings, file.settings.settingsWhitelist) as IStreamlabelSettings;
          }
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
    if (this.labelSettings.limit) {
      this.labelSettings.limit = parseInt(this.labelSettings.limit as any, 10);
      if (isNaN(this.labelSettings.limit)) this.labelSettings.limit = 0;
      if (this.labelSettings.limit < 0) this.labelSettings.limit = 0;
      if (this.labelSettings.limit > 100) this.labelSettings.limit = 100;
    }

    if (this.labelSettings.duration) {
      this.labelSettings.duration = parseInt(this.labelSettings.duration as any, 10);
      if (isNaN(this.labelSettings.duration)) this.labelSettings.duration = 1;
      if (this.labelSettings.duration < 1) this.labelSettings.duration = 1;
    }

    this.streamlabelsService.setSettingsForStat(
      this.currentlySelected.settings.settingsStat ?
        this.currentlySelected.settings.settingsStat :
        this.currentlySelected.name,
      this.labelSettings
    );
  }


  /**
   * Returns the preview split on newlines
   */
  get splitPreview() {
    return this.preview.split('\\n');
  }


  get preview() {
    if (this.labelSettings.format == null) return '';

    let replaced = this.labelSettings.format
      .replace(/{name}/gi, 'Fishstickslol')
      .replace(/{title}/gi, 'New Computer')
      .replace(/{currentAmount}/gi, '$12')
      .replace(/{count}/gi, '123')
      .replace(/{goalAmount}/gi, '$47')
      .replace(/{amount}/gi, '$4.99')
      .replace(/{months}/gi, '3')
      .replace(/{either_amount}/gi, ['$4.99', '499 Bits'][Math.floor(Math.random() * 2)]);

    if (this.labelSettings.item_format) {
      const itemStr = this.sampleItems.join(this.labelSettings.item_separator);
      replaced = replaced.replace(/{list}/gi, itemStr);
    }

    return replaced;
  }


  get sampleItems() {
    return this.sampleItemData.map(data => {
      return this.labelSettings.item_format
        .replace(/{name}/gi, data.name)
        .replace(/{months}/gi, data.months)
        .replace(/{amount}/gi, data.amount)
        .replace(/{either_amount}/gi, [data.amount, data.bits_amount][Math.floor(Math.random() * 2)])
        .replace(/{message}/gi, data.message);
    });
  }


  sampleItemData = [
    { name: 'Fishstickslol', months: '5', amount: '$4.98', message: 'I love you!', bits_amount: '498 Bits' },
    { name: 'ChocoPie', months: '2', amount: '$5', message: 'I love you!', bits_amount: '500 Bits' },
    { name: 'Beecreative', months: '3', amount: '$1.43', message: 'I love you!', bits_amount: '143 Bits' },
    { name: 'ActionBa5tard', months: '1', amount: '$13.37', message: 'Love your stream!', bits_amount: '1337 Bits' }
  ];

}
