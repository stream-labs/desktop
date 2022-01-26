import { Component } from 'vue-property-decorator';
import BaseElement from './BaseElement';
import { BrowserView } from 'components/shared/ReactComponentList';
import { LayoutService, ELayoutElement } from 'services/layout';
import { Inject } from 'services/core';
import { UserService } from 'services/user';

@Component({})
export default class Display extends BaseElement {
  @Inject() layoutService: LayoutService;
  @Inject() userService: UserService;

  mins = { x: 0, y: 0 };

  get url() {
    const src = this.layoutService.views.currentTab.slottedElements[ELayoutElement.Browser].src;
    if (!/^https?\:\/\//.test(src)) {
      return `https://${src}`;
    }
    return src;
  }

  get partition() {
    return this.userService.isLoggedIn ? this.userService.views.auth.partition : undefined;
  }

  get element() {
    return (
      <BrowserView
        componentProps={{
          src: this.url,
          options: { webPreferences: { partition: this.partition, contextIsolation: true } },
        }}
      />
    );
  }

  render() {
    return this.renderElement();
  }
}
