import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { mutation } from './core/stateful-service';
import Vue from 'vue';
import { Inject } from 'services/core';
import { AppService } from 'services/app';

export enum EDismissable {
  SceneCollectionsHelpTip = 'scene_collections_help_tip',
  RecentEventsHelpTip = 'recent_events_help_tip',
}

interface IDismissablesServiceState {
  [key: string]: boolean;
}

/**
 * A dismissable is anything that can be dismissed and should
 * never show up again, like a help tip.
 */
export class DismissablesService extends PersistentStatefulService<IDismissablesServiceState> {
  @Inject() appService: AppService;

  shouldShow(key: EDismissable): boolean {
    // Some keys have extra show criteria
    if (key === EDismissable.RecentEventsHelpTip && !this.state[key]) {
      // If this is a fresh cache, never show the tip
      if (this.appService.state.onboarded) {
        this.dismiss(key);
        return false;
      }
    }

    return !this.state[key];
  }

  dismiss(key: EDismissable) {
    this.DISMISS(key);
  }

  dismissAll() {
    Object.keys(EDismissable).forEach(key => this.dismiss(EDismissable[key]));
  }

  @mutation()
  DISMISS(key: EDismissable) {
    Vue.set(this.state, key, true);
  }
}
