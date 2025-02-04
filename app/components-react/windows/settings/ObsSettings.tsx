import React, { CSSProperties, HTMLAttributes } from 'react';
import * as pageComponents from './pages';
import { useObsSettings } from './useObsSettings';
import { ObsFormGroup } from '../../obs/ObsForm';
import Form from '../../shared/inputs/Form';
import css from './ObsSettings.m.less';
import Tabs from 'components-react/shared/Tabs';

/**
 * Renders a settings page
 */
export function ObsSettings(p: { page: string }) {
  const { setPage, setDisplay } = useObsSettings();
  setPage(p.page);
  const PageComponent = getPageComponent(p.page);

  const showTabs = ['Output', 'Audio', 'Advanced'].includes(p.page);
  return (
    <div className={css.obsSettingsWindow}>
      {showTabs && <Tabs onChange={setDisplay} />}
      <PageComponent />
    </div>
  );
}

/**
 * Renders generic inputs from OBS
 */
export function ObsGenericSettingsForm() {
  const { settingsFormData, saveSettings } = useObsSettings();
  return (
    <ObsFormGroup value={settingsFormData} onChange={newSettings => saveSettings(newSettings)} />
  );
}

/**
 * A section layout for settings
 */
export function ObsSettingsSection(
  p: HTMLAttributes<unknown> & { title?: string; style?: CSSProperties },
) {
  return (
    <div className="section" style={p.style}>
      {p.title && <h2>{p.title}</h2>}
      <div className="section-content">
        <Form layout="vertical">{p.children}</Form>
      </div>
    </div>
  );
}

/**
 * Returns a component for a given page
 */
function getPageComponent(page: string) {
  const componentName = Object.keys(pageComponents).find(componentName => {
    return (pageComponents as Record<string, any>)[componentName].page === page;
  });
  return componentName ? (pageComponents as Record<string, any>)[componentName] : null;
}
