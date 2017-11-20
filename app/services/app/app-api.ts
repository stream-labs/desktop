
export interface IAppServiceApi {
  /**
   * Load scenes collection from config.
   * To get list of available configs use ScenesCollectionsService
   * @see ScenesCollectionsService
   */
  loadConfig(configName: string): Promise<void>;
}
