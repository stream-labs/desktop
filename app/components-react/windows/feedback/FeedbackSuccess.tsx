import React from 'react';
import * as remote from '@electron/remote';
import Translate from 'components-react/shared/Translate';
import { $t } from 'services/i18n';

export default function FeedbackSuccess(p: {
  score: number;
  setCanContact: (value: boolean) => void;
}) {
  return (
    <div>
      <i className="icon-check" />
      <h2>{$t('Thank you for helping us make Streamlabs products better!')}</h2>
      {p.score > 8 ? (
        <Translate message="If you want to participate in further user research, join our <research-link>User Research Program</research-link>">
          <a
            slot="research-link"
            onClick={() => remote.shell.openExternal('https://www.streamlabs.com')}
          />
        </Translate>
      ) : (
        <div>
          <span>{$t('If we have questions about your feedback, may we reach out to you?')}</span>
        </div>
      )}
      <button className="button button--default">{$t('Done')}</button>
    </div>
  );
}
