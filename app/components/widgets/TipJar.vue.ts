import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';
import {
  TipJarService,
  ITipJarData
} from 'services/widget-settings/tip-jar';
import { UserService } from 'services/user';
import { HostsService } from 'services/hosts';
import { inputComponents } from 'components/shared/inputs';
import TestButtons from './TestButtons.vue';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import CodeEditor from './CodeEditor.vue';

import { $t } from 'services/i18n';

const nameMap = () => ({
  tips: $t('Tips & Donations'),
  twitch_follows: $t('Twitch Follows'),
  mixer_follows: $t('Mixer Follows'),
  twitch_bits: $t('Twitch Bits'),
  twitch_subs: $t('Twitch Subs'),
  mixer_subscriptions: $t('Mixer Subscriptions'),
  twitch_resubs: $t('Twitch Resubs'),
  youtube_subscribers: $t('Youtube Subscriptions'),
  youtube_sponsors: $t('Youtube Sponsors'),
  youtube_superchats: $t('Youtube Super Chats'),
  periscope_superhearts: $t('Periscope Super Hearts'),
  picarto_follows: $t('Picarto Follows'),
  picarto_subscriptions: $t('Picarto Subscriptions')
});

const mediaGalleryInputs = {
  twitch: ['twitch_follows'],
  youtube: ['youtube_subscribers', 'youtube_sponsors'],
  mixer: ['mixer_subscriptions', 'mixer_follows']
};

@Component({
  components: {
    WidgetWindow,
    TestButtons,
    HFormGroup,
    CodeEditor,
    ...inputComponents
  }
})
export default class TipJar extends WidgetSettings<ITipJarData, TipJarService> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  textColorTooltip = $t('A hex code for the base text color.');

  backgroundColorDescription = $t(
    'Note: This background color is for preview purposes only. It will not be shown in your stream.'
  );

  jarSrc = `https://${this.hostsService.cdn}/static/tip-jar/jars/glass-`;
  inputOptions: { description: string, value: string }[] = [];

  titleFromKey(key: string) {
    return nameMap()[key];
  }

  get platform() {
    return this.userService.platform.type;
  }

  get mediaGalleryInputs() {
    if (!mediaGalleryInputs[this.platform]) return [];
    return mediaGalleryInputs[this.platform];
  }

  afterFetch() {
    this.inputOptions = this.wData.jars.map((jar: string) => ({ description: `${this.jarSrc}${jar}.png`, value: jar }));
  }
}
