import React, { useRef, useEffect } from 'react';
import VueTestComponent from '../../components/shared/VueTestComponent';

interface IProps {
  componentClass: Function;
  componentProps: any;
}

function VueComponent(props: IProps) {
  const renderArea = window['vueRenderAreaForReact'];
  const containerRef = useRef(null);
  useEffect(() => {
    const id = renderArea.createComponent(props.componentClass, props.componentProps);
    return () => {
      renderArea.destroyComponent(id);
    };
  });
  return (<div ref={containerRef} className="vue-component-wrap"></div>);
}
