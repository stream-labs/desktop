import { Component } from 'vue-property-decorator';
import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/widgets/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { IAlertBoxData, AlertBoxService } from 'services/widgets/settings/alert-box';
import { $t } from 'services/i18n';

import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { Inject } from 'util/injector';
import { IAlertBoxVariation } from 'services/widgets/settings/alert-box/alert-box-api';

const alertNameMap = () => ({
  bits: $t('Bits'),
  donations: $t('Donations'),
  donordrive: $t('Charity Streaming Donations'),
  patreon: $t('Patreon Pledges'),
  extraLife: $t('Extra Life Donations'),
  justGiving: $t('JustGiving Donations'),
  merch: $t('Merch'),
  resubs: $t('Resubs'),
  gamewisp: $t('Gamewisp Subscriptions'),
  subs: $t('Subscriptions'),
  tiltify: $t('Tiltify Donations'),
  treat: $t('TreatStream'),
  follows: $t('Follows'),
  hosts: $t('Hosts'),
  raids: $t('Raids')
});

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents
  }
})
export default class AlertBox extends WidgetSettings<IAlertBoxData, AlertBoxService> {
  @Inject() alertBoxService: AlertBoxService;

  afterFetch() {
    this.alertTypes = this.alertTypes.filter((type) => this.wData.settings[type]);
    console.log(this.wData);
  }

  alertName(alertType: string) {
    return alertNameMap()[alertType];
  }

  alertTypes = this.alertBoxService.apiNames();

  addAlertMenuOpen = false;
  selectedAlert = 'general';
  selectedId = 'default';

  get selectedVariation() {
    if (this.selectedAlert === 'general') { return this.wData }
    return this.wData.settings[this.selectedAlert].variations.find(
      (variation: IAlertBoxVariation) => variation.id === this.selectedId
    );
  }

  get navItems() {
    if (this.selectedAlert === 'general') {
      return [
        { value: 'general', label: $t('General Settings') },
        { value: 'moderation', label: $t('Moderator Tools') },
        { value: 'source', label: $t('Source') }
      ];
    }
    const baseItems = [
      { value: 'title', label: $t('Title Message') },
      { value: 'media', label: $t('Image & Video') },
      { value: 'audio', label: $t('Audio') },
      { value: 'animation', label: $t('Animation') },
    ];
    if (this.selectedVariation.settings.message) {
      baseItems.push({ value: 'message', label: $t('Donor Message') })
    }
    if (['donations', 'bits', 'hosts', 'raids'].includes(this.selectedAlert) || this.selectedId !== 'default') {
      baseItems.push({ value: 'alert', label: $t('Alert Settings') })
    }
    return baseItems;
  }

  get minTriggerAmount() {
    return ''
  }

  get minRecentEvents() {
    return ''
  }

  selectAlertType(alertName: string) {
    this.selectedAlert = this.selectedAlert === alertName ? 'general' : alertName;
  }

  selectVariation(id: string) {
    this.selectedId = id;
  }

  toggleAddAlertMenu() {
    this.addAlertMenuOpen = !this.addAlertMenuOpen;
  }
}
