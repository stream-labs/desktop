import { click, test, useSpectron } from '../../helpers/spectron';
import { showSettings } from '../../helpers/spectron/settings';
import { sleep } from '../../helpers/sleep';
import { useForm } from '../../helpers/forms/useFormMonkey';

useSpectron();

test('Shared components ', async t => {
  await showSettings(t, 'Experimental');
  await click(t, 'button=Show Shared Components Library');
  await click(t, 'div=Demo Form');
  const { readForm, fillForm } = useForm(t, 'demo-form');
  const formData = await readForm();
  console.log('form data', formData);
  await fillForm({
    name: 'John Doe',
    gender: 'male',
    age: '20',
  });
  console.log('form data', await readForm());
  await sleep(9999999);
  t.pass();
});
