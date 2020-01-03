import { Component } from 'vue-property-decorator';
import { MediaShareService, IMediaShareData } from 'services/widgets/settings/media-share';

import WidgetEditor from 'components/windows/WidgetEditor.vue';
import WidgetSettings from './WidgetSettings.vue';

import { metadata } from './inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import NumberInput from 'components/shared/inputs/NumberInput.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';

import { $t } from 'services/i18n';
import styles from './MedaShare.m.less';

@Component({})
export default class MediaShare extends WidgetSettings<IMediaShareData, MediaShareService> {
  get metadata() {
    return this.service.getMetadata();
  }

  navItems = [
    { value: 'media', label: $t('Manage Media Settings') },
    { value: 'source', label: $t('Source') },
  ];

  async unbanMedia(media: string) {
    await this.service.unbanMedia(media);
  }

  get banList() {
    if (this.wData && !this.wData.banned_media.length) {
      return <span class={styles.whisper}>{$t('No banned media found')}</span>;
    }

    return (
      this.wData &&
      this.wData.banned_media.map(media => (
        <div
          vTooltip={$t('Banned by %{user}', { user: media.action_by })}
          class={styles.banlistCell}
        >
          <span>{media.media_title}</span>
          <button class="button button--default" onClick={() => this.unbanMedia(media.media)}>
            {$t('Unban')}
          </button>
        </div>
      ))
    );
  }

  get form() {
    return (
      this.loaded && (
        <ValidatedForm slot="media-properties" onInput={() => this.save()}>
          <VFormGroup metadata={this.metadata.pricePerSecond}>
            <NumberInput vModel={this.wData.settings.price_per_second} metadata={{}} />
            <span>{$t('USD')}</span>
          </VFormGroup>
          <VFormGroup metadata={this.metadata.minAmount}>
            <NumberInput vModel={this.wData.settings.min_amount_to_share} metadata={{}} />
            <span>{$t('USD')}</span>
          </VFormGroup>
          <VFormGroup metadata={this.metadata.maxDuration}>
            <NumberInput vModel={this.wData.settings.max_duration} metadata={{}} />
            <span>{$t('seconds')}</span>
          </VFormGroup>
          <VFormGroup vModel={this.wData.settings.buffer_time} metadata={this.metadata.buffer} />
          <VFormGroup vModel={this.wData.settings.security} metadata={this.metadata.security} />
        </ValidatedForm>
      )
    );
  }

  render() {
    return (
      this.wData && (
        <WidgetEditor
          slots={[{ value: 'banlist', label: $t('Banned Media') }]}
          navItems={this.navItems}
        >
          <div slot="banlist" class={styles.banlist}>
            {this.banList}
          </div>
          {this.form}
        </WidgetEditor>
      )
    );
  }
}
