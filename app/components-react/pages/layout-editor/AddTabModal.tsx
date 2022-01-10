import React, { useState } from 'react';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import { TextInput, ImagePickerInput } from 'components-react/shared/inputs';
import { useLayoutEditor } from './hooks';

const ICONS = [
  { value: 'icon-studio', label: 'icon-studio' },
  { value: 'icon-widgets', label: 'icon-widgets' },
  { value: 'icon-settings-3-1', label: 'icon-settings-3-1' },
  { value: 'icon-graph', label: 'icon-graph' },
  { value: 'icon-lock', label: 'icon-lock' },
  { value: 'icon-live-dashboard', label: 'icon-live-dashboard' },
  { value: 'icon-ideas', label: 'icon-ideas' },
  { value: 'icon-wish-list', label: 'icon-wish-list' },
  { value: 'icon-framed-poster', label: 'icon-framed-poster' },
  { value: 'icon-integrations-2', label: 'icon-integrations-2' },
  { value: 'icon-camera', label: 'icon-camera' },
  { value: 'icon-audio', label: 'icon-audio' },
];

export default function AddTabModal() {
  const { LayoutService } = Services;
  const { setShowModal } = useLayoutEditor();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  function createTab() {
    LayoutService.addTab(name, icon);
    setShowModal(false);
  }

  const canSave = !!icon && !!name;

  function Footer() {
    return (
      <>
        <button className="button button--default" onClick={() => setShowModal(false)}>
          {$t('Cancel')}
        </button>
        <button
          className="button button--action"
          onClick={createTab}
          disabled={!canSave}
          style={{ marginLeft: '8px' }}
        >
          {$t('Save New Tab')}
        </button>
      </>
    );
  }

  return (
    <ModalLayout footer={<Footer />} wrapperStyle={{ width: '410px', height: '350px' }}>
      <ImagePickerInput value={icon} onInput={setIcon} options={ICONS} isIcons={true} />
      <TextInput label={$t('Name')} value={name} onInput={setName} style={{ marginTop: '8px' }} />
    </ModalLayout>
  );
}
