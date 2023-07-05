import { useModule } from 'slap';
import React from 'react';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import { OnboardingModule } from './Onboarding';
import { Services } from 'components-react/service-provider';
import { useWatchVuex } from 'components-react/hooks';
import { UltraComparison } from 'components-react/shared/UltraComparison';

export function Prime() {
  const { UserService, RecordingModeService } = Services;
  const { next } = useModule(OnboardingModule);
  let tableProps;

  if (RecordingModeService.views.isRecordingModeEnabled) {
    tableProps = {
      tableHeaders: [
        { text: $t('Themes and Overlays'), icon: 'icon-themes' },
        { text: $t('Streamlabs Desktop'), icon: 'icon-desktop' },
        { text: $t('Highlighter'), icon: 'icon-slice' },
        { text: $t('Collab Cam'), icon: 'icon-team-2' },
        { text: $t('Tipping'), icon: 'icon-donation-settings' },
        { text: $t('Storage'), icon: 'icon-cloud-backup' },
        { text: $t('Custom Branding'), icon: 'icon-creator-site' },
        {
          text: 'Cross Clip',
          icon: 'icon-editor-7',
          tooltip: $t('Format Clips for TikTok, Shorts, etc'),
        },
        {
          text: 'Video Editor',
          icon: 'icon-streamlabs',
          tooltip: $t('Collaborative Video Editing'),
        },
        { text: $t('Merch Store'), icon: 'icon-upperwear' },
      ],
      tableData: {
        standard: [
          { text: $t('Access to Free Overlays and Themes') },
          { text: '✓', key: 'check1' },
          { text: '✓', key: 'check2' },
          { text: $t('Add 1 Guest') },
          { text: $t('No-Fee Tipping') },
          { text: '1GB' },
          { text: $t('Logo Maker, Intro Maker, Emote Maker') },
          { text: $t('Create Custom Videos with Watermark') },
          { text: $t('30 Minute Videos + 15GB Storage') },
          { text: $t('Design and Sell Custom Merch') },
        ],
        prime: [
          {
            text: $t('Access to All Overlays and Themes (%{themeNumber})', {
              themeNumber: '1000+',
            }),
          },
          { text: '✓', key: 'check1' },
          { text: '✓', key: 'check2' },
          { text: $t('Add Up To 11 Guests or Cameras') },
          { text: $t('Custom Tip Page and Domain') },
          { text: '10GB' },
          { text: $t('YouTube Thumbnail Maker, Creator Sites') },
          { text: $t('No Watermark + 1080p/60fps + More') },
          { text: $t('1 Hour Videos + 250GB Storage + More') },
          { text: $t('Highest Profit Margins') },
        ],
      },
    };
  }

  useWatchVuex(
    () => UserService.views.isPrime,
    isPrime => isPrime && next(),
  );

  return (
    <div style={{ width: '100%' }}>
      <h1 className={commonStyles.titleContainer}>{$t('Choose your Streamlabs plan')}</h1>
      <UltraComparison onSkip={next} refl="slobs-onboarding" {...tableProps} />
    </div>
  );
}
