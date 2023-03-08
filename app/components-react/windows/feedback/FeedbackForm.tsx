import React from 'react';
import cx from 'classnames';
import styles from './FeedbackWindow.m.less';
import { $t } from 'services/i18n';
import { TextAreaInput } from 'components-react/shared/inputs';

export default function FeedbackForm(p: {
  setScore: (value: number) => void;
  setComment: (value: string) => void;
  score: number;
  comment: string;
}) {
  return (
    <div>
      <h3>{$t('Your feedback is important to us!')}</h3>
      <span>
        {$t('How likely are you to recommend Streamlabs Desktop to a friend or other creator?')}
      </span>
      <ScoreInput value={p.score} onChange={p.setScore} />
      {p.score > -1 && (
        <TextAreaInput
          label={$t('What is the primary reason for your score?')}
          value={p.comment}
          onChange={p.setComment}
        />
      )}
    </div>
  );
}

function ScoreInput(p: { value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className={styles.scoreContainer}>
        {[...Array(10).keys()].map(key => (
          <div
            key={key}
            className={cx(styles.score, {
              [styles.green]: key > 8,
              [styles.yellow]: key > 6,
              [styles.red]: key < 7,
              [styles.active]: key === p.value,
            })}
            onClick={() => p.onChange(key)}
          >
            {key}
          </div>
        ))}
      </div>
      <div>
        <span>
          <i className="icon-thumbs-down" />
          {$t('0 - Not Likely')}
        </span>
        <span>
          <i className="icon-thumbs-up" />
          {$t('10 - Very Likely')}
        </span>
      </div>
    </div>
  );
}
