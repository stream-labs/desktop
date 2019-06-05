import { Module, EApiPermissions, apiMethod, IApiContext } from './module';
import { Inject } from 'services/core/injector';
import { KeyListenerService, IKeyBinding } from 'services/key-listener';

enum EKeyListenerType {
  Up = 'up',
  Down = 'down',
}

interface IKeyReference {
  type: EKeyListenerType;
  key: string;
  modifiers: {
    alt?: boolean;
    ctrl?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
}

export class HotkeysModule extends Module {
  moduleName = 'Hotkeys';
  permissions = [EApiPermissions.Hotkeys];

  @Inject() keyListenerService: KeyListenerService;

  @apiMethod()
  registerKey(ctx: IApiContext, reference: IKeyReference, callback: () => void) {
    return this.keyListenerService.register(
      { ...this.referenceToBinding(reference), callback },
      this.getNamespace(ctx.app.id),
    );
  }

  @apiMethod()
  unregisterKey(ctx: IApiContext, reference: IKeyReference) {
    this.keyListenerService.unregister(
      this.referenceToBinding(reference),
      this.getNamespace(ctx.app.id),
    );
  }

  @apiMethod()
  unregisterAll(ctx: IApiContext) {
    this.keyListenerService.unregisterAll(this.getNamespace(ctx.app.id));
  }

  private referenceToBinding(ref: IKeyReference): IKeyBinding {
    return {
      eventType: ref.type === EKeyListenerType.Up ? 'registerKeyup' : 'registerKeydown',
      key: ref.key,
      modifiers: {
        alt: !!ref.modifiers.alt,
        ctrl: !!ref.modifiers.ctrl,
        shift: !!ref.modifiers.shift,
        meta: !!ref.modifiers.meta,
      },
    };
  }

  private getNamespace(appId: string) {
    return `PlatformApp-${appId}`;
  }
}
