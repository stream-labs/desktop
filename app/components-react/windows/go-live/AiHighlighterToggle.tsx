import { SwitchInput } from 'components-react/shared/inputs/SwitchInput';
import React, { useEffect, useRef, useState } from 'react';
import styles from './AiHighlighterToggle.m.less';

import { Services } from 'components-react/service-provider';
import Highlighter from 'components-react/pages/Highlighter';
import { useVuex } from 'components-react/hooks';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

export default function AiHighlighterToggle({
  game,
  cardIsExpanded,
}: {
  game: string | undefined;
  cardIsExpanded: boolean;
}) {
  //TODO M: Probably good way to integrate the highlighter in to GoLiveSettings
  const { HighlighterService } = Services;
  const useHighlighter = useVuex(() => HighlighterService.views.useAiHighlighter);
  const [isExpanded, setIsExpanded] = useState(
    game === 'Fortnite' ? true : useHighlighter ? true : cardIsExpanded,
  );

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
            <div
              style={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
              }}
              onClick={() => setIsExpanded(isExpanded ? false : true)}
            >
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
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    marginTop: '16px',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexGrow: 1,
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {' '}
                        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>
                          Auto-create
                          <br /> highlights
                        </h2>
                        <div
                          style={{
                            padding: '4px',
                            borderRadius: '4px',
                            paddingTop: '1px',
                            paddingBottom: '1px',
                            paddingLeft: '6px',
                            paddingRight: '6px',
                            width: 'fit-content',
                            marginBottom: '8px',
                            backgroundColor: '#2B5BD7',
                          }}
                        >
                          Beta
                        </div>
                      </div>
                      <SwitchInput
                        style={{ padding: 0, margin: 0, marginLeft: '-40px', width: '100%' }}
                        value={useHighlighter}
                        label=""
                        onChange={() => HighlighterService.actions.toggleAiHighlighter()}
                      />
                    </div>
                    <div
                      style={{
                        width: '182px',
                        height: '187px',
                        display: 'grid',
                        placeContent: 'center',
                        backgroundColor: 'gray',
                      }}
                    >
                      TODO: <br />
                      explainer image
                    </div>
                  </div>
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
