import { FailedResult } from './NicoliveClient';
import { $t } from 'services/i18n';
import { remote } from 'electron';

export class NicoliveFailure {
  constructor(
    public type: 'logic' | 'http_error' | 'network_error',
    public method: string,
    public reason: string,
    public additionalMessage: string = ''
  ) {}

  static fromClientError(method: string, res: FailedResult) {
    if (res.value instanceof Error) {
      console.error(res.value);
      return new this('network_error', method, 'network_error');
    }
    const { errorCode, errorMessage } = res.value.meta;
    const additionalMessage = `${errorCode ?? ''}${errorMessage ? `: ${errorMessage}` : ''}`;
    return new this('http_error', method, res.value.meta.status.toString(10), additionalMessage);
  }

  static fromConditionalError(method: string, reason: string) {
    return new this('logic', method, reason);
  }
}

async function openErrorDialog({ title, message }: { title: string; message: string }): Promise<void> {
  return new Promise<void>(resolve => {
    remote.dialog.showMessageBox(
      remote.getCurrentWindow(),
      {
        type: 'warning',
        title,
        message,
        buttons: [$t('common.close')],
        noLink: true,
      },
      _ => resolve()
    );
  });
}

export async function openErrorDialogFromFailure(failure: NicoliveFailure): Promise<void> {
  if (failure.type === 'logic') {
    return openErrorDialog({
      title: $t(`nicolive-program.errors.logic.${failure.method}.${failure.reason}.title`),
      message: $t(`nicolive-program.errors.logic.${failure.method}.${failure.reason}.message`),
    });
  }

  return openErrorDialog({
    title: $t(`nicolive-program.errors.api.${failure.method}.${failure.reason}.title`),
    message: $t(`nicolive-program.errors.api.${failure.method}.${failure.reason}.message`, {
      additionalMessage: failure.additionalMessage,
    }),
  });
}
