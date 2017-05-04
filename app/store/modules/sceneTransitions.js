import Obs from '../../api/Obs.js';


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
    for (const prop of properties) {
      let value = prop.currentValue;
      if (prop.type === 'OBS_PROPERTY_BOOL') {
        value = value === 1 ? 'true' : 'false';
      }
      Obs.setSceneTransitionProperty(state.currentName, prop.name, value);
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
        currentValue: state.currentName,
        values: state.availableNames.map(name => { return { [name]: name }; })
      },
      duration: {
        description: 'Duration',
        name: 'duration',
        currentValue: state.duration
      }
    };
  },

  sceneTransitionsAddNewFormData(state) {
    return {
      type: {
        description: 'Transition type',
        name: 'type',
        currentValue: state.availableTypes[0].type,
        values: state.availableTypes.map(({ type, description }) => {
          return { [description]: type };
        })
      },
      name: {
        description: 'Transition name',
        name: 'name',
        currentValue: 'New transition'
      }
    };
  },

  sceneTransitionsPropertiesFormData(state) {
    const transitionName = state.currentName;
    const properties = Obs.getSceneTransitionProperties(transitionName);
    if (!properties) return [];
    // patch currentValue for corresponding to common properties format
    for (const property of properties) {
      property.currentValue = property.currentValue.value;
      if (property.type === 'OBS_PROPERTY_LIST') {
        property.values = Obs.getSceneTransitionPropertySubParameters(
          transitionName, property.name
        ).map(
          ({ name, value }) => { return { [name]: value }; }
        );
      } else if (property.type === 'OBS_PROPERTY_BOOL') {
        property.currentValue = property.currentValue === 'true' ? 1 : 0; // TODO: fix node-obs bool values
      }
    }
    return properties;
  }
};

export default {
  state: initialState,
  mutations,
  actions,
  getters
};
