import React, { useMemo, useState } from 'react';
import { Services } from '../service-provider';
import { ObsForm } from '../obs/ObsForm';
import { TObsFormData } from '../../components/obs/inputs/ObsInput';
import { useSelector } from '../store';
import { ModalLayout } from '../shared/ModalLayout';
import Display from '../shared/Display';
import { assertIsDefined } from '../../util/properties-type-guards';

export default function SourceProperties() {
  const { WindowsService, SourcesService } = Services;

  // get source
  const source = useMemo(() => {
    const { sourceId } = WindowsService.getChildWindowQueryParams();
    return SourcesService.views.getSource(sourceId);
  }, []);

  // define reactive variables
  const [properties, setProperties] = useState(source ? source.getPropertiesFormData() : []);
  const hideStyleBlockers = useSelector(() => WindowsService.state.child.hideStyleBlockers);

  function saveProperties(formData: TObsFormData) {
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
      <ObsForm value={properties} onChange={saveProperties} layout="horizontal" />
    </ModalLayout>
  );
}
