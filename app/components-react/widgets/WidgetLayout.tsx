import { Col, Collapse, Layout, Row, Spin } from 'antd';
import React, { ReactNode } from 'react';
import { useWidget } from './useWidget';
import Display from '../shared/Display';
import css from './WidgetLayout.m.less';

import Form, { useForm } from '../shared/inputs/Form';
import { ObsForm } from '../obs/ObsForm';
import { $t } from '../../services/i18n';

const { Content, Header } = Layout;

export function WidgetLayout(p: { children: ReactNode | [ReactNode, ReactNode] }) {
  const { previewSourceId, isLoading } = useWidget();
  let MenuPanel: ReactNode;
  let ContentPanel: ReactNode;
  if (Array.isArray(p.children)) {
    [MenuPanel, ContentPanel] = p.children;
  } else {
    ContentPanel = p.children;
  }
  const form = useForm();
  return (
    <Layout className={css.widgetLayout} style={{ height: '100%' }}>
      <Header style={{ height: '350px', padding: 0 }}>
        <Display sourceId={previewSourceId} />
      </Header>
      <Content>
        <Row style={{ height: '100%', borderTop: '1px solid var(--border)' }}>
          {MenuPanel && (
            <Col
              flex="250px"
              style={{
                borderRight: '1px solid var(--border)',
                backgroundColor: 'var(--section)',
              }}
            >
              {!isLoading && MenuPanel}
            </Col>
          )}

          <Col
            flex="auto"
            style={{ padding: '16px', paddingTop: '32px', height: '100%', overflow: 'auto' }}
          >
            <Form form={form} layout="horizontal">
              <Spin spinning={isLoading}>{!isLoading && ContentPanel}</Spin>
            </Form>
            <BrowserSourceSettings />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

function BrowserSourceSettings() {
  const { browserSourceProps, updateBrowserSourceProps } = useWidget();
  return (
    <Collapse bordered={false}>
      <Collapse.Panel header={$t('Browser Source Settings')} key={1}>
        <ObsForm
          value={browserSourceProps}
          onChange={updateBrowserSourceProps}
          layout="horizontal"
        />
      </Collapse.Panel>
    </Collapse>
  );
}
