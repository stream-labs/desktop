import React, { CSSProperties } from 'react';
import { Services } from '../service-provider';
import { useVuex } from 'components-react/hooks';
import cx from 'classnames';

type TUltraIcon = 'badge' | 'day' | 'night' | 'simple';

interface IUltraIcon {
  type?: TUltraIcon | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The ultra icon has been added as a font but use this svg icon component
 * when displaying the icon with multicolor styling.
 */
export default function UltraIcon({ type, className, style }: IUltraIcon) {
  const { isDarkTheme } = useVuex(() => ({
    isDarkTheme: Services.CustomizationService.views.isDarkTheme,
  }));

  if (type === 'badge') {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cx('ultra-icon', className)}
        style={style}
      >
        <circle cx="12" cy="12" r="12" fill="url(#paint0_linear_18321_17211)" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18.6659 7.57664C18.2441 6.94234 17.3881 6.77004 16.7538 7.19179C16.1195 7.61354 15.9472 8.46963 16.3689 9.10393C16.9203 9.93318 17.2416 10.9274 17.2416 12.0009C17.2416 14.8953 14.8953 17.2416 12.0009 17.2416C10.9274 17.2416 9.93318 16.9203 9.10393 16.3689C8.46963 15.9472 7.61354 16.1195 7.19179 16.7538C6.77004 17.3881 6.94234 18.2441 7.57664 18.6659C8.84439 19.5088 10.3674 20 12.0009 20C16.4187 20 20 16.4187 20 12.0009C20 10.3674 19.5088 8.84439 18.6659 7.57664ZM11.9993 14.206C13.218 14.206 14.206 13.218 14.206 11.9993C14.206 10.7806 13.218 9.7926 11.9993 9.7926C10.7806 9.7926 9.7926 10.7806 9.7926 11.9993C9.7926 13.218 10.7806 14.206 11.9993 14.206Z"
          fill="#09161D"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.999 6.75839C9.10471 6.75839 6.75839 9.10471 6.75839 11.999C6.75839 12.7608 6.1409 13.3782 5.37919 13.3782C4.61749 13.3782 4 12.7608 4 11.999C4 7.5813 7.5813 4 11.999 4C12.7608 4 13.3782 4.61749 13.3782 5.37919C13.3782 6.1409 12.7608 6.75839 11.999 6.75839Z"
          fill="#09161D"
        />
        <defs>
          <linearGradient
            id="paint0_linear_18321_17211"
            x1="3.52196"
            y1="10.0747"
            x2="23.2452"
            y2="23.1449"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2DE8B0" />
            <stop offset="0.488027" stopColor="#CBE953" />
            <stop offset="0.758621" stopColor="#FFAB48" />
            <stop offset="1" stopColor="#FF5151" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (type === 'day' || (!type && !isDarkTheme)) {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cx('ultra-icon', 'ultra-icon-day', className)}
        style={style}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.2921 3.24162C12.9099 2.66674 12.134 2.51058 11.5591 2.89282C10.9842 3.27507 10.828 4.05096 11.2103 4.62584C11.71 5.37741 12.0012 6.27854 12.0012 7.25147C12.0012 9.87468 9.87468 12.0012 7.25147 12.0012C6.27854 12.0012 5.37741 11.71 4.62584 11.2103C4.05096 10.828 3.27507 10.9842 2.89282 11.5591C2.51058 12.134 2.66674 12.9099 3.24162 13.2921C4.39061 14.0561 5.77096 14.5012 7.25147 14.5012C11.2554 14.5012 14.5012 11.2554 14.5012 7.25147C14.5012 5.77096 14.0561 4.39061 13.2921 3.24162ZM7.25 9.25C8.35457 9.25 9.25 8.35457 9.25 7.25C9.25 6.14543 8.35457 5.25 7.25 5.25C6.14543 5.25 5.25 6.14543 5.25 7.25C5.25 8.35457 6.14543 9.25 7.25 9.25Z"
          fill="url(#paint0_linear_1_5)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.24974 2.5C4.62653 2.5 2.5 4.62653 2.5 7.24974C2.5 7.9401 1.94036 8.49974 1.25 8.49974C0.559644 8.49974 0 7.9401 0 7.24974C0 3.24582 3.24582 0 7.24974 0C7.9401 0 8.49974 0.559644 8.49974 1.25C8.49974 1.94036 7.9401 2.5 7.24974 2.5Z"
          fill="#09161D"
        />
        <defs>
          <linearGradient
            id="paint0_linear_1_5"
            x1="4.41781"
            y1="7.64438"
            x2="14.1296"
            y2="14.0801"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2DE8B0" />
            <stop offset="0.488027" stopColor="#CBE953" />
            <stop offset="0.758621" stopColor="#FFAB48" />
            <stop offset="1" stopColor="#FF5151" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (type === 'night' || (!type && isDarkTheme)) {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cx('ultra-icon', 'ultra-icon-night', className)}
        style={style}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.2921 3.24162C12.9099 2.66674 12.134 2.51058 11.5591 2.89282C10.9842 3.27507 10.828 4.05096 11.2103 4.62584C11.71 5.37741 12.0012 6.27854 12.0012 7.25147C12.0012 9.87468 9.87468 12.0012 7.25147 12.0012C6.27854 12.0012 5.37741 11.71 4.62584 11.2103C4.05096 10.828 3.27507 10.9842 2.89282 11.5591C2.51058 12.134 2.66674 12.9099 3.24162 13.2921C4.39061 14.0561 5.77096 14.5012 7.25147 14.5012C11.2554 14.5012 14.5012 11.2554 14.5012 7.25147C14.5012 5.77096 14.0561 4.39061 13.2921 3.24162ZM7.25 9.25C8.35457 9.25 9.25 8.35457 9.25 7.25C9.25 6.14543 8.35457 5.25 7.25 5.25C6.14543 5.25 5.25 6.14543 5.25 7.25C5.25 8.35457 6.14543 9.25 7.25 9.25Z"
          fill="url(#paint0_linear_0_1)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.24974 2.5C4.62653 2.5 2.5 4.62653 2.5 7.24974C2.5 7.9401 1.94036 8.49974 1.25 8.49974C0.559644 8.49974 0 7.9401 0 7.24974C0 3.24582 3.24582 0 7.24974 0C7.9401 0 8.49974 0.559644 8.49974 1.25C8.49974 1.94036 7.9401 2.5 7.24974 2.5Z"
          fill="white"
        />
        <defs>
          <linearGradient
            id="paint0_linear_0_1"
            x1="4.41781"
            y1="7.64438"
            x2="14.1296"
            y2="14.0801"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2DE8B0" />
            <stop offset="0.488027" stopColor="#CBE953" />
            <stop offset="0.758621" stopColor="#FFAB48" />
            <stop offset="1" stopColor="#FF5151" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (type === 'simple') {
    return (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        className={cx('ultra-icon', className)}
        style={style}
      >
        <path d="M28.356 6.915c-0.815-1.226-2.471-1.56-3.697-0.744s-1.56 2.471-0.744 3.697c1.066 1.603 1.687 3.526 1.687 5.601 0 5.596-4.537 10.133-10.133 10.133-2.076 0-3.998-0.621-5.601-1.687-1.226-0.816-2.882-0.482-3.697 0.744s-0.482 2.882 0.744 3.697c2.451 1.63 5.396 2.579 8.554 2.579 8.542 0 15.466-6.924 15.466-15.466 0-3.158-0.95-6.103-2.579-8.554zM15.467 19.733c2.356 0 4.267-1.91 4.267-4.267s-1.91-4.267-4.267-4.267c-2.356 0-4.267 1.91-4.267 4.267s1.91 4.267 4.267 4.267zM15.466 5.333c-5.596 0-10.133 4.537-10.133 10.133 0 1.473-1.194 2.667-2.667 2.667s-2.667-1.194-2.667-2.667c0-8.542 6.924-15.466 15.466-15.466 1.473 0 2.667 1.194 2.667 2.667s-1.194 2.667-2.667 2.667z"></path>
      </svg>
    );
  }

  // return night icon by default
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cx('ultra-icon', className)}
      style={style}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.2921 3.24162C12.9099 2.66674 12.134 2.51058 11.5591 2.89282C10.9842 3.27507 10.828 4.05096 11.2103 4.62584C11.71 5.37741 12.0012 6.27854 12.0012 7.25147C12.0012 9.87468 9.87468 12.0012 7.25147 12.0012C6.27854 12.0012 5.37741 11.71 4.62584 11.2103C4.05096 10.828 3.27507 10.9842 2.89282 11.5591C2.51058 12.134 2.66674 12.9099 3.24162 13.2921C4.39061 14.0561 5.77096 14.5012 7.25147 14.5012C11.2554 14.5012 14.5012 11.2554 14.5012 7.25147C14.5012 5.77096 14.0561 4.39061 13.2921 3.24162ZM7.25 9.25C8.35457 9.25 9.25 8.35457 9.25 7.25C9.25 6.14543 8.35457 5.25 7.25 5.25C6.14543 5.25 5.25 6.14543 5.25 7.25C5.25 8.35457 6.14543 9.25 7.25 9.25Z"
        fill="url(#paint0_linear_1_5)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.24974 2.5C4.62653 2.5 2.5 4.62653 2.5 7.24974C2.5 7.9401 1.94036 8.49974 1.25 8.49974C0.559644 8.49974 0 7.9401 0 7.24974C0 3.24582 3.24582 0 7.24974 0C7.9401 0 8.49974 0.559644 8.49974 1.25C8.49974 1.94036 7.9401 2.5 7.24974 2.5Z"
        fill="#09161D"
      />
      <defs>
        <linearGradient
          id="paint0_linear_1_5"
          x1="4.41781"
          y1="7.64438"
          x2="14.1296"
          y2="14.0801"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2DE8B0" />
          <stop offset="0.488027" stopColor="#CBE953" />
          <stop offset="0.758621" stopColor="#FFAB48" />
          <stop offset="1" stopColor="#FF5151" />
        </linearGradient>
      </defs>
    </svg>
  );
}
