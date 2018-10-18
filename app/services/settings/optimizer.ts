import { $t } from 'services/i18n';
import { ISettingsSubCategory } from './settings-api';

export enum OptimizationKey {
    outputMode = 'outputMode',
    quality = 'quality',
    colorSpace = 'colorSpace',
    fpsType = 'fpsType',
    fpsCommon = 'fpsCommon',
    encoder = 'encoder',
    rateControl = 'rateControl',
    videoBitrate = 'videoBitrate',
    keyframeInterval = 'keyframeInterval',
    encoderPreset = 'encoderPreset',
    profile = 'profile',
    tune = 'tune',
    audioBitrate = 'audioBitrate',
    audioTrackIndex = 'audioTrackIndex',
}

// OptimizationKey のキーと完全対応していること
export type OptimizeSettings = {
    outputMode?: 'Simple' | 'Advanced'
    quality?: string
    colorSpace?: '601' | '709'
    fpsType?: 'Common FPS Values' | 'Integer FPS Value' | 'Fractional FPS Value'
    fpsCommon?: string
    encoder?: 'obs_x264' | 'obs_qsv11'
    rateControl?: 'CBR' | 'VBR' | 'ABR' | 'CRF'
    videoBitrate?: number
    keyframeInterval?: number
    encoderPreset?: string
    profile?: 'high' | 'main' | 'baseline'
    tune?: string
    audioBitrate?: string
    audioTrackIndex?: string
};

enum CategoryName {
    output = 'Output',
    video = 'Video',
    advanced = 'Advanced',
}

export type KeyDescription = {
    key: OptimizationKey,
    category: CategoryName,
    subCategory: string,
    setting: string,
    label?: string,
    lookupValueName?: boolean,
    dependents?: { value: any, params: KeyDescription[] }[],
};

const AllKeyDescriptions: KeyDescription[] = [
    {
        key: OptimizationKey.outputMode,
        category: CategoryName.output,
        subCategory: 'Untitled',
        setting: 'Mode',
        lookupValueName: true,
        dependents: [{
            value: 'Advanced',
            params: [
                {
                    key: OptimizationKey.encoder,
                    category: CategoryName.output,
                    subCategory: 'Streaming',
                    setting: 'Encoder',
                    lookupValueName: true,
                    dependents: [{
                        value: 'obs_x264',
                        params: [
                            {
                                key: OptimizationKey.rateControl,
                                category: CategoryName.output,
                                subCategory: 'Streaming',
                                setting: 'rate_control',
                                lookupValueName: true,
                                dependents: [{
                                    value: 'CBR',
                                    params: [
                                        {
                                            key: OptimizationKey.videoBitrate,
                                            category: CategoryName.output,
                                            subCategory: 'Streaming',
                                            setting: 'bitrate',
                                            label: 'settings.videoBitrate',
                                        },
                                    ]
                                }]
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
                        ]
                    }]
                },
                {
                    key: OptimizationKey.audioTrackIndex,
                    category: CategoryName.output,
                    subCategory: 'Streaming',
                    setting: 'TrackIndex',
                },
                {
                    key: OptimizationKey.audioBitrate,
                    category: CategoryName.output,
                    subCategory: 'Audio - Track 1',
                    setting: 'Track1Bitrate',
                    label: 'settings.audioBitrate',
                },
            ]
        }]
    },
    {
        key: OptimizationKey.quality,
        category: CategoryName.video,
        subCategory: 'Untitled',
        setting: 'Output',
        label: 'streaming.resolution',
        lookupValueName: true,
    },
    {
        key: OptimizationKey.colorSpace,
        category: CategoryName.advanced,
        subCategory: 'Video',
        setting: 'ColorSpace',
    },
    {
        key: OptimizationKey.fpsType,
        category: CategoryName.video,
        subCategory: 'Untitled',
        setting: 'FPSType',
        lookupValueName: true,
        dependents: [{
            value: 'Common FPS Values',
            params: [
                {
                    key: OptimizationKey.fpsCommon,
                    category: CategoryName.video,
                    subCategory: 'Untitled',
                    setting: 'FPSCommon',
                    label: 'streaming.FPS',
                },
            ]
        }]
    },
];

export interface OptimizedSettings {
    best: OptimizeSettings;
    current: OptimizeSettings;
    info: [CategoryName, {
        key: string,
        name: string,
        currentValue: string,
        newValue?: string
    }[]][];
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

    constructor(keyDescription: KeyDescription) {
        this.key = keyDescription.key;
        this.category = keyDescription.category;
        this.subCategory = keyDescription.subCategory;
        this.setting = keyDescription.setting;
        if (keyDescription.label) {
            this._label = keyDescription.label;
        } else {
            this._label = i18nPath(
                'settings',
                keyDescription.category,
                keyDescription.subCategory,
                keyDescription.setting,
                'name'
            );
        }
        this.lookupValueName = keyDescription.lookupValueName;
    }

    get label(): string {
        const t = $t(this._label);
        if (t !== this._label) {
            return t;
        }
        console.warn(`label '${this._label}' not found for ${this.key}`);
        return this.setting;
    }

    value(v: any): string {
        if (v === undefined) {
            console.error(`value(undefined): ${i18nPath('settings', this.category, this.subCategory, this.setting)}`);
            return;
        }
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

type OptimizeItem = {
    key: string,
    name: string,
    currentValue: string,
    newValue?: string
};

function* iterateAllKeyDescriptions(keyDescriptionis: KeyDescription[]): IterableIterator<KeyDescription> {
    for (const item of keyDescriptionis) {
        yield item;
        if (item.dependents) {
            for (const keyParams of item.dependents) {
                yield* iterateAllKeyDescriptions(keyParams.params);
            }
        }
    }
}

// items の中のいずれかの要素を values が保持しているかを確認する
function isDependOnItems(values: OptimizeSettings, items: KeyDescription[]): boolean {
    for (const item of items) {
        if (values.hasOwnProperty(item.key)) {
            return true;
        }
        if (item.dependents) {
            for (const dependent of item.dependents) {
                if (isDependOnItems(values, dependent.params)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function validateKeyDescriptions(params: KeyDescription[]) {
    const actual = new Set<string>(Array.from(iterateAllKeyDescriptions(params)).map(d => d.key));
    const missing = [];
    for (const key of Object.values(OptimizationKey)) {
        if (!actual.has(key)) {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        console.error(`niconico-optimization: : missing keys in keyDescriptions: ${missing}`);
    }
}
validateKeyDescriptions(AllKeyDescriptions);

export interface ISettingsAccessor {
    getSettingsFormData(categoryName: string): ISettingsSubCategory[];
    findSetting(settings: ISettingsSubCategory[], category: string, setting: string): any;
    findSettingValue(settings: ISettingsSubCategory[], category: string, setting: string): any;
    setSettings(categoryName: string, settingsData: ISettingsSubCategory[]): void;
}

/**
 * KeyDescription を通して設定値にアクセスする。
 */
export class SettingsKeyAccessor {
    private accessor: ISettingsAccessor;

    constructor(accessor: ISettingsAccessor) {
        this.accessor = accessor;
    }

    private categoryCache = new Map<CategoryName, ISettingsSubCategory[]>();
    private modifiedCategories = new Set<CategoryName>();

    private getCategory(category: CategoryName, reload: boolean = false): ISettingsSubCategory[] {
        if (reload || !this.categoryCache.has(category)) {
            console.log(`getCategory: ${category}`);
            this.categoryCache.set(category, this.accessor.getSettingsFormData(category));
        }
        return this.categoryCache.get(category);
    }

    private updateCategory(category: CategoryName) {
        if (this.categoryCache.has(category)) {
            console.log(`updateCategory: ${category}`);
            this.accessor.setSettings(category, this.getCategory(category));
        }
    }

    writeBackCategory(category: CategoryName) {
        if (this.modifiedCategories.has(category)) {
            this.updateCategory(category);
            this.modifiedCategories.delete(category);
        }
    }

    writeBackAllCategories() {
        for (const category of this.modifiedCategories) {
            this.updateCategory(category);
        }
        this.modifiedCategories.clear();
    }

    private forgetCategoryCache(category: CategoryName) {
        if (this.categoryCache.has(category)) {
            this.categoryCache.delete(category);
            if (this.modifiedCategories.has(category)) {
                this.modifiedCategories.delete(category);
            }
        }
    }

    clearCache() {
        this.writeBackAllCategories();
        this.categoryCache.clear();
    }

    private findValue(i: KeyDescription) {
        return this.accessor.findSettingValue(this.getCategory(i.category), i.subCategory, i.setting);
    }

    private findSetting(i: KeyDescription) {
        return this.accessor.findSetting(this.getCategory(i.category), i.subCategory, i.setting);
    }

    setValue(item: KeyDescription, value: any) {
        console.log(`setValue: ${item.category}/${item.key}: ${value}`);
        const setting = this.findSetting(item);
        if (setting) {
            if (setting.value !== value) {
                if (item.dependents) {
                    // dependents は item の値に依存して出現したり消滅したりする。
                    // 存在するときの修正は item 変更前に書き戻さないと反映されないため、事前に書き戻す。
                    for (const dependent of item.dependents) {
                        for (const subItem of dependent.params) {
                            this.writeBackCategory(subItem.category);
                        }
                    }
                }
                console.log(`setValue: ${item.category}/${item.key}: ${setting.value} -> ${value}`);
                setting.value = value;
                const category = item.category;
                this.modifiedCategories.add(category);
                if (item.dependents) {
                    // itemを変更すると、それに従って dependents全体が切り替わるため、
                    // item自体の変更は即時で送信し、以後 dependentsを参照するときには読み直させるために
                    // キャッシュを破棄する。(事前に上で変更は書き戻しているので単純破棄)
                    // 変更後に破棄するのは、この破棄対象カテゴリがこのitem自身と同じケースがあるため。
                    this.writeBackCategory(category);
                    for (const dependent of item.dependents) {
                        for (const subItem of dependent.params) {
                            this.forgetCategoryCache(subItem.category);
                        }
                    }
                }
            }
        } else {
            console.warn(`key not found: ${item.key}`);
        }
    }

    /**
     * KeyDescriptions を再帰的に渡り歩いて f を呼び出す
     * @param keyDescriptions 
     * @param f 
     */
    *travarseKeyDescriptions<T>(keyDescriptions: KeyDescription[], f: (d: KeyDescription) => T): IterableIterator<T> {
        for (const item of keyDescriptions) {
            yield f(item);
            if (item.dependents) {
                // cacheオブジェクトの参照ではその後の変更で書き換わってしまうので、元の値をディープコピーして保存する
                let lastCategorySettings = JSON.parse(JSON.stringify(this.getCategory(item.category)));

                let changed = false;
                const value = this.findValue(item);

                for (const dependent of item.dependents) {
                    this.setValue(item, dependent.value);
                    if (value !== dependent.value) {
                        changed = true;
                    }
                    yield* this.travarseKeyDescriptions(dependent.params, f);
                }

                if (changed) {
                    // まず値を変更した上で書き戻し、
                    this.setValue(item, value);
                    this.writeBackCategory(item.category);
                    // 次に元の値群を書き戻すことで依存値が書き戻せる
                    this.categoryCache.set(item.category, lastCategorySettings);
                    this.updateCategory(item.category);
                }
            }
        }
    }

    *getValues(keyDescriptions: KeyDescription[]): IterableIterator<OptimizeSettings> {
        yield* this.travarseKeyDescriptions(keyDescriptions, (item: KeyDescription): OptimizeSettings => {

            /* DEBUG
            const setting = this.findSetting(item);
            if (setting && 'options' in setting && Array.isArray(setting.options)) {
                console.log(
                    `${item.key}: availableOptions: `,
                    JSON.stringify(setting.options.map((v: any) => v.value), null, 2)
                );
            } // */

            return { [item.key]: this.findValue(item) };
        });
    }

    *getSettings(keyDescriptions: KeyDescription[]): IterableIterator<[OptimizationKey, any]> {
        yield* this.travarseKeyDescriptions(keyDescriptions, (item: KeyDescription): [OptimizationKey, any] => {
            const setting = this.findSetting(item);
            return [item.key, setting];
        });
    }
    getSetting(key: OptimizationKey, keyDescriptions: KeyDescription[]): any {
        for (const kv of this.getSettings(keyDescriptions)) {
            if (kv[0] === key) {
                return kv[1];
            }
        }
        return undefined;
    }

    setValues(values: OptimizeSettings, keyDescriptions: KeyDescription[]) {
        for (const item of keyDescriptions) {
            const key = item.key;
            if (item.dependents) {
                let value = this.findValue(item);
                for (const dependent of item.dependents) {
                    if (isDependOnItems(values, dependent.params)) {
                        this.setValue(item, dependent.value);
                        this.setValues(values, dependent.params);
                    }
                }
                if (values.hasOwnProperty(key)) {
                    value = values[key];
                }
                this.setValue(item, value);
            } else {
                if (values.hasOwnProperty(key)) {
                    this.setValue(item, values[key]);
                }
            }
        }
    }
}

export class Optimizer {
    private accessor: SettingsKeyAccessor;
    private keyDescriptions: KeyDescription[];

    constructor(accessor: SettingsKeyAccessor, keysNeeded: OptimizeSettings) {
        this.accessor = accessor;
        this.keyDescriptions = AllKeyDescriptions;
    }

    getCurrentSettings(): OptimizeSettings {
        return Object.assign({}, ...this.accessor.getValues(this.keyDescriptions));
    }

    /**
     * 期待する前提 expect のうち、現在の値 current と異なる値を持つものだけを列挙する
     * @param current 現在の設定
     * @param expect 期待する設定
     */
    static *getDifference(current: OptimizeSettings, expect: OptimizeSettings): IterableIterator<OptimizeSettings> {
        // 最適化の必要な値を抽出する
        for (const key of Object.getOwnPropertyNames(expect)) {
            if (current[key] !== expect[key]) {
                yield { [key]: expect[key] };
            }
        }
    }

    /**
     * 現在値から expect に更新するための差分を列挙する
     * @param expect 期待する設定
     */
    *getDifferenceFromCurrent(expect: OptimizeSettings): IterableIterator<OptimizeSettings> {
        yield* Optimizer.getDifference(this.getCurrentSettings(), expect);
    }

    optimize(optimized: OptimizeSettings) {
        this.accessor.setValues(optimized, this.keyDescriptions);
        this.accessor.writeBackAllCategories();
    }

    optimizeInfo(current: OptimizeSettings, optimized: OptimizeSettings): [CategoryName, OptimizeItem[]][] {
        const map = new Map<CategoryName, OptimizeItem[]>();
        for (const keyDescription of iterateAllKeyDescriptions(this.keyDescriptions)) {
            const opt = new OptKeyProperty(keyDescription);
            const key = opt.key;
            const category = opt.category;
            let item;
            if (optimized.hasOwnProperty(key)) {
                item = {
                    key,
                    name: opt.label,
                    currentValue: opt.value(current[key]),
                    newValue: opt.value(optimized[key])
                };
            } else {
                item = {
                    key,
                    name: opt.label,
                    currentValue: opt.value(current[key]),
                };
            }

            if (!map.has(category)) {
                map.set(category, [item]);
            } else {
                map.get(category).push(item);
            }
        }
        return Array.from(map);
    }
}
