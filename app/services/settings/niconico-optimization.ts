import { $t } from 'services/i18n';
import { ISettingsSubCategory } from './settings-api';

export enum OptimizationKey {
    outputMode = 'outputMode', // outputMode must be the first entry
    videoBitrate = 'videoBitrate',
    audioBitrate = 'audioBitrate',
    quality = 'quality',
    colorSpace = 'colorSpace',
    fps = 'fps',
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
        setting: 'VBitrate'
    },
    {
        key: OptimizationKey.audioBitrate,
        category: CategoryName.output,
        subCategory: 'Streaming',
        setting: 'ABitrate'
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
        setting: 'ColorSpace'
    },
    {
        key: OptimizationKey.fps,
        category: CategoryName.video,
        subCategory: 'Untitled',
        setting: 'FPSCommon',
        label: 'streaming.FPS'
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
            this._label = ['settings', options.category, options.subCategory, options.setting, 'name'].join('.');
        }
        this.lookupValueName = options.lookupValueName;
    }

    get label(): string {
        const t = $t(this._label);
        if (t !== this._label) {
            return t;
        }
        return this._label;
    }

    value(v: any): string {
        if (this.lookupValueName) {
            const t = ['settings', this.category, this.subCategory, this.setting, v].join('.');
            const name = $t(t);
            if (t !== name) {
                return name;
            }
            return t;
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
            videoBitrate: (options.bitrate - audioBitrate),
            audioBitrate: audioBitrate.toString(10),
            quality: quality,
            colorSpace: '709',
            fps: '30',
            outputMode: 'Simple',
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