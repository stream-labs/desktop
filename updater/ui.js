// This is the entry point into the updater app

import Vue from 'vue';
import VueI18n from 'vue-i18n';
import UpdaterWindow from './UpdaterWindow.vue';
import electron from 'electron';
import './updater.css';

Vue.use(VueI18n);

const locale = electron.remote.app.getLocale();
const fallbackLocale = 'en-US';

const i18n = new VueI18n({
  locale,
  fallbackLocale,
  messages: {
    'en-US': {
      checking: {
        message: 'Checking for updates'
      },
      downloading: {
        message: 'Downloading version {version}'
      },
      installing: {
        message: 'Installing version {version}',
        description: 'This may take a few minutes. If you are having issues updating, please {linkText}',
        linkText: 'download a fresh installer.'
      },
      error: {
        message: 'Something went wrong',
        description: 'There was an error updating. Please {linkText}',
        linkText: 'download a fresh installer.'
      }
    },
    'ja': {
      checking: {
        message: 'アップデート情報を確認しています'
      },
      downloading: {
        message: 'バージョン{version}を{br}ダウンロードしています'
      },
      installing: {
        message: 'バージョン{version}を{br}インストールしています',
        description: 'この処理には数分かかる場合があります。{br}アップデートに問題が発生した場合は{br}{linkText}',
        linkText: '最新のインストーラーをダウンロードしてください。'
      },
      error: {
        message: '問題が発生しました',
        description: 'アップデートに失敗しました。{br}{linkText}',
        linkText: '最新のインストーラーをダウンロードしてください。'
      }
    }
  },
  silentTranslationWarn: true
});

document.addEventListener('DOMContentLoaded', () => {

  new Vue({
    el: '#app',
    i18n,
    render: createEl => {
      return createEl(UpdaterWindow);
    }
  });

});