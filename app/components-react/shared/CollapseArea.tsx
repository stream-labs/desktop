import React, { HTMLAttributes, RefObject, useEffect, useRef } from 'react';
import { Collapse } from 'antd';
import { findDOMNode } from 'react-dom';

export function CollapseArea(p: { isExpanded: boolean } & HTMLAttributes<unknown>) {
  const ref: RefObject<HTMLDivElement> = useRef(null);

  useEffect(() => {
    const $div: Element = findDOMNode(ref.current);
    ($div.querySelector('.ant-collapse-header') as HTMLElement).style.display = 'none';
    const $item = $div.querySelector('.ant-collapse-item') as HTMLElement;
    $item.style.backgroundColor = 'transparent';
    const $contentBox = $div.querySelector('.ant-collapse-content-box') as HTMLElement;
    if ($contentBox) $contentBox.style.padding = '0';
  });

  return (
    <div ref={ref}>
      <Collapse activeKey={Number(p.isExpanded)} ghost={true} bordered={false}>
        <Collapse.Panel key={1} header={''}>
          {p.children}
        </Collapse.Panel>
      </Collapse>
    </div>
  );
}
