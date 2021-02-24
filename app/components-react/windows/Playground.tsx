import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';
import React, { useState, HTMLAttributes } from 'react';
import { Services } from '../service-provider';
import { useOnCreate, useStateHelper } from '../hooks';
import { assertIsDefined } from '../../util/properties-type-guards';
import { TextInput } from '../shared/inputs/TextInput';
import { Button } from 'antd';
import Form, { useForm } from '../shared/inputs/Form';
import { ListInput, SliderInput, SwitchInput, NumberInput, CheckboxInput } from '../shared/inputs';
import Scrollable from '../shared/Scrollable';
import Animate from 'rc-animate';
import { DestinationSwitchers } from './go-live/DestinationSwitchers';
import styles from './go-live/GoLive.m.less';

interface IWindowOptions {
  renameId?: string;
  itemsToGroup?: string[];
  parentId?: string;
  sceneId: string;
}

/**
 * Modal for creating or re-naming a folder
 */
export default function Playground() {
  const [myState, setMyState] = useState({ foo: 0 });
  const { s, updateState } = useStateHelper({
    displayValue: 0,
    actualValue: 0,
    switched: false,
    numberValue: 0,
    uncontrolledTextValue: '',
    controlledTextValue: '',
    debouncedTextValue: '',
  });

  return (
    <ModalLayout>
      <Form>
        {/*<SliderInput*/}
        {/*  name="mySlider"*/}
        {/*  value={s.actualValue}*/}
        {/*  min={0}*/}
        {/*  max={20}*/}
        {/*  onChange={val => updateState({ actualValue: val })}*/}
        {/*  onInput={val => updateState({ displayValue: val })}*/}
        {/*  debounce={500}*/}
        {/*/>*/}
        {/*<TextInput label="DisplayValue" name={'DisplayValue'} value={s.displayValue.toString()} />*/}
        {/*<TextInput label="ActualValue" name={'ActualValue'} value={s.actualValue.toString()} />*/}
        {/*<SwitchInput*/}
        {/*  label="Switch Me"*/}
        {/*  name="MySwitch"*/}
        {/*  debounce={500}*/}
        {/*  value={s.switched}*/}
        {/*  onChange={val => updateState({ switched: val })}*/}
        {/*/>*/}
        <TextInput
          label="UncontrolledText"
          name={'UncontrolledText'}
          value={s.uncontrolledTextValue}
          onChange={val => updateState({ uncontrolledTextValue: val })}
        />
        Val: {s.uncontrolledTextValue}
        <TextInput
          label="ControlledText"
          name={'ControlledText'}
          uncontrolled={false}
          value={s.controlledTextValue}
          onChange={val => updateState({ controlledTextValue: val })}
        />
        Val: {s.controlledTextValue}
        <TextInput
          label="DebouncedText"
          name={'DebouncedText'}
          debounce={500}
          value={s.debouncedTextValue}
          onChange={val => updateState({ debouncedTextValue: val })}
        />
        Val: {s.debouncedTextValue}
        <NumberInput
          label="NumberInput"
          name="MyNumber"
          max={10}
          min={0}
          value={s.numberValue}
          onChange={val => updateState({ numberValue: val })}
        />
        Val: {s.numberValue}
        <CheckboxInput
          label="Switch Checkbox"
          name="MySwitch"
          value={s.switched}
          onChange={val => updateState({ switched: val })}
        />
        Val: {s.switched ? 'switched' : 'not switched'}
      </Form>
    </ModalLayout>
  );
}
//
// const MyInput = React.memo(
//   (p: { name: string; value: string; onInput: (newVal: string) => unknown }) => {
//     console.log('render input', p.name, p.value);
//     return (
//       <input type="text" value={p.value} onInput={ev => p.onInput(ev.target['value'] as string)} />
//     );
//   },
// );
//
// const MyForm = React.memo((p: HTMLAttributes<any>) => {
//   console.log('render form');
//   return (
//     <div>
//       This is my Form
//       <div>{p.children}</div>
//     </div>
//   );
// });
//
// export default function Playground() {
//   const [fooVal, setFooVal] = useState('FooValue');
//   const [barVal, setBarVal] = useState('BarValue');
//   console.log('render root');
//
//   return (
//     <div>
//       This is root
//       <MyForm>
//         <MyInput name="Foo" value={fooVal} onInput={setFooVal} />
//         <MyInput name="Bar" value={barVal} onInput={setBarVal} />
//       </MyForm>
//     </div>
//   );
// }
