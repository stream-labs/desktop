import React from 'react';
import Form from 'components-react/shared/inputs/Form';
import { SliderInput, FileInput, SwitchInput } from 'components-react/shared/inputs';
import { Button } from 'antd';
import path from 'path';
import Scrollable from 'components-react/shared/Scrollable';
import Animate from 'rc-animate';
import TransitionSelector from 'components-react/highlighter/TransitionSelector';
import { $t } from 'services/i18n';
import { IAudioInfo, ITransitionInfo } from 'services/highlighter';
import { TModalClipsView } from './ClipsView';

export function EditingControls({
  audio,
  transition,
  emitSetTransitionDuration,
  emitSetMusicEnabled,
  emitSetMusicFile,
  emitSetMusicVolume,
  emitSetShowModal,
}: {
  audio: IAudioInfo;
  transition: ITransitionInfo;
  emitSetTransitionDuration: (duration: number) => void;
  emitSetMusicEnabled: (enabled: boolean) => void;
  emitSetMusicFile: (file: string) => void;
  emitSetMusicVolume: (volume: number) => void;
  emitSetShowModal: (modal: TModalClipsView | null) => void;
}) {
  function setTransitionDuration(duration: number) {
    emitSetTransitionDuration(duration);
    // HighlighterService.actions.setTransition({ duration });
  }

  function setMusicEnabled(enabled: boolean) {
    emitSetMusicEnabled(enabled);
    // HighlighterService.actions.setAudio({ musicEnabled: enabled });
  }

  const musicExtensions = ['mp3', 'wav', 'flac'];

  function setMusicFile(file: string) {
    if (!musicExtensions.map(e => `.${e}`).includes(path.parse(file).ext)) return;
    emitSetMusicFile(file);
    // HighlighterService.actions.setAudio({ musicPath: file });
  }

  function setMusicVolume(volume: number) {
    emitSetMusicVolume(volume);
    // HighlighterService.actions.setAudio({ musicVolume: volume });
  }

  return (
    <Scrollable
      style={{
        width: '300px',
        flexShrink: 0,
        background: 'var(--section)',
        borderLeft: '1px solid var(--border)',
        padding: '20px',
      }}
    >
      <Form layout="vertical">
        <TransitionSelector />
        <SliderInput
          label={$t('Transition Duration')}
          value={transition.duration}
          onChange={setTransitionDuration}
          min={0.5}
          max={5}
          step={0.1}
          debounce={200}
          hasNumberInput={false}
          tooltipPlacement="top"
          tipFormatter={v => `${v}s`}
        />
        <SwitchInput
          label={$t('Background Music')}
          value={audio.musicEnabled}
          onChange={setMusicEnabled}
        />
        <Animate transitionName="ant-slide-up">
          {audio.musicEnabled && (
            <div>
              <FileInput
                label={$t('Music File')}
                value={audio.musicPath}
                filters={[{ name: $t('Audio File'), extensions: musicExtensions }]}
                onChange={setMusicFile}
              />
              <SliderInput
                label={$t('Music Volume')}
                value={audio.musicVolume}
                onChange={setMusicVolume}
                min={0}
                max={100}
                step={1}
                debounce={200}
                hasNumberInput={false}
                tooltipPlacement="top"
                tipFormatter={v => `${v}%`}
              />
            </div>
          )}
        </Animate>
      </Form>
      <Button
        style={{ marginTop: '16px', marginRight: '8px' }}
        onClick={() => emitSetShowModal('preview')}
      >
        {$t('Preview')}
      </Button>
      <Button
        type="primary"
        style={{ marginTop: '16px' }}
        onClick={() => emitSetShowModal('export')}
      >
        {$t('Export')}
      </Button>
    </Scrollable>
  );
}
