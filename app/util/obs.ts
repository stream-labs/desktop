import * as obs from '../../obs-api';

// Utilities for interacting with OBS

/**
 * This should always be used instead of reading settings
 * directly from an OBS input.  This is because the OBS
 * settings object does not always contain default values
 * and is therefore unreliable for reading the actual
 * current value of a setting.
 * @param props the OBS properties object
 */
export function propsToSettings(props: obs.IProperties) {
  const settings: obs.ISettings = {};
  let prop = props.first();

  do {
    settings[prop.name] = prop.value;
  } while ((prop = prop.next()));

  return settings;
}
