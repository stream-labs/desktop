import { ICardProps } from '../components/shared/react-component-props';
import React, { useState, useEffect } from 'react';
import { Services } from './service-provider';
import { useVuex } from './hooks';
import ReactComponent from '../components/shared/ReactComponent';
// import { useServiceState } from './hooks/useServiceState';
// import { getResource } from '../app/services/core';
// import { PerformanceService } from '../app/app-services';
// import { Services } from './service-provider';

export default function Card(props: ICardProps) {
  const { CPU } = useVuex(() => ({ CPU: Services.PerformanceService.state.CPU }));

  return (
    <div>
      <h1>{props.title}</h1>
      <p>Hello world from React!</p>
      <p>CPU: {CPU}</p>
    </div>
  );
}

interface ICardState {
  CPU: number;
}

// export default class Card extends React.Component<ICardProps, ICardState> {
//   constructor(props: ICardProps) {
//     super(props);
//     this.state = { CPU: 0 };
//   }
//
//   componentDidMount() {
//     setInterval(() => {
//       this.setState({ CPU: Services.PerformanceService.state.CPU });
//     }, 2000);
//   }
//
//   render() {
//     return (
//       <div>
//         <h1>Class component </h1>
//         <h1>{this.props.title}</h1>
//         <p>Hello world from React!</p>
//         <p>CPU: {this.state.CPU}</p>
//       </div>
//     );
//   }
// }

window['helloIncluded'] = true;
