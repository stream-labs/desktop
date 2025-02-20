import { SwitchInput } from 'components-react/shared/inputs/SwitchInput';
import React, { useEffect, useRef, useState } from 'react';
import styles from './AiHighlighterToggle.m.less';

import { Services } from 'components-react/service-provider';
import Highlighter from 'components-react/pages/Highlighter';
import { useVuex } from 'components-react/hooks';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export default function AiHighlighterToggle({
  game,
  cardIsExpanded,
}: {
  game: string | undefined;
  cardIsExpanded: boolean;
}) {
  //TODO M: Probably good way to integrate the highlighter in to GoLiveSettings
  const { HighlighterService } = Services;
  const { useHighlighter, highlighterVersion } = useVuex(() => {
    return {
      useHighlighter: HighlighterService.views.useAiHighlighter,
      highlighterVersion: HighlighterService.views.highlighterVersion,
    };
  });

  function getInitialExpandedState() {
    if (game === 'Fortnite') {
      return true;
    } else {
      if (useHighlighter) {
        return true;
      } else {
        return cardIsExpanded;
      }
    }
  }
  const initialExpandedState = getInitialExpandedState();
  const [isExpanded, setIsExpanded] = useState(initialExpandedState);

  useEffect(() => {
    if (game === 'Fortnite') {
      setIsExpanded(true);
    }
    if (game !== 'Fortnite' && game !== undefined && useHighlighter) {
      HighlighterService.actions.setAiHighlighter(false);
    }
  }, [game]);

  return (
    <div>
      {game === undefined || game === 'Fortnite' ? (
        <div
          key={'aiSelector'}
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'flex-end',
            flexFlow: 'rowWrap',
            width: '100%',
          }}
        >
          <div style={{ flexGrow: 0, backgroundColor: 'red' }}></div>

          <div className={styles.aiHighlighterBox}>
            <div className={styles.headlineWrapper} onClick={() => setIsExpanded(!isExpanded)}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 300, color: '#BDC2C4' }}>
                Streaming <span style={{ fontWeight: 700 }}>Fortnite</span>? Try AI Highlighter!
              </h3>
              {isExpanded ? (
                <UpOutlined style={{ color: '#BDC2C4' }} />
              ) : (
                <DownOutlined style={{ color: '#BDC2C4' }} />
              )}
            </div>
            {isExpanded ? (
              <>
                <div className={styles.expandedWrapper}>
                  <div className={styles.toggleTextWrapper}>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 600 }}>
                        Auto-create
                        <br /> highlights
                      </h2>
                      <div className={styles.betaTag}>Beta</div>
                    </div>
                    {highlighterVersion !== '' ? (
                      <SwitchInput
                        style={{ padding: 0, margin: 0, marginLeft: '-40px', width: '100%' }}
                        value={useHighlighter}
                        label=""
                        onChange={() => HighlighterService.actions.toggleAiHighlighter()}
                      />
                    ) : (
                      <Button
                        style={{ width: 'fit-content' }}
                        size="small"
                        type="primary"
                        onClick={() => {
                          HighlighterService.installAiHighlighter(false, 'Go-live-flow');
                        }}
                      >
                        Install AI Highlighter
                      </Button>
                    )}
                  </div>
                  <div className={styles.image}></div>
                </div>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
