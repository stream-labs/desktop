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
import { FacemasksService } from 'services/facemasks';

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
  raids: $t('Raids'),
  superhearts: $t('Super Hearts'),
  fanfunding: $t('Super Chat'),
  sponsors: $t('Members'),
  subscribers: $t('Subscribers'), // YouTube
  stars: $t('Stars'),
  support: $t('Support'),
  likes: $t('Likes'),
  facemasks: $t('Facemask Donations'),
});

const triggerAmountMap = {
  bits: 'bits_alert_min_amount',
  donations: 'donation_alert_min_amount',
  hosts: 'host_viewer_minimum',
  raids: 'raid_raider_minimum',
};

const HAS_ALERT_SETTINGS = ['donations', 'bits', 'hosts', 'raids'];
const HAS_DONOR_MESSAGE = [
  'donations',
  'bits',
  'subs',
  'merch',
  'patreon',
  'extraLife',
  'donordrive',
  'justGiving',
  'tiltify',
  'treat',
];

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    ValidatedForm,
    ...inputComponents,
  },
})
export default class AlertBox extends WidgetSettings<IAlertBoxData, AlertBoxService> {
  @Inject() alertBoxService: AlertBoxService;
  @Inject() facemasksService: FacemasksService;

  $refs: { [key: string]: HTMLElement };

  afterFetch() {
    this.alertTypes = this.alertTypes.filter(type => this.wData.settings[type]);
    const languages = this.wData.tts_languages;
    this.languages = Object.keys(languages)
      .map(category => ({
        label: category,
        options: Object.keys(languages[category]).map(key => ({
          value: key,
          label: languages[category][key],
        })),
      }))
      .sort((a, _b) => (a.label === 'Legacy Voice' ? -1 : 0));
  }

  alertName(alertType: string) {
    return alertNameMap()[alertType];
  }

  alertTypes = this.alertBoxService.apiNames();

  addAlertMenuOpen = false;
  selectedAlert = 'general';
  selectedId = 'default';
  editingName: string = null;
  languages: any[] = [];

  facemaskDevice = this.facemasksService.getEnabledDevice();
  facemaskEnabled = this.facemasksService.getEnabledStatus();

  get metadata() {
    return this.service.getMetadata(this.selectedAlert, this.languages);
  }

  get facemaskDeviceOptions() {
    return this.facemasksService
      .getInputDevicesList()
      .map(d => ({ title: d.name, value: d.value }));
  }

  get selectedVariation() {
    if (this.selectedAlert === 'general') {
      return this.wData;
    }
    return this.wData.settings[this.selectedAlert].variations.find(
      (variation: IAlertBoxVariation) => variation.id === this.selectedId,
    );
  }

  get navItems() {
    if (this.selectedAlert === 'general') {
      return [
        { value: 'general', label: $t('General Settings') },
        { value: 'moderation', label: $t('Moderator Tools') },
        { value: 'source', label: $t('Source') },
      ];
    }
    const baseItems = [
      { value: 'title', label: $t('Title Message') },
      { value: 'media', label: $t('Media') },
      { value: 'animation', label: $t('Animation') },
    ];
    if (HAS_DONOR_MESSAGE.includes(this.selectedAlert)) {
      baseItems.push({ value: 'message', label: $t('Donor Message') });
    }
    if (HAS_ALERT_SETTINGS.includes(this.selectedAlert) || this.selectedId !== 'default') {
      baseItems.push({ value: 'alert', label: $t('Alert Settings') });
    }
    return baseItems;
  }

  get conditions() {
    return this.alertBoxService.conditionsByType(this.selectedAlert);
  }

  get minTriggerAmount() {
    return this.wData.settings[triggerAmountMap[this.selectedAlert]];
  }

  set minTriggerAmount(value: number) {
    this.wData.settings[triggerAmountMap[this.selectedAlert]] = value;
  }

  get minRecentEvents() {
    return this.selectedAlert === 'donation'
      ? this.wData.settings.recent_events_donation_min_amount
      : this.wData.settings.recent_events_host_min_viewer_count;
  }

  set minRecentEvents(value: number) {
    if (this.selectedAlert === 'donation') {
      this.wData.settings.recent_events_donation_min_amount = value;
    } else {
      this.wData.settings.recent_events_host_min_viewer_count = value;
    }
  }

  selectAlertType(alertName: string) {
    this.selectedId = 'default';
    this.selectedAlert = this.selectedAlert === alertName ? 'general' : alertName;
  }

  selectVariation(id: string) {
    this.selectedId = id;
  }

  toggleAddAlertMenu() {
    this.addAlertMenuOpen = !this.addAlertMenuOpen;
  }

  addAlert(type: string) {
    const newVariation = this.alertBoxService.newVariation(type);
    this.wData.settings[type].variations.push(newVariation);
    this.selectedAlert = type;
    this.addAlertMenuOpen = false;
    this.save();
    this.$nextTick(() => this.editName(newVariation.id));
  }

  removeVariation(id: string) {
    this.selectedId = 'default';
    this.wData.settings[this.selectedAlert].variations = this.wData.settings[
      this.selectedAlert
    ].variations.filter((variation: IAlertBoxVariation) => variation.id !== id);
    this.save();
  }

  editName(id: string) {
    this.editingName = id;
    this.selectedId = id;
    // Above is done here with a stop propagation in the input to avoid possible race conditions which would lead to
    // this.selectedVariation potentially being incorrect
    const field = <HTMLInputElement>this.$refs[`${id}-name-input`][0];
    this.$nextTick(() => field.focus());
  }

  nameInputHandler(eventData: string) {
    this.selectedVariation.name = eventData;
  }

  nameBlurHandler(id: string) {
    this.save();
    this.editingName = null;
  }

  handleFacemaskDeviceSelect(value: string) {
    this.facemaskDevice = this.facemaskDeviceOptions.find(device => device.value === value);
  }

  handleFacemaskInput() {
    if (this.selectedAlert === 'facemasks') {
      const { duration } = this.selectedVariation.settings;
      this.facemasksService
        .updateFacemaskSettings({
          duration,
          enabled: this.facemaskEnabled,
          device: this.facemaskDevice,
        })
        .catch(() => this.onFailHandler($t('Something went wrong updating Facemask settings')));
    }
    this.save();
  }
}
