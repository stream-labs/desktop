/** 
 * Namespace representing the global libobs functionality 
 * @namespace ObsGlobal
 * */
export namespace ObsGlobal {
    /**
     * Initializes libobs global context
     * @method
     * @memberof ObsGlobal
     * @name startup
     * @param {string} locale - The locale used globally
     * @param {string} [path] - Path to libobs data files
     */
    function startup(locale: string, path?: string): void;

    /**
     * Uninitializes libobs global context
     * @method
     * @memberof ObsGlobal 
     * @name shutdown
     */
    function shutdown(): void;

    /**
     * Current status of the global libobs context
     * @member {boolean} initialized
     * @memberof ObsGlobal
     * 
     */
    const initialized: boolean;

    /**
     * Current locale of current libobs context
     * @member {string} locale
     * @memberof ObsGlobal
     */
    const locale: string;

    /**
     * Version of current libobs context.
     * Represented as a 32-bit unsigned integer.
     * First 2 bytes are major.
     * Second 2 bytes are minor.
     * Last 4 bytes are patch.
     * @member {number} version
     * @memberof ObsGlobal
     */
    const version: number;
}

/**
 * Used for various 2-dimensional functions
 * @interface IVec2
 * @property {number} x
 * @property {number} y
 */
export interface IVec2 {
    x: number;
    y: number;
}

/**
 * Base class for Filter, Transition, Scene, and Input
 * @interface ObsSource
 * @property {object} settings - Object holding current settings of the source
 * @property {ObsProperties} properties - Returns properties structure associated with the source.
 * @property {number} status - The validity of the source
 * @property {string} id - The corresponding id of the source
 * @property {boolean} configurable - Whether the source has properties or not
 * @property {number} width - width of the source. 0 if audio only
 * @property {number} height - height of the source. 0 if audio only
 * @property {string} name - Name of the source when referencing it
 * @property {number} flags - Unsigned bit-field concerning various flags
 */
export interface ObsSource {
    /**
     * Release the underlying reference
     * @method release
     * @memberof ObsSource#
     */
    release(): void;

    /**
     * Send remove signal to other holders of the current reference.
     * @method remove
     * @memberof ObsSource#
     */
    remove(): void;

    /**
     * Update the settings of the source instance
     * correlating to the values held within the
     * object passed. 
     * @method update
     * @memberof ObsSource#
     * @param {object} settings - Object holding settings values
     */
    update(settings: object): void;

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
 * Describes the type of source.
 * @readonly
 * @enum
 * @name ESourceType
 * @property Input
 * @property Filter
 * @property Transition
 * @property Scene
 */
export const enum ESourceType {
    Input,
    Filter,
    Transition,
    Scene,
}

/**
 * Describes algorithm type to use for volume representation.
 * @readonly
 * @enum 
 * @name EFaderType
 * @property Cubic
 * @property IEC
 * @property Log
 */
export const enum EFaderType {
    Cubic,
    IEC,
    Log
}

/**
 * This is simply used to type check
 * objects passed back that hold internal
 * information when dealing with callbacks.
 * @interface ObsCallbackData
 */
export class ObsCallbackData {
    private constructor();
}

/**
 * @classdesc Object representation of a fader control. 
 * @class ObsFader
 * @hideconstructor
 * @property {number} db - Volume level of the control
 * @property {number} deflection - deflection representation of volume level
 * @property {number} mul - Multiplier represention of volume level
 */
export class ObsFader {
    private constructor();

    /**
     * Create an instance of a fader object
     * @param {EFaderType} type - What algorithm to use for new fader
     * @memberof ObsFader
     * @return {ObsFader} The created instance
     */
    static create(type: EFaderType): ObsFader;

    db: number;
    deflection: number;
    mul: number;

    /**
     * Attach to a source to monitor the volume of
     * @method attach
     * @param source Input source to attach to
     */
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
    update(settings: object): void;

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
    update(settings: object): void;

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
    static create(id: string, name: string, settings?: object, hotkeys?: object): ObsInput;
    static createPrivate(id: string, name: string, settings?: object): ObsInput;
    static fromName(name: string): ObsInput;
    static getPublicSources(): ObsInput[];
    volume: number;
    syncOffset: number;
    showing: boolean;
    audioMixers: number;


    duplicate(name?: string, is_private?: boolean): ObsInput;
    findFilter(name: string): ObsFilter;
    addFilter(filter: ObsFilter): void;
    removeFilter(filter: ObsFilter): void;
    readonly filters: ObsFilter[];

    //Source
    release(): void;
    remove(): void;
    update(settings: object): void;

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

    findItem(id: string | number): ObsSceneItem;
    getItems(): ObsSceneItem[];

    //Source
    release(): void;
    remove(): void;
    update(settings: object): void;

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

export interface ITransformInfo {
    readonly pos: IVec2;
    readonly rot: number;
    readonly scale: IVec2;
    readonly alignment: number;
    readonly boundsType: EBoundsType;
    readonly boundsAlignment: number;
    readonly bounds: IVec2;
}

export interface ICropInfo {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

export const enum EAlignment {
    Center,
    Left = (1 << 0),
    Right = (1 << 1),
    Top = (1 << 2),
    Bottom = (1 << 3),
    TopLeft = (Top | Left),
    TopRight = (Top | Right),
    BottomLeft = (Bottom | Left),
    BottomRight = (Bottom | Right)
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
    readonly transformInfo: ITransformInfo;
    readonly crop: ICropInfo;

    moveUp(): void;
    moveDown(): void;
    moveTop(): void;
    moveBottom(): void;
    move(position: number): void;

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
    readonly status: number;
    readonly name: string;
    readonly description: string;
    readonly longDescription: string;
    readonly enabled: boolean;
    readonly visible: boolean;
    readonly type: EPropertyType;
    readonly details: 
        IListProperty | IEditableListProperty | 
        IPathProperty | ITextProperty | 
        INumberProperty | {};
    readonly value: ObsProperty;
    readonly done: boolean;

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
    readonly graphics_module: string;
    readonly fps_num: number;
    readonly fps_den: number;
    readonly base_width: number;
    readonly base_height: number;
    readonly output_width: number;
    readonly output_height: number;
    readonly output_format: EFormat;
    readonly adapter: number;
    readonly gpu_conversion: boolean;
    readonly colorspace: EColorSpace;
    readonly range: ERangeType;
    readonly scale_type: EScaleType;
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