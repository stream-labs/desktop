import { Inject } from './core/injector';
import { StatefulService } from './core/stateful-service';
import {
  CustomizationService,
  TCompactModeStudioController,
  TCompactModeTab,
} from './customization';
import { UserService } from './user';

export interface ICompactModeServiceState {
  // nothing
}

export class CompactModeService extends StatefulService<ICompactModeServiceState> {
  @Inject() customizationService: CustomizationService;
  @Inject() userService: UserService;

  toggleCompactMode() {
    this.customizationService.toggleCompactMode();
  }
  set compactMode(value: boolean) {
    this.customizationService.setCompactMode(value);
  }
  get compactMode(): boolean {
    return this.customizationService.state.compactMode;
  }

  set compactModeTab(tab: TCompactModeTab) {
    this.customizationService.setCompactModeTab(tab);
  }
  get compactModeTab(): TCompactModeTab {
    if (this.userService.isLoggedIn()) {
      return this.customizationService.state.compactModeTab || 'studio';
    }
    return 'studio';
  }

  set compactModeStudioController(controller: TCompactModeStudioController) {
    this.customizationService.setCompactModeStudioController(controller);
  }
  get compactModeStudioController(): TCompactModeStudioController {
    return this.customizationService.state.compactModeStudioController;
  }
}
