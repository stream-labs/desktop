import React, { HTMLAttributes } from 'react';
import ExclamationCircleOutlined from '@ant-design/icons';

// TODO: add more types
type MessageType = 'warning' | 'info';

export default function Message(p: { type: MessageType } & HTMLAttributes<unknown>) {
  const type = p.type;
  const classProp = `ant-message-custom-content ant-message-${type}`;
  return (
    <div className={classProp}>
      {type === 'warning' && <ExclamationCircleOutlined color="orange" />} {p.children}
    </div>
  );
}
