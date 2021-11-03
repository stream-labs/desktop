import React, { useState } from 'react';
import { Example, useSharedComponentsLibrary } from './SharedComponentsLibrary';
import { useFormState } from '../../hooks';
import Utils from '../../../services/utils';
import { IListOption, ListInput } from '../../shared/inputs/ListInput';
import Form from '../../shared/inputs/Form';
import {
  CheckboxInput,
  FileInput,
  NumberInput,
  SliderInput,
  SwitchInput,
  TagsInput,
  TextAreaInput,
  TextInput,
} from '../../shared/inputs';
import InputWrapper from '../../shared/inputs/InputWrapper';

/**
 * A component that renders a form with a different variations of input components
 * We need it for testing input components in automated tests
 */
export function DemoForm() {
  const { layout } = useSharedComponentsLibrary();
  const { s, bind } = useFormState({
    name: '',
    gender: '',
    age: 0,
    colors: [] as number[],
    city: '',
    weight: 65,
    addIntroduction: false,
    introduction: '',
    plusOneName: '',
    confirm1: false,
    confirm2: false,
    saveFilePath: '',
  });

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'other' },
  ];

  const colorOptions = [
    { value: 1, label: 'Red' },
    { value: 2, label: 'Green' },
    { value: 3, label: 'Blue' },
    { value: 4, label: 'Orange' },
  ];

  const availableCities = ['Tokyo', 'Delhi', 'Shanghai', 'MexicoCity', 'Cairo'];
  const [cityOptions, setCityOptions] = useState<IListOption<string>[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  async function onCitySearch(searchStr: string) {
    setIsSearching(true);
    // add a fake loading time
    await Utils.sleep(1000);
    const cities = availableCities.filter(cityName => cityName.startsWith(searchStr));
    setCityOptions(cities.map(cityName => ({ value: cityName.charAt(0), label: cityName })));
    setIsSearching(false);
  }

  return (
    <Form layout={layout} name="demo-form">
      <Example title="Demo Form">
        <TextInput {...bind.name} label={'Name'} required />
        <ListInput {...bind.gender} label={'Gender'} options={genderOptions} />
        <NumberInput {...bind.age} label={'Age'} />
        <ListInput
          {...bind.city}
          label={'City'}
          options={cityOptions}
          showSearch
          onSearch={onCitySearch}
          loading={isSearching}
        />
        <SliderInput {...bind.weight} label={'Weight'} min={1} max={300} />
        <TagsInput label="Pick your favorite colors" {...bind.colors} options={colorOptions} />
        <SwitchInput {...bind.addIntroduction} label={'Add Introduction'} />
        {s.addIntroduction && <TextAreaInput {...bind.introduction} label={'Introduction'} />}
        <FileInput label="Save to File" save={true} {...bind.saveFilePath} />
        <InputWrapper>
          <CheckboxInput {...bind.confirm1} label={'Confirm you allow processing your data'} />
          <CheckboxInput {...bind.confirm2} required label={'Confirm you love Streamlabs OBS'} />
        </InputWrapper>
      </Example>
    </Form>
  );
}
