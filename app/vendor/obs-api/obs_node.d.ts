export namespace ObsGlobal {
    /**
     * Initializes libobs global context
     * @param locale The locale used globally
     * @param path Path to libobs data files
     */
    function startup(locale: string, path?: string): void;

    /**
     * Uninitializes libobs global context
     */
    function shutdown(): void;

    /**
     * Current status of the global libobs context
     */
    const initialized: boolean;

    /**
     * Current locale of current libobs context
     */
    const locale: string;

    /**
     * Version of current libobs context.
     * Represented as a 32-bit unsigned integer.
     * First 2 bytes are major.
     * Second 2 bytes are minor.
     * Last 4 bytes are patch.
     */
    const version: number;
}

/**
 * Used for various 2-dimensional functions
 * @property {number} x
 * @property {number} y
 */
export interface IVec2 {
    x: number;
    y: number;
}

/**
 * Base class for Filter, Transition, Scene, and Input.
 * Should not be created directly.
 * 
 * @property {number} status The validitty of the source
 * @property {string} id The corresponding id of the source
 * @property {boolean} configurable Whether the source has properties or not
 * @property {number} width width of the source. 0 if audio only
 * @property {number} height height of the source. 0 if audio only
 * @property {string} name Name of the source when referencing it
 * @property {number} flags Unsigned bit-field concerning various flags.
 * @method release Release the underlying reference
 * @method remove Send remove signal to other holders of the current reference.
 */

export const enum ESourceType {
    Input,
    Filter,
    Transition,
    Scene,
}

export const enum EFaderType {
    Cubic,
    IEC,
    Log
}

export class ObsCallbackData {

}

export class ObsFader {
    private constructor();

    static create(type: EFaderType): ObsFader;

    db: number;
    deflection: number;
    mul: number;

    attach(source: ObsInput): void;
    detach(): void;

    addCallback(cb: (data: { db: number; }) => void): ObsCallbackData;
    removeCallback(cbData: ObsCallbackData): void;
}

export class ObsVolmeter {
    private constructor();

    static create(type: EFaderType): ObsVolmeter;

    peakHold: number;
    updateInterval: number;

    attach(source: ObsInput): void;
    detach(): void;

    addCallback(
        cb: (data: {
            level: number;
            magnitude: number;
            peak: number;
            muted: boolean; }) => void): ObsCallbackData;

    removeCallback(cbData: ObsCallbackData): void;
}

export interface ObsSource {
    release(): void;
    remove(): void;

    readonly settings: object;
    readonly properties: ObsProperties;
    readonly status: number;
    readonly type: ESourceType;
    readonly id: string;
    readonly configurable: boolean;
    readonly width: number;
    readonly height: number;

    name: string;
    flags: number;
}

/**
 * Object representing a filter.
 * 
 * You must call release() before all references run out. 
 */
export class ObsFilter implements ObsSource {
    private constructor();
    static types(): string[];
    static create(id: string, name: string, settings?: object): ObsFilter;

    //Source
    release(): void;
    remove(): void;

    readonly settings: object;
    readonly properties: ObsProperties;
    readonly status: number;
    readonly type: ESourceType;
    readonly id: string;
    readonly configurable: boolean;
    readonly width: number;
    readonly height: number;

    name: string;
    flags: number;
}

/**
 * Object representing a transition.
 * Should be set to an output at all times. 
 * You must call release() before all references run out. 
 * 
 * @method start Begins a transition into another scene/input source
 */
export class ObsTransition implements ObsSource {
    private constructor();
    static types(): string[];
    static create(id: string, name: string, settings?: object): ObsTransition;
    getActiveSource(): ObsScene | ObsInput;
    clear(): void;
    set(input: ObsInput | ObsScene): void;
    start(ms: number, input: ObsInput | ObsScene): void;

    //Source
    release(): void;
    remove(): void;

    readonly settings: object;
    readonly properties: ObsProperties;
    readonly status: number;
    readonly type: ESourceType;
    readonly id: string;
    readonly configurable: boolean;
    readonly width: number;
    readonly height: number;

    name: string;
    flags: number;
}

/**
 * Object representing an input source.
 * An input source can be either an audio or video or even both. 
 * So some of these don't make sense right now. For instance, there's
 * no reason tot call volume on a source that only provides video input. 
 * 
 * You can check for audio/video by using flags() but we'll be adding
 * properties to make this a bit easier. 
 * 
 * You must call release() before all references run out. 
 */
export class ObsInput implements ObsSource {
    private constructor();
    static types(): string[];
    static create(id: string, name: string, hotkeys?: object, settings?: object): ObsInput;
    static createPrivate(id: string, name: string, settings?: object): ObsInput;
    static fromName(name: string): ObsInput;
    static getPublicSources(): ObsInput[];
    volume: number;
    syncOffset: number;
    showing: boolean;
    audioMixers: number;

    duplicate(name: string, is_private: boolean): ObsInput;
    findFilter(name: string): ObsFilter;
    addFilter(filter: ObsFilter): void;
    removeFilter(filter: ObsFilter): void;
    readonly filters: ObsFilter[];

    //Source
    release(): void;
    remove(): void;

    readonly settings: object;
    readonly properties: ObsProperties;
    readonly status: number;
    readonly type: ESourceType;
    readonly id: string;
    readonly configurable: boolean;
    readonly width: number;
    readonly height: number;

    name: string;
    flags: number;
}

export const enum ESceneDupType {
    Refs,
    Copy,
    PrivateRefs,
    PrivateCopy
}

/**
 * Object representing a scene.
 * 
 * A scene can also be used as an input source. 
 * You can grab it's input reference by calling source()
 * on an instance of ObsScene. 
 * 
 * You must call release() before all reference run out. 
 */
export class ObsScene implements ObsSource {
    private constructor();
    static types(): string[];
    static create(name: string): ObsScene;
    static fromName(name: string): ObsScene;
    duplicate(name: string, type: ESceneDupType): ObsScene;
    add(source: ObsInput): ObsSceneItem;
    
    readonly source: ObsInput;

    findItem(name: string): ObsSceneItem;
    getItems(): ObsSceneItem[];

    //Source
    release(): void;
    remove(): void;

    readonly settings: object;
    readonly properties: ObsProperties;
    readonly status: number;
    readonly type: ESourceType;
    readonly id: string;
    readonly configurable: boolean;
    readonly width: number;
    readonly height: number;

    name: string;
    flags: number;
}

export const enum EOrderMovement {
    MoveUp,
    MoveDown,
    MoveTop,
    MoveBottom
}

/**
 * Object representing an item within a scene. 
 * 
 * When you add an input source to a scene, a few things
 * happen. If the input source provides video, it allocates
 * rendering structures for it. If it provides audio, it 
 * provides audio sampling structures for it. All actual
 * rendering information is held by the scene item. This
 * is so two scene items can be different even if they use
 * the same underlying source. 
 * 
 * Changing any of the properties will change how the 
 * input source is rendered for that particular item.
 */
export class ObsSceneItem {
    private constructor();
    readonly source: ObsInput;
    readonly scene: ObsScene;
    readonly id: number;

    selected: boolean;
    position: IVec2;
    rotation: number;
    scale: IVec2;
    alignment: number;
    boundsAlignment: number;
    bounds: IVec2;
    boundsType: EBoundsType;
    scaleFilter: EScaleType;
    visible: boolean;
    // transform_info: TTransformInfo;
    // crop: TCropInfo;

    order(movement: EOrderMovement): void;
    orderPosition(pos: number): void;

    remove(): void;

    defeUpdateBegin(): void;
    deferUpdateEnd(): void;
}

export const enum EPropertyType {
    Invalid,
    Boolean,
    Int,
    Float,
    Text,
    Path,
    List,
    Color,
    Button,
    Font,
    EditableList,
    FrameRate
}

export const enum EListFormat {
    Invalid,
    Int,
    Float,
    String
}

export const enum EEditableListType {
    Strings,
    Files,
    FilesAndUrls
}

export const enum EPathType {
    File,
    FileSave,
    Directory
}

export const enum ETextType {
    Default,
    Password,
    Multiline
}

export const enum ENumberType {
    Scroller,
    Slider
}

export interface IListProperty {
    readonly format: EListFormat;
    readonly items: string[] | number[];
}

export interface IEditableListProperty extends IListProperty {
    readonly format: EListFormat;
    readonly items: string[] | number[];
    readonly type: EEditableListType;
    readonly filter: string;
    readonly defaultPath: string;
}

export interface IPathProperty {
    readonly type: EPathType;
}

export interface ITextProperty {
    readonly type: ETextType;
}

export interface INumberProperty {
    readonly type: ENumberType;
}

/**
 * Object representing an entry in a properties list (Properties).
 */
export class ObsProperty {
    private constructor();
    status: number;
    name: string;
    description: string;
    longDescription: string;
    enabled: boolean;
    visible: boolean;
    type: EPropertyType;
    details: 
        IListProperty | IEditableListProperty | 
        IPathProperty | ITextProperty | 
        INumberProperty | {};
    value: ObsProperty;
    done: boolean;

    /**
     * Uses the current object to obtain the next
     * property in the properties list.
     * 
     * Check the status property in order to make
     * sure the property is still valid after using.
     */
    next(): void;
}

/**
 * Object representing a list of properties. 
 * 
 * Use .properties method on an encoder, source, output, or service
 * to obtain an instance. 
 */
export class ObsProperties {
    private constructor();
    /**
     * Obtains the status of the list.
     */
    status: number;

    /**
     * Obtains the first property in the list.
     */
    first(): ObsProperty;
    count(): number;

    /**
     * Obtains property matching name.
     * @param name The name of the property to fetch.
     */
    get(name: string): ObsProperty;
}

export class ObsModule {
    private constructor();
    static create(bin_path: string, data_path: string): ObsModule;
    static load_all(): void;
    static add_path(path: string, data_path: string): void;
    static log_loaded(): void;
    initialize(): void;
    file_name(): string;
    name(): string;
    author(): string;
    description(): string;
    bin_path(): string;
    data_path(): string;
    status(): number;
}

/**
 * @namespace module 
 * A namespace meant for functions interacting with global context 
 * conerning modules. 
 */
export namespace module {
    function add_path(bin_path: string, data_path: string): void;
    function load_all(): void;
    function log_loaded(): void;
}

export const enum EScaleType {
    Default,
    Point,
    FastBilinear,
    Bilinear,
    Bicubic
}

export const enum EBoundsType {
    None,
    Stretch,
    ScaleInner,
    ScaleOuter,
    ScaleToWidth,
    ScaleToHeight,
    MaxOnly
}

export const enum EColorSpace {
    Default,
    CS601,
    CS709
}

export const enum ERangeType {
    Default,
    Partial,
    Full
}

export const enum EFormat {
    None,
    I420,
    NV12,
    YVYU,
    YUY2,
    UYVY,
    RGBA,
    BGRA,
    BGRX,
    Y800,
    I444
}

interface IVideoInfo {
    graphics_module: string;
    fps_num: number;
    fps_den: number;
    base_width: number;
    base_height: number;
    output_width: number;
    output_height: number;
    output_format: EFormat;
    adapter: number;
    gpu_conversion: boolean;
    colorspace: EColorSpace;
    range: ERangeType;
    scale_type: EScaleType;
}

export class ObsVideo {
    static reset(info: IVideoInfo): void;
    static setOutputSource(channel: number, input: ObsInput | ObsTransition | ObsScene): void;
    static getOutputSource(channel: number): ObsInput | ObsTransition | ObsScene;
}

export const enum EColorFormat {
	Unknown,
	A8,
	R8,
	RGBA,
	BGRX,
	BGRA,
	R10G10B10A2,
	RGBA16,
	R16,
	RGBA16F,
	RGBA32F,
	RG16F,
	RG32F,
	R16F,
	R32F,
	DXT1,
	DXT3,
	DXT5
}

export const enum EZStencilFormat {
	None,
	Z16,
	Z24_S8,
	Z32F,
	Z32F_S8X24
}

export interface IDisplayInit {
    width: number;
    height: number;
    format: EColorFormat;
    zsformat: EZStencilFormat;
}

export class ObsDisplay {
    private constructor();
    static create(info: IDisplayInit): ObsDisplay;
    destroy(): void;

    addDrawer(path: string): void;
    removeDrawer(path: string): void;
    
    readonly status: number;
    readonly enabled: boolean;
}