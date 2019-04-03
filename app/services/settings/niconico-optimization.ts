import {
    OptimizeSettings, SettingsKeyAccessor, OptimizationKey, EncoderType
} from './optimizer';

/**
 * niconicoに最適な設定値を返す。
 * @param options ビットレート
 */
export function getBestSettingsForNiconico(
    options: { bitrate: number },
    settings: SettingsKeyAccessor
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

    let encoderSettings: OptimizeSettings = {
        encoder: EncoderType.x264,
        simpleUseAdvanced: true,
        encoderPreset: 'ultrafast',
    };
    if (settings.hasSpecificValue(OptimizationKey.encoder, EncoderType.nvenc)) {
        encoderSettings = {
            encoder: EncoderType.nvenc,
            simpleUseAdvanced: true,
            NVENCPreset: 'llhq',
        };
        console.log('NVENC あった');
    } else if (settings.hasSpecificValue(OptimizationKey.encoder, EncoderType.qsv)) {
        encoderSettings = {
            encoder: EncoderType.qsv,
            simpleUseAdvanced: true,
            targetUsage: 'speed',
        };
        console.log('obs_qsv11 あった');
    }

    const commonSettings: OptimizeSettings = {
        outputMode: 'Simple',
        videoBitrate: (options.bitrate - audioBitrate),
        audioBitrate: audioBitrate.toString(10),
        quality: resolution,
        fpsType: 'Common FPS Values',
        fpsCommon: '30',
    };

    const advancedSettings: OptimizeSettings = {
        outputMode: 'Advanced',
        advRateControl: 'CBR',
        advColorSpace: '709',
        advKeyframeInterval: 300,
        advProfile: 'high',
        advAudioTrackIndex: '1',
    };

    return Object.assign(
        {},
        commonSettings,
        // advancedSettings,
        encoderSettings
    );
}
