import React from 'react';
import { ModalLayout } from '../../shared/ModalLayout';
import { Button } from 'antd';
import { useOnDestroy } from '../../hooks';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import Form from '../../shared/inputs/Form';
import {
  SwitchInput,
  NumberInput,
  TextInput,
  RadioInput,
  CheckboxInput,
} from '../../shared/inputs';
import { useGoLiveSettings } from '../go-live/useGoLiveSettings';

export default function FlexTvGoLiveWindow() {
  const {
    StreamingService,
    WindowsService,
  } = Services;
  const {
    error,
    lifecycle,
    checklist,
    isMultiplatformMode,
    goLive,
    isAdvancedMode,
    switchAdvancedMode,
    prepopulate,
    isLoading,
    form,
  } = useGoLiveSettings()
    .select();

  const shouldShowConfirm = ['prepopulate', 'waitForNewSettings'].includes(lifecycle);
  const shouldShowAdvancedSwitch = shouldShowConfirm && isMultiplatformMode;
  const shouldShowGoBackButton =
    lifecycle === 'runChecklist' && error && checklist.startVideoTransmission !== 'done';

  // clear failed checks and warnings on window close
  useOnDestroy(() => {
    if (checklist.startVideoTransmission !== 'done') {
      StreamingService.actions.resetInfo();
    }
  });

  function close() {
    WindowsService.actions.closeChildWindow();
  }

  function goBackToSettings() {
    prepopulate();
  }

  function renderFooter() {
    return (
      <Form layout={'inline'}>
        {shouldShowAdvancedSwitch && (
          <SwitchInput
            label={$t('Show Advanced Settings')}
            name='advancedMode'
            onChange={switchAdvancedMode}
            value={isAdvancedMode}
            debounce={200}
            disabled={isLoading}
          />
        )}

        {/* CLOSE BUTTON */}
        <Button onClick={close}>{$t('Close')}</Button>

        {/* GO BACK BUTTON */}
        {shouldShowGoBackButton && (
          <Button onClick={goBackToSettings}>{$t('Go back to settings')}</Button>
        )}

        {/* GO LIVE BUTTON */}
        {shouldShowConfirm && (
          <Button type='primary' onClick={goLive} disabled={isLoading || !!error}>
            {$t('Confirm & Go Live')}
          </Button>
        )}
      </Form>
    );
  }

  return (
    <ModalLayout footer={renderFooter()}>
      <Form
        form={form}
        style={{
          position: 'relative',
          height: '100%',
        }}
        layout='vertical'
        name='editStreamForm'
      >
        <div className='section thin'>
          <TextInput label={'방송제목'} />
        </div>
        <div className='section thin'>
          <RadioInput
            label={'카테고리'}
            options={[
              {
                value: '720',
                label: '토크방',
              },
              {
                value: '1080',
                label: '19+',
              },
            ]}
          />
        </div>
        <div className='section thin'>
          <RadioInput
            label={'방송형태'}
            options={[
              {
                value: '720',
                label: '일반방송',
              },
              {
                value: '1080',
                label: '팬방송',
              },
            ]}
          />
        </div>
        <div className='section thin'>
          <h3 className='section-title'>{'방송속성'}</h3>
          <CheckboxInput
            label={'연령제한'}
          />
          <CheckboxInput
            label={'비밀번호방'}
          />
        </div>
        <div className='section thin'>
          <RadioInput
            label={'방송화질'}
            options={[
              {
                value: '720',
                label: '일반화질',
              },
              {
                value: '1080',
                label: '고화질(1080p)',
              },
            ]}
          />
        </div>
        <div className='section thin'>
          <NumberInput
            label={'유저 수'}
          />
        </div>
        {
          /*
    <Animation transitionName={shouldShowChecklist ? 'slideright' : ''}>
        {shouldShowChecklist && <GoLiveChecklist className={styles.page} key={'checklist'} />}
      </Animation>
           */
        }
      </Form>
    </ModalLayout>
  );
}
