import { $t } from 'services/i18n';
import { ISettingsSubCategory } from './settings-api';

export enum OptimizationKey {
    outputMode = 'outputMode', // outputMode must be the first entry
    videoBitrate = 'videoBitrate',
    audioBitrate = 'audioBitrate',
    quality = 'quality',
    colorSpace = 'colorSpace',
    fps = 'fps',
    encoder = 'encoder',
    keyframeInterval = 'keyframeInterval',
    encoderPreset = 'encoderPreset',
    profile = 'profile',
    tune = 'tune',
    audioTrackIndex = 'audioTrackIndex',
}

enum CategoryName {
    output = 'Output',
    video = 'Video',
    advanced = 'Advanced',
}

type DefinitionParam = {
    key: OptimizationKey,
    category: CategoryName,
    subCategory: string,
    setting: string,
    label?: string,
    lookupValueName?: boolean,
};

const definitionParams: DefinitionParam[] = [
    {
        key: OptimizationKey.outputMode,
        category: CategoryName.output,
        subCategory: 'Untitled',
        setting: 'Mode',
        lookupValueName: true,
    },
    {
        key: OptimizationKey.videoBitrate,
        category: CategoryName.output,
        subCategory: 'Streaming',
        setting: 'bitrate',
        label: 'settings.videoBitrate',
    },
    {
        key: OptimizationKey.audioBitrate,
        category: CategoryName.output,
        subCategory: 'Audio - Track 1',
        setting: 'Track1Bitrate',
        label: 'settings.audioBitrate',
    },
    {
        key: OptimizationKey.quality,
        category: CategoryName.video,
        subCategory: 'Untitled',
        setting: 'Output',
        label: 'settings.Output.name',
        lookupValueName: true,
    },
    {
        key: OptimizationKey.colorSpace,
        category: CategoryName.advanced,
        subCategory: 'Video',
        setting: 'ColorSpace',
    },
    {
        key: OptimizationKey.fps,
        category: CategoryName.video,
        subCategory: 'Untitled',
        setting: 'FPSCommon',
        label: 'streaming.FPS',
    },
    {
        key: OptimizationKey.encoder,
        category: CategoryName.output,
        subCategory: 'Streaming',
        setting: 'Encoder',
        lookupValueName: true,
    },
    {
        key: OptimizationKey.keyframeInterval,
        category: CategoryName.output,
        subCategory: 'Streaming',
        label: 'settings.keyframeInterval',
        setting: 'keyint_sec',
    },
    {
        key: OptimizationKey.encoderPreset,
        category: CategoryName.output,
        subCategory: 'Streaming',
        setting: 'preset',
        label: 'settings.encoderPreset',
        lookupValueName: true,
    },
    {
        key: OptimizationKey.profile,
        category: CategoryName.output,
        subCategory: 'Streaming',
        setting: 'profile',
        lookupValueName: true,
    },
    {
        key: OptimizationKey.tune,
        category: CategoryName.output,
        subCategory: 'Streaming',
        setting: 'tune',
        lookupValueName: true,
    },
    {
        key: OptimizationKey.audioTrackIndex,
        category: CategoryName.output,
        subCategory: 'Streaming',
        setting: 'TrackIndex'
    },
];

export type OptimizeSettings = Object;

export interface OptimizedSettings {
    delta: OptimizeSettings;
    current: OptimizeSettings;
    info: {
        key: string,
        name: string,
        currentValue: string,
        newValue?: string
    }[];
}

/**
 * i18n用pathを組み立てる。
 * 空白を含む階層はドット記法で接続出来ないので置き換える
 */
function i18nPath(top: string, ...args: string[]): string {
    return top + [...args].map(s => {
        if (s.match(/\s/)) {
            return `['${s}']`;
        }
        return `.${s}`;
    }).join('');
}

class OptKeyProperty {
    key: OptimizationKey;
    category: CategoryName;
    subCategory: string;
    setting: string;

    private _label: string;
    private lookupValueName: boolean;

    constructor(options: DefinitionParam) {
        this.key = options.key;
        this.category = options.category;
        this.subCategory = options.subCategory;
        this.setting = options.setting;
        if (options.label) {
            this._label = options.label;
        } else {
            this._label = i18nPath('settings', options.category, options.subCategory, options.setting, 'name');
        }
        this.lookupValueName = options.lookupValueName;
    }

    get label(): string {
        const t = $t(this._label);
        if (t !== this._label) {
            return t;
        }
        console.log(`label '${this._label}' not found for ${this.key}`);
        return this.setting;
    }

    value(v: any): string {
        if (this.lookupValueName) {
            const t = i18nPath('settings', this.category, this.subCategory, this.setting, v);
            const name = $t(t);
            if (t !== name) {
                return name;
            }
        }
        return v;
    }
}

export class NiconicoOptimization {
    private static definitions: OptKeyProperty[] = definitionParams.map(o => new OptKeyProperty(o));

    static keys: OptimizationKey[] = Object.values(OptimizationKey);
    static keyTable = new Map<OptimizationKey, OptKeyProperty>(
        NiconicoOptimization.definitions.map((p) => [p.key, p]) as [OptimizationKey, OptKeyProperty][]
    );

    static optimizeInfo(current: OptimizeSettings, optimized: OptimizeSettings): {
        key: string,
        name: string,
        currentValue: string,
        newValue?: string
    }[] {
        return NiconicoOptimization.definitions.map(opt => {
            const key = opt.key
            if (key in optimized) {
                return {
                    key,
                    name: opt.label,
                    currentValue: opt.value(current[key]),
                    newValue: opt.value(optimized[key])
                }
            } else {
                return {
                    key,
                    name: opt.label,
                    currentValue: opt.value(current[key]),
                }
            }
        });
    }

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
            keyFramePeriod: 300,
            encoderPreset: 'ultrafast',
            profile: 'high',
            tune: 'zerolatency',
            audioTrackIndex: '1',
        };
    }
}

export interface ISettingsAccessor {
    getSettingsFormData(categoryName: string): ISettingsSubCategory[];
    findSetting(settings: ISettingsSubCategory[], category: string, setting: string): any;
    findSettingValue(settings: ISettingsSubCategory[], category: string, setting: string): any;
    setSettings(categoryName: string, settingsData: ISettingsSubCategory[]): void;
}

export class NiconicoOptimizer {
    private accessor: ISettingsAccessor;

    constructor(accessor: ISettingsAccessor) {
        this.accessor = accessor;
    }

    private categoryCache = new Map<CategoryName, ISettingsSubCategory[]>();

    getCategory(category: CategoryName, reload: boolean = false): ISettingsSubCategory[] {
        if (reload || !this.categoryCache.has(category)) {
            this.categoryCache.set(category, this.accessor.getSettingsFormData(category));
            /* console.log(`load category ${category} ->
${JSON.stringify(this.categoryCache.get(category), null, 2)}`
            ); // DEBUG */
        }
        return this.categoryCache.get(category);
    }

    updateCategory(category: CategoryName) {
        if (this.categoryCache.has(category)) {
            this.accessor.setSettings(category, this.getCategory(category));
        }
    }

    findValue(key: OptimizationKey) {
        const i = NiconicoOptimization.keyTable.get(key);
        return this.accessor.findSettingValue(this.getCategory(i.category), i.subCategory, i.setting);
    }

    findSetting(key: OptimizationKey) {
        const i = NiconicoOptimization.keyTable.get(key);
        return this.accessor.findSetting(this.getCategory(i.category), i.subCategory, i.setting);
    }

    setValues(kvs: { key: OptimizationKey, value: any }[]) {
        const om = kvs.find(i => i.key == OptimizationKey.outputMode);
        if (om !== undefined) {
            kvs = kvs.filter(i => i.key != OptimizationKey.outputMode);
            kvs.unshift(om);
        }

        let modifiedCategories = new Set<CategoryName>();

        for (const kv of kvs) {
            const setting = this.findSetting(kv.key);
            if (setting) {
                if (setting.value !== kv.value) {
                    setting.value = kv.value;

                    const category = NiconicoOptimization.keyTable.get(kv.key).category;
                    modifiedCategories.add(category);

                    if (kv.key == OptimizationKey.outputMode) {
                        this.updateCategory(category);
                        this.getCategory(category, true); // reload
                        modifiedCategories.delete(category);
                    }
                }
            } else {
                console.warn(`key not found: ${kv.key}`);
            }
        }

        for (const category of modifiedCategories) {
            if (this.categoryCache.has(category as CategoryName)) {
                this.updateCategory(category as CategoryName);
            }
        }
    }

    setValue(key: OptimizationKey, value: any) {
        this.setValues([{ key, value }]);
    }

    getCurrent(outputMode: string): OptimizeSettings {
        // 出力モードが異なるときは変更した上で現在の値を取得する
        const lastMode = this.findValue(OptimizationKey.outputMode);
        if (lastMode !== outputMode) {
            this.setValue(OptimizationKey.outputMode, outputMode);
        }

        // 値を取得する
        const current = Object.assign(
            {},
            ...NiconicoOptimization.keys.map((key: OptimizationKey) => {
                if (key === OptimizationKey.outputMode) {
                    return { [key]: lastMode }; // 出力モードは以前の値
                } else {
                    return { [key]: this.findValue(key) };
                }
            })
        );

        // 出力モードを元に戻す
        if (lastMode !== outputMode) {
            this.setValue(OptimizationKey.outputMode, lastMode);
        }
        return current;
    }

    optimize(optimized: OptimizeSettings) {
        let kvs: { key: OptimizationKey, value: any }[] = [];
        for (let key of NiconicoOptimization.keys) {
            if (key in optimized) {
                kvs.push({ key, value: optimized[key] });
            }
        }
        this.setValues(kvs);
    }
}