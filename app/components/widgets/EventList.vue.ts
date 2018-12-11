import { Component } from 'vue-property-decorator';
import {
  EventListService,
  IEventListData
} from 'services/widgets/settings/event-list';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';
import { inputComponents } from 'components/shared/inputs';
import { AnimationInput } from './inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';

const eventsByPlatform = (platform: string) => ({
  twitch: [
    { key: 'show_follows', title: $t('Follows') },
    { key: 'show_subscriptions', title: $t('Subscriptions') },
    { key: 'show_resubs', title: $t('Show Resubs') },
    { key: 'show_sub_tiers', title: $t('Show Sub Tiers') },
    { key: 'show_hosts', title: $t('Hosts') },
    { key: 'show_bits', title: $t('Bits') },
    { key: 'show_raids', title: $t('Raids') }
  ],
  facebook: [],
  youtube: [
    { key: 'show_subscriptions', title: $t('Subscriptions') },
    { key: 'show_sponsors', title: $t('Members') },
    { key: 'show_fanfundings', title: $t('Super Chats') }
  ],
  mixer: [
    { key: 'show_resubs', title: $t('Show Resubs') },
  ]
}[platform]);

@Component({
  components: {
    WidgetEditor,
    VFormGroup,
    AnimationInput,
    ValidatedForm,
    ...inputComponents
  }
})
export default class EventList extends WidgetSettings<IEventListData, EventListService> {
  @Inject() userService: UserService;

  get themeMetadata() {
    return Object.keys(this.wData.themes).map((theme) => ({
      title: this.wData.themes[theme].label,
      value: theme
    }));
  }

  get eventsForPlatform() {
    const baseEvents = [{ key: 'show_donations', title: $t('Donations') }, { key: 'show_merch', title: $t('Merch') }];
    return eventsByPlatform(this.userService.platform.type).concat(baseEvents);
  }

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }

  get isMixer() {
    return this.userService.platform.type === 'mixer';
  }

  textColorTooltip = $t('A hex code for the base text color.');

  backgroundColorTooltip = $t(
    'A hex code for the widget background. This is for preview purposes only. It will not be shown in your stream.'
  );

  minBitsTooltip = $t(
    'The smallest amount of bits a cheer must have for an event to be shown.' +
      ' Setting this to 0 will make every cheer trigger an event.'
  );

  fontSizeTooltip = $t('The font size in pixels. Reasonable size typically ranges between 24px and 48px.');

  navItems = [
    { value: 'manage-list', label: $t('Manage List') },
    { value: 'font', label: $t('Font Settings') },
    { value: 'visual', label: $t('Visual Settings') },
    { value: 'source', label: $t('Source') }
  ];
}
