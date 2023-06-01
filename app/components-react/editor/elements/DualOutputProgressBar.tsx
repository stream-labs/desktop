import React, { useState } from 'react';
import ProgressBar from 'components-react/shared/ProgressBar';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { useSubscription } from '../../hooks/useSubscription';

export default function DualOutputProgressBar(p: { sceneId: string }) {
  const { DualOutputService, ScenesService } = Services;

  const [current, setCurrent] = useState(0);

  const v = useVuex(() => ({
    total: ScenesService.views.getSceneItemsBySceneId(p.sceneId)?.length ?? 0,
  }));

  useSubscription(DualOutputService.sceneNodeHandled, index => setCurrent(index));

  return <ProgressBar current={current} total={v.total} />;
}
