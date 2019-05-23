import electron, { WebviewTag } from 'electron';
import url from 'url';
import { Loading } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { UserService } from 'services/user';
import { Inject } from 'services/core/injector';
import { HostsService } from 'services/hosts';
import { GuestApiService } from 'services/guest-api';
import Utils from 'services/utils';
import { NavigationService } from 'services/navigation';

@Component({})
export default class CreatorSites extends TsxComponent<{}> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;
  @Inject() guestApiService: GuestApiService;
  @Inject() navigationService: NavigationService;

  $refs: {
    creatorSitesWebview: WebviewTag;
  };

  /**
   * SPAs loaded into webview can't rely on dom-ready for knowing when to show them
   * without flashes or loaders. This is part of an API for the site itself to notify SLOBS
   * when it's ready which contributes to a better UX.
   */
  remoteAppReady: boolean = false;

  mounted() {
    this.$refs.creatorSitesWebview.addEventListener('did-finish-load', () => {
      this.guestApiService.exposeApi(this.$refs.creatorSitesWebview.getWebContents().id, {
        remoteAppReady: async () => {
          this.remoteAppReady = true;
        },
        navigateToDashboard: async () => {
          this.navigationService.navigate('Dashboard');
        },
      });

      if (Utils.isDevMode()) {
        this.$refs.creatorSitesWebview.openDevTools();
      }
    });

    // Open StreamPress popups (like Publish opening new tab) in the user's default browser
    this.$refs.creatorSitesWebview.addEventListener('new-window', evt => {
      const { shell } = electron.remote;
      const protocol = url.parse(evt.url).protocol;
      if (protocol === 'http:' || protocol === 'https:') {
        shell.openExternal(evt.url);
      }
    });
  }

  get creatorSitesUrl() {
    return `https://beta.streamlabs.com/editor/slobs?auth_token=${this.userService.apiToken}`;
    //return `http://${this.hostsService.streamlabs}/editor/slobs/${this.userService.apiToken}`;
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
      opacity: this.remoteAppReady ? 1 : 0,
      width: '100%',
      transition: 'opacity 0.5s ease-in',
    };
  }

  get loadingStyles() {
    return {
      display: this.remoteAppReady ? 'none' : 'block',
    };
  }

  get loadingMessages() {
    return ['Loading resources...', 'Setting up layouts...', 'Loading files...'];
  }

  render(h: Function) {
    if (!this.userService.isLoggedIn) {
      return;
    }

    const ua = `SLOBS ${electron.remote.process.env.SLOBS_VERSION}`;

    return (
      <div>
        <div class="creator-sites-container" style={this.containerStyles}>
          <webview
            class="creator-sites"
            ref="creatorSitesWebview"
            src={this.creatorSitesUrl}
            style={this.webviewStyles}
            useragent={ua}
            preload="bundles/guest-api"
          />
          <div style={this.loadingStyles}>
            <Loading loadingStrs={this.loadingMessages} />
          </div>
        </div>
      </div>
    );
  }
}
