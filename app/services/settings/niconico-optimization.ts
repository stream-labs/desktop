import {
    OptimizeSettings, SettingsKeyAccessor, OptimizationKey,
} from './optimizer';

/**
 * niconicoに最適な設定値を返す。
 * @param options ビットレート
 */
export function getBestSettingsForNiconico(
    options: { bitrate: number },
    settings: SettingsKeyAccessor // TODO 見る
): OptimizeSettings {
    let audioBitrate: number;
    let resolution: string;
    if (options.bitrate >= 6000) {
        audioBitrate = 192;
        resolution = '1280x720';
    } else if (options.bitrate >= 2000) {
        audioBitrate = 192;
        resolution = '800x450';
    } else if (options.bitrate >= 1000) {
        audioBitrate = 96;
        resolution = '800x450';
    } else if (options.bitrate >= 384) {
        audioBitrate = 48;
        resolution = '512x288';
    } else {
        audioBitrate = 48;
        resolution = '512x288';
    }

    return {
        outputMode: 'Advanced',
        rateControl: 'CBR',
        videoBitrate: (options.bitrate - audioBitrate),
        audioBitrate: audioBitrate.toString(10),
        quality: resolution,
        colorSpace: '709',
        fpsType: 'Common FPS Values',
        fpsCommon: '30',
        encoder: 'obs_x264',
        keyframeInterval: 300,
        encoderPreset: 'ultrafast',
        profile: 'high',
        tune: 'zerolatency',
        audioTrackIndex: '1',
    };
}
