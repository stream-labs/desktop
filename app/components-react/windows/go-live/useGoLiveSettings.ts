import { IGoLiveSettings, StreamInfoView } from '../../../services/streaming';
import { TPlatform } from '../../../services/platforms';
import { Services } from '../../service-provider';
import { createMutations, merge, useStateManager } from '../../core/useStateManager';
import { cloneDeep, pick } from 'lodash';
import Form, { useForm } from '../../shared/inputs/Form';
import { FormInstance } from 'antd/lib/form';
import { message } from 'antd';
import { $t } from '../../../services/i18n';
import { useEffect } from 'react';

type TCustomFieldName = 'title' | 'description';
type TModificators = { isUpdateMode?: boolean; isScheduleMode?: boolean };
type IGoLiveSettingsState = IGoLiveSettings & TModificators & { needPrepopulate: boolean };

/**
 * Shared state and utils for for GoLiveWindow and EditStreamWindow
 */
export function useGoLiveSettings<
  TComputedProps extends object,
  TComputedPropsCb extends (settings: StreamInfoView & TModificators) => TComputedProps
>(computedPropsCb?: TComputedPropsCb, modificators: TModificators = {} as TModificators) {
  // use form for validations
  const form = useForm();

  // use shared state for current context
  const { dependencyWatcher, isRoot, contextView } = useStateManager(
    () => getInitialStreamSettings(modificators),
    (getState, setState) => initializeGoLiveSettings(getState, setState, form),
    computedPropsCb as TComputedPropsCb,
  );

  // on component mount
  useEffect(() => {
    // if it's a root component than sync platform settings
    if (isRoot && contextView.needPrepopulate) {
      contextView.prepopulate();
    }
  }, []);

  return dependencyWatcher;
}

/**
 * Creates an initial state for the current context
 */
function getInitialStreamSettings(modificators: TModificators): IGoLiveSettingsState {
  const { StreamingService } = Services;
  modificators = { isUpdateMode: false, isScheduleMode: false, ...modificators };
  const view = StreamingService.views;
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
      if (!view.checkPrimaryPlatform(platform)) delete settings.platforms[platform];
    });
  }
  return settings;
}

/**
 * Create getters, mutations and actions
 */
function initializeGoLiveSettings(
  getState: () => IGoLiveSettingsState,
  setState: (newState: IGoLiveSettingsState) => void,
  form: FormInstance,
) {
  // inject services
  const { StreamingService, StreamSettingsService } = Services;

  // create a TState shortcut
  type TState = IGoLiveSettingsState;

  // creates a StreamInfoView object based on provided state
  function getView(state?: TState) {
    const stateGetter = state ? () => state : getState;
    return new StreamInfoView(StreamingService.state, stateGetter);
  }

  // create a StreamInfoView object based on the current state
  const view = getView();

  // DEFINE GETTERS
  // getter must not have side effects
  const getters = {
    get isLoading() {
      const state = getState();
      return state.needPrepopulate || getView(state).isLoading;
    },

    // antd form instance
    get form() {
      return form;
    },

    // return last actual settings
    getSettings() {
      return getState();
    },

    // render platform inputs based in specific layout based on the current mode
    renderPlatformSettings(
      commonFields: JSX.Element,
      requiredFields: JSX.Element,
      optionalFields: JSX.Element,
      essentialOptionalFields?: JSX.Element,
    ) {
      let settingsMode: 'singlePlatform' | 'multiplatformAdvanced' | 'multiplatformSimple';
      if (view.isMultiplatformMode) {
        settingsMode = view.isAdvancedMode ? 'multiplatformAdvanced' : 'multiplatformSimple';
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
    },
  };

  // DEFINE REDUCERS
  // reducers are pure functions that return a new modified state
  // reducers must be synchronous and must not have side effects
  const reducers = {
    /**
     * Update top level settings
     */
    updateSettings(state: TState, patch: Partial<TState>) {
      const newSettings = { ...state, ...patch };
      // we should re-calculate common fields before applying new settings
      const platforms = getView(newSettings).applyCommonFields(newSettings.platforms);
      return { ...newSettings, platforms };
    },
    /**
     * Update settings for a specific platforms
     */
    updatePlatform(
      state: TState,
      platform: TPlatform,
      patch: Partial<IGoLiveSettings['platforms'][TPlatform]>,
    ) {
      return this.updateSettings(state, {
        platforms: {
          ...state.platforms,
          [platform]: { ...state.platforms[platform], ...patch },
        },
      });
    },
    /**
     * Enable/disable a custom ingest destinations
     */
    switchCustomDestination(state: TState, destInd: number, enabled: boolean) {
      const customDestinations = cloneDeep(getView(state).customDestinations);
      customDestinations[destInd].enabled = enabled;
      return reducers.updateSettings(state, { customDestinations });
    },
    /**
     * Switch Advanced or Simple mode
     */
    switchAdvancedMode(state: TState, enabled: boolean) {
      return reducers.updateSettings(state, { advancedMode: enabled });
    },
    /**
     * Set a common field like title or description for all eligible platforms
     **/
    updateCommonFields(state: TState, fieldName: TCustomFieldName, value: string) {
      const view = getView(state);
      let updatedState = state;
      view.platformsWithoutCustomFields.forEach(platform => {
        if (!view.supports(fieldName, [platform])) return;
        updatedState = this.updatePlatform(updatedState, platform, { [fieldName]: value });
      });
      return updatedState;
    },
    /**
     * Enable/disable custom common fields for a platform
     **/
    toggleCustomFields(state: TState, platform: TPlatform) {
      const enabled = state.platforms[platform].useCustomFields;
      return this.updatePlatform(state, platform, { useCustomFields: !enabled });
    },
  };

  // create mutations from reducers to modify the current state in React.Context
  // mutations should not have any side effects except mutating the store
  const mutations = createMutations(reducers, getState, setState);
  // create a shortcut for service actions
  const serviceActions = StreamingService.actions;

  // DEFINE PRIVATE FUNCTIONS
  // we're not going to export these functions into components

  /**
   * Save current settings so we can use it next time we open the GoLiveWindow
   */
  function save(settings: TState) {
    StreamSettingsService.actions.return.setGoLiveSettings(settings);
  }

  /**
   * Take saved settings and load them into the current context state
   */
  function takeSavedSettings() {
    mutations.updateSettings(
      getInitialStreamSettings(pick(getState(), 'isUpdateMode', 'isScheduleMode')),
    );
    // consider we call takeSavedSettings() after we already prepopulated all platforms
    mutations.updateSettings({ needPrepopulate: false });
  }

  // DEFINE ACTIONS
  // actions could have side effects and could be async
  // however it's not recommended to await actions in components
  // since it violates the Flux pattern
  const actions = {
    /**
     * Switch platforms on/off and save settings
     * If platform is enabled then prepopulate its settings
     */
    switchPlatforms(enabledPlatforms: TPlatform[]) {
      let platformHasBeenEnabled = false;
      let newSettings = getState();
      view.linkedPlatforms.forEach(platform => {
        const enabled = view.getPlatformSettings(platform).enabled;
        const shouldEnable = !enabled && enabledPlatforms.includes(platform);
        if (shouldEnable) platformHasBeenEnabled = true;
        newSettings = reducers.updatePlatform(newSettings, platform, {
          enabled: enabledPlatforms.includes(platform),
        });
      });
      save(newSettings);
      if (platformHasBeenEnabled) {
        actions.prepopulate();
      } else {
        mutations.updateSettings(newSettings);
      }
    },

    /**
     * Validate the form and show an error message
     */
    async validate() {
      try {
        await form.validateFields();
        return true;
      } catch (e) {
        message.error($t('Invalid settings. Please check the form'));
        return false;
      }
    },

    /**
     * Validate the form and start streaming
     */
    async goLive() {
      if (await actions.validate()) {
        serviceActions.goLive(getState());
      }
    },
    /**
     * Validate the form and send new settings for each eligible platform
     */
    async updateStream() {
      if (
        (await actions.validate()) &&
        (await serviceActions.return.updateStreamSettings(getState()))
      ) {
        message.success($t('Successfully updated'));
      }
    },

    /**
     * Fetch settings for each platform
     */
    async prepopulate() {
      await serviceActions.return.prepopulateInfo();
      takeSavedSettings();
    },
  };

  // merge everything we are going to have accessible in components into one object
  // StateManager will take care about optimal components re-rendering
  // depending on what prop from this object will particular component use
  return merge(getView(), getters, { ...mutations, ...actions });
}
