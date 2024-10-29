import { useAtom, useAtomValue } from 'jotai';
import { atomWithObservable } from 'jotai/utils';
import { atomWithImmer } from 'jotai-immer';
import { Suspense } from 'react';
import { api } from '@/api/api';
import { Form, Input } from 'antd';


const goLiveSettingsAtom = atomWithImmer({
  general: {
    title: '',
    description: ''
  },
  platforms: {} as unknown 
});

const streamInfoAtom = atomWithObservable(() => api.StreamingService.state$);

const userInfoAtom = atomWithObservable(() => api.UserService.state$);

function Glw() {
  const lifecycle = useAtomValue(streamInfoAtom).lifecycle;
  const shouldShowSettings = ['waitForNewSettings'].includes(lifecycle);
  const shouldShowChecklist = ['runChecklist', 'live'].includes(lifecycle);
    
  return (
    <Suspense fallback={'Loading...'}>
        {shouldShowChecklist && <GlwSettings key={'settings'} />}
        {shouldShowSettings && <GlwChecklist key={'checklist'} />}
    </Suspense>
  );
}

function GlwSettings() {
  const hasDescription = true;
  const descriptionIsRequired = true;
  const [settings, setSettings] = useAtom(goLiveSettingsAtom);
  const userName = useAtomValue(userInfoAtom).name

  const handleInputChange = (field: 'title' | 'description') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings((draft) => {
      draft.general[field] = e.target.value;
    });
  };

  return (
    <>
      General Settings for {userName}

      {/*TITLE*/}
      <Form.Item label="Title" required={true}>
        <Input value={settings.general.title} onChange={handleInputChange('title')} />
      </Form.Item>

      {/*DESCRIPTION*/}
      {hasDescription && (
        <Form.Item label="Description" required={descriptionIsRequired}>
          <Input.TextArea rows={4} value={settings.general.description} onChange={handleInputChange('description')} />
        </Form.Item>
      )}
    </>
  );
}

function GlwChecklist() {
  return <div>Go Live Checklist </div>;
};
