import { PersistentStatefulService } from 'services/persistent-stateful-service';
import { mutation, Service } from 'services/stateful-service';
import electron from 'electron';
import Util from 'services/utils';
import { notes } from './notes';
import { NavigationService } from 'services/navigation';
import { Inject } from 'util/injector';
import { $t } from 'services/i18n';
import { NotificationsService, ENotificationType } from 'services/notifications';
import { JsonrpcService } from 'services/api/jsonrpc/jsonrpc';

interface IPatchNotesState {
  lastVersionSeen: string;
}

export interface IPatchNotes {
  version: string;
  title: string;
  notes: string[];
  showChest: boolean;
}

export class PatchNotesService extends PersistentStatefulService<IPatchNotesState> {
  @Inject() navigationService: NavigationService;
  @Inject() notificationsService: NotificationsService;
  @Inject() private jsonrpcService: JsonrpcService;

  static defaultState: IPatchNotesState = {
    lastVersionSeen: null,
  };

  init() {
    super.init();

    if (Util.isDevMode()) {
      // Useful for previewing patch notes in dev mode
      window['showPatchNotes'] = () => {
        this.navigationService.navigate('PatchNotes');
      };
    }
  }

  /**
   * Will show the latest patch notes if they are available and
   * the user has not seen them.
   * @param onboarded Whether the user was onboarded this session
   */
  showPatchNotesIfRequired(onboarded: boolean) {
    // Don't show the patch notes in dev mode or preview
    if (Util.isDevMode() || Util.isPreview() || Util.isIpc()) return;

    const minorVersionRegex = /^\d+\.\d+[^\.]/;
    const currentMinorVersion = electron.remote.process.env.SLOBS_VERSION.match(minorVersionRegex);
    if (!currentMinorVersion) return;

    const currentMinorVersionRegex = new RegExp(currentMinorVersion[0]);

    if (
      // If the notes don't match the current version, we shouldn't show them.
      !currentMinorVersionRegex.test(notes.version) ||
      // The user has already seen the current patch notes
      currentMinorVersionRegex.test(this.state.lastVersionSeen)
    ) {
      return;
    }

    this.SET_LAST_VERSION_SEEN(electron.remote.process.env.SLOBS_VERSION);

    // Only show the actual patch notes if they weren't onboarded
    if (!onboarded) {
      this.notificationsService.push({
        type: ENotificationType.SUCCESS,
        lifeTime: 30000,
        showTime: false,
        playSound: false,
        message: $t('Streamlabs OBS has updated! Click here to see what changed.'),
        action: this.jsonrpcService.createRequest(
          Service.getResourceId(this.navigationService),
          'navigate',
          'PatchNotes',
        ),
      });
    }
  }

  get notes() {
    return notes;
  }

  @mutation()
  private SET_LAST_VERSION_SEEN(version: string) {
    this.state.lastVersionSeen = version;
  }
}
