import React from 'react';
import { $t } from '../../services/i18n';
import styles from './Grow.m.less';
import { Services } from '../service-provider';
import cx from 'classnames';

export default function Grow() {
  const { GrowService } = Services;

  return (
    <div>
      <ResourceFooter />
    </div>
  );
}

function ResourceFooter() {
  return (
    <div className={styles.footer}>
      <h2>{$t('Streamer Resources')}</h2>
      <span></span>

      <div>
        <div>
          <h3>{$t('Streamlabs University')}</h3>
          <span>
            {$t(
              'Professional streamers are now able to earn large amounts of money while entertaining people and creating their own brand. But how does one become a professional streamer? Streamlabs University is our answer to this question. In this course, we’ll walk you through everything you need to know to become a successful streamer and turn your passion into a profession.',
            )}
          </span>
        </div>
        <div>
          <h3>{$t('Content Hub')}</h3>
          <span>
            {$t(
              'The Ultimate Resource For Live Streaming. Years of blog posts, guides, and support articles are now in one place. Content Hub is your one-stop-shop for everything related to live streaming. There are dozens of different categories to choose from. Learn how to set up your live stream, find new features, and stay up-to-date on all of the tools you can use to enhance your stream.',
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
