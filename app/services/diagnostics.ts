/*global SLOBS_BUNDLE_ID*/

import { InitAfter, Inject, mutation, PersistentStatefulService } from 'services/core';
import { EEncoderFamily, OutputSettingsService, SettingsService } from './settings';
import * as cp from 'child_process';
import prettyBytes from 'pretty-bytes';
import Utils from './utils';
import os from 'os';
import { EDeviceType, HardwareService, IDevice } from './hardware';
import { ScenesService } from './scenes';
import { UserService } from './user';
import { SourceFiltersService } from './source-filters';
import { StreamingService } from './api/external-api/streaming';
import { EStreamingState } from './streaming';
import Vue from 'vue';
import { PerformanceService } from './performance';
import { jfetch } from 'util/requests';
import { CacheUploaderService } from './cache-uploader';
import { AudioService } from './audio';
import { getOS, OS } from 'util/operating-systems';

interface IStreamDiagnosticInfo {
  startTime: number;
  endTime?: number;
  pctSkipped?: number;
  pctLagged?: number;
  pctDropped?: number;
  avgFps?: number;
  avgCpu?: number;
}

interface IDiagnosticsServiceState {
  streams: IStreamDiagnosticInfo[];
}

/**
 * Accumulator for keeping a running average of values
 * without keeping all samples in memory.
 */
class Accumulator {
  public average = 0;
  public nSamples = 0;
  public lastValue: number = null;

  sample(val: number) {
    this.lastValue = val;
    this.average = (this.average * this.nSamples + val) / (this.nSamples + 1);
    this.nSamples++;
  }
}

const STREAM_HISTORY_LENGTH = 5;
const STATS_FLUSH_INTERVAL = 60 * 1000;

class Section {
  str = '';

  constructor(title: string, data: object | string) {
    this.wl('-'.repeat(title.length + 4));
    this.wl(`| ${title} |`);
    this.wl('-'.repeat(title.length + 4));
    this.wl();

    if (typeof data === 'object') {
      this.printObj(data);
    } else {
      this.wl(data);
    }

    this.wl();
  }

  private printObj(data: object, indent = 0, itemInd?: number) {
    if (Array.isArray(data)) {
      data.forEach((item, i) => {
        if (typeof item === 'object' && item != null) {
          this.printObj(item, indent, i + 1);
        } else {
          this.wl(`${' '.repeat(indent)}${i + 1}. ${item ?? ''}`);
        }
      });

      return;
    }

    Object.keys(data).forEach((key, i) => {
      let prefix = ' '.repeat(indent);

      if (itemInd != null) {
        if (i === 0) {
          prefix += `${itemInd}. `;
        } else {
          prefix += '   ';
        }
      }

      const value = data[key] as unknown;

      if (typeof value === 'object' && value != null) {
        this.wl(`${prefix}${key}:`);
        this.printObj(value, indent + (itemInd != null ? 5 : 2));
      } else {
        this.wl(`${prefix}${key}: ${value ?? ''}`);
      }
    });
  }

  wl(line = '') {
    this.str += `${line}\n`;
  }

  toString() {
    return this.str;
  }
}

/**
 * Responsible for generating a diagnostic report that can be used
 * to diagnose issues such as common misconfigurations. This report
 * is only generated on-demand (generally while receiving tech support)
 * and is never collected or generated automatically.
 */
@InitAfter('StreamingService')
export class DiagnosticsService extends PersistentStatefulService<IDiagnosticsServiceState> {
  @Inject() settingsService: SettingsService;
  @Inject() outputSettingsService: OutputSettingsService;
  @Inject() hardwareService: HardwareService;
  @Inject() scenesService: ScenesService;
  @Inject() userService: UserService;
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() streamingService: StreamingService;
  @Inject() performanceService: PerformanceService;
  @Inject() cacheUploaderService: CacheUploaderService;
  @Inject() audioService: AudioService;

  static defaultState: IDiagnosticsServiceState = {
    streams: [],
  };

  problems: string[];

  accumulators: {
    skipped?: Accumulator;
    lagged?: Accumulator;
    dropped?: Accumulator;
    fps?: Accumulator;
    cpu?: Accumulator;
  } = {};

  streaming = false;

  init() {
    super.init();

    this.streamingService.streamingStatusChange.subscribe(state => {
      if (state === EStreamingState.Live) {
        if (this.streaming) return;

        this.streaming = true;

        this.ADD_STREAM({ startTime: Date.now() });

        this.accumulators.skipped = new Accumulator();
        this.accumulators.lagged = new Accumulator();
        this.accumulators.dropped = new Accumulator();
        this.accumulators.fps = new Accumulator();
        this.accumulators.cpu = new Accumulator();
      }

      if (state === EStreamingState.Offline) {
        this.saveAccumulators();
        this.UPDATE_STREAM({ endTime: Date.now() });
        this.streaming = false;
        this.accumulators = {};
      }
    });

    this.performanceService.statisticsUpdated.subscribe(stats => {
      if (!this.streaming) return;

      this.accumulators.skipped.sample(stats.percentageSkippedFrames);
      this.accumulators.lagged.sample(stats.percentageLaggedFrames);
      this.accumulators.dropped.sample(stats.percentageDroppedFrames);
      this.accumulators.cpu.sample(stats.CPU);
      this.accumulators.fps.sample(stats.frameRate);
    });

    setInterval(() => {
      // Flush stats to persistent storage every 60 seconds.
      // This means we have relatively up to date stats even in
      // the event of a crash.
      this.saveAccumulators();
    }, STATS_FLUSH_INTERVAL);
  }

  private saveAccumulators() {
    if (!this.streaming) return;

    this.UPDATE_STREAM({
      pctSkipped: this.accumulators.skipped.lastValue,
      pctLagged: this.accumulators.lagged.lastValue,
      pctDropped: this.accumulators.dropped.lastValue,
      avgFps: this.accumulators.fps.average,
      avgCpu: this.accumulators.cpu.average,
    });
  }

  async generateReport() {
    this.problems = [];
    const top = await this.generateTopSection();
    const user = this.generateUserSection();
    const system = this.generateSystemSection();
    const video = this.generateVideoSection();
    const output = this.generateOutputSection();
    const audio = this.generateAudioSection();
    const devices = this.generateDevicesSection();
    const scenes = this.generateScenesSection();
    const streams = this.generateStreamsSection();

    // Problems section needs to be generated last, because it relies on the
    // problems array that all other sections add to.
    const problems = this.generateProblemsSection();

    const report = [top, problems, user, system, streams, video, output, audio, devices, scenes];

    return report.join('');
  }

  async uploadReport() {
    const formData = new FormData();
    formData.append('content', await this.generateReport());

    return jfetch<{ success: boolean; report_code: string }>(
      'https://streamlabs.com/api/v6/desktop/reports',
      {
        method: 'POST',
        body: formData,
      },
    );
  }

  private logProblem(problem: string) {
    this.problems.push(problem);
  }

  private async generateTopSection() {
    // All diagnostic reports include a cache upload
    const cacheId = await this.cacheUploaderService.uploadCache();

    return new Section('Streamlabs Desktop Diagnostic Report', {
      Version: Utils.env.SLOBS_VERSION,
      Bundle: SLOBS_BUNDLE_ID,
      Date: new Date().toString(),
      Cache: cacheId,
    });
  }

  private generateUserSection() {
    const title = 'User';

    if (this.userService.views.isLoggedIn) {
      return new Section(title, {
        'User Id': this.userService.state.userId,
        'Logged-In Platform': {
          Username: this.userService.views.platform.username,
          Platform: this.userService.views.platform.type,
        },
        'Connected Platforms': Object.keys(this.userService.views.platforms).map(p => {
          return {
            Username: this.userService.views.platforms[p].username,
            Platform: p,
          };
        }),
      });
    } else {
      return new Section(title, 'User is not logged in');
    }
  }

  private generateVideoSection() {
    const settings = this.settingsService.views.values;
    const fpsObj = { Type: settings.Video.FPSType };

    if (fpsObj.Type === 'Common FPS Values') {
      fpsObj['Value'] = settings.Video.FPSCommon;
    } else if (fpsObj.Type === 'Integer FPS Value') {
      fpsObj['Value'] = settings.Video.FPSInt;
    } else if (fpsObj.Type === 'Fractional FPS Value') {
      fpsObj['Numerator'] = settings.Video.FPSNum;
      fpsObj['Denominator'] = settings.Video.FPSDen;
    }

    const baseRes = this.parseRes(settings.Video.Base);
    const baseAspect = baseRes.x / baseRes.y;

    if (baseAspect < 16 / 9.1 || baseAspect > 16 / 8.9) {
      this.logProblem(`Base resolution is not 16:9 aspect ratio: ${baseRes.x}x${baseRes.y}`);
    }

    // Need to pull output res from output settings service, in case
    // rescale output option is being used on stream encoder
    const outputRes = this.parseRes(
      this.outputSettingsService.getSettings().streaming.outputResolution,
    );
    const outputAspect = outputRes.x / outputRes.y;

    if (outputAspect < 16 / 9.1 || outputAspect > 16 / 8.9) {
      this.logProblem(`Output resolution is not 16:9 aspect ratio: ${outputRes.x}x${outputRes.y}`);
    }

    if (baseAspect !== outputAspect) {
      this.logProblem('Base resolution and Output resolution have different aspect ratio');
    }

    if (outputRes.y > baseRes.y) {
      this.logProblem('Output resolution is higher than Base resolution (upscaling)');
    }

    if (outputRes.y < 720) {
      this.logProblem(`Low Output resolution: ${outputRes.x}x${outputRes.y}`);
    }

    if (outputRes.y > 1080) {
      this.logProblem(`High Output resolution: ${outputRes.x}x${outputRes.y}`);
    }

    if (baseRes.y < 720) {
      this.logProblem(`Low Base resolution: ${baseRes.x}x${baseRes.y}`);
    }

    return new Section('Video', {
      'Base Resolution': settings.Video.Base,
      'Output Resolution': settings.Video.Output,
      'Downscale Filter': settings.Video.ScaleType,
      'Frame Rate': fpsObj,
    });
  }

  private parseRes(resString: string): IVec2 {
    const parts = resString.split('x');
    return { x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) };
  }

  private generateOutputSection() {
    const settings = this.outputSettingsService.getSettings();

    if (settings.streaming.bitrate < 2500) {
      this.logProblem(`Low streaming bitrate: ${settings.streaming.bitrate}`);
    }

    if (settings.recording.bitrate < 2500) {
      this.logProblem(`Low recording bitrate: ${settings.recording.bitrate}`);
    }

    return new Section('Output', {
      Mode: settings.mode,
      Streaming: {
        Encoder:
          settings.streaming.encoder === EEncoderFamily.jim_nvenc
            ? 'NVENC (New)'
            : settings.streaming.encoder,
        Bitrate: settings.streaming.bitrate,
        'Use Custom Resolution': settings.streaming.hasCustomResolution,
        'Output Resolution': settings.streaming.outputResolution,
        'Encoder Preset': settings.streaming.preset,
        'Encoder Options': settings.streaming.encoderOptions,
        'Rescale Output': settings.streaming.rescaleOutput,
        'Audio Track': this.settingsService.views.streamTrack + 1,
        'VOD Track': this.settingsService.views.vodTrack + 1,
        'VOD Track Enabled': !!this.settingsService.views.vodTrackEnabled,
      },
      Recording: {
        Encoder:
          settings.recording.encoder === EEncoderFamily.jim_nvenc
            ? 'NVENC (New)'
            : settings.recording.encoder,
        Bitrate: settings.recording.bitrate,
        'Output Resolution': settings.recording.outputResolution,
        'Audio Tracks': this.settingsService.views.recordingTracks.map(t => t + 1).join(', '),
      },
    });
  }

  private generateSystemSection() {
    const cpus = os.cpus();
    let gpuSection: Object;

    if (getOS() === OS.Windows) {
      const gpuInfo = this.getWmiClass('Win32_VideoController', [
        'Name',
        'DriverVersion',
        'DriverDate',
      ]);

      // Ensures we are working with an array
      [].concat(gpuInfo).forEach((gpu, index) => {
        gpuSection[`GPU ${index + 1}`] = {
          Name: gpu.Name,
          'Driver Version': gpu.DriverVersion,
          'Driver Date': gpu.DriverDate,
        };
      });
    }

    return new Section('System', {
      'Operating System': `${os.platform()} ${os.release()}`,
      Architecture: process.arch,
      CPU: {
        Model: cpus[0].model,
        Cores: cpus.length,
      },
      Memory: {
        Total: prettyBytes(os.totalmem()),
        Free: prettyBytes(os.freemem()),
      },
      Graphics: gpuSection ?? 'This information is not available on macOS reports',
    });
  }

  private generateAudioSection() {
    const settings = this.settingsService.views.values;
    const devices = this.hardwareService.getDevices();

    function audioDeviceObj(deviceId: string) {
      if (deviceId == null) return 'Disabled';

      const deviceObj = devices.find(device => deviceId === device.id);

      return {
        Id: deviceId,
        Name: deviceObj ? deviceObj.description : '<DEVICE NOT FOUND>',
      };
    }

    return new Section('Audio', {
      'Sample Rate': settings.Audio.SampleRate,
      Channels: settings.Audio.ChannelSetup,
      'Global Sources': {
        'Desktop Audio': audioDeviceObj(settings.Audio['Desktop Audio'] as string),
        'Desktop Audio 2': audioDeviceObj(settings.Audio['Desktop Audio 2'] as string),
        'Mic/Aux': audioDeviceObj(settings.Audio['Mic/Aux'] as string),
        'Mic/Aux 2': audioDeviceObj(settings.Audio['Mic/Aux 2'] as string),
        'Mic/Aux 3': audioDeviceObj(settings.Audio['Mic/Aux 3'] as string),
      },
    });
  }

  private generateDevicesSection() {
    const devices = this.hardwareService.getDevices();
    const dshowDevices = this.hardwareService.getDshowDevices();

    function mapDevice(d: IDevice) {
      return {
        Name: d.description,
        Id: d.id,
      };
    }

    return new Section('Available Devices', {
      Audio: {
        Output: devices.filter(d => d.type === EDeviceType.audioOutput).map(mapDevice),
        Input: devices.filter(d => d.type === EDeviceType.audioInput).map(mapDevice),
      },
      'Video Capture': dshowDevices.map(mapDevice),
    });
  }

  private generateScenesSection() {
    const sceneData = {};

    // Non-translated plain names for widget types
    const widgetLookup = [
      'AlertBox',
      'DonationGoal',
      'FollowerGoal',
      'SubscriberGoal',
      'BitGoal',
      'DonationTicker',
      'ChatBox',
      'EventList',
      'TipJar',
      'ViewerCount',
      'StreamBoss',
      'Credits',
      'SpinWheel',
      'SponsorBanner',
      'MediaShare',
      'SubGoal',
      'StarsGoal',
      'SupporterGoal',
      'CharityGoal',
      'Poll',
      'EmoteWall',
      'ChatHighlight',
    ];

    this.scenesService.views.scenes.map(s => {
      sceneData[s.name] = s.getItems().map(si => {
        const source = si.getSource();
        const propertiesManagerType = source.getPropertiesManagerType();
        const propertiesManagerSettings = source.getPropertiesManagerSettings();

        const sourceData = {
          Name: source.name,
          Type: source.type,
        };

        if (propertiesManagerType === 'widget') {
          sourceData['Widget Type'] = widgetLookup[propertiesManagerSettings.widgetType];
        } else if (propertiesManagerType === 'streamlabels') {
          sourceData['Streamlabel Type'] = propertiesManagerSettings.statname;
        }

        // TODO: Handle macOS
        if (source.type === 'dshow_input') {
          const deviceId = source.getObsInput().settings['video_device_id'];
          const device = this.hardwareService.getDshowDevices().find(d => d.id === deviceId);

          if (device == null) {
            this.logProblem(
              `Source ${source.name} references device ${deviceId} which could not be found on the system.`,
            );
          }

          sourceData['Selected Device Id'] = deviceId;
          sourceData['Selected Device Name'] = device?.description ?? '<DEVICE NOT FOUND>';
        }

        if (source.audio && this.settingsService.state.Output.type === 1) {
          const tracks = Utils.numberToBinnaryArray(
            this.audioService.views.getSource(source.sourceId).audioMixers,
            6,
          ).reverse();
          const enabledTracks = tracks.reduce((arr, val, idx) => {
            if (val) {
              return [...arr, idx + 1];
            }

            return arr;
          }, []);

          sourceData['Enabled Audio Tracks'] = enabledTracks.join(', ');
        }

        sourceData['Filters'] = this.sourceFiltersService.views
          .filtersBySourceId(source.sourceId)
          .map(f => {
            return {
              Name: f.name,
              Type: f.type,
              Enabled: f.visible,

              // TODO: Decide if settings are needed - it adds a lot of noise
              // Settings: f.settings,
            };
          });

        return sourceData;
      });
    });

    return new Section('Scenes', {
      'Active Scene': this.scenesService.views.activeScene.name,
      Scenes: sceneData,
    });
  }

  private generateStreamsSection() {
    return new Section(
      'Streams',
      this.state.streams.map(s => {
        return {
          'Start Time': new Date(s.startTime).toString(),
          'End Time': s.endTime ? new Date(s.endTime).toString() : 'Stream did not end cleanly',
          'Skipped Frames': `${s.pctSkipped.toFixed(2)}%`,
          'Lagged Frames': `${s.pctLagged.toFixed(2)}%`,
          'Dropped Frames': `${s.pctDropped.toFixed(2)}%`,
          'Average CPU': `${s.avgCpu.toFixed(2)}%`,
          'Average FPS': s.avgFps.toFixed(2),
        };
      }),
    );
  }

  private generateProblemsSection() {
    return new Section(
      'Potential Issues',
      this.problems.length ? this.problems : 'No issues detected',
    );
  }

  private getWmiClass(wmiClass: string, select: string[]): object {
    try {
      const result = JSON.parse(
        cp
          .execSync(
            `Powershell -command "Get-CimInstance -ClassName ${wmiClass} | Select-Object ${select.join(
              ', ',
            )} | ConvertTo-JSON"`,
          )
          .toString(),
      );

      if (Array.isArray(result)) {
        return result.map(o => this.convertWmiValues(o));
      } else {
        return this.convertWmiValues(result);
      }
    } catch (e: unknown) {
      console.error(`Error fetching WMI class ${wmiClass} for diagnostics`, e);
      return [];
    }
  }

  private convertWmiValues(wmiObject: object) {
    Object.keys(wmiObject).forEach(key => {
      const val = wmiObject[key];

      if (typeof val === 'string') {
        const match = val.match(/\/Date\((\d+)\)/);

        if (match) {
          wmiObject[key] = new Date(parseInt(match[1], 10)).toString();
        }
      }
    });

    return wmiObject;
  }

  @mutation({ sync: false })
  private ADD_STREAM(stream: IStreamDiagnosticInfo) {
    this.state.streams.unshift(stream);
    if (this.state.streams.length > STREAM_HISTORY_LENGTH) this.state.streams.pop();
  }

  @mutation({ sync: false })
  private UPDATE_STREAM(stream: Partial<IStreamDiagnosticInfo>) {
    Vue.set(this.state.streams, 0, { ...this.state.streams[0], ...stream });
  }
}
