import React from 'react';
import { UltraComparison } from 'components-react/shared/UltraComparison';
import styles from './Ultra.m.less';
import { $t } from 'services/i18n';

interface IProductInfo {
  title: string;
  description: string;
  image: string;
  link?: string;
}

export function Ultra() {
  const products: IProductInfo[] = [
    {
      title: 'Streamlabs Desktop Ultra',
      description: $t('Pro live streaming features for Windows & Mac'),
      image: '',
    },
    {
      title: 'Streamlabs Web Suite Ultra',
      description: $t('Develop your brand, monetize your channel, and beyond'),
      image: '',
    },
    {
      title: 'Streamlabs Mobile Ultra',
      description: $t('Live stream on-the-go or mobile games from iOS & Android'),
      image: '',
    },
    {
      title: 'Streamlabs Console',
      description: $t('Stream from your console to Twitch without a desktop'),
      image: '',
    },
    {
      title: 'Melon App Pro',
      description: $t('Stream and record with guests from your browser'),
      image: '',
    },
    {
      title: 'Oslo Editor Pro',
      description: $t('Professional video editing and collaboration tools'),
      image: '',
    },
    {
      title: 'Crossclip Pro',
      description: $t('Turn your VODs into must-see TikToks, Reels, and Shorts'),
      image: '',
    },
    {
      title: 'Willow Link Pro',
      description: $t('Create a custom personal, all-in-one page to link in bio'),
      image: '',
    },
  ];

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
      <UltraComparison />
    </div>
  );
}

function ProductCard(p: IProductInfo) {
  return (
    <div className={styles.productCard}>
      <img src={p.image} />
      <span className={styles.title}>{p.title}</span>
      <span>{p.description}</span>
      {!!p.link && <span className={styles.explore}>{$t('Explore')}</span>}
    </div>
  );
}

Ultra.page = 'Ultra';
