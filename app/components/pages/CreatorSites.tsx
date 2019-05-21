import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'services/core/injector';

@Component({})
export default class CreatorSites extends TsxComponent<{}> {
  @Inject() userService: UserService;

  get creatorSitesUrl() {
    return this.userService.dashboardUrl('editor');
  }

  get containerStyles() {
    return {
      position: 'absolute',
      top: '-1px',
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  get webviewStyles() {
    return {
      position: 'absolute',
      top: '-2px',
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  render(h: Function) {
    return (
      <div>
        <div class="creator-sites-container" style={this.containerStyles}>
          {this.userService.isLoggedIn() ? (
            <webview
              class="creator-sites"
              ref="creatorSitesWebview"
              src={this.creatorSitesUrl}
              style={this.webviewStyles}
            />
          ) : (
            undefined
          )}
        </div>
      </div>
    );
  }
}
