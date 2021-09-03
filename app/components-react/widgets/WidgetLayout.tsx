import { Col, Collapse, Layout, Row } from 'antd';
import React from 'react';
import { useWidget } from './useWidget';
import Display from '../shared/Display';
import css from './WidgetLayout.m.less';
import { $t } from '../../services/i18n';
import Form from '../shared/inputs/Form';
import { ListInput, SliderInput } from '../shared/inputs';

const { Content, Sider } = Layout;
const { Panel } = Collapse;

// export function WidgetLayout(p: { MainPanel: () => JSX.Element; SubPanel: () => JSX.Element }) {
//   const { selectedTab, previewSourceId } = useWidget();
//
//   return (
//     <Layout style={{ height: '100%' }}>
//       <Row>
//         <Col>
//           <Sider>
//             <p.MainPanel />
//           </Sider>
//         </Col>
//         <Col>
//           <Sider collapsible collapsedWidth={0} width={250} trigger={null} collapsed={!selectedTab}>
//             <p.SubPanel />
//           </Sider>
//         </Col>
//       </Row>
//
//       <Layout>
//         <Content>
//           <div>Display for {previewSourceId}</div>
//         </Content>
//       </Layout>
//     </Layout>
//   );
// }

export function WidgetLayout(p: { children: [React.ReactNode, React.ReactNode] }) {
  const { selectedTab, previewSourceId, isPreviewVisible } = useWidget();
  const [MainPanel, SubPanel] = p.children;

  return (
    <Layout style={{ height: '100%' }} className={css.widgetLayout}>
      <Row>
        <Col style={{ borderRight: '1px solid var(--border)' }}>
          <Sider width={250}>
            {MainPanel}
          </Sider>
        </Col>
        <Col>
          <Sider collapsible collapsedWidth={0} width={250} trigger={null} collapsed={!selectedTab}>
            {SubPanel}
          </Sider>
        </Col>
      </Row>

      <Layout>
        <Content>
          <Display sourceId={previewSourceId} isVisible={isPreviewVisible}></Display>
        </Content>
      </Layout>
    </Layout>
  );
}

// function SideLayout() {
//
//   return (
//     <Layout style={{ height: '100%' }} className={css.widgetLayout}>
//       <Row>
//         <Col style={{ borderRight: '1px solid var(--border)' }}>
//           <Sider width={250}>
//             {MainPanel}
//           </Sider>
//         </Col>
//         <Col>
//           <Sider collapsible collapsedWidth={0} width={250} trigger={null} collapsed={!selectedTab}>
//             {SubPanel}
//           </Sider>
//         </Col>
//       </Row>
//
//       <Layout>
//         <Content>
//           <Display sourceId={previewSourceId} isVisible={isPreviewVisible}></Display>
//         </Content>
//       </Layout>
//     </Layout>
//   );
// }
