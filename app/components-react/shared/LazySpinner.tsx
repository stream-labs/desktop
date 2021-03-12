import React, { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import Animation from 'rc-animate';

export default function LazySpinner(props: { visible?: boolean } = {}) {
  const defaultProps = { delay: 300, transitionTime: 300 };
  const p = { ...defaultProps, ...props };
  const color = '#17242D'; // TODO: pick color from theme
  const [spinnerIsVisible, setSpinnerIsVisible] = useState(p.visible);

  useEffect(() => {
    setSpinnerIsVisible(p.visible);
    // setTimeout(() => setSpinnerIsVisible(p.visible), 200);
  }, [p.visible]);

  const stretchStyles: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    minWidth: '100px',
    minHeight: '150px',
  };

  const containerStyles: React.CSSProperties = {
    ...stretchStyles,
    background: color,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 1,
  };

  const spinnerStyles: React.CSSProperties = {
    marginTop: '100px',
    transition: 'opacity 0.5s ease-in 0.5s',
    opacity: spinnerIsVisible ? 1 : 0,
  };
  //
  // useEffect(() => {
  //   setTimeout(() => setVisible(true), p.delay);
  // }, []);

  return (
    <div>
      <Animation transitionName="ant-fade">
        {p.visible && (
          <div style={containerStyles}>
            <Spin size="large" style={spinnerStyles} />
          </div>
        )}
      </Animation>
    </div>
  );
}
