import React from 'react';
import { $t } from 'services/i18n';

export default function EmptyDestinations() {
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <i className="icon icon-empty" style={{ fontSize: '60px' }} />
      <h1>{$t('No Destinations Selected')}</h1>
      <p>{$t('Toggle your destination to get started and see title, tags and other settings')}</p>
    </div>
  );
}
