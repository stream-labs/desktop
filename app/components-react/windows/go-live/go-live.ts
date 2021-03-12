import { IGoLiveSettings, StreamInfoView } from '../../../services/streaming';
import { TPlatform } from '../../../services/platforms';
import { Services } from '../../service-provider';
import {
  createMutations,
  createReducers,
  mergeToProxy,
  TReducers,
  useOnCreate,
  useStateManager,
} from '../../hooks';
import { useState } from 'react';
import { keys } from '../../../services/utils';
import { ViewHandler } from '../../../services/core';
import { cloneDeep, debounce, mapValues, omit } from 'lodash';
import Form from '../../shared/inputs/Form';

export interface IGoLiveProps {
  // settings: IGoLiveSettings;
  // updateSettings: (settingsPatch: Partial<IGoLiveSettings>) => unknown;
}

// TODO: remove
export type TSetPlatformSettingsFn = <T extends TPlatform>(
  platform: T,
  newPlatformSettings: IGoLiveSettings['platforms'][T],
) => unknown;

export type TUpdatePlatformSettingsFn = <T extends TPlatform>(
  platform: T,
  patch: Partial<IGoLiveSettings['platforms'][T]>,
) => unknown;

export function getEnabledPlatforms(settings: IGoLiveSettings): TPlatform[] {
  const platforms = Object.keys(settings.platforms) as TPlatform[];
  return platforms.filter(platform => settings.platforms[platform].enabled);
}

// /**
//  * Returns true if the component should show only required fields
//  */
// export function canShowOnlyRequiredFields(settings: IGoLiveSettings): boolean {
//   const enabledPlatforms = getEnabledPlatforms(settings);
//   return enabledPlatforms.length > 1 && !settings.advancedMode;
// }

// export function (settings: IGoLiveSettings): boolean {
//   const enabledPlatforms = getEnabledPlatforms(settings);
//   return enabledPlatforms.length > 1 && !settings.advancedMode;
// }

// export function isAdvancedMode(settings: IGoLiveSettings): boolean {
//   const enabledPlatforms = getEnabledPlatforms(settings);
//   return enabledPlatforms.length == 1 || settings.advancedMode;
// }

type TCustomFieldName = 'title' | 'description';

type IGoLiveSettingsState = IGoLiveSettings & { locked: boolean; loaded: boolean };

function getInitialStreamSettings(modificators: TModificators) {
  const view = Services.StreamingService.views;
  const settings = {
    ...view.savedSettings,
    locked: false,
    loaded: false,
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

type TModificators = { isScheduleMode?: boolean; isUpdateMode?: boolean };

export function useGoLiveSettings<TWatchResult extends object = {}>(
  debug: string,
  watch?: (settings: StreamInfoView & TModificators) => TWatchResult,
  modificators: TModificators = {} as TModificators,
) {
  const { StreamingService, StreamSettingsService } = Services;

  const stateManager = useStateManager(
    () => getInitialStreamSettings(modificators),
    (getState, setState) => {
      type TState = IGoLiveSettingsState;
      function getView(state: TState) {
        return new StreamInfoView(StreamingService.state, () => state);
      }

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
          return this.updateSettings(state, { customDestinations });
        },
        switchAdvancedMode(state: TState, enabled: boolean) {
          return this.updateSettings(state, { advancedMode: enabled });
        },
        /**
         * Update the selected field for all target platforms
         **/
        updateCommonFields(state: TState, fieldName: TCustomFieldName, value: string) {
          const view = getView(state);
          let updatedState = state;
          view.platformsWithoutCustomFields.forEach(platform => {
            if (!view.supports(fieldName, [platform])) return;
            updatedState = this.updatePlatform(state, platform, { [fieldName]: value });
          });
          return updatedState;
        },
        toggleCustomFields(state: TState, platform: TPlatform) {
          const enabled = state.platforms[platform].useCustomFields;
          return this.updatePlatform(state, platform, { useCustomFields: !enabled });
        },
        lock(state: TState) {
          return this.updateSettings(state, { locked: true });
        },
      };

      const mutations = createMutations(reducers, getState, setState);

      const actions = {
        switchPlatforms: debounce((enabledPlatforms: TPlatform[]) => {
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
        }, 100),

        renderPlatformSettings(
          commonFields: JSX.Element,
          requiredFields: JSX.Element,
          ptionalFields: JSX.Element,
        ) {
          let settingsMode: 'singlePlatform' | 'multiplatformAdvanced' | 'multiplatformSimple';
          if (view.isMultiplatformMode) {
            settingsMode = view.isAdvancedMode ? 'multiplatformAdvanced' : 'multiplatformSimple';
          } else {
            settingsMode = 'singlePlatform';
          }
          switch (settingsMode) {
            case 'singlePlatform':
              return [commonFields, requiredFields, ptionalFields];
            case 'multiplatformSimple':
              return requiredFields;
            case 'multiplatformAdvanced':
              return [requiredFields, ptionalFields, commonFields];
          }
        },

        goLive() {
          StreamingService.actions.goLive(getState());
        },

        updateStream() {
          StreamingService.actions.updateStreamSettings(getState());
        },

        save(settings: TState) {
          const settingsToSave = omit(settings, 'locked');
          StreamSettingsService.setGoLiveSettings(settingsToSave);
        },

        reload() {
          mutations.updateSettings(getInitialStreamSettings(modificators));
        },

        async prepopulate() {
          mutations.lock();
          await StreamingService.actions.return.prepopulateInfo();
          actions.reload();
          if (!view.error) mutations.updateSettings({ loaded: true });
        },
      };

      const view = new StreamInfoView(StreamingService.state, getState);

      const result = mergeToProxy(
        {
          ...mutations,
          ...actions,
          ...modificators,
        },
        view.exposeProps(),
      );

      return result;

      // return mergeToProxy(
      //   {
      //     updateSettings,
      //     updatePlatform,
      //     switchPlatform,
      //     updateCommonFields,
      //     toggleCustomFields,
      //     switchAdvancedMode,
      //     switchCustomDestination,
      //     goLive,
      //     ...modificators,
      //   },
      //   view.exposeProps(),
      // );
    },
    debug,
    watch,
  );

  return stateManager as typeof stateManager & TWatchResult;
}

function mergeActionsAndView<TActions extends object, TView extends ViewHandler<any>>(
  actions: TActions,
  view: TView,
): TActions & TView {
  return new Proxy(
    {},
    {
      get(key) {
        const propName = key as string;
        return actions.hasOwnProperty(propName) ? actions[propName] : view[propName];
      },
    },
  ) as TActions & TView;
}

function exposeView<
  TState extends object,
  TView extends object,
  TPropName extends keyof TView,
  TResult extends { [K in TPropName]: TView[K] }
>(view: TView): { [K in TPropName]: TView[K] } {
  const result: any = {};
  Object.getOwnPropertyNames(view.constructor.prototype).forEach(
    propName => (result[propName] = view[propName]),
  );

  for (const propName in view) {
    result[propName] = view[propName];
  }
  console.log('exposed props', result);
  return result as TResult;
}

//
// function exposeActions<
//   TState,
//   TRest extends any[],
//   TActionName extends keyof TActions,
//   TActions extends { [K in TActionName]: (prevState: TState, ...args: TRest) => void }
//   >(actions: TActions, stateRef: { current: TState}): { [K in TActionName]: (...args: TRest) => void } {
//   return mapValues(actions, actionName => {
//     (...args: any[]) => actions[actionName]
//   });
// }
