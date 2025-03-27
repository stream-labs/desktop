import React, { HTMLAttributes } from 'react';
import { ModalLayout } from '../../shared/ModalLayout';
import Form from '../../shared/inputs/Form';
import {
  CheckboxInput,
  DateInput,
  FileInput,
  ImageInput,
  ListInput,
  MediaUrlInput,
  NumberInput,
  SliderInput,
  SwitchInput,
  TagsInput,
  TextAreaInput,
  TextInput,
  TInputLayout,
} from '../../shared/inputs';
import { Alert, Button, Col, Row, Space, Tag, Timeline, Tabs, Menu } from 'antd';
import { Services } from '../../service-provider';
import InputWrapper from '../../shared/inputs/InputWrapper';
import Scrollable from '../../shared/Scrollable';
import PlatformLogo from '../../shared/PlatformLogo';
import { DownloadOutlined } from '@ant-design/icons';
import { alertAsync, confirmAsync } from '../../modals';
import { I18nService, WHITE_LIST } from '../../../services/i18n';
import pick from 'lodash/pick';
import { DemoForm } from './DemoForm';
import { CodeInput } from '../../shared/inputs/CodeInput';
import { injectState, merge, useModule, injectFormBinding } from 'slap';
import { TApplicationTheme } from 'services/customization';

const { TabPane } = Tabs;

export default function SharedComponentsLibrary() {
  return (
    <ModalLayout>
      <Row gutter={16} style={{ height: 'calc(100% + 24px)' }}>
        <Col flex="auto" style={{ height: '100%' }}>
          <Scrollable style={{ height: '100%' }}>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Shared Components" key="1">
                <Examples />
              </TabPane>
              <TabPane tab="Demo Form" key="2">
                <DemoForm />
              </TabPane>
            </Tabs>
          </Scrollable>
        </Col>
        <Col flex={'300px'}>
          <SettingsPanel />
        </Col>
      </Row>
    </ModalLayout>
  );
}

function Examples() {
  const {
    layout,
    required,
    placeholder,
    hasTooltips,
    disabled,
    size,
    formState,
  } = useSharedComponentsLibrary().extend(module => {
    const formState = injectState({
      textVal: '',
      textAreaVal: '',
      switcherVal: false,
      numberVal: 0,
      sliderVal: 5,
      imageVal: '',
      galleryImage: '',
      galleryAudio: '',
      javascript: 'alert("Hello World!")',
      saveFilePathVal: '',
      checkboxVal: false,
      dateVal: undefined as Date | undefined,
      listVal: 1,
      listOptions: [
        { value: 1, label: 'Red' },
        { value: 2, label: 'Green' },
        { value: 3, label: 'Blue' },
        { value: 4, label: 'Orange' },
      ],
      listVal2: '',
      listOptions2: [
        { value: '', label: 'Please Select the option' },
        { value: 'foo', label: 'Foo' },
        { value: 'bar', label: 'Bar' },
      ],
      tagsVal: [1, 2, 3],
      tagsOptions: [
        { value: 1, label: 'Red' },
        { value: 2, label: 'Green' },
        { value: 3, label: 'Blue' },
        { value: 4, label: 'Orange' },
      ],
    });

    return {
      formState,
    };
  });

  const s = formState;
  const bind = formState.bind;
  const globalProps: Record<string, any> = {};
  if (hasTooltips) globalProps.tooltip = 'This is tooltip';
  if (required) globalProps.required = true;
  if (placeholder) globalProps.placeholder = placeholder;
  if (disabled) globalProps.disabled = true;
  if (size) globalProps.size = size;

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
        <TextInput label="Read Only" readOnly {...globalProps} {...bind.textVal} />
        <TextInput label="Password" isPassword {...globalProps} {...bind.textVal} />
        <TextInput
          label="With addons"
          addonBefore="http://"
          addonAfter=".com"
          {...globalProps}
          {...bind.textVal}
        />
      </Example>

      <Example title="Number Input">
        <NumberInput label="Basic" {...globalProps} {...bind.numberVal} />
        <NumberInput
          label="Min = 0, Max = 10"
          min={0}
          max={10}
          {...globalProps}
          {...bind.numberVal}
        />
      </Example>

      <Example title="Textarea Input">
        <TextAreaInput label="Basic" {...globalProps} {...bind.textAreaVal} />
        <TextAreaInput
          label="Show Count"
          {...globalProps}
          {...bind.textAreaVal}
          showCount
          maxLength={50}
        />
        <TextAreaInput label="Auto Size" {...globalProps} {...bind.textAreaVal} autoSize />
      </Example>

      <Example title="List Input">
        <ListInput label="Basic" {...globalProps} {...bind.listVal} options={s.listOptions} />
        <ListInput
          label="With search"
          {...globalProps}
          {...bind.listVal}
          options={s.listOptions}
          showSearch
        />
        <ListInput
          label="Allow Clear"
          {...globalProps}
          {...bind.listVal}
          options={s.listOptions}
          allowClear
        />
        <ListInput
          label="Custom Empty"
          {...globalProps}
          {...bind.listVal2}
          options={s.listOptions2}
        />
      </Example>

      <Example title="Tags Input">
        <TagsInput label="Basic" {...globalProps} {...bind.tagsVal} options={s.tagsOptions} />
        <TagsInput
          label="Custom Tag Render"
          {...globalProps}
          {...bind.tagsVal}
          options={s.tagsOptions}
          tagRender={(tagProps, tag) => (
            <Tag {...tagProps} color={tag.label.toLowerCase()}>
              {tag.label}
            </Tag>
          )}
        />
        <TagsInput
          label="Custom Option Render"
          {...globalProps}
          {...bind.tagsVal}
          options={s.tagsOptions}
          optionRender={opt => (
            <Row gutter={16} style={{ color: opt.label.toLowerCase() }}>
              <Col>{opt.value}</Col>
              <Col>{opt.label}</Col>
            </Row>
          )}
        />
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
      </Example>

      <Example title="Checkbox Input">
        <InputWrapper label="Checkbox Group">
          <CheckboxInput label="Default" {...globalProps} {...bind.checkboxVal} />
          <CheckboxInput label="Debounced" debounce={500} {...globalProps} {...bind.checkboxVal} />
        </InputWrapper>
      </Example>

      <Example title="Slider Input">
        <SliderInput label="Basic" min={0} max={10} {...globalProps} {...bind.sliderVal} />
        <SliderInput
          label="Without Number Input"
          min={0}
          max={10}
          hasNumberInput={false}
          {...bind.sliderVal}
        />
        <SliderInput
          label="Debounced"
          min={0}
          max={10}
          debounce={300}
          {...globalProps}
          {...bind.sliderVal}
        />
      </Example>

      <Example title="Date Input">
        <DateInput label="Default" {...globalProps} {...bind.dateVal} />
      </Example>

      <Example title="Image Input">
        <ImageInput label="Basic" maxFileSize={3000000} {...globalProps} {...bind.imageVal} />
      </Example>

      <Example title="File Input">
        <FileInput label="Save As" save={true} {...globalProps} {...bind.saveFilePathVal} />
      </Example>

      <Example title="Media Gallery">
        <MediaUrlInput label="Image" {...globalProps} {...bind.galleryImage} />
      </Example>

      <Example title="Code Input">
        <CodeInput label="javascript" lang="js" {...globalProps} {...bind.javascript} />
      </Example>

      <Example title="Buttons">
        <Space direction="vertical">
          <Button type="primary" size={size}>
            Primary
          </Button>
          <Button size={size}>Default</Button>
          <Button type="dashed" size={size}>
            Dashed
          </Button>
          <br />
          <Button type="link" size={size}>
            Link
          </Button>
          <br />
          <Button type="primary" icon={<DownloadOutlined />} size={size} />
          <Button type="primary" shape="circle" icon={<DownloadOutlined />} size={size} />
          <Button type="primary" shape="round" icon={<DownloadOutlined />} size={size} />
          <Button type="primary" shape="round" icon={<DownloadOutlined />} size={size}>
            Download
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} size={size}>
            Download
          </Button>

          <Button type="primary" loading>
            Loading
          </Button>

          <Button type="primary" ghost>
            Primary Ghost
          </Button>
          <Button ghost>Default Ghost</Button>
          <Button type="dashed" ghost>
            Dashed Ghost
          </Button>

          <Button type="primary" danger>
            Primary Danger
          </Button>
          <Button danger>Default Danger</Button>
          <Button type="dashed" danger>
            Dashed Danger
          </Button>
          <Button type="text" danger>
            Text Danger
          </Button>
          <Button type="link" danger>
            Link Danger
          </Button>
        </Space>
      </Example>

      <Example title="Menu">
        <Menu theme="light">
          <Menu.Item key="1">Item 1</Menu.Item>
          <Menu.Item key="2">Item 2</Menu.Item>
          <Menu.Item key="3">Item 4</Menu.Item>
        </Menu>

        <Menu theme="dark">
          <Menu.Item key="1">Item 1</Menu.Item>
          <Menu.Item key="2">Item 2</Menu.Item>
          <Menu.Item key="3">Item 4</Menu.Item>
        </Menu>
      </Example>

      <Example title="Modals">
        <Space>
          <Button onClick={() => alertAsync('This is Alert')}>Show Alert</Button>
          <Button
            onClick={() =>
              confirmAsync('This is Alert').then(confirmed =>
                alertAsync(confirmed ? 'Confirmed' : 'Not confirmed'),
              )
            }
          >
            Show Confirm
          </Button>
        </Space>
      </Example>

      <Example title="Platform Logo">
        <PlatformLogo platform="twitch" />
        <PlatformLogo platform="youtube" />
        <PlatformLogo platform="facebook" />
        <PlatformLogo platform="streamlabs" />
        <PlatformLogo platform="dlive" />
        <PlatformLogo platform="nimotv" />
      </Example>

      <Example title="Timeline">
        <Timeline pending="Recording...">
          <Timeline.Item>Create a services site 2015-09-01</Timeline.Item>
          <Timeline.Item>Solve initial network problems 2015-09-01</Timeline.Item>
          <Timeline.Item>Technical testing 2015-09-01</Timeline.Item>
        </Timeline>
      </Example>
    </Form>
  );
}

export function Example(p: { title: string } & HTMLAttributes<unknown>) {
  const { background } = useSharedComponentsLibrary();

  return (
    <Container background={background} title={p.title}>
      {background !== 'error' && (
        <InputWrapper>
          <h2>{p.title}</h2>
        </InputWrapper>
      )}

      {p.children}
    </Container>
  );
}

function Container(p: { title: string; background: string } & HTMLAttributes<unknown>) {
  return (
    <div>
      {p.background === 'none' && <div>{p.children}</div>}
      {p.background === 'section' && <div className="section">{p.children}</div>}
      {p.background === 'section-alt' && <div className="section section-alt">{p.children}</div>}
      {p.background === 'error' && (
        <Alert
          type="error"
          message={p.title}
          description={p.children}
          style={{ marginBottom: '24px' }}
        />
      )}
    </div>
  );
}

function SettingsPanel() {
  const { bind, locales } = useSharedComponentsLibrary();

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
        {...bind.theme}
      />
      <ListInput
        label="Layout"
        options={createOptions(['horizontal', 'vertical', 'inline'])}
        {...bind.layout}
      />
      <ListInput
        label="Background"
        options={createOptions(['none', 'section', 'section-alt', 'error'])}
        {...bind.background}
      />
      <ListInput
        label="Size"
        options={createOptions(['default', 'large', 'small'])}
        {...bind.size}
      />
      <ListInput label="Language" options={createOptions(locales)} {...bind.locale} />
      <TextInput label="Placeholder" {...bind.placeholder} />
      <InputWrapper label="Miscellaneous">
        <CheckboxInput label={'Has tooltips'} {...bind.hasTooltips} />
        <CheckboxInput label={'Required'} {...bind.required} />
        <CheckboxInput label={'Disabled'} {...bind.disabled} />
      </InputWrapper>
    </Form>
  );
}

export function useSharedComponentsLibrary() {
  return useModule(SharedComponentsModule);
}

class SharedComponentsModule {
  state = injectState({
    layout: 'horizontal',
    hasTooltips: false,
    required: false,
    placeholder: 'Start typing',
    disabled: false,
    size: 'middle',
    background: 'section',
    locales: WHITE_LIST,
  } as ISharedComponentsState);

  private globalState = {
    get theme() {
      return Services.CustomizationService.currentTheme;
    },
    set theme(theme: TApplicationTheme) {
      Services.CustomizationService.actions.setTheme(theme);
    },
    get locale() {
      return I18nService.instance.state.locale;
    },
    set locale(locale: string) {
      // TODO: change locale dynamically
      alert('Not implemented');
      // I18nService.instance.actions.setLocale(locale);
    },
  };

  get mergedState() {
    return merge(this.state.getters, this.globalState);
  }

  bind = injectFormBinding(
    () => this.mergedState,
    statePatch => {
      const localStatePatch = pick(statePatch, Object.keys(this.state));
      this.state.update(localStatePatch);
      const globalStatePatch = pick(statePatch, Object.keys(this.globalState));
      Object.assign(this.globalState, globalStatePatch);
    },
  );
}

interface ISharedComponentsState {
  layout: TInputLayout;
  placeholder: string;
  hasTooltips: boolean;
  required: boolean;
  disabled: boolean;
  size: 'middle' | 'large' | 'small';
  background: 'none' | 'section' | 'section-alt' | 'error';
  locales: string[];
}
