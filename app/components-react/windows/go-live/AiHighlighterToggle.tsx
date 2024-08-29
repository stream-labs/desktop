import { SwitchInput } from 'components-react/shared/inputs/SwitchInput';
import React, { useEffect, useState } from 'react';
import styles from './AiHighlighterToggle.m.less';

import { Services } from 'components-react/service-provider';
import Highlighter from 'components-react/pages/Highlighter';
import { useVuex } from 'components-react/hooks';

export default function AiHighlighterToggle({ game }: { game: string | undefined }) {
  //TODO M: Probably good way to integrate the highlighter in to GoLiveSettings
  const { HighlighterService } = Services;
  const useHighlighter = useVuex(() => HighlighterService.views.useAiHighlighter);
  console.log('rerender Toggle');

  return (
    <>
      {game === 'Fortnite' ? (
        <div
          key={'aiSelector'}
          style={{
            marginTop: '-16px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'flex-end',
            flexFlow: 'rowWrap',
            width: '100%',
          }}
        >
          <div style={{ flexGrow: 0, backgroundColor: 'red' }}></div>

          <div className={styles.aiHighlighterBox}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>Auto-create highlights</div>
              <div
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: '#4F5E65',
                  paddingTop: '1px',
                  paddingBottom: '1px',
                  paddingLeft: '6px',
                  paddingRight: '6px',
                }}
              >
                Beta
              </div>
            </div>
            <div>
              <SwitchInput
                style={{ padding: 0, margin: 0 }}
                value={useHighlighter}
                onChange={() => HighlighterService.actions.toggleAiHighlighter()}
              />
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
