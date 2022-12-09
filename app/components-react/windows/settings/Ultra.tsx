import React from 'react';
import cx from 'classnames';
import { UltraComparison } from 'components-react/shared/UltraComparison';
import styles from './Ultra.m.less';
import { $t } from 'services/i18n';
import { $i } from 'services/utils';
import { Services } from 'components-react/service-provider';

interface IProductInfo {
  title: string;
  description: string;
  image: string;
  link?: string;
}

export function Ultra() {
  const { UserService } = Services;

  const products: IProductInfo[] = [
    {
      title: 'Streamlabs Desktop Ultra',
      description: $t('Pro live streaming features for Windows & Mac'),
      image: 'desktop.png',
    },
    {
      title: 'Streamlabs Web Suite Ultra',
      description: $t('Develop your brand, monetize, and more'),
      image: 'web.png',
      link: 'https://streamlabs.com/login',
    },
    {
      title: 'Streamlabs Mobile Ultra',
      description: $t('Live stream on-the-go or mobile games from iOS & Android'),
      image: 'mobile.png',
      link: 'https://streamlabs.com/mobile-app',
    },
    {
      title: 'Streamlabs Console',
      description: $t('Stream from your console to Twitch without a desktop'),
      image: 'console.png',
      link: 'https://streamlabs.com/console',
    },
    {
      title: 'Melon App Pro',
      description: $t('Stream and record with guests from your browser'),
      image: 'melon.png',
      link: 'https://melonapp.com/',
    },
    {
      title: 'Oslo Editor Pro',
      description: $t('Professional video editing and collaboration tools'),
      image: 'oslo.png',
      link: 'http://oslo.io/',
    },
    {
      title: 'Crossclip Pro',
      description: $t('Turn your VODs into must-see TikToks, Reels, and Shorts'),
      image: 'crossclip.png',
      link: 'https://crossclip.com/',
    },
    {
      title: 'Willow Link Pro',
      description: $t('Create a custom personal, all-in-one page to link in bio'),
      image: 'willow.png',
      link: 'https://streamlabs.com/willow',
    },
  ];

  const isPrime = UserService.views.isPrime;

  return (
    <div>
      <div className={styles.productListContainer}>
        <div className={styles.colorBlock} />
        <h2>{$t('Streamlabs Ultra')}</h2>
        <span>
          {$t(
            'One single subscription, premium features for %{appNumber} creator apps. Access everything you need for professional live streaming, recording, video editing, highlighting, sharing, monetization, and more.',
            { appNumber: 8 },
          )}
        </span>
        <div className={styles.productGrid}>
          {products.map(product => (
            <ProductCard {...product} />
          ))}
        </div>
      </div>
      {!isPrime && <UltraComparison condensed />}
    </div>
  );
}

function ProductCard(p: IProductInfo) {
  return (
    <div className={cx(styles.productCard, { [styles.hasLink]: !!p.link })}>
      <img src={$i(`images/products/${p.image}`)} />
      <span className={styles.title}>{p.title}</span>
      <span>{p.description}</span>
      {!!p.link && <span className={styles.explore}>{$t('Explore')}</span>}
    </div>
  );
}

Ultra.page = 'Ultra';
