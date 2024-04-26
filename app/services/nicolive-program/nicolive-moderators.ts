import { Subject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Inject } from 'services/core/injector';
import { StatefulService, mutation } from 'services/core/stateful-service';
import { WindowsService } from 'services/windows';
import { NicoliveClient, isOk } from './NicoliveClient';
import { NicoliveProgramService } from './nicolive-program';
import { NicoliveFailure, openErrorDialogFromFailure } from './NicoliveFailure';

interface INicoliveModeratorsService {
  // moderator の userId 集合
  moderatorsCache: string[];
  roomURL: string;
}

export class NicoliveModeratorsService extends StatefulService<INicoliveModeratorsService> {
  @Inject() private nicoliveProgramService: NicoliveProgramService;
  @Inject() private windowsService: WindowsService;

  private client = new NicoliveClient();

  static initialState: INicoliveModeratorsService = {
    moderatorsCache: [],
    roomURL: '',
  };

  private stateChangeSubject = new Subject<typeof this.state>();
  stateChange = this.stateChangeSubject.asObservable();
  private refreshSubject = new Subject<void>();
  refreshObserver = this.refreshSubject.asObservable();

  init() {
    super.init();

    this.nicoliveProgramService.stateChange
      .pipe(
        map(({ roomURL, roomThreadID }) => ({
          roomURL,
          roomThreadID,
        })),
        distinctUntilChanged(
          (prev, curr) => prev.roomURL === curr.roomURL && prev.roomThreadID === curr.roomThreadID,
        ),
      )
      .subscribe(state => {
        if (state.roomURL !== this.state.roomURL) {
          this.setState({ roomURL: state.roomURL, moderatorsCache: [] });
          if (state.roomURL) {
            this.fetchModerators();
          } else {
            this.patchState({ roomURL: '' });
          }
        }
      });
  }

  private async fetchModerators() {
    const result = await this.client.fetchModerators();
    if (!isOk(result)) {
      throw NicoliveFailure.fromClientError('fetchModerators', result);
    }
    this.setModeratorsCache(result.value.data.map(moderator => moderator.userId).map(String));
    this.refreshSubject.next();
  }

  isModerator(userId: string): boolean {
    return new Set(this.state.moderatorsCache).has(userId);
  }

  private setModeratorsCache(userIds: string[]) {
    console.info('setModeratorsCache', userIds); // DEBUG
    this.patchState({ moderatorsCache: userIds });
  }

  private async addModeratorCache(userId: string) {
    if (this.isModerator(userId)) return;
    this.setModeratorsCache([...this.state.moderatorsCache, userId]);
  }
  async addModerator(userId: string) {
    if (this.isModerator(userId)) return;
    const result = await this.client.addModerator(userId);
    if (!isOk(result)) {
      throw NicoliveFailure.fromClientError('addModerator', result);
    }
    this.addModeratorCache(userId);
  }

  async removeModeratorCache(userId: string) {
    if (this.isModerator(userId)) {
      const moderators = new Set(this.state.moderatorsCache);
      moderators.delete(userId);
      this.setModeratorsCache([...moderators]);
    }
  }
  async removeModerator(userId: string) {
    if (this.isModerator(userId)) {
      await this.client.removeModerator(userId);
      this.removeModeratorCache(userId);
    }
  }

  private resolveConfirmPromise: (result: boolean) => void | undefined = undefined;

  closeConfirmWindow(result: boolean) {
    console.info('closeConfirmWindow', result); // DEBUG

    if (!this.resolveConfirmPromise) return;

    // TODO Sentry breadcrumbs
    const resolve = this.resolveConfirmPromise;
    this.resolveConfirmPromise = undefined;
    resolve(result);
  }

  async confirmModerator({
    userName,
    userId,
    operation,
  }: {
    userName: string;
    userId: string;
    operation: 'add' | 'remove';
  }): Promise<boolean> {
    // すでに確認ウィンドウが開いている場合は閉じる
    this.closeConfirmWindow(false);

    return new Promise<{ confirmWindowId: string; result: boolean }>(resolve => {
      // TODO Sentry breadcrumbs
      // TODO modalにする?
      const confirmWindowId = this.windowsService.createOneOffWindow({
        componentName: 'ModeratorConfirmDialog',
        isFullScreen: true, // hide Titlebar
        queryParams: { userName, userId, operation },
        size: { width: 480, height: 240 },
      });
      this.resolveConfirmPromise = (result: boolean) => {
        resolve({ confirmWindowId, result });
      };
    }).then(({ confirmWindowId, result }: { confirmWindowId: string; result: boolean }) => {
      this.windowsService.closeOneOffWindow(confirmWindowId);
      return result;
    });
  }

  async addModeratorWithConfirm({ userId, userName }: { userId: string; userName: string }) {
    if (this.isModerator(userId)) return;
    const ok = await this.confirmModerator({
      userId,
      userName,
      operation: 'add',
    });
    if (ok) {
      try {
        await this.addModerator(userId);
      } catch (caught) {
        if (caught instanceof NicoliveFailure) {
          openErrorDialogFromFailure(caught);
        }
      }
    }
  }
  async removeModeratorWithConfirm({ userId, userName }: { userId: string; userName: string }) {
    if (!this.isModerator(userId)) return;
    const ok = await this.confirmModerator({
      userId,
      userName,
      operation: 'remove',
    });
    if (ok) {
      try {
        await this.removeModerator(userId);
      } catch (caught) {
        if (caught instanceof NicoliveFailure) {
          openErrorDialogFromFailure(caught);
        }
      }
    }
  }

  private setState(state: INicoliveModeratorsService) {
    this.SET_STATE(state);
    this.stateChangeSubject.next(state);
  }

  private patchState(partial: Partial<INicoliveModeratorsService>) {
    this.setState({ ...this.state, ...partial });
  }

  @mutation()
  private SET_STATE(nextState: INicoliveModeratorsService) {
    this.state = nextState;
  }
}
