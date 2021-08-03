import { Component } from 'vue-property-decorator';
import { IEmoteWallData, EmoteWallService } from 'services/widgets/settings/emote-wall';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';

import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import { Services } from 'components-react/service-provider';

import { $t } from 'services/i18n';

@Component({})
export default class EmoteWall extends WidgetSettings<IEmoteWallData, EmoteWallService> {
  UserService = Services.UserService;
  TwitchService = Services.TwitchService;
  OnboardingService = Services.OnboardingService;
  WindowsService = Services.WindowsService;

  get metadata() {
    return this.service.getMetadata();
  }

  get navItems() {
    return [
      { value: 'wall', label: $t('Wall Settings') },
      { value: 'source', label: $t('Source') },
    ];
  }

  render() {
    return (
      this.wData && (
        <WidgetEditor navItems={this.navItems}>
          <ValidatedForm slot="wall-properties" onInput={() => this.save()}>
            <VFormGroup value={this.wData.settings.enabled} metadata={this.metadata.enabled} />
            <VFormGroup
              value={this.wData.settings.emote_animation_duration}
              metadata={this.metadata.duration}
            />
            <VFormGroup value={this.wData.settings.emote_scale} metadata={this.metadata.scale} />
            <VFormGroup
              value={this.wData.settings.combo_required}
              metadata={this.metadata.comboRequired}
            />
            <VFormGroup
              value={this.wData.settings.combo_count}
              metadata={this.metadata.comboCount}
            />
            <VFormGroup
              value={this.wData.settings.combo_timeframe}
              metadata={this.metadata.comboTimeframe}
            />
            <VFormGroup
              value={this.wData.settings.ignore_duplicates}
              metadata={this.metadata.ignoreDuplicates}
            />
          </ValidatedForm>
        </WidgetEditor>
      )
    );
  }
}
