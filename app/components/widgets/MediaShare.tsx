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
  pricePerSecTooltip = $t(
    'In order to control length, you can decide how much it costs per second to share media. Setting this to 0.30' +
      ' would mean that for $10, media would play for 30 seconds. The default value is 0.10.',
  );

  minAmountTooltip = $t(
    'The minimum amount a donor must donate in order to share media. The default value is $5.00 USD',
  );

  maxDurationTooltip = $t(
    'The maximum duration in seconds that media can be played, regardless of amount donated.' +
      ' The default value is 60 seconds.',
  );

  bufferTimeTooltip = $t('The time between videos the next video has to buffer.');

  securityDescription = $t(
    // tslint:disable-next-line:prefer-template
    'This slider helps you filter shared media before it can be submitted.\n' +
      'Off: No security\n' +
      'Low: 65%+ rating, 5k+ views\n' +
      'Medium: 75%+ rating, 40k+ views\n' +
      'High: 80%+ rating, 300k+ views\n' +
      'Very High: 85%+ rating, 900k+ views',
  );

  bufferMeta = metadata.slider({
    tooltip: this.bufferTimeTooltip,
    max: 30,
    interval: 1,
    title: $t('Buffer Time'),
  });
  securityMeta = metadata.spamSecurity({
    title: $t('Spam Security'),
    tooltip: this.securityDescription,
  });

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
          <VFormGroup
            title={$t('Price Per Second')}
            metadata={{ tooltip: this.pricePerSecTooltip }}
          >
            <NumberInput vModel={this.wData.settings.price_per_second} metadata={{}} />
            <span>{$t('USD')}</span>
          </VFormGroup>
          <VFormGroup
            title={$t('Min. Amount to Share')}
            metadata={{ tooltip: this.minAmountTooltip }}
          >
            <NumberInput vModel={this.wData.settings.min_amount_to_share} metadata={{}} />
            <span>{$t('USD')}</span>
          </VFormGroup>
          <VFormGroup
            title={$t('Max Duration')}
            metadata={{ tooltip: this.maxDurationTooltip, isInteger: true }}
          >
            <NumberInput vModel={this.wData.settings.max_duration} metadata={{}} />
            <span>{$t('seconds')}</span>
          </VFormGroup>
          <VFormGroup vModel={this.wData.settings.buffer_time} metadata={this.bufferMeta} />
          <VFormGroup vModel={this.wData.settings.security} metadata={this.securityMeta} />
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
