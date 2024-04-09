import antdNightTheme from './night-theme.lazy.less?raw';
import antdDayTheme from './day-theme.lazy.less?raw';
import antdPrimeDark from './prime-dark.lazy.less?raw';
import antdPrimeLight from './prime-light.lazy.less?raw';
import uuid from 'uuid/v4';

/**
 * Small shim to do the same thing as webpack's style-loader
 * with the `lazyStyleTag` option.
 * @param css String containing css
 * @returns Object with `use` and `unuse` functions
 */
function createLazyScript(css: string) {
  const id = uuid();

  return {
    use() {
      const styleTag = document.createElement('style');
      styleTag.id = id;
      styleTag.innerHTML = css;
      document.head.appendChild(styleTag);
    },

    unuse() {
      const styleTag = document.getElementById(id);
      styleTag.remove();
    },
  };
}

export default {
  ['night-theme']: createLazyScript(antdNightTheme),
  ['day-theme']: createLazyScript(antdDayTheme),
  ['prime-dark']: createLazyScript(antdPrimeDark),
  ['prime-light']: createLazyScript(antdPrimeLight),
};
