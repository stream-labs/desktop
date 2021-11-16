import React, { useMemo, useState } from 'react';
import { Services } from '../service-provider';
import { ObsForm } from '../obs/ObsForm';
import { TObsFormData } from '../../components/obs/inputs/ObsInput';
import { useSelector } from '../store';
import { ModalLayout } from '../shared/ModalLayout';
import Display from '../shared/Display';
import { assertIsDefined } from '../../util/properties-type-guards';
import Scrollable from '../shared/Scrollable';

export default function SourceProperties() {
  const { WindowsService, SourcesService } = Services;

  const source = useMemo(() => {
    const { sourceId } = WindowsService.getChildWindowQueryParams();
    return SourcesService.views.getSource(sourceId);
  }, []);

  const [properties, setProperties] = useState(source ? source.getPropertiesFormData() : []);
  const hideStyleBlockers = useSelector(() => WindowsService.state.child.hideStyleBlockers);

  function updateProperties(formData: TObsFormData) {
    assertIsDefined(source);
    // save source settings in OBS source
    source.setPropertiesFormData(formData);
    // sync source setting with state
    const updatedProps = source.getPropertiesFormData();
    setProperties(updatedProps);
  }

  return (
    <ModalLayout
      scrollable
      fixedChild={source && !hideStyleBlockers && <Display sourceId={source.sourceId} />}
    >
      <ObsForm value={properties} onChange={updateProperties} layout="horizontal" />
      {/*<Scrollable style={{ height: '100%' }} snapToWindowEdge>*/}
      {/*  <ObsForm value={properties} onChange={updateProperties} layout="horizontal" />*/}
      {/*</Scrollable>*/}
    </ModalLayout>
  );
}
