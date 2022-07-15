import { Inject } from './core/injector';
import { UserService } from './user';
import { HostsService } from './hosts';
import fs from 'fs';
import path from 'path';
import electron from 'electron';
import { Service } from './core/service';
import { randomBytes } from 'crypto';
import { EncoderType } from './settings/optimizer';

function randomCharacters(len: number): string {
  const buf = randomBytes(len);
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from(buf)
    .map(b => characters[Math.floor((b / 256) * characters.length)])
    .join('');
}

export type TUsageEvent =
  | {
    event: 'stream_start' | 'stream_end';
    user_id: string | null;
    platform: string;
    stream_track_id: string;
    content_id: string | null;
    output_mode: 'Simple' | 'Advanced';
    video: {
      base_resolution: string; // eg. '1920x1080'
      output_resolution: string; // eg. '1280x720'
      fps: string; // "30", "29.97", "24 NTSC", ... 
      bitrate: number;
    };
    audio: {
      bitrate: number;
      sample_rate: 44100 | 48000;
    };
    encoder: {
      encoder_type: EncoderType;
      preset: string;
    };
    auto_optimize: {
      enabled: boolean;
      use_hardware_encoder: boolean;
    };
    advanced?: {
      rate_control: 'CBR' | 'VBR' | 'ABR' | 'CRF';
      profile: 'high' | 'main' | 'baseline';
    };
    yomiage: {
      enabled: boolean;
      pitch: number;
      rate: number;
      volume: number;
    };
    compact_mode: {
      auto_compact_mode: boolean;
      current: boolean;
    }
  }
  | {
    event: 'app_start' | 'app_close';
  }
  | {
    event: 'crash';
  };

type TAnalyticsEvent = 'TCP_API_REQUEST' | 'FacebookLogin'; // add more types if you need

interface IAnalyticsEvent {
  product: string;
  version: number;
  event: string;
  value?: any;
  time?: string;
  count?: number;
  uuid?: string;
  saveUser?: boolean;
}

export function track(event: TUsageEvent) {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    return {
      ...descriptor,
      value(...args: any[]): any {
        UsageStatisticsService.instance.recordEvent(event);
        descriptor.value.apply(this, args);
      },
    };
  };
}

export class UsageStatisticsService extends Service {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  installerId: string;
  version = electron.remote.process.env.NAIR_VERSION;

  init() {
    this.loadInstallerId();
  }

  loadInstallerId() {
    let installerId = localStorage.getItem('installerId');

    if (!installerId) {
      const exePath = electron.remote.app.getPath('exe');
      const installerNamePath = path.join(path.dirname(exePath), 'installername');

      if (fs.existsSync(installerNamePath)) {
        try {
          const installerName = fs.readFileSync(installerNamePath).toString();

          if (installerName) {
            const matches = installerName.match(/\-([A-Za-z0-9]+)\.exe/);
            if (matches) {
              installerId = matches[1];
              localStorage.setItem('installerId', installerId);
            }
          }
        } catch (e) {
          console.error('Error loading installer id', e);
        }
      }
    }

    this.installerId = installerId;
  }

  generateStreamingTrackID(): string {
    // 配信の開始と終了を対応付ける一時的な識別子はランダムな文字列で生成する
    const id = randomCharacters(10);
    return id;
  }

  /**
   * Record a usage event on our server.
   * @param event the event type to record
   * @param metadata arbitrary data to store with the event (must be serializable)
   */
  recordEvent(event: TUsageEvent) {
    console.log('recordEvent', event);

    if (event.event === 'stream_start' || event.event === 'stream_end') {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      const request = new Request(`${this.hostsService.statistics}/action`, {
        headers,
        method: 'POST',
        body: JSON.stringify(event),
      });

      return fetch(request);
    }
  }
}
