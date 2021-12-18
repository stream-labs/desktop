import React, { useMemo, useState } from 'react';
import { Services } from '../service-provider';
import { ObsForm } from '../obs/ObsForm';
import { TObsFormData } from '../../components/obs/inputs/ObsInput';
import { useSelector } from '../store';
import { ModalLayout } from '../shared/ModalLayout';
import Display from '../shared/Display';
import { assertIsDefined } from '../../util/properties-type-guards';
import electron from 'electron';
import { useSubscription } from '../hooks/useSubscription';

export default function SourceProperties() {
  const {
    WindowsService,
    SourcesService,
    EditorCommandsService,
    UsageStatisticsService,
  } = Services;

  // get source
  const source = useMemo(() => {
    const { sourceId } = WindowsService.getChildWindowQueryParams();
    return SourcesService.views.getSource(sourceId);
  }, []);

  // define reactive variables
  const [properties, setProperties] = useState(() =>
    source ? source.getPropertiesFormData() : [],
  );
  const hideStyleBlockers = useSelector(() => WindowsService.state.child.hideStyleBlockers);

  // close the window if the source has been deleted
  useSubscription(SourcesService.sourceRemoved, removedSource => {
    if (source && removedSource.sourceId !== source.sourceId) return;
    WindowsService.actions.closeChildWindow();
  });

  // update properties state if the source has been changed
  useSubscription(SourcesService.sourceUpdated, updatedSource => {
    if (source && updatedSource.sourceId !== source.sourceId) return;
    setProperties(source!.getPropertiesFormData());
  });

  function onChangeHandler(formData: TObsFormData, changedInd: number) {
    assertIsDefined(source);

    if (formData[changedInd].name === 'video_config') {
      UsageStatisticsService.actions.recordFeatureUsage('DShowConfigureVideo');
    }

    // save source settings
    EditorCommandsService.executeCommand('EditSourcePropertiesCommand', source.sourceId, [
      formData[changedInd],
    ]);
  }

  return (
    <ModalLayout
      scrollable
      fixedChild={source && !hideStyleBlockers && <Display sourceId={source.sourceId} />}
    >
      <ObsForm value={properties} onChange={onChangeHandler} layout="horizontal" />
    </ModalLayout>
  );
}
