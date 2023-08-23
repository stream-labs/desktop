import { Space } from 'antd';
import React, { HTMLAttributes } from 'react';

interface IButtonGroupProps {
  align?: 'center' | 'end' | 'start' | 'baseline' | undefined;
  direction?: 'horizontal' | 'vertical' | undefined;
  size?: 'small' | 'middle' | 'large' | number | undefined;
  split?: React.ReactNode;
  wrap?: boolean;
}

export function ButtonGroup(p: HTMLAttributes<unknown> & IButtonGroupProps) {
  return (
    <div className={p?.className} style={{ ...p?.style, textAlign: 'right', marginBottom: '8px' }}>
      <Space
        align={p?.align ?? 'end'}
        direction={p?.direction}
        size={p?.size}
        split={p?.split}
        wrap={p?.wrap}
      >
        {p.children}
      </Space>
    </div>
  );
}
