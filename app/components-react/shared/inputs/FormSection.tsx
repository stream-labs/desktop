import React, { HTMLAttributes } from 'react';

export default function FormSection(p: { name: string } & HTMLAttributes<unknown>) {
  const attrs = {
    'data-role': 'form',
    'data-name': p.name,
  };
  return <div {...attrs}>{p.children}</div>;
}
