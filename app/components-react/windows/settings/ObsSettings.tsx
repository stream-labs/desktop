import React, { HTMLAttributes } from 'react';
import * as pageComponents from './pages';
import { useObsSettings } from './useObsSettings';
import { ObsFormGroup } from '../../obs/ObsForm';
import Form from '../../shared/inputs/Form';

export function ObsSettings() {
  const { page } = useObsSettings();
  const PageComponent = getPageComponent(page);
  return <PageComponent />;
}

export function ObsGenericSettingsForm() {
  const { settingsFormData, saveSettings } = useObsSettings();
  return (
    <ObsFormGroup value={settingsFormData} onChange={newSettings => saveSettings(newSettings)} />
  );
}

export function ObsSettingsSection(p: HTMLAttributes<unknown>) {
  return (
    <div className="section">
      <div className="section-content">
        <Form layout="vertical">{p.children}</Form>
      </div>
    </div>
  );
}

function getPageComponent(page: string) {
  const componentName = Object.keys(pageComponents).find(componentName => {
    return pageComponents[componentName].page === page;
  });
  return componentName ? pageComponents[componentName] : null;
}
