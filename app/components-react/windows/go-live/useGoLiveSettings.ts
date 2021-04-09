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
  const form = useForm();
  const { dependencyWatcher, isRoot, contextView } = useStateManager(
    () => getInitialStreamSettings(modificators),
    (getState, setState) => initializeGoLiveSettings(getState, setState, form),
    computedPropsCb as TComputedPropsCb,
  );

  useEffect(() => {
    if (isRoot && contextView.needPrepopulate) {
      contextView.prepopulate();
    }
  }, []);

  return dependencyWatcher;
}

function getInitialStreamSettings(modificators: TModificators): IGoLiveSettingsState {
  const { StreamingService } = Services;
  modificators = { isUpdateMode: false, isScheduleMode: false, ...modificators };
  const view = StreamingService.views;
  const settings = {
    ...view.savedSettings,
    needPrepopulate: true,
    modificators,
    ...modificators,
    tweetText: view.getTweetText(view.commonFields.title),
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

function initializeGoLiveSettings(
  getState: () => IGoLiveSettingsState,
  setState: (newState: IGoLiveSettingsState) => void,
  form: FormInstance,
) {
  const { StreamingService, StreamSettingsService } = Services;
  type TState = IGoLiveSettingsState;
  function getView(state: TState) {
    return new StreamInfoView(StreamingService.state, () => state);
  }

  const getters = {
    get isLoading() {
      const state = getState();
      return state.needPrepopulate || getView(state).isLoading;
    },

    get form() {
      return form;
    },

    getSettings() {
      return getView(getState()).settings;
    },

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

  const reducers = {
    updateSettings(state: TState, patch: Partial<TState>) {
      const newSettings = { ...state, ...patch };
      // we should re-calculate common fields before applying new settings
      const platforms = getView(newSettings).applyCommonFields(newSettings.platforms);
      return { ...newSettings, platforms };
    },
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
    switchCustomDestination(state: TState, destInd: number, enabled: boolean) {
      const customDestinations = cloneDeep(getView(state).customDestinations);
      customDestinations[destInd].enabled = enabled;
      return reducers.updateSettings(state, { customDestinations });
    },
    switchAdvancedMode(state: TState, enabled: boolean) {
      return reducers.updateSettings(state, { advancedMode: enabled });
    },
    /**
     * Update the selected field for all target platforms
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
    toggleCustomFields(state: TState, platform: TPlatform) {
      const enabled = state.platforms[platform].useCustomFields;
      return this.updatePlatform(state, platform, { useCustomFields: !enabled });
    },
  };

  const mutations = createMutations(reducers, getState, setState);

  const actions = {
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
      actions.save(newSettings);
      if (platformHasBeenEnabled) {
        actions.prepopulate();
      } else {
        mutations.updateSettings(newSettings);
      }
    },

    async validate() {
      try {
        await form.validateFields();
        return true;
      } catch (e) {
        message.error($t('Invalid settings. Please check the form'));
        return false;
      }
    },

    async goLive() {
      if (await actions.validate()) {
        StreamingService.actions.goLive(getState());
      }
    },

    async updateStream() {
      if (await actions.validate() && await StreamingService.actions.return.updateStreamSettings(getState())) {
        message.success($t('Successfully updated'));
      }
    },

    save(settings: TState) {
      StreamSettingsService.actions.return.setGoLiveSettings(settings);
    },

    reload() {
      mutations.updateSettings(
        getInitialStreamSettings(pick(getState(), 'isUpdateMode', 'isScheduleMode')),
      );
      mutations.updateSettings({ needPrepopulate: false });
    },

    async prepopulate() {
      await StreamingService.actions.return.prepopulateInfo();
      actions.reload();
    },
  };

  const view = new StreamInfoView(StreamingService.state, getState);
  const mergedActionsAndGetters = merge(getters, { ...mutations, ...actions });
  return merge(view.exposeProps(), mergedActionsAndGetters);
}
