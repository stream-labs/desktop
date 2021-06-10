import {
  IGoLiveSettings,
  IGoLiveSettingsState,
  StreamInfoView,
  TModificators,
} from '../../../services/streaming';
import { TPlatform } from '../../../services/platforms';
import { Services } from '../../service-provider';
import cloneDeep from 'lodash/cloneDeep';
import { FormInstance } from 'antd/lib/form';
import { message } from 'antd';
import { $t } from '../../../services/i18n';
import { mutation } from '../../store';
import { useFeature } from '../../hooks/useFeature';
import { useForm } from '../../shared/inputs/Form';

type TCustomFieldName = 'title' | 'description';
// type TModificators = { isUpdateMode?: boolean; isScheduleMode?: boolean };
// type IGoLiveSettingsState = IGoLiveSettings & TModificators & { needPrepopulate: boolean };

export class GoLiveSettingsFeature extends StreamInfoView<IGoLiveSettingsState> {
  // antd form instance
  public form: FormInstance;

  constructor(initialState: IGoLiveSettingsState) {
    super(initialState);
  }

  state = {
    isUpdateMode: false,
    twee
  }

  init(params: { isUpdateMode: boolean; isScheduleMode: boolean; form: FormInstance }) {
    this.form = params.form;
    this.state.isScheduleMode = params.isScheduleMode;
    this.state.isUpdateMode = params.isUpdateMode;
    this.prepopulate();
  }

  // creates an initial state
  getInitialStreamSettings() {
    const modificators = { isUpdateMode: false, isScheduleMode: false };
    const view = new StreamInfoView({});
    const settings = {
      ...view.savedSettings, // copy saved stream settings
      needPrepopulate: true, // we need to sync platform settings after context create
      tweetText: view.getTweetText(view.commonFields.title), // generate a default tweet text
      ...modificators,
    };
    // if stream has not been started than we allow to change settings only for a primary platform
    // so delete other platforms from the settings object
    if (modificators.isUpdateMode && !view.isMidStreamMode) {
      Object.keys(settings.platforms).forEach((platform: TPlatform) => {
        if (!this.checkPrimaryPlatform(platform)) delete settings.platforms[platform];
      });
    }
    return settings;
  }

  getView(state: IGoLiveSettingsState) {
    return new StreamInfoView(state);
  }
  get settings() {
    return this.state;
  }

  getSettings() {
    return this.state;
  }

  get isLoading() {
    const state = this.state;
    return state.needPrepopulate || this.getView(this.state).isLoading;
  }

  get customDestinations() {
    return this.state.customDestinations;
  }

  get optimizedProfile() {
    return this.state.optimizedProfile;
  }

  get tweetText() {
    return this.state.tweetText;
  }

  get isUpdateMode() {
    return this.state.isUpdateMode;
  }

  get isScheduleMode() {
    return this.state.isScheduleMode;
  }

  // select eligible layout and renders settings
  renderPlatformSettings(
    commonFields: JSX.Element,
    requiredFields: JSX.Element,
    optionalFields?: JSX.Element,
    essentialOptionalFields?: JSX.Element,
  ) {
    let settingsMode: 'singlePlatform' | 'multiplatformAdvanced' | 'multiplatformSimple';
    if (this.isMultiplatformMode) {
      settingsMode = this.isAdvancedMode ? 'multiplatformAdvanced' : 'multiplatformSimple';
    } else {
      settingsMode = 'singlePlatform';
    }

    switch (settingsMode) {
      case 'singlePlatform':
        return [essentialOptionalFields, commonFields, requiredFields, optionalFields];
      case 'multiplatformSimple':
        return requiredFields;
      case 'multiplatformAdvanced':
        return [essentialOptionalFields, requiredFields, optionalFields, commonFields];
    }
  }

  /**
   * Update top level settings
   */
  @mutation()
  updateSettings(patch: Partial<IGoLiveSettingsState>) {
    console.log('Update settings', patch);
    const newSettings = { ...this.state, ...patch };
    // we should re-calculate common fields before applying new settings
    const platforms = this.getView(newSettings).applyCommonFields(newSettings.platforms);
    Object.assign(this.state, { ...newSettings, platforms });
  }
  /**
   * Update settings for a specific platforms
   */
  @mutation()
  updatePlatform(platform: TPlatform, patch: Partial<IGoLiveSettings['platforms'][TPlatform]>) {
    const updated = {
      platforms: {
        ...this.state.platforms,
        [platform]: { ...this.state.platforms[platform], ...patch },
      },
    };
    this.updateSettings(updated);
  }
  /**
   * Enable/disable a custom ingest destinations
   */
  @mutation()
  switchCustomDestination(destInd: number, enabled: boolean) {
    const customDestinations = cloneDeep(this.getView(this.state).customDestinations);
    customDestinations[destInd].enabled = enabled;
    this.updateSettings({ customDestinations });
  }
  /**
   * Switch Advanced or Simple mode
   */

  @mutation()
  switchAdvancedMode(enabled: boolean) {
    this.updateSettings({ advancedMode: enabled });
  }
  /**
   * Set a common field like title or description for all eligible platforms
   **/

  @mutation()
  updateCommonFields(fieldName: TCustomFieldName, value: string) {
    this.platformsWithoutCustomFields.forEach(platform => {
      if (!this.supports(fieldName, [platform])) return;
      this.state.platforms[platform][fieldName] = value;
    });
  }
  /**
   * Enable/disable custom common fields for a platform
   **/

  @mutation()
  toggleCustomFields(platform: TPlatform) {
    const enabled = this.state.platforms[platform].useCustomFields;
    return this.updatePlatform(platform, { useCustomFields: !enabled });
  }

  /**
   * Save current settings so we can use it next time we open the GoLiveWindow
   */
  save(settings: IGoLiveSettingsState) {
    Services.StreamSettingsService.actions.return.setGoLiveSettings(settings);
  }

  /**
   * Switch platforms on/off and save settings
   * If platform is enabled then prepopulate its settings
   */
  switchPlatforms(enabledPlatforms: TPlatform[]) {
    console.log('SWITCH PLATFORMS');
    this.linkedPlatforms.forEach(platform => {
      this.updatePlatform(platform, { enabled: enabledPlatforms.includes(platform) });
    });

    console.log('SAVE SETTINGS');
    this.save(this.settings);

    console.log('PREPOPULATE');
    this.prepopulate();
  }

  /**
   * Validate the form and show an error message
   */
  async validate() {
    try {
      await this.form.validateFields();
      return true;
    } catch (e: unknown) {
      message.error($t('Invalid settings. Please check the form'));
      return false;
    }
  }

  /**
   * Validate the form and start streaming
   */
  async goLive() {
    if (await this.validate()) {
      Services.StreamingService.actions.goLive(this.state);
    }
  }
  /**
   * Validate the form and send new settings for each eligible platform
   */
  async updateStream() {
    if (
      (await this.validate()) &&
      (await Services.StreamingService.actions.return.updateStreamSettings(this.state))
    ) {
      message.success($t('Successfully updated'));
    }
  }

  /**
   * Fetch settings for each platform
   */
  async prepopulate() {
    await Services.StreamingService.actions.return.prepopulateInfo();

    // Take saved settings and load them into the current context state
    this.updateSettings(this.getInitialStreamSettings());
    this.updateSettings({ needPrepopulate: false });
  }
}

export function useGoLiveSettings() {
  const form = useForm();

  return useFeature(GoLiveSettingsFeature, {
    form,
    isUpdateMode: false,
    isScheduleMode: false,
  });
}
