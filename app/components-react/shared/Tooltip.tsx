import React, { CSSProperties, PropsWithChildren, HTMLAttributes } from 'react';
import { Tooltip } from 'antd';
import styles from './Tooltip.m.less';
import cx from 'classnames';

type TTipPosition =
  | 'topLeft'
  | 'top'
  | 'topRight'
  | 'leftTop'
  | 'left'
  | 'leftBottom'
  | 'bottomLeft'
  | 'bottom'
  | 'bottomRight'
  | 'rightTop'
  | 'right'
  | 'rightBottom';

interface ITooltipTipProps {
  title: string;
  className?: HTMLAttributes<HTMLElement> | string;
  style?: CSSProperties;
  lightShadow?: boolean;
  placement?: TTipPosition;
  content?: HTMLElement | boolean;
}

export default function ToolTip(props: PropsWithChildren<ITooltipTipProps>) {
  const { title, className, style, lightShadow, placement = 'bottom', content } = props;

  return (
    <div className={cx(styles.tooltipWrapper, className)}>
      <div className={cx(styles.tooltipArrow)} />
      {lightShadow ? (
        <Tooltip
          className={cx(lightShadow && styles.lightShadow)}
          placement={placement}
          title={title}
          style={style}
          getPopupContainer={triggerNode => triggerNode}
        >
          {content}
          {{ ...props }.children}
        </Tooltip>
      ) : (
        <Tooltip
          className={cx(lightShadow && styles.lightShadow)}
          placement={placement}
          title={title}
          style={style}
        >
          {content}
          {{ ...props }.children}
        </Tooltip>
      )}
    </div>
  );
}
