import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from '../SceneSelector.vue';
import Mixer from '../Mixer.vue';
import Chat from '../Chat.vue';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import StreamingService from '../../services/streaming';
import { getPlatformService, IStreamInfo, Community } from '../../services/platforms';
import StudioFooter from '../StudioFooter.vue';
import { ScenesService } from '../../services/scenes';
import { Display, VideoService } from '../../services/video';
import { WindowsService } from '../../services/windows';
import { PerformanceService } from '../../services/performance';
import electron from 'electron';
import { ListInput } from '../shared/forms';
import { debounce, cloneDeep } from 'lodash';

const { webFrame, screen } = electron;

interface GameInput {
  name: string;
  value: string;
  options: object[];
}

interface CommunityInput {
  name: string;
  description: string;
  value: string;
  options: object[];
}


@Component({
  components: {
    SceneSelector,
    Mixer,
    Chat,
    StudioFooter,
    ListInput
  }
})
export default class Live extends Vue {
  @Inject()
  userService: UserService;

  @Inject()
  streamingService: StreamingService;

  @Inject()
  scenesService: ScenesService;

  @Inject()
  videoService: VideoService;

  @Inject()
  windowsService: WindowsService;

  @Inject()
  performanceService: PerformanceService;

  streamInfo: IStreamInfo = { status: 'Fetching Information', viewers: 0, game: 'Game' };

  streamCommunities: Community[] = [];

  tempStreamCommunities: Community[] = [];

  streamTitle: string = '';

  status: boolean = true;

  streamInfoInterval: number;

  obsDisplay: Display;

  $refs: {
    display: HTMLElement
  };

  debouncedGameSearch: (search: string) => void;

  debouncedCommunitySearch: (search: string) => void;

  updatingStreamInfo = false;

  updatingStreamCommunity = false;

  gameValues = {
    name: 'streamGame',
    value: 'My value',
    options: [
      { description: '', value: '' }
    ]
  };

  communityValues = {
    name: 'streamCommunity',
    value: 'My value',
    options: [
      { description: '', value: '' }
    ]
  };

  created() {
    this.debouncedGameSearch = debounce((search: string) => this.onGameSearchChange(search), 500);
    this.debouncedCommunitySearch = debounce((search: string) => this.onCommunitySearchChange(search), 500);
  }

  mounted() {
    this.fetchLiveStreamInfo();
    this.streamInfoInterval = window.setInterval(this.fetchLiveStreamInfo, 30 * 1000);

    this.obsDisplay = this.videoService.createDisplay();

    this.obsDisplay.setShoulddrawUI(false);

    this.onResize();

    window.addEventListener('resize', this.onResize);
  }

  beforeDestroy() {
    clearInterval(this.streamInfoInterval);

    window.removeEventListener('resize', this.onResize);
    this.obsDisplay.destroy();
  }

  onGameInput(gameInput: GameInput) {
    this.streamInfo.game = gameInput.value;
  }

  onCommunityInput(communityInput: CommunityInput) {
    if (this.streamCommunities.length < 3) {
      this.streamCommunities.push({name: communityInput.description, objectID: communityInput.value});
    }
  }

  onResize() {
    const display = this.$refs.display;
    const rect = display.getBoundingClientRect();
    const factor = this.windowsService.state.main.scaleFactor;

    this.obsDisplay.resize(
      rect.width * factor,
      rect.height * factor
    );

    this.obsDisplay.move(
      rect.left * factor,
      rect.top * factor
    );
  }

  isExpanded = false;

  expandOutput() {
    if(this.isExpanded) {
      this.isExpanded = false;
    } else {
      this.isExpanded = true;
      this.streamInfoExpanded = true;
      this.editingStreamTitle = false;
      this.editingStreamGame = false;
      this.editingStreamCommunities = false;
    }
  }

  streamInfoExpanded = true;

  expandStreamInfo() {
    this.streamInfoExpanded = true;
  }

  collapseStreamInfo() {
    this.streamInfoExpanded = false;
  }

  editingStreamTitle = false;

  editStreamTitle() {
    this.editingStreamTitle = true;
  }

  cancelStreamTitle() {
    this.editingStreamTitle = false;
  }

  updateStreamInfo(field: string) {
    if (this.updatingStreamInfo) return;
    this.updatingStreamInfo = true;

    const platform = this.userService.platform.type;
    const platformId = this.userService.platformId;
    const oauthToken = this.userService.platform.token;
    const service = getPlatformService(platform);

    let streamTitle = this.streamInfo.status;
    let streamGame = this.streamInfo.game;

    if (field === 'title') {
      streamTitle = this.streamTitle;
    }

    service.putStreamInfo(streamTitle, streamGame, platformId, this.userService.platform.token).then(status => {
      this.updatingStreamInfo = false;

      if (status) {
        this.streamInfo.status = this.streamTitle;
        this.editingStreamTitle = false;
        this.editingStreamGame = false;
      } else {
        this.streamInfo.status = 'Error';
        this.editingStreamTitle = false;
        this.editingStreamGame = false;
      }
    });
  }

  editingStreamGame = false;

  editStreamGame() {
    this.editingStreamGame = true;
  }

  searchingGames = false;

  onGameSearchChange(searchString: string) {
    if (searchString !== '') {
      this.searchingGames = true;
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);

      this.gameValues.options = [];

      service.searchGames(searchString).then(games => {
        this.searchingGames = false;
        if (games && games.length) {
          games.forEach(game => {
            this.gameValues.options.push({description: game.name, value: game.name});
          });
        }
      });
    }
  }

  cancelStreamGame() {
    this.editingStreamGame = false;
  }

  editingStreamCommunities = false;

  editStreamCommunities() {
    this.editingStreamCommunities = true;
    this.tempStreamCommunities = cloneDeep(this.streamCommunities);
  }

  searchingCommunities = false;

  onCommunitySearchChange(searchString: string) {
    if (searchString !== '') {
      this.searchingCommunities = true;
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);

      this.communityValues.options = [];

      service.searchCommunities(searchString).then(communities => {
        this.searchingCommunities = false;
        if (communities && communities.length) {
          communities.forEach(community => {
            this.communityValues.options.push({description: community.name, value: community.objectID});
          });
        }
      });
    }
  }

  updateStreamCommunities() {
    if (this.updatingStreamCommunity) return;
    this.updatingStreamCommunity = true;

    const communityIDs = this.streamCommunities.map(community => community.objectID);

    const platform = this.userService.platform.type;
    const platformId = this.userService.platformId;
    const oauthToken = this.userService.platform.token;
    const service = getPlatformService(platform);

    service.putStreamCommunities(communityIDs, platformId, oauthToken).then(status => {
      this.updatingStreamCommunity = false;
      if (status) {
        this.editingStreamCommunities = false;
      } else {
        this.editingStreamCommunities = false;
      }
    });
  }

  cancelStreamCommunities() {
    this.editingStreamCommunities = false;
    this.streamCommunities = cloneDeep(this.tempStreamCommunities);
  }

  removeCommunity(index: number) {
    this.streamCommunities.splice(index, 1);
  }


  fetchLiveStreamInfo() {
    //Avoid hitting Twitch API if user is not streaming
    if (this.streamingService.isStreaming) {
      const platform = this.userService.platform.type;
      const platformId = this.userService.platformId;
      const service = getPlatformService(platform);
      const oauthToken = this.userService.platform.token;

      service.fetchLiveStreamInfo(platformId, oauthToken).then(streamInfo => {
        this.streamInfo = streamInfo;
      });

      if (platform === 'twitch') {
        service.getStreamCommunities(platformId).then(communities => {
          this.streamCommunities = communities.map(community => {
            return { name: community.name, objectID: community._id };
          });
        });
      }
    }
  }

  //getters

  get recenteventsUrl() {
    return this.userService.widgetUrl('recent-events');
  }

  get streamStatus() {
    return this.streamInfo.status || 'Stream Offline';
  }

  get streamCCU() {
    return this.streamInfo.viewers;
  }

  get streamGame() {
    return this.streamInfo.game;
  }

  get cpuPercent() {
    return this.performanceService.state.CPU;
  }

  get frameRate() {
    return this.performanceService.state.frameRate.toFixed(2);
  }

  get platform() {
    return this.userService.platform.type;
  }

}
