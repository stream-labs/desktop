import { IGoLiveSettings, IStreamEvent, StreamInfoView } from '../../../services/streaming';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import { Services } from '../../service-provider';
import { createMutations, merge, useStateManager } from '../../hooks/useStateManager';
import cloneDeep from 'lodash/cloneDeep';
import pick from 'lodash/pick';
import { useForm } from '../../shared/inputs/Form';
import { FormInstance } from 'antd/lib/form';
import { message } from 'antd';
import { $t } from '../../../services/i18n';
import { useEffect } from 'react';
import {
  IYoutubeLiveBroadcast,
  IYoutubeStartStreamOptions,
} from '../../../services/platforms/youtube';
import { IFacebookLiveVideoExtended } from '../../../services/platforms/facebook';
import { assertIsDefined } from '../../../util/properties-type-guards';
import { settings } from 'cluster';

type TCustomFieldName = 'title' | 'description';
type TModificators = { isUpdateMode?: boolean; isScheduleMode?: boolean };
type IGoLiveSettingsState = IGoLiveSettings &
  TModificators & {
    needPrepopulate: boolean;
    streamEvents: IStreamEvent[];
    isStreamEventModalVisible: boolean;
    selectedStreamEventId: string;
  };

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
    streamEvents: [],
    isStreamEventModalVisible: false,
    selectedStreamEventId: '',
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

    // select eligible layout and renders settings
    renderPlatformSettings(
      commonFields: JSX.Element,
      requiredFields: JSX.Element,
      optionalFields?: JSX.Element,
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
      const platformSettings = state.platforms[platform];
      assertIsDefined(platformSettings);
      const enabled = platformSettings.useCustomFields;
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
        const enabled = view.getPlatformSettings(platform)!.enabled;
        const shouldEnable = !enabled && enabledPlatforms.includes(platform);
        if (shouldEnable) platformHasBeenEnabled = true;
        newSettings = reducers.updatePlatform(newSettings, platform, {
          enabled: enabledPlatforms.includes(platform),
        });
      });
      save(newSettings);
      actions.prepopulate();
    },

    /**
     * Validate the form and show an error message
     */
    async validate() {
      try {
        await form.validateFields();
        return true;
      } catch (e: unknown) {
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

  const schedulerActions = createSchedulerActions(getState, setState, form);

  // merge everything we are going to have accessible in components into one object
  // StateManager will take care about optimal re-rendering order
  // depending on what prop from this object will particular component use
  return merge(getView(), getters, { ...mutations, ...actions }, schedulerActions);
}

export function useStreamScheduler() {
  return useGoLiveSettings(undefined, { isScheduleMode: true });
}

function createSchedulerActions(
  getState: () => IGoLiveSettingsState,
  setState: (newState: IGoLiveSettingsState) => void,
  form: FormInstance,
) {
  const { StreamingService, YoutubeService, FacebookService } = Services;
  const view = StreamingService.views;

  function updateState(statePatch: Partial<IGoLiveSettingsState>) {
    setState({ ...getState(), ...statePatch });
  }

  const getters = {
    get selectedPlatform(): TPlatform | null {
      const platforms = getState().platforms;
      return (Object.keys(platforms)[0] as TPlatform) || null;
    },

    /**
     * Returns a list of linked platforms that support stream schedule
     */
    get platformsWithScheduler(): TPlatform[] {
      return view.linkedPlatforms.filter(platform => view.supports('stream-schedule', [platform]));
    },
  };

  const actions = {
    async loadStreamEvents() {
      // load fb and yt events simultaneously
      const streamEvents: IStreamEvent[] = [];
      const [fbEvents, ytEvents] = await Promise.all([loadFbEvents(), loadYTBEvents()]);

      // convert fb and yt events to the unified IStreamEvent format
      ytEvents.forEach(ytEvent => {
        streamEvents.push(convertYTBroadcastToEvent(ytEvent));
      });

      fbEvents.forEach(fbEvent => {
        streamEvents.push(convertFBLiveVideoToEvent(fbEvent));
      });
      setState({ ...getState(), streamEvents });
    },

    async submitEvent() {
      try {
        await form.validateFields();
        const settings = getState();
        await StreamingService.actions.return.scheduleStream(settings);
      } catch (e: unknown) {
        message.error($t('Invalid settings. Please check the form'));
        return false;
      }
    },

    showNewEventModal(platform?: TPlatform) {
      platform = platform || getters.platformsWithScheduler[0];
      const platformService = getPlatformService(platform);
      updateState({
        isStreamEventModalVisible: true,
        platforms: { [platform]: cloneDeep(platformService.state.settings) },
      });
    },

    async showEditEventModal(eventId: string) {
      const event = getState().streamEvents.find(ev => ev.id === eventId);
      if (!event) return;
      const platform = event.platform;
      updateState({
        isStreamEventModalVisible: true,
        selectedStreamEventId: eventId,
        platforms: {},
      });
      const flags = { useCustomFields: false, enabled: true };
      if (platform === 'youtube') {
        const settings = await YoutubeService.actions.return.fetchStartStreamOptionsForBroadcast(
          eventId,
        );
        updateState({
          platforms: {
            [platform]: { ...settings, ...flags },
          },
        });
      }
      if (platform === 'facebook') {
        const fbDestination = event.facebook;
        assertIsDefined(fbDestination);
        const settings = await FacebookService.actions.return.fetchStartStreamOptionsForVideo(
          eventId,
          fbDestination.destinationType,
          fbDestination.destinationId,
        );
        updateState({
          platforms: { [platform]: { ...settings, ...flags } },
        });
      }
    },

    closeEventModal() {
      updateState({ isStreamEventModalVisible: false, selectedStreamEventId: '', platforms: {} });
    },
  };

  async function loadYTBEvents() {
    if (!view.linkedPlatforms.includes('youtube')) return [];
    return await YoutubeService.actions.return.fetchEligibleBroadcasts(false);
  }

  async function loadFbEvents() {
    if (!view.linkedPlatforms.includes('facebook')) return [];
    return await FacebookService.actions.return.fetchAllVideos();
  }

  return merge(getters, actions);
}

function convertYTBroadcastToEvent(ytBroadcast: IYoutubeLiveBroadcast): IStreamEvent {
  return {
    platform: 'youtube',
    id: ytBroadcast.id,
    date: new Date(
      ytBroadcast.snippet.scheduledStartTime || ytBroadcast.snippet.actualStartTime,
    ).valueOf(),
    title: ytBroadcast.snippet.title,
    status: ytBroadcast.status.lifeCycleStatus === 'complete' ? 'completed' : 'scheduled',
  };
}

function convertFBLiveVideoToEvent(fbLiveVideo: IFacebookLiveVideoExtended): IStreamEvent {
  return {
    platform: 'facebook',
    id: fbLiveVideo.id,
    date: new Date(fbLiveVideo.planned_start_time || fbLiveVideo.broadcast_start_time).valueOf(),
    title: fbLiveVideo.title,
    status: 'scheduled',
    facebook: {
      destinationType: fbLiveVideo.destinationType,
      destinationId: fbLiveVideo.destinationId,
    },
  };
}
