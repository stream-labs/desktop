import { Inject } from 'services/core';
import { ScenesService } from 'services/scenes';
import { SourcesService } from 'services/sources';
import { GuestCamService, IObsReturnTypes } from '.';

/**
 * Base class representing something that needs a connection
 * to the mediasoup plugin and service
 */
export abstract class MediasoupEntity {
  @Inject() sourcesService: SourcesService;
  @Inject() scenesService: ScenesService;
  @Inject() guestCamService: GuestCamService;

  destroyed = false;

  mutexUnlockFunc: () => void;

  constructor(public sourceId: string) {}

  sendWebRTCRequest<T = unknown>(data: unknown): Promise<T> {
    return this.guestCamService.sendWebRTCRequest(data) as Promise<T>;
  }

  getSource() {
    return this.sourcesService.views.getSource(this.sourceId);
  }

  makeObsRequest<TFunc extends keyof IObsReturnTypes>(
    func: TFunc,
    arg?: Object,
  ): IObsReturnTypes[TFunc] {
    if (this.destroyed) {
      throw new Error('Attempted to make OBS request from destroyed entity');
    }

    const ret = this.guestCamService.makeObsRequest(this.sourceId, func, arg);
    this.log('OBS REQUEST', func, arg, ret);
    return ret;
  }

  log(...args: unknown[]) {
    this.guestCamService.log(...args);
  }

  /**
   * Each entity gets the lock *only once*. The lock will be acquired
   * automatically the first time `withMutex` is called, it will remain
   * locked until an exception occurs, a promise is rejected, or unlock
   * is called manually.
   * @param fun The code to execute
   */
  async withMutex<TReturn>(fun: () => TReturn) {
    if (!this.mutexUnlockFunc) {
      this.mutexUnlockFunc = await this.guestCamService.pluginMutex.wait();
    }

    try {
      const val = fun();

      if (val instanceof Promise) {
        return await val;
      }

      return val;
    } catch (e: unknown) {
      this.log('Got error executing within mutex, unlocking mutex', e);
      this.unlockMutex();
      throw e;
    }
  }

  unlockMutex() {
    if (this.mutexUnlockFunc) {
      this.mutexUnlockFunc();
      this.mutexUnlockFunc = null;
    }
  }

  destroy() {
    this.destroyed = true;
    this.unlockMutex();
  }
}
