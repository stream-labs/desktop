import {
    ISettingsAccessor,
    Optimizer,
    OptimizeSettings,
} from './optimizer';

export {
    ISettingsAccessor,
    OptimizeSettings,
    OptimizedSettings
} from './optimizer';

export class NiconicoOptimizer extends Optimizer {
    /**
     * niconicoに最適な設定値を返す。
     * @param options ビットレート
     */
    static bestSettings(options: { bitrate: number }): OptimizeSettings {
        let audioBitrate: number;
        let quality: string;
        if (options.bitrate >= 6000) {
            audioBitrate = 192;
            quality = '1280x720';
        } else if (options.bitrate >= 2000) {
            audioBitrate = 192;
            quality = '800x450';
        } else if (options.bitrate >= 1000) {
            audioBitrate = 96;
            quality = '800x450';
        } else if (options.bitrate >= 384) {
            audioBitrate = 48;
            quality = '512x288';
        } else {
            audioBitrate = 48;
            quality = '512x288';
        }

        return {
            outputMode: 'Advanced',
            videoBitrate: (options.bitrate - audioBitrate),
            audioBitrate: audioBitrate.toString(10),
            quality: quality,
            colorSpace: '709',
            fps: '30',
            encoder: 'obs_x264',
            keyframeInterval: 300,
            encoderPreset: 'ultrafast',
            profile: 'high',
            tune: 'zerolatency',
            audioTrackIndex: '1',
        };
    }
}
