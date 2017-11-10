
export interface IAppServiceApi {
  /**
   * Load config.
   * To get list of available configs use ConfigPersistenceService
   * @see ConfigPersistenceService
   */
  loadConfig(configName: string): Promise<void>;
}
