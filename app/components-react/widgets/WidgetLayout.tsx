import { Col, Layout, Row } from 'antd';
import React from 'react';
import { useWidget } from './useWidget';
import Display from '../shared/Display';
import css from './WidgetLayout.m.less';

import Form, { useForm } from '../shared/inputs/Form';

const { Content, Header } = Layout;

export function WidgetLayout(p: { children: [React.ReactNode, React.ReactNode] }) {
  const { previewSourceId, isLoading } = useWidget();
  const [MainPanel, SubPanel] = p.children;
  const form = useForm();
  return (
    <Layout className={css.widgetLayout} style={{ height: '100%' }}>
      <Header style={{ height: '350px', padding: 0 }}>
        <Display sourceId={previewSourceId} />
      </Header>
      <Content>
        <Row style={{ height: '100%', borderTop: '1px solid var(--border)' }}>
          <Col
            flex="250px"
            style={{
              borderRight: '1px solid var(--border)',
              backgroundColor: 'var(--section)',
            }}
          >
            {isLoading && 'loading...'}
            {!isLoading && MainPanel}
          </Col>
          <Col flex="auto" style={{ padding: '16px', paddingTop: '32px' }}>
            <Form form={form} layout="horizontal">
              {isLoading && 'loading...'}
              {!isLoading && SubPanel}
            </Form>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

function BrowserSettings() {

}
