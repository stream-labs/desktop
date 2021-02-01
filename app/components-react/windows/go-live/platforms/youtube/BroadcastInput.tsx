import React from 'react';
import { $t } from '../../../../../services/i18n';
import * as moment from 'moment';
import css from './BroadcastInput.m.less';
import cx from 'classnames';
import { IYoutubeLiveBroadcast } from '../../../../../services/platforms/youtube';
import { ListInput, Option, IInputCustomProps } from '../../../../shared/inputs';
import { FormItemProps } from 'antd/lib/form';
import { SelectProps } from 'antd/lib/select';

/**
 * Broadcast-selector for Youtube
 */
export default function BroadcastInput(
  p: { broadcasts: IYoutubeLiveBroadcast[] } & Omit<SelectProps<string>, 'options'> &
    IInputCustomProps<string> &
    FormItemProps,
) {
  /**
   * format the isoDate to the locale-dependent format
   */
  function formatDate(isoDate: string): string {
    return moment(new Date(isoDate)).format(moment.localeData().longDateFormat('ll'));
  }

  return (
    <ListInput value={p.value} onInput={p.onInput} {...p}>
      {/* "Create New" option*/}
      <Option className={cx(css.newBroadcast, css.broadcast)} value={''}>
        <div className={css.colImage}>
          <div>
            <i className="fa fa-plus" />
          </div>
        </div>
        <div className={css.colDescription}>
          <div>{$t('Create New Event')}</div>
        </div>
      </Option>

      {/* Other options*/}
      {p.broadcasts.map(broadcast => (
        <Option value={broadcast.id} label={broadcast.snippet.title}>
          <div className={css.colImage}>
            <img src={broadcast.snippet.thumbnails.default.url} />
          </div>
          <div className={css.colDescription}>
            <div>{broadcast.snippet.title}</div>
            <div>{broadcast.snippet.description}</div>
          </div>
          <div className={css.colDate}>
            <div>{formatDate(broadcast.snippet.scheduledStartTime)}</div>
          </div>
        </Option>
      ))}
    </ListInput>
  );
}
