import { test, useSpectron } from '../../helpers/spectron';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';
import { clickButton, clickTab, focusChild } from '../../helpers/modules/core';
import { useForm } from '../../helpers/modules/forms';
useSpectron();

/**
 * Test shared input components
 */
test('Form inputs', async t => {
  const { readForm, fillForm, assertFormContains } = useForm('demo-form');

  // open demo-form
  await showSettingsWindow('Experimental');
  await focusChild();
  await clickButton('Show Shared Components Library');
  await clickTab('Demo Form');

  // test that we can read the form data correctly
  const initialFormData = await readForm();

  t.deepEqual(initialFormData, [
    { name: 'name', value: '', displayValue: '' },
    { name: 'gender', value: '', displayValue: null },
    { name: 'age', value: '0', displayValue: '0' },
    { name: 'city', value: '', displayValue: null },
    { name: 'weight', value: 65, displayValue: 65 },
    { name: 'colors', value: [], displayValue: [] },
    { name: 'addIntroduction', value: false, displayValue: false },
    { name: 'saveFilePath', value: '', displayValue: '' },
    { name: 'confirm1', value: false, displayValue: false },
    { name: 'confirm2', value: false, displayValue: false },
  ]);

  // fill out all inputs
  await fillForm({
    name: 'John Doe',
    gender: 'Male',
    colors: ['Red', 'Orange'],
    age: 20,
    weight: 100,
    city: 'Cairo',
    addIntroduction: true,
    introduction: 'Hello World!',
    saveFilePath: 'C:\\myreport.txt',
    confirm1: true,
    confirm2: true,
  });

  // read the form again and test that it was filled out correctly
  const filledFormData = await readForm();

  t.deepEqual(filledFormData, [
    { name: 'name', value: 'John Doe', displayValue: 'John Doe' },
    { name: 'gender', value: 'male', displayValue: 'Male' },
    { name: 'age', value: '20', displayValue: '20' },
    { name: 'city', value: 'C', displayValue: 'Cairo' },
    { name: 'weight', value: 100, displayValue: 100 },
    {
      name: 'colors',
      value: [1, 4],
      displayValue: ['Red', 'Orange'],
    },
    { name: 'addIntroduction', value: true, displayValue: true },
    {
      name: 'introduction',
      value: 'Hello World!',
      displayValue: 'Hello World!',
    },
    { name: 'saveFilePath', value: 'C:\\myreport.txt', displayValue: 'C:\\myreport.txt' },
    { name: 'confirm1', value: true, displayValue: true },
    { name: 'confirm2', value: true, displayValue: true },
  ]);

  // test assertion
  assertFormContains({
    name: 'John Doe',
    gender: 'Male',
    colors: ['Red', 'Orange'],
    age: 20,
    city: 'Cairo',
    weight: 100,
    addIntroduction: true,
    introduction: 'Hello World!',
    saveFilePath: 'C:\\myreport.txt',
    confirm1: true,
    confirm2: true,
  });
});
