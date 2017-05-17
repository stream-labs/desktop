import Obs from '../../api/Obs.js';
import { obsValuesToInputValues, inputValuesToObsValues } from '../../components/shared/forms/Input.ts';

const initialState = {
  availableTypes: [],
  availableNames: [],
  duration: 0,
  properties: [],
  currentName: '',
};

/* eslint-disable no-param-reassign */
const mutations = {

  SET_SCENE_TRANSITION_NAME(state, data) {
    state.currentName = data.currentName;
  },

  SET_SCENE_TRANSITION_DURATION(state, data) {
    state.duration = data.duration;
  },

  SET_SCENE_TRANSITION_AVAILABLE_TYPES(state, data) {
    state.availableTypes = data.availableTypes;
  },

  SET_SCENE_TRANSITION_AVAILABLE_NAMES(state, data) {
    state.availableNames = data.availableNames;
  },

  SET_SCENE_TRANSITION_PROPERTIES(state, data) {
    state.properties = data.properties;
  }
};

/* eslint-enable */

const actions = {

  refreshSceneTransitions({ commit }) {
    const currentName = Obs.getSceneTransitionName();
    commit('SET_SCENE_TRANSITION_NAME', { currentName });
    commit('SET_SCENE_TRANSITION_DURATION', { duration: Obs.getSceneTransitionDuration() });
    commit('SET_SCENE_TRANSITION_AVAILABLE_TYPES', { availableTypes: Obs.getSceneTransitionTypes() });
    commit('SET_SCENE_TRANSITION_AVAILABLE_NAMES', { availableNames: Obs.getSceneTransitionNames() });
    commit('SET_SCENE_TRANSITION_PROPERTIES', { properties: Obs.getSceneTransitionProperties(currentName) });
  },

  setSceneTransitionProperties({ state, dispatch }, { properties }) {
    const propertiesToSave = inputValuesToObsValues(properties, {
      boolToString: true
    });
    for (const prop of propertiesToSave) {
      Obs.setSceneTransitionProperty(state.currentName, prop.name, prop.value);
    }
    dispatch({ type: 'refreshSceneTransitions' });
  },


  setCurrentSceneTransition({ dispatch }, { currentName, duration }) {
    if (currentName) Obs.setSceneTransitionName(currentName);
    if (duration) Obs.setSceneTransitionDuration(duration);
    dispatch({ type: 'refreshSceneTransitions' });
  },


  addSceneTransition({ dispatch }, { transitionName, transitionType }) {
    Obs.addSceneTransition(transitionType, transitionName);
    Obs.setSceneTransitionName(transitionName);
    dispatch({ type: 'refreshSceneTransitions' });
  },


  removeSceneTransition({ dispatch, state }, { name }) {
    Obs.removeSceneTransition(name);
    if (name === state.currentName) {
      dispatch({
        type: 'setCurrentSceneTransition',
        currentName: state.availableNames.find(transitionName => transitionName !== name)
      });
      return;
    }
    dispatch({ type: 'refreshSceneTransitions' });
  }


};

const getters = {

  sceneTransitionsFormData(state) {
    return {
      currentName: {
        description: 'Transition',
        name: 'currentName',
        value: state.currentName,
        options: state.availableNames.map(name => { return { description: name, value: name } })
      },
      duration: {
        description: 'Duration',
        name: 'duration',
        value: state.duration
      }
    };
  },

  sceneTransitionsAddNewFormData(state) {
    return {
      type: {
        description: 'Transition type',
        name: 'type',
        value: state.availableTypes[0].type,
        options: state.availableTypes.map(({ type, description }) => {
          return { description, value: type };
        })
      },
      name: {
        description: 'Transition name',
        name: 'name',
        value: 'New transition'
      }
    };
  },

  sceneTransitionsPropertiesFormData(state) {
    const transitionName = state.currentName;
    let properties = Obs.getSceneTransitionProperties(transitionName);
    if (!properties) return [];

    // patch currentValue for corresponding to common properties format
    properties = obsValuesToInputValues(properties, {
      valueIsObject: true,
      boolIsString: true,
      subParametersGetter: propName => {
        return Obs.getSceneTransitionPropertySubParameters(transitionName, propName);
      }
    });

    return properties;
  }
};

export default {
  state: initialState,
  mutations,
  actions,
  getters
};
