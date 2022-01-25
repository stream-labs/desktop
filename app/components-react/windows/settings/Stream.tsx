import React from 'react';
import { useModule } from '../../hooks/useModule';
import { $t } from '../../../services/i18n';
import { ICustomStreamDestination } from '../../../services/settings/streaming';
import { EStreamingState } from '../../../services/streaming';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import cloneDeep from 'lodash/cloneDeep';
import namingHelpers from '../../../util/NamingHelpers';
import { Services } from '../../service-provider';
import { ObsGenericSettingsForm } from './ObsSettings';
import { mutation } from '../../store';
import css from './Stream.m.less';
import cx from 'classnames';
import { Button, message, Tooltip } from 'antd';
import PlatformLogo from '../../shared/PlatformLogo';
import Form, { useForm } from '../../shared/inputs/Form';
import { createBinding, TextInput } from '../../shared/inputs';
import { ButtonGroup } from '../../shared/ButtonGroup';
import { FormInstance } from 'antd/lib/form';

/**
 * A Redux module for components in the StreamSetting window
 */
class StreamSettingsModule {
  // DEFINE A STATE
  state = {
    // false = edit mode off
    // true = add custom destination mode
    // number = edit custom destination mode where number is the index of the destination
    editCustomDestMode: false as boolean | number,

    // form data
    customDestForm: {
      name: '',
      url: '',
      streamKey: '',
      enabled: false,
    } as ICustomStreamDestination,
  };

  // INJECT SERVICES

  private get streamSettingsService() {
    return Services.StreamSettingsService;
  }
  private get userService() {
    return Services.UserService;
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

  // DEFINE MUTATIONS

  @mutation()
  editCustomDest(ind: number) {
    this.state.customDestForm = cloneDeep(this.customDestinations[ind]);
    this.state.editCustomDestMode = ind;
  }

  @mutation()
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
  removeCustomDest(ind: number) {
    const destinations = cloneDeep(this.customDestinations);
    destinations.splice(ind, 1);
    this.streamSettingsService.setGoLiveSettings({ customDestinations: destinations });
  }

  @mutation()
  stopEditing() {
    this.state.editCustomDestMode = false;
  }

  @mutation()
  updateCustomDestForm(updatedFields: Partial<ICustomStreamDestination>) {
    this.state.customDestForm = { ...this.state.customDestForm, ...updatedFields };
  }

  @mutation()
  private fixUrl() {
    // add "/" to the end of url string
    if (
      this.state.customDestForm.streamKey &&
      this.state.customDestForm.url.charAt(this.state.customDestForm.url.length - 1) !== '/'
    ) {
      this.state.customDestForm.url += '/';
    }
  }

  // DEFINE ACTIONS AND GETTERS

  get platforms() {
    return this.streamingView.allPlatforms.filter(platform => {
      // Only show tiktok if it's already linked
      if (platform === 'tiktok') {
        return !!this.userService.views.auth?.platforms?.tiktok;
      }

      return true;
    });
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

  private form: FormInstance;
  setForm(form: FormInstance) {
    this.form = form;
  }

  platformMerge(platform: TPlatform) {
    this.navigationService.navigate('PlatformMerge', { platform });
    this.windowsService.actions.closeChildWindow();
  }

  platformUnlink(platform: TPlatform) {
    getPlatformService(platform).unlink();
  }

  async saveCustomDest() {
    // validate form
    try {
      await this.form.validateFields();
    } catch (e: unknown) {
      message.error($t('Invalid settings. Please check the form'));
      return;
    }

    this.fixUrl();

    const destinations = cloneDeep(this.customDestinations);
    const isUpdateMode = typeof this.state.editCustomDestMode === 'number';
    if (isUpdateMode) {
      const ind = this.state.editCustomDestMode as number;
      destinations.splice(ind, 1, this.state.customDestForm);
    } else {
      destinations.push(this.state.customDestForm);
    }
    this.streamSettingsService.setGoLiveSettings({ customDestinations: destinations });
    this.stopEditing();
  }

  private suggestCustomDestName() {
    const destinations = this.customDestinations;
    return namingHelpers.suggestName($t('Destination'), (name: string) =>
      destinations.find(dest => dest.name === name),
    );
  }
}

// wrap the module into a React hook
function useStreamSettings() {
  return useModule(StreamSettingsModule).select();
}

/**
 * A root component for StreamSettings
 */
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
            'Streaming to a custom ingest is advanced functionality. Some features may stop working as expected',
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

/**
 * Renders a Platform placeholder
 */
function Platform(p: { platform: TPlatform }) {
  const platform = p.platform;
  const { UserService, StreamingService } = Services;
  const { canEditSettings, platformMerge, platformUnlink } = useStreamSettings();
  const isMerged = StreamingService.views.checkPlatformLinked(platform);
  const username = UserService.state.auth!.platforms[platform]?.username;
  const platformName = getPlatformService(platform).displayName;
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
            <Button
              onClick={() => platformMerge(platform)}
              style={{
                backgroundColor: `var(--${platform})`,
                borderColor: 'transparent',
                color: platform === 'trovo' ? 'black' : 'inherit',
              }}
            >
              {$t('Connect')}
            </Button>
          </span>
        )}
        {shouldShowUnlinkBtn && (
          <Button danger onClick={() => platformUnlink(platform)}>
            {$t('Unlink')}
          </Button>
        )}
        {shouldShowPrimaryBtn && (
          <Tooltip
            title={$t(
              'You cannot unlink the platform you used to sign in to Streamlabs Desktop. If you want to unlink this platform, please sign in with a different platform.',
            )}
          >
            <Button disabled={true} type="primary">
              {$t('Logged in')}
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/**
 * Renders a custom destinations list
 */
function CustomDestinationList() {
  const { isPrime, customDestinations, editCustomDestMode, addCustomDest } = useStreamSettings();
  const shouldShowPrimeLabel = !isPrime;
  const destinations = customDestinations;
  const isEditMode = editCustomDestMode !== false;
  const shouldShowAddForm = editCustomDestMode === true;
  const canAddMoreDestinations = destinations.length < 2;
  return (
    <div>
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
    </div>
  );
}

/**
 * Renders a single custom destination
 */
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

/**
 * Renders an ADD/EDIT form for the custom destination
 */
function CustomDestForm() {
  const {
    saveCustomDest,
    stopEditing,
    customDestForm,
    updateCustomDestForm,
    setForm,
  } = useStreamSettings();
  const form = useForm();
  setForm(form);
  const bind = createBinding(customDestForm, updateCustomDestForm);

  return (
    <Form name="customDestForm">
      <TextInput label={$t('Name')} required {...bind.name} />
      <TextInput label={'URL'} required {...bind.url} />
      <TextInput label={$t('Stream Key')} {...bind.streamKey} isPassword />
      <ButtonGroup>
        <Button onClick={stopEditing}>{$t('Cancel')}</Button>
        <Button type="primary" onClick={saveCustomDest}>
          {$t('Save')}
        </Button>
      </ButtonGroup>
    </Form>
  );
}
