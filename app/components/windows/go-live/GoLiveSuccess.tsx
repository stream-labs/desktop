// import TsxComponent from 'components/tsx-component';
// import { Inject } from 'services/core';
// import { StreamingService, TGoLiveChecklistItemState } from 'services/streaming';
// import { WindowsService } from '../../../services/windows';
// import { $t } from 'services/i18n';
// import { Component } from 'vue-property-decorator';
// import styles from './GoLive.m.less';
// import cx from 'classnames';
// import { YoutubeService } from '../../../services/platforms/youtube';
// import { getPlatformService, TPlatform } from '../../../services/platforms';
// import electron from 'electron';
// import Utils from '../../../services/utils';
// import { Twitter } from '../../Twitter';
// import { TwitterService } from '../../../services/integrations/twitter';
//
// /**
//  * Shows
//  */
// @Component({})
// export default class GoLiveSuccess extends TsxComponent<{}> {
//   @Inject() private streamingService: StreamingService;
//   @Inject() private windowsService: WindowsService;
//   @Inject() private twitterService: TwitterService;
//
//   private copyToClipboard(url: string) {
//     Utils.copyToClipboard(url);
//     this.$toasted.show($t('Copied to your clipboard'), {
//       position: 'bottom-center',
//       duration: 1000,
//       singleton: true,
//     });
//   }
//
//   private get view() {
//     return this.streamingService.views;
//   }
//
//   private get title() {
//     return this.view.commonFields.title;
//   }
//
//   private openLink(url: string) {
//     electron.remote.shell.openExternal(url);
//   }
//
//   private get links() {
//     return this.view.enabledPlatforms.map(
//       platform => getPlatformService(platform).state.streamPageUrl,
//     );
//   }
//
//   private get streamInfoText(): string {
//     return `${this.title}\n${this.links.join('\n')}`;
//   }
//
//   private copyLinks() {
//     this.copyToClipboard(this.streamInfoText);
//   }
//
//   private openLinks() {
//     this.links.forEach(url => this.openLink(url));
//   }
//
//   private render() {
//     return (
//       <div class={styles.successContainer}>
//         <h1>{$t("You're live!")}</h1>
//
//         {/* LINKS LIST */}
//         <div class={cx('section', styles.linksContainer)}>
//           <p style={{ fontSize: '16px' }}> {$t('Your links')}</p>
//           <table class={styles.streamLinks}>
//             {this.view.enabledPlatforms.map(platform => {
//               const service = getPlatformService(platform);
//               const name = service.displayName;
//               const url = service.state.streamPageUrl;
//               return (
//                 <tr>
//                   <td>
//                     <strong>{name}</strong>
//                   </td>
//                   <td>
//                     <a onclick={() => this.openLink(url)}>{url}</a>
//                     <a onclick={() => this.copyToClipboard(url)}>{$t('Copy')}</a>
//                   </td>
//                 </tr>
//               );
//             })}
//           </table>
//           <div class={styles.copyLinksButtons}>
//             <a onclick={() => this.copyLinks()}>{$t('Copy Links')}</a>
//             <a onclick={() => this.openLinks()}>{$t('Open Links')}</a>
//           </div>
//         </div>
//
//         {/* TWITTER */}
//         {this.twitterService.isEnabled && (
//           <Twitter
//             style={{ width: '750px' }}
//             streamTitle={this.view.commonFields.title}
//             value={this.streamInfoText}
//           />
//         )}
//       </div>
//     );
//   }
// }
