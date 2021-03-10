import { IGoLiveSettings, StreamInfoView } from '../../../services/streaming';
import { TPlatform } from '../../../services/platforms';
import { Services } from '../../service-provider';
import { mergeToProxy, useOnCreate, useStateManager } from '../../hooks';
import { useState } from 'react';
import { keys } from '../../../services/utils';
import { ViewHandler } from '../../../services/core';
import { cloneDeep, mapValues } from 'lodash';

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

export function useGoLiveSettings<TWatchResult extends object = {}>(
  debug: string,
  watch?: (settings: StreamInfoView) => TWatchResult,
  modificators: { isScheduleMode?: boolean; isUpdateMode?: boolean } = {},
) {
  const { StreamingService, StreamSettingsService } = Services;

  const stateManager = useStateManager(
    () => StreamingService.views.savedSettings,
    (getState, setState) => {
      const view = new StreamInfoView(StreamingService.state, getState);

      function updateSettings(patch: Partial<IGoLiveSettings>) {
        const newSettings = { ...getState(), ...patch };
        // we should re-calculate common fields before applying new settings
        const platforms = view.applyCommonFields(newSettings.platforms);
        setState({ ...newSettings, platforms });
      }

      function updatePlatform<TPlatformType extends TPlatform>(
        platform: TPlatform,
        patch: Partial<IGoLiveSettings['platforms'][TPlatform]>,
      ) {
        const state = getState();
        updateSettings({
          platforms: {
            ...state.platforms,
            [platform]: { ...state.platforms[platform], ...patch },
          },
        });
      }

      function switchPlatform(platformName: TPlatform, enabled: boolean) {
        updatePlatform(platformName, { enabled });
        StreamSettingsService.setGoLiveSettings(view.settings);
        StreamingService.actions.prepopulateInfo();
      }

      function switchCustomDestination(destInd: number, enabled: boolean) {
        const customDestinations = cloneDeep(view.customDestinations);
        customDestinations[destInd].enabled = enabled;
        updateSettings({ customDestinations });
      }

      function switchAdvancedMode(enabled: boolean) {
        updateSettings({ advancedMode: enabled });
      }

      /**
       * Update the selected field for all target platforms
       **/
      function updateCommonFields(fieldName: TCustomFieldName, value: string) {
        view.platformsWithoutCustomFields.forEach(platform => {
          if (!view.supports(fieldName, [platform])) return;
          updatePlatform(platform, { [fieldName]: value });
        });
      }

      function toggleCustomFields(platform: TPlatform) {
        const enabled = view.platforms[platform].useCustomFields;
        updatePlatform(platform, { useCustomFields: !enabled });
      }

      function goLive() {
        StreamingService.actions.goLive(view.settings);
      }

      return mergeToProxy(
        {
          updateSettings,
          updatePlatform,
          switchPlatform,
          updateCommonFields,
          toggleCustomFields,
          switchAdvancedMode,
          switchCustomDestination,
          goLive,
          ...modificators,
        },
        view.exposeProps(),
      );
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
