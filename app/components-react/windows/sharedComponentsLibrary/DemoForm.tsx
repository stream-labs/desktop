import React, { useState } from 'react';
import { Example, useSharedComponentsLibrary } from './SharedComponentsLibrary';
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
import { injectQuery, injectState } from 'slap';

/**
 * A component that renders a form with a different variations of input components
 * We need it for testing input components in automated tests
 */
export function DemoForm() {
  const {
    layout,
    formState,
    citiesQuery,
    colorOptions,
    genderOptions,
    addIntroduction,
    setSearchStr,
  } = useSharedComponentsLibrary().extend(module => {
    const formState = injectState({
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
      searchStr: '',
    });

    const citiesQuery = injectQuery(fetchCities, () => formState.searchStr);

    return {
      formState,
      citiesQuery,

      genderOptions: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'other' },
      ],

      colorOptions: [
        { value: 1, label: 'Red' },
        { value: 2, label: 'Green' },
        { value: 3, label: 'Blue' },
        { value: 4, label: 'Orange' },
      ],
    };
  });

  const bind = formState.bind;

  return (
    <Form layout={layout} name="demo-form">
      <Example title="Demo Form">
        <TextInput {...bind.name} label={'Name'} required />
        <ListInput {...bind.gender} label={'Gender'} options={genderOptions} />
        <NumberInput {...bind.age} label={'Age'} />
        {/*Selected city {bind.city.value}*/}
        <ListInput
          {...bind.city}
          label={'City'}
          placeholder="Start typing for search"
          options={citiesQuery.data}
          showSearch
          onSearch={search => setSearchStr(search)}
          loading={citiesQuery.isLoading}
        />
        <SliderInput {...bind.weight} label={'Weight'} min={1} max={300} />
        <TagsInput label="Pick your favorite colors" {...bind.colors} options={colorOptions} />
        <FileInput label="Save to File" save={true} {...bind.saveFilePath} />
        <SwitchInput {...bind.addIntroduction} label={'Add Introduction'} />
        {addIntroduction && <TextAreaInput {...bind.introduction} label={'Introduction'} />}
        <InputWrapper>
          <CheckboxInput {...bind.confirm1} label={'Confirm you allow processing your data'} />
          <CheckboxInput {...bind.confirm2} required label={'Confirm you love Streamlabs'} />
        </InputWrapper>
      </Example>
    </Form>
  );
}

async function fetchCities(searchStr: string) {
  const availableCities = ['Tokyo', 'Delhi', 'Shanghai', 'MexicoCity', 'Cairo'];
  await Utils.sleep(1000);
  if (!searchStr) return [];
  const cities = availableCities.filter(cityName =>
    cityName.toLowerCase().startsWith(searchStr.toLowerCase()),
  );
  return cities.map(cityName => ({ label: cityName, value: cityName }));
}
