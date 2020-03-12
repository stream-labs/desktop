import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import styles from './WelcomeToPrime.m.less';
import { $t } from 'services/i18n';
import { Inject } from 'services/core';
import { NavigationService, TAppPage } from 'services/navigation';
import { WindowsService } from 'services/windows';
import { ToggleInput } from 'components/shared/inputs/inputs';
import { CustomizationService } from 'services/customization';

@Component({})
export default class WelcomeToPrime extends TsxComponent {
  @Inject() navigationService: NavigationService;
  @Inject() windowsService: WindowsService;
  @Inject() customizationService: CustomizationService;

  panelData = [
    {
      title: $t('Overlay, Widget, and Site Themes'),
      icon: 'icon-themes',
      description: $t(
        "Fully customize your stream and your website to represent your brand; or pick from thousands of our pre-made themes. Either way, your stream will look amazing and it's all included with Prime.",
      ),
      link: 'BrowseOverlays',
      button: $t('View Themes'),
      img: 'prime-themes.png',
    },
    {
      title: $t('Every App is FREE'),
      icon: 'icon-store',
      description: $t(
        "We've curated a list of diverse and feature rich applications to give you more control, automation, better analytics, and new ways to interact with your audience.",
      ),
      link: 'PlatformAppStore',
      button: $t('Browse Apps'),
      img: 'prime-apps.png',
    },
  ];

  navigate(link: TAppPage) {
    this.navigationService.navigate(link);
    this.windowsService.closeChildWindow();
  }

  get theme() {
    return this.customizationService.currentTheme;
  }

  toggleTheme() {
    if (this.theme === 'prime-dark') {
      return this.customizationService.setTheme('night-theme');
    }
    if (this.theme === 'night-theme') {
      return this.customizationService.setTheme('prime-dark');
    }
    if (this.theme === 'prime-light') {
      return this.customizationService.setTheme('day-theme');
    }
    if (this.theme === 'day-theme') {
      return this.customizationService.setTheme('prime-light');
    }
  }

  panel(panel: Dictionary<string>) {
    return (
      <div class={styles.panel}>
        <h2 class={styles.subtitle}>
          <i class={cx(panel.icon, styles.icon)} />
          {panel.title}
        </h2>
        <p>{panel.description}</p>
        <img src={require(`../../../media/images/${panel.img}`)} />
        <button class="button button--action" onClick={() => this.navigate(panel.link as TAppPage)}>
          {panel.button}
        </button>
      </div>
    );
  }

  render() {
    return (
      <div class={styles.container}>
        <h1 class={styles.title}>{$t('Welcome to Prime!')}</h1>
        <p>{$t("We've picked out a few Prime benefits to get you started:")}</p>
        <div class={styles.panelContainer}>{this.panelData.map(this.panel)}</div>
        <p class={styles.themeToggle}>
          {$t("We've added a new UI theme exclusive to Prime members:")}
          <span>{$t('Classic Theme')}</span>
          <ToggleInput value={/prime/.test(this.theme)} onInput={() => this.toggleTheme()} />
          <span>{$t('Prime Theme')}</span>
        </p>
      </div>
    );
  }
}
