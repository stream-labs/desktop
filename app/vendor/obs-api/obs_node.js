import electron from '../electron';
const { remote } = electron;
const obs = remote.require('./app/vendor/obs-api/obs_node.node');

export const ObsGlobal = obs.Global;
export const ObsInput = obs.Input;
export const ObsScene = obs.Scene;
export const ObsFilter = obs.Filter;
export const ObsTransition = obs.Transition;
export const ObsSceneItem = obs.SceneItem;
export const ObsProperties = obs.Properties;
export const ObsProperty = obs.Property;
export const ObsDisplay = obs.Display;
export const ObsSource = obs.ISource;
export const ObsVolmeter = obs.Volmeter;
export const ObsFader = obs.Fader;