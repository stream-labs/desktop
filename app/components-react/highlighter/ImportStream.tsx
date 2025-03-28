import { Button, Form, Select } from 'antd';
import { Services } from 'components-react/service-provider';
import { ListInput, TextInput } from 'components-react/shared/inputs';

import * as remote from '@electron/remote';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import { EGame } from 'services/highlighter/models/ai-highlighter.models';
import { IStreamInfoForAiHighlighter } from 'services/highlighter/models/highlighter.models';
import { $t } from 'services/i18n';
import uuid from 'uuid';
import React, { useRef, useState } from 'react';
import styles from './StreamView.m.less';
import { supportedGames } from 'services/highlighter/models/game-config.models';

export function ImportStreamModal({ close, videoPath }: { close: () => void; videoPath?: string }) {
  const { HighlighterService } = Services;
  const [inputValue, setInputValue] = useState<string>('');
  const [filePath, setFilePath] = useState<string | undefined>(videoPath);
  const [draggingOver, setDraggingOver] = useState<boolean>(false);
  const [game, setGame] = useState<EGame | null>(null);
  const gameOptions = supportedGames;

  function handleInputChange(value: string) {
    setInputValue(value);
  }

  function onSelect(game: EGame) {
    setGame(game as EGame);
  }

  function specialCharacterValidator(rule: unknown, value: string, callback: Function) {
    if (/[\\/:"*?<>|]+/g.test(value)) {
      callback($t('You cannot use special characters in this field'));
    } else {
      callback();
    }
  }

  async function importStreamFromDevice() {
    const selections = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile'],
      filters: [{ name: $t('Video Files'), extensions: SUPPORTED_FILE_TYPES }],
    });

    if (selections && selections.filePaths) {
      return selections.filePaths;
    }
  }

  async function startAiDetection(title: string, game: EGame, filePath: string[] | undefined) {
    if (/[\\/:"*?<>|]+/g.test(title)) return;
    const streamInfo: IStreamInfoForAiHighlighter = {
      id: 'manual_' + uuid(),
      title,
      game,
    };

    try {
      if (game && filePath && filePath.length > 0) {
        HighlighterService.actions.detectAndClipAiHighlights(filePath[0], streamInfo);
        close();
        return;
      }

      filePath = await importStreamFromDevice();
      if (filePath && filePath.length > 0) {
        HighlighterService.actions.detectAndClipAiHighlights(filePath[0], streamInfo);
        close();
      } else {
        // No file selected
      }
    } catch (error: unknown) {
      console.error('Error importing file from device', error);
    }
  }
  return (
    <>
      <div className={styles.manualUploadWrapper}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontWeight: 600, margin: 0 }}>{$t('Import Fortnite Stream')}</h2>{' '}
          <div>
            <Button type="text" onClick={close}>
              <i className="icon-close" style={{ margin: 0 }}></i>
            </Button>
          </div>
        </div>

        <TextInput
          className={styles.customInput}
          value={inputValue}
          name="name"
          placeholder={$t('Set a title for your stream')}
          onChange={handleInputChange}
          style={{ width: '100%', color: 'black', border: 'none' }}
          rules={[{ validator: specialCharacterValidator }]}
          nowrap
        />
        <div
          onClick={async () => {
            const path = await importStreamFromDevice();
            setFilePath(path ? path[0] : undefined);
          }}
          onDragOver={e => {
            e.preventDefault();
            setDraggingOver(true);
          }}
          onDragLeave={() => setDraggingOver(false)}
          className={styles.videoPreview}
          style={
            {
              '--border-style': videoPath ? 'solid' : 'dashed',
              '--border-color': draggingOver ? 'var(--teal)' : '#ffffff29',
            } as React.CSSProperties
          }
        >
          {videoPath ? (
            <video src={videoPath} controls></video>
          ) : (
            <div style={{ display: 'grid', placeItems: 'center', opacity: 0.3 }}>
              <i className="fa fa-plus"></i>
              <h3>Drag and drop stream or click to select</h3>
            </div>
          )}
        </div>
        <Form>
          <ListInput
            onSelect={(val, opts) => {
              onSelect(opts.value);
            }}
            onChange={value => {
              setGame(value || null);
            }}
            placeholder={$t('Start typing to search')}
            options={gameOptions}
            showSearch
            optionRender={option => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {option.image && (
                  <img
                    src={typeof option.image === 'string' ? option.image : undefined}
                    alt={option.label}
                    style={{
                      width: '24px',
                      height: '24px',
                      objectFit: 'cover',
                      borderRadius: '2px',
                    }}
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span>{option.label}</span>
              </div>
            )}
            debounce={500}
            allowClear
          />
        </Form>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          <Button
            disabled={!game}
            style={{ width: '100%' }}
            type="primary"
            onClick={() => startAiDetection(inputValue, game!, filePath ? [filePath] : undefined)}
          >
            {$t('Select video to start import')}
          </Button>
        </div>
      </div>
    </>
  );
}
