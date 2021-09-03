import { Col, Layout, Row } from 'antd';
import React from 'react';
import { useWidget } from './useWidget';
import Display from "../shared/Display";

const { Content, Sider } = Layout;

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
    <Layout style={{ height: '100%' }}>
      <Row>
        <Col>
          <Sider>{MainPanel}</Sider>
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
