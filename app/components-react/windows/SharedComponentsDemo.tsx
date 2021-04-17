import React, { HTMLAttributes } from 'react';
import { useFormState, useVuex } from '../hooks';
import { ModalLayout } from '../shared/ModalLayout';
import Form from '../shared/inputs/Form';
import {
  CheckboxInput,
  createBinding,
  ListInput,
  SwitchInput,
  TextInput,
  TInputLayout,
} from '../shared/inputs';
import { Card, Col, Row } from 'antd';
import { Services } from '../service-provider';
import { merge, useStateManager } from '../hooks/useStateManager';
import InputWrapper from '../shared/inputs/InputWrapper';

export default function SharedComponentsDemo() {
  const { Context, contextValue } = useGlobalSettings();
  return (
    <Context.Provider value={contextValue}>
      <ModalLayout>
        <Row gutter={16}>
          <Col flex="auto">
            <Examples />
          </Col>
          <Col flex={'300px'}>
            <GlobalSettings />
          </Col>
        </Row>
      </ModalLayout>
    </Context.Provider>
  );
}

function Examples() {
  const { layout, hasTooltips, required, placeholder } = useGlobalSettings();
  const { s, bind } = useFormState({
    textVal: '',
    switcherVal: false,
    numberVal: 0,
    sliderVal: 5,
    imageVal: '',
    checkboxesVal: [true, true, false, false],
  });

  const globalProps: Record<string, any> = {};
  if (hasTooltips) globalProps.tooltip = 'This is tooltip';
  if (required) globalProps.required = true;
  if (placeholder) globalProps.placeholder = placeholder;

  return (
    <Form layout={layout}>
      <Example title="TextInput">
        <TextInput label="Uncontrolled" {...globalProps} {...bind.textVal} />
        <TextInput
          label="Controlled"
          uncontrolled={false}
          placeholder={placeholder}
          {...bind.textVal}
        />
        <TextInput label="Debounced" debounce={500} {...globalProps} {...bind.textVal} />
        <TextInput label="Disabled" disabled {...globalProps} {...bind.textVal} />
        <TextInput
          label="With addons"
          addonBefore="http://"
          addonAfter=".com"
          {...globalProps}
          {...bind.textVal}
        />
        Value: {s.textVal}
      </Example>

      <Example title="SwitchInput">
        <SwitchInput label="Default" {...globalProps} {...bind.switcherVal} />
        <SwitchInput label="Debounced" debounce={500} {...globalProps} {...bind.switcherVal} />
        <SwitchInput label="Disabled" disabled {...globalProps} {...bind.switcherVal} />
        <SwitchInput
          label="With text"
          {...globalProps}
          {...bind.switcherVal}
          checkedChildren="Enabled"
          unCheckedChildren="Disabled"
        />
        Value: {String(s.switcherVal)}
      </Example>
    </Form>
  );
}

function Example(p: { title: string } & HTMLAttributes<unknown>) {
  return (
    <Card title={p.title} style={{ width: '100%', marginBottom: '24px' }}>
      {p.children}
    </Card>
  );
}

function GlobalSettings() {
  const { theme, switchTheme, bind } = useGlobalSettings();

  function createOptions(opts: string[]) {
    return opts.map(opt => ({
      label: opt,
      value: opt,
    }));
  }

  return (
    <Form
      layout="vertical"
      style={{
        position: 'fixed',
        height: '100%',
        backgroundColor: 'var(--section)',
        overflow: 'hidden',
        width: '300px',
        right: '0',
        top: '30px',
        padding: '16px',
      }}
    >
      <ListInput
        label="Theme"
        options={createOptions(['night-theme', 'day-theme', 'prime-dark', 'prime-light'])}
        value={theme}
        onChange={switchTheme}
      />
      <ListInput
        label="Layout"
        options={createOptions(['horizontal', 'vertical', 'inline'])}
        {...bind.layout}
      />
      <TextInput label="Placeholder" {...bind.placeholder} />
      <InputWrapper>
        <CheckboxInput label={'Has tooltips'} {...bind.hasTooltips} />
        <CheckboxInput label={'Required'} {...bind.required} />
      </InputWrapper>
    </Form>
  );
}

interface IGlobalSettingsState {
  layout: TInputLayout;
  placeholder: string;
  hasTooltips: boolean;
  required: boolean;
}

function useGlobalSettings() {
  return useStateManager(
    {
      layout: 'horizontal',
      hasTooltips: false,
      required: false,
      placeholder: 'Start typing',
    } as IGlobalSettingsState,
    (getState, setState) => {
      const { CustomizationService } = Services;

      // function updateSettings(patch: Partial<IGlobalSettingsState>) {
      //   setState({ ...getState(), ...patch });
      // }
      //
      const bind = createBinding(getState, setState);

      const getters = {
        get theme() {
          return CustomizationService.currentTheme;
        },
      };

      // const mutations = {
      //   updateSettings,
      //   setLayout(layout: TInputLayout) {
      //     updateSettings({ layout });
      //   },
      // };

      const actions = {
        switchTheme(theme: string) {
          CustomizationService.actions.setTheme(theme);
        },
      };

      return merge(getters, { bind }, actions);
    },
    null,
  ).dependencyWatcher;
}
