import { Module, EApiPermissions, TApiModule, IApiContext } from './modules/module';
import { SourcesModule } from './modules/sources';
import { ScenesModule} from './modules/scenes';
import { ObsSettingsModule } from './modules/obs-settings';
import { StreamingRecordingModule } from './modules/streaming-recording';
import { AuthorizationModule } from './modules/authorization';
import { ILoadedApp } from '..';
import { ThemeModule } from './modules/theme';
import { SceneCollectionsModule } from './modules/scene-collections';
import { ExternalModule } from './modules/external';
import { AppModule } from './modules/app';
import { NotificationsModule } from './modules/notifications';

export class PlatformAppsApi {

  modules: Dictionary<Module> = {};

  constructor() {
    // Register all modules
    this.registerModule(new SourcesModule());
    this.registerModule(new ScenesModule());
    this.registerModule(new ObsSettingsModule());
    this.registerModule(new StreamingRecordingModule());
    this.registerModule(new AuthorizationModule());
    this.registerModule(new ThemeModule());
    this.registerModule(new SceneCollectionsModule());
    this.registerModule(new ExternalModule());
    this.registerModule(new AppModule());
    this.registerModule(new NotificationsModule());
  }

  private registerModule(module: Module) {
    this.modules[module.moduleName] = module;
  }

  /**
   * Returns an object tree of API methods.  Any modules that
   * the app does not have sufficient permission for will be
   * replaced with a method that returns a rejected promise
   * explaining the lack of permissions.
   */
  getApi(app: ILoadedApp, permissions: EApiPermissions[]) {
    const api: Dictionary<TApiModule> = {};

    const context: IApiContext = { app };

    Object.keys(this.modules).forEach(moduleName => {
      api[moduleName] = {};

      let authorized = true;

      // TODO this is a weird pattern
      for (let permission of this.modules[moduleName].permissions) {
        authorized = permissions.includes(permission);
        if (!authorized) break;
      }

      ((this.modules[moduleName].constructor as typeof Module).apiMethods || []).forEach(methodName => {
        api[moduleName][methodName] = async (...args: any[]) => {
          if (authorized) {
            return await this.modules[moduleName][methodName](context, ...args);
          } else {
            throw new Error('This app does not have permission to access this API. ' +
              `Required permissions: ${this.modules[moduleName].permissions}`);
          }
        };
      });

      ((this.modules[moduleName].constructor as typeof Module).apiEvents || []).forEach(eventName => {
        if (authorized) {
          api[moduleName][eventName] = this.modules[moduleName][eventName];
        } else {
          api[moduleName][eventName] = async () => {
            throw new Error('This app does not have permission to access this API. ' +
              `Required permissions: ${this.modules[moduleName].permissions}`);
          }
        }
      });
    });

    return api;
  }

}
