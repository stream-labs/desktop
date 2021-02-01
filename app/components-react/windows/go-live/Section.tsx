import styles from './GoLive.m.less';
import React, { HTMLAttributes } from 'react';
import cx from 'classnames';

interface ISectionProps {
  title?: string;
  isSimpleMode?: boolean;
}

/**
 * renders a section wrapper
 */
export function Section(p: ISectionProps & HTMLAttributes<unknown>) {
  const title = p.title;

  // render header and section wrapper in advanced mode
  if (!p.isSimpleMode) {
    return (
      <div className={cx({ [styles.section]: true, [styles.sectionWithoutTitle]: !title })}>
        {title && <h2>{title}</h2>}
        <div>{p.children}</div>
      </div>
    );
  }

  // render content only in simple mode
  return <div>{p.children}</div>;
}
