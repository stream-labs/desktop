import { IGoLiveSettings, StreamInfoView } from '../../../services/streaming';
import { TPlatform } from '../../../services/platforms';
import { Services } from '../../service-provider';
import {
  createMutations,
  createReducers,
  merge,
  TReducers,
  useStateManager,
  TMerge,
} from '../../core/useStateManager';
import { ViewHandler } from '../../../services/core';
import { cloneDeep, debounce, mapValues, omit, pick } from 'lodash';
import Form from '../../shared/inputs/Form';
import { useOnCreate } from '../../hooks';

let tm: TMerge<{}, {}>;

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
type TModificators = { isScheduleMode?: boolean; isUpdateMode?: boolean };
type IGoLiveSettingsState = IGoLiveSettings & TModificators & { needPrepopulate: boolean };

function getInitialStreamSettings(modificators: TModificators): IGoLiveSettingsState {
  const view = Services.StreamingService.views;
  const settings = {
    ...view.savedSettings,
    needPrepopulate: true,
    modificators,
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

export function useGoLiveSettings<
  TComputedProps extends object,
  TComputedPropsCb extends (settings: StreamInfoView & TModificators) => TComputedProps
>(
  // computedProps: (settings: StreamInfoView & TModificators) => TComputedProps,
  computedPropsCb?: TComputedPropsCb,
  modificators: TModificators = {} as TModificators,
  debug?: string,
) {
  const { dependencyWatcher, isRoot, contextView } = useStateManager(
    () => getInitialStreamSettings(modificators),
    initializeGoLiveSettings,
    //v => ({ fooBar: v.bar + v.foo }),
    computedPropsCb as TComputedPropsCb,
    true,
  );

  useOnCreate(() => {
    if (isRoot && contextView.needPrepopulate) {
      contextView.prepopulate();
    }
  });

  return dependencyWatcher;

  // result.contextView
  // result.computedProps
  // result.computedView
  // result.componentView
  // result.initializerReturnType
  // return result.dependencyWatcher;
}

function initializeGoLiveSettings(
  getState: () => IGoLiveSettingsState,
  setState: (newState: IGoLiveSettingsState) => void,
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

    goLive() {
      StreamingService.actions.goLive(getState());
    },

    updateStream() {
      StreamingService.actions.updateStreamSettings(getState());
    },

    save(settings: TState) {
      StreamSettingsService.setGoLiveSettings(settings);
    },

    reload() {
      mutations.updateSettings(
        getInitialStreamSettings(pick(getState(), 'isUpdateMode', 'isScheduleMode')),
      );
    },

    async prepopulate() {
      await StreamingService.actions.return.prepopulateInfo();
      actions.reload();
      mutations.updateSettings({ needPrepopulate: false });
    },
  };

  const view = new StreamInfoView(StreamingService.state, getState);

  // return {
  //   ...mutations,
  //   ...actions,
  // }

  const mergedActionsAndGetters = merge(getters, { ...mutations, ...actions });

  return merge(view.exposeProps(), mergedActionsAndGetters);
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
