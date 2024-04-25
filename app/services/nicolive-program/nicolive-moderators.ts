import { Subject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Inject } from 'services/core/injector';
import { StatefulService, mutation } from 'services/core/stateful-service';
import { WindowsService } from 'services/windows';
import { NicoliveClient } from './NicoliveClient';
import { NicoliveProgramService } from './nicolive-program';

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
          if (state.roomURL) {
            this.setState({ roomURL: state.roomURL });
            this.clearModeratorsCache();
            this.fetchModerators();
          } else {
            // 切断時に消す場合
            this.clearModeratorsCache();
          }
        }
      });
  }

  private async fetchModerators() {
    const moderators = await this.client.fetchModerators();
    this.setModeratorsCache(moderators.map(moderator => moderator.userId).map(String));
  }

  isModerator(userId: string): boolean {
    return new Set(this.state.moderatorsCache).has(userId);
  }

  clearModeratorsCache() {
    console.info('clearModeratorsCache'); // DEBUG
    this.setState({ moderatorsCache: [] });
  }

  setModeratorsCache(userIds: string[]) {
    console.info('setModeratorsCache', userIds); // DEBUG
    this.setState({ moderatorsCache: userIds });
  }

  async addModerator(userId: string) {
    if (this.isModerator(userId)) return;
    await this.client.addModerator(userId);
    this.setModeratorsCache([...this.state.moderatorsCache, userId]);
  }

  async removeModerator(userId: string) {
    if (this.isModerator(userId)) {
      await this.client.removeModerator(userId);
      const moderators = new Set(this.state.moderatorsCache);
      moderators.delete(userId);
      this.setModeratorsCache([...moderators]);
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
      await this.addModerator(userId);
      // TODO error handling
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
      await this.removeModerator(userId);
      // TODO error handling
    }
  }

  private setState(partial: Partial<INicoliveModeratorsService>) {
    const nextState = { ...this.state, ...partial };
    this.SET_STATE(nextState);
    this.stateChangeSubject.next(nextState);
  }

  @mutation()
  private SET_STATE(nextState: INicoliveModeratorsService) {
    this.state = nextState;
  }
}
