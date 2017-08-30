import { StatefulService, mutation } from './stateful-service';
import { OnboardingService } from './onboarding';
import { ConfigPersistenceService } from './config-persistence';
import { HotkeysService } from './hotkeys';
import { UserService } from './user';
import { ShortcutsService } from './shortcuts';
import { Inject } from '../util/injector';
import Utils from './utils.ts';
import electron from '../vendor/electron';
import { ServicesManager } from '../services-manager';

interface IStartupState {
  loading: boolean;
}

// Performs operations that happen once at startup.  This service
// mainly calls into other services to do the heavy lifting.
export class StartupService extends StatefulService<IStartupState> {

  @Inject()
  onboardingService: OnboardingService;

  @Inject()
  configPersistenceService: ConfigPersistenceService;

  @Inject()
  hotkeysService: HotkeysService;

  @Inject()
  userService: UserService;

  @Inject()
  shortcutsService: ShortcutsService;

  static initialState: IStartupState = {
    loading: true
  };

  load() {
    // This is synchronous and can take a really long time for large configs.
    // Setting a timeout allows the spinner and loading text to be drawn to
    // the screen before starting on the slow synchronous operation.
    // TODO: loading should be async
    setTimeout(() => {
      // If we're not showing the onboarding steps, we should load
      // the config file.  Otherwise the onboarding process will
      // handle it based on what the user wants.
      if (!this.onboardingService.startOnboardingIfRequired()) {
        this.configPersistenceService.load();
      }

      // Set up auto save
      const autoSave = setInterval(() => {
        this.configPersistenceService.save();
      }, 60 * 1000);


      electron.ipcRenderer.on('shutdown', () => {
        clearInterval(autoSave);
        this.configPersistenceService.rawSave();
        electron.remote.getCurrentWindow().close();
      });

      this.hotkeysService.registerAndBindHotkeys();
      this.userService;
      this.shortcutsService;

      ServicesManager.instance.listenApiCalls();

      this.FINISH_LOADING();
    }, 500);

  }


  @mutation()
  FINISH_LOADING() {
    this.state.loading = false;
  }

}
