import React from 'react';
import { Col } from 'antd';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { useSourceShowcaseSettings } from './useSourceShowcase';
import styles from './SourceShowcase.m.less';

export default function SourceTag(p: {
  name: string;
  type: string;
  appId?: string;
  appSourceId?: string;
}) {
  const { PlatformAppsService } = Services;

  const {
    inspectSource,
    selectInspectedSource,
    inspectedSource,
    inspectedAppId,
    inspectedAppSourceId,
  } = useSourceShowcaseSettings();

  function active() {
    if (!p.appId) return inspectedSource === p.type;
    if (inspectedAppId !== p.appId) return false;
    const appManifest = PlatformAppsService.views.getApp(p.appId).manifest;
    return appManifest.sources.find(source => source.id === inspectedAppSourceId);
  }

  return (
    <Col span={8}>
      <div
        className={cx(styles.sourceTag, { [styles.active]: active() })}
        onClick={() => inspectSource(p.type, p.appId, p.appSourceId)}
        onDoubleClick={() => selectInspectedSource()}
      >
        {p.name}
      </div>
    </Col>
  );
}
