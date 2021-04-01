import React from 'react';
import Animation from 'rc-animate';

const spinnerSvg =
  '<div class="s-spinner"><div size="small" class="s-bars"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 28 40" class="s-spinner--small"><path d="M0 0, l0 4, l0 -4" id="s-bar-y-path"></path> <rect width="4" height="34.3707" x="0" y="0" ry="2" rx="2" class="s-spinner__bar"><animate attributeName="opacity" values=".24; .08; .24" begin="0s" dur="1.2s" repeatCount="indefinite"></animate> <animate attributeName="height" values="40; 32; 40" begin="0s" dur="1.2s" repeatCount="indefinite"></animate> <!----> <animateMotion begin="0s" dur="1.2s" repeatCount="indefinite"><mpath xlink:href="#s-bar-y-path"></mpath></animateMotion></rect> <rect width="4" height="34.9627" x="12" y="0" ry="2" rx="2" class="s-spinner__bar"><animate attributeName="opacity" values=".24; .24; .24" begin="0s" dur="0.4s"></animate> <animate attributeName="opacity" values=".24; .08; .24" begin="0.4s" dur="1.2s" repeatCount="indefinite"></animate> <animate attributeName="height" values="40; 32; 40" begin="0.4s" dur="1.2s" repeatCount="indefinite"></animate> <!----> <animateMotion begin="0.4s" dur="1.2s" repeatCount="indefinite"><mpath xlink:href="#s-bar-y-path"></mpath></animateMotion></rect> <rect width="4" height="40" x="24" y="0" ry="2" rx="2" class="s-spinner__bar"><animate attributeName="opacity" values=".24; .24; .24" begin="0s" dur="0.8s"></animate> <animate attributeName="opacity" values=".24; .08; .24" begin="0.8s" dur="1.2s" repeatCount="indefinite"></animate> <animate attributeName="height" values="40; 32; 40" begin="0.8s" dur="1.2s" repeatCount="indefinite"></animate> <!----> <animateMotion begin="0.8s" dur="1.2s" repeatCount="indefinite"><mpath xlink:href="#s-bar-y-path"></mpath></animateMotion></rect></svg></div></div>';

export default function Spinner(props: { visible?: boolean } = {}) {
  const defaultProps = { visible: false };
  const p = { ...defaultProps, ...props };
  const color = 'var(--background)';

  const containerStyles: React.CSSProperties = {
    backgroundColor: color,
    position: 'absolute',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    zIndex: 1,
  };

  return (
    <Animation transitionName="ant-fade">
      {p.visible && (
        <div style={containerStyles}>
          <span
            style={{ visibility: p.visible ? 'visible' : 'hidden' }}
            dangerouslySetInnerHTML={{ __html: spinnerSvg }}
          ></span>
        </div>
      )}
    </Animation>
  );
}
