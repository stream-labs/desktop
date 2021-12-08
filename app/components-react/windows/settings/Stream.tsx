import React from 'react';
import { useModule } from '../../hooks/useModule';
import { $t } from '../../../services/i18n';
import { ICustomStreamDestination } from '../../../services/settings/streaming';
import { ISettingsSubCategory } from '../../../services/settings';
import { EStreamingState } from '../../../services/streaming';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import cloneDeep from 'lodash/cloneDeep';
import namingHelpers from '../../../util/NamingHelpers';
import { Services } from '../../service-provider';
import { ObsGenericSettingsForm } from './ObsSettings';
import { mutation } from '../../store';
import css from './Stream.m.less';
import cx from 'classnames';
import { Tooltip } from 'antd';
import PlatformLogo from '../../shared/PlatformLogo';
import Form from '../../shared/inputs/Form';
import { createBinding, TextInput } from '../../shared/inputs';

class StreamSettingsModule {
  // INJECT SERVICES

  private get streamSettingsService() {
    return Services.StreamSettingsService;
  }
  private get userService() {
    return Services.UserService;
  }
  private get restreamService() {
    return Services.RestreamService;
  }
  private get navigationService() {
    return Services.NavigationService;
  }
  private get windowsService() {
    return Services.WindowsService;
  }
  private get streamingService() {
    return Services.StreamingService;
  }
  private get magicLinkService() {
    return Services.MagicLinkService;
  }

  // DEFINE A STATE
  state = {
    editCustomDestMode: false as boolean | number,
    customDestForm: {
      name: '',
      url: '',
      streamKey: '',
      enabled: false,
    } as ICustomStreamDestination,
  };

  // private customDestModel: ICustomStreamDestination = {
  //   name: '',
  //   url: '',
  //   streamKey: '',
  //   enabled: false,
  // };

  // private customDestMetadata = formMetadata({
  //   name: metadata.text({ title: $t('Name'), required: true, fullWidth: true }),
  //   url: metadata.text({ title: 'URL', required: true, fullWidth: true }),
  //   streamKey: metadata.text({ title: $t('Stream Key'), masked: true, fullWidth: true }),
  // });

  get platforms() {
    return this.streamingView.allPlatforms.filter(platform => {
      // Only show tiktok if it's already linked
      if (platform === 'tiktok') {
        return !!this.userService.views.auth?.platforms?.tiktok;
      }

      return true;
    });
  }

  saveObsSettings(obsSettings: ISettingsSubCategory[]) {
    this.streamSettingsService.setObsStreamSettings(obsSettings);
  }

  get obsSettings() {
    return this.streamSettingsService.views.obsStreamSettings;
  }

  get isPrime() {
    return this.userService.isPrime;
  }

  disableProtectedMode() {
    this.streamSettingsService.actions.setSettings({ protectedModeEnabled: false });
  }

  enableProtectedMode() {
    this.streamSettingsService.actions.setSettings({
      protectedModeEnabled: true,
      key: '',
      streamType: 'rtmp_common',
    });
  }

  get protectedModeEnabled(): boolean {
    return this.streamSettingsService.protectedModeEnabled;
  }

  get streamingView() {
    return this.streamingService.views;
  }

  get needToShowWarning() {
    return this.userService.isLoggedIn && !this.protectedModeEnabled;
  }

  get canEditSettings() {
    return this.streamingService.state.streamingStatus === EStreamingState.Offline;
  }

  get customDestinations() {
    return this.streamingView.savedSettings.customDestinations;
  }

  platformMerge(platform: TPlatform) {
    this.navigationService.navigate('PlatformMerge', { platform });
    this.windowsService.actions.closeChildWindow();
  }

  platformUnlink(platform: TPlatform) {
    getPlatformService(platform).unlink();
  }

  @mutation()
  editCustomDest(ind: number) {
    this.state.customDestForm = cloneDeep(this.customDestinations[ind]);
    this.state.editCustomDestMode = ind;
  }

  addCustomDest() {
    if (!this.userService.isPrime) {
      this.magicLinkService.actions.linkToPrime('slobs-multistream');
      return;
    }
    this.state.customDestForm = {
      name: this.suggestCustomDestName(),
      streamKey: '',
      url: '',
      enabled: false,
    };
    this.state.editCustomDestMode = true;
  }

  @mutation()
  private async saveCustomDest() {
    // TODO: validate
    // if (!(await this.$refs.customDestForm.validate())) return;

    // add "/" to the end of url string
    if (
      this.state.customDestForm.streamKey &&
      this.state.customDestForm.url.charAt(this.state.customDestForm.url.length - 1) !== '/'
    ) {
      this.state.customDestForm.url += '/';
    }

    const destinations = cloneDeep(this.customDestinations);
    const isUpdateMode = typeof this.state.editCustomDestMode === 'number';
    if (isUpdateMode) {
      const ind = this.state.editCustomDestMode as number;
      destinations.splice(ind, 1, this.state.customDestForm);
    } else {
      destinations.push(this.state.customDestForm);
    }
    this.streamSettingsService.setGoLiveSettings({ customDestinations: destinations });
    this.state.editCustomDestMode = false;
  }

  private suggestCustomDestName() {
    const destinations = this.customDestinations;
    return namingHelpers.suggestName($t('Destination'), (name: string) =>
      destinations.find(dest => dest.name === name),
    );
  }

  @mutation()
  removeCustomDest(ind: number) {
    const destinations = cloneDeep(this.customDestinations);
    destinations.splice(ind, 1);
    this.streamSettingsService.setGoLiveSettings({ customDestinations: destinations });
  }

  @mutation()
  cancelEditing() {
    this.state.editCustomDestMode = false;
  }
}

// wrap the module into a React hook
function useStreamSettings() {
  return useModule(StreamSettingsModule).select();
}

export function StreamSettings() {
  const {
    platforms,
    protectedModeEnabled,
    canEditSettings,
    disableProtectedMode,
    needToShowWarning,
    enableProtectedMode,
  } = useStreamSettings();

  return (
    <div>
      {/* account info */}
      {protectedModeEnabled && (
        <div>
          <h2>{$t('Stream Destinations')}</h2>
          {platforms.map(platform => (
            <Platform key={platform} platform={platform} />
          ))}

          <CustomDestinationList />

          {canEditSettings && (
            <div>
              <a onClick={disableProtectedMode}>{$t('Stream to custom ingest')}</a>
            </div>
          )}
        </div>
      )}

      {/* WARNING messages */}
      {!canEditSettings && (
        <div className="section section--warning">
          {$t("You can not change these settings when you're live")}
        </div>
      )}
      {needToShowWarning && (
        <div className="section section--warning">
          <b>{$t('Warning')}: </b>
          {$t(
            'Streaming to a custom ingest is advanced functionality. Some features of Streamlabs OBS may stop working as expected',
          )}
          <br />
          <br />

          {canEditSettings && (
            <button className="button button--warn" onClick={enableProtectedMode}>
              {$t('Use recommended settings')}
            </button>
          )}
        </div>
      )}

      {/* OBS settings */}
      {!protectedModeEnabled && canEditSettings && <ObsGenericSettingsForm />}
    </div>
  );
}

StreamSettings.page = 'Stream';

function Platform(p: { platform: TPlatform }) {
  const platform = p.platform;
  const { UserService, StreamingService } = Services;
  const { canEditSettings, platformMerge, platformUnlink } = useStreamSettings();
  const isMerged = StreamingService.views.checkPlatformLinked(platform);
  const username = UserService.state.auth!.platforms[platform]?.username;
  const platformName = getPlatformService(platform).displayName;
  const buttonClass = {
    facebook: 'button--facebook',
    youtube: 'button--youtube',
    twitch: 'button--twitch',
    tiktok: 'button--tiktok',
  }[platform];
  const isPrimary = StreamingService.views.checkPrimaryPlatform(platform);
  const shouldShowPrimaryBtn = isPrimary;
  const shouldShowConnectBtn = !isMerged && canEditSettings;
  const shouldShowUnlinkBtn = !isPrimary && isMerged && canEditSettings;

  return (
    <div className="section flex">
      <div className="margin-right--20" style={{ width: '50px' }}>
        <PlatformLogo className={css.platformLogo} size="medium" platform={platform} />
      </div>
      <div>
        {platformName} <br />
        {isMerged ? username : <span style={{ opacity: '0.5' }}>{$t('unlinked')}</span>} <br />
      </div>

      <div style={{ marginLeft: 'auto' }}>
        {shouldShowConnectBtn && (
          <span>
            <button
              onClick={() => platformMerge(platform)}
              className={cx(`button ${buttonClass}`, css.platformButton)}
            >
              {$t('Connect')}
            </button>
          </span>
        )}
        {shouldShowUnlinkBtn && (
          <button
            onClick={() => platformUnlink(platform)}
            className={cx('button button--soft-warning', css.platformButton)}
          >
            {$t('Unlink')}
          </button>
        )}
        {shouldShowPrimaryBtn && (
          <Tooltip
            title={$t(
              'You cannot unlink the platform you used to sign in to Streamlabs OBS. If you want to unlink this platform, please sign in with a different platform.',
            )}
          >
            <button disabled={true} className={cx('button button--action', css.platformButton)}>
              {$t('Logged in')}
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function CustomDestinationList() {
  const { isPrime, customDestinations, editCustomDestMode, addCustomDest } = useStreamSettings();
  const shouldShowPrimeLabel = !isPrime;
  const destinations = customDestinations;
  const isEditMode = editCustomDestMode !== false;
  const shouldShowAddForm = editCustomDestMode === true;
  const canAddMoreDestinations = destinations.length < 2;
  return (
    <p>
      {destinations.map((dest, ind) => (
        <CustomDestination key={ind} ind={ind} destination={dest} />
      ))}
      {!isEditMode && canAddMoreDestinations && (
        <a className={css.addDestinationBtn} onClick={addCustomDest}>
          <i className="fa fa-plus" />
          <span>{$t('Add Destination')}</span>
          {shouldShowPrimeLabel ? (
            <b className={css.prime}>prime</b>
          ) : (
            <div className={css.prime} />
          )}
        </a>
      )}
      {!canAddMoreDestinations && <p>{$t('Maximum custom destinations has been added')}</p>}
      {shouldShowAddForm && (
        <div className="section">
          <CustomDestForm />
        </div>
      )}
    </p>
  );
}

function CustomDestination(p: { destination: ICustomStreamDestination; ind: number }) {
  const { editCustomDestMode, removeCustomDest, editCustomDest } = useStreamSettings();
  const isEditMode = editCustomDestMode === p.ind;
  return (
    <div className="section">
      <div className="flex">
        <div className="margin-right--20" style={{ width: '50px' }}>
          <i className={cx(css.destinationLogo, 'fa fa-globe')} />
        </div>
        <div className={css.destinationName}>
          <span>{p.destination.name}</span> <br />
          {p.destination.url}
          <br />
        </div>

        <div style={{ marginLeft: 'auto' }}>
          {!isEditMode && (
            <div>
              <i
                className={cx('fa fa-trash', css.actionIcon)}
                onClick={() => removeCustomDest(p.ind)}
              />
              <i
                className={cx('fa fa-pen', css.actionIcon)}
                onClick={() => editCustomDest(p.ind)}
              />
            </div>
          )}
        </div>
      </div>
      {isEditMode && <CustomDestForm />}
    </div>
  );
}

function CustomDestForm() {
  const { saveCustomDest, cancelEditing } = useStreamSettings();

  return (
    <Form ref="customDestForm">
      <TextInput label={$t('Name')} required />
      <TextInput label={$t('URL')} required />
      <TextInput label={$t('Stream Key')} />

      <p style={{ textAlign: 'right' }}>
        <button className="button button--default" onClick={cancelEditing}>
          {$t('Cancel')}
        </button>
        <button className="button button--action" onClick={saveCustomDest}>
          {$t('Save')}
        </button>
      </p>
    </Form>
  );
}
