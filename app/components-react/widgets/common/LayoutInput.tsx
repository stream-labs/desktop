import React from 'react';
import { CardInput, InputComponent } from '../../shared/inputs';
import { TCardInputProps } from '../../shared/inputs/CardInput';
import { Services } from '../../service-provider';
import { getDefined } from '../../../util/properties-type-guards';

type TLayoutInputProps = Omit<TCardInputProps<'above' | 'banner' | 'side'>, 'options'>;

export const LayoutInput = InputComponent((p: TLayoutInputProps) => {
  const nightMode = Services.CustomizationService.isDarkTheme ? 'night' : 'day';
  const options = [
    {
      label: require(`../../../../media/images/alert-box/layout-bottom-${nightMode}.png`),
      value: 'above',
    },
    {
      label: require(`../../../../media/images/alert-box/layout-over-${nightMode}.png`),
      value: 'banner',
    },
    {
      label: require(`../../../../media/images/alert-box/layout-side-${nightMode}.png`),
      value: 'side',
    },
  ];

  const value = getDefined(p.value);
  return <CardInput {...p} value={value} options={options} />;
});
