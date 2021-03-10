import { ModalLayout } from '../shared/ModalLayout';
import React from 'react';
import {
  CheckboxInput,
  ListInput,
  NumberInput,
  SliderInput,
  SwitchInput,
  TagsInput,
  TextAreaInput,
  TextInput,
} from '../shared/inputs';

export default function InputTest() {
  const metadata = {
    label: 'Test Input',
  };

  const listMetadata = {
    ...metadata,
    options: [
      { label: 'a', value: 'a' },
      { label: 'b', value: 'b' },
      { label: 'c', value: 'c' },
    ],
  };

  return (
    <ModalLayout>
      <CheckboxInput {...metadata} />
      <ListInput {...listMetadata} />
      <NumberInput {...metadata} />
      <SliderInput {...metadata} />
      <SwitchInput {...metadata} />
      <TagsInput {...listMetadata} />
      <TextAreaInput {...metadata} />
      <TextInput {...metadata} />
    </ModalLayout>
  );
}
