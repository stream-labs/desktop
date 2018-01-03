const fs = require('fs');
const CONFIG = JSON.parse(fs.readFileSync('test/screentest/config.json'));
const CONFIG_VARIATION = CONFIG.configs;

/**
 * get set of unique configs
 */
export function getConfigs() {
  const configKeys = Object.keys(CONFIG_VARIATION);
  let configs: Dictionary<any>[] = [];

  configKeys.forEach(configKey => {
    const values = CONFIG_VARIATION[configKey];
    const updatedConfigs: Dictionary<any>[] = [];
    values.forEach((value: any) => {
      if (!configs.length) {
        updatedConfigs.push({ [configKey]: value });
      } else {
        configs.forEach(config => {
          updatedConfigs.push(Object.assign({}, config, { [configKey]: value }));
        });
      }
    });
    configs = updatedConfigs;
  });
  return configs;
}
