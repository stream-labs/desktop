/** 
 * Namespace representing the global libobs functionality
 */
export namespace ObsGlobal {
    /**
     * Initializes libobs global context
     * @param locale - Locale to be used within libobs
     * @param path - Data path of libobs
     */
    export function startup(locale: string, path?: string): void;

    /**
     * Uninitializes libobs global context
     */
    export function shutdown(): void;

    /**
     * Output channels are useful in that we can attach multiple
     * sources for output. For the most part, you're generally only
     * going to use one channel for video. However, if you so wanted, 
     * you could assign more to be layered on top of other channels. 
     * 
     * This also accepts audio input sources which are automatically 
     * mixed into the audio output. This means you can have a standalone
     * input source that isn't attached to the scene being rendered. 
     * @param channel - The output channel to assign source
     * @param input - The source to assign to the output channel
     */
    export function setOutputSource(channel: number, input: ObsInput | ObsTransition | ObsScene): void;

    /**
     * Obtains the source associated with a given output channel
     * @param channel - The output channel to fetch source of
     * @returns - The associated source or null if none was assigned to the given channel or channel was invalid.
     */
    export function getOutputSource(channel: number): ObsInput | ObsTransition | ObsScene;

    /**
     * Current status of the global libobs context
     */
    export const initialized: boolean;

    /**
     * Current locale of current libobs context
     */
    export const locale: string;

    /**
     * Version of current libobs context.
     * Represented as a 32-bit unsigned integer.
     * First 2 bytes are major.
     * Second 2 bytes are minor.
     * Last 4 bytes are patch.
     */
    export const version: number;
}

/**
 * Used for various 2-dimensional functions
 */
export interface IVec2 {
    readonly x: number;
    readonly y: number;
}

/**
 * Base class for Filter, Transition, Scene, and Input
 */
export interface ObsSource {
    /**
     * Release the underlying reference
     */
    release(): void;

    /**
     * Send remove signal to other holders of the current reference.
     */
    remove(): void;

    /**
     * Update the settings of the source instance
     * correlating to the values held within the
     * object passed. 
     */
    update(settings: object): void;

    /**
     * Object holding current settings of the source
     */
    readonly settings: object;
    
    /**
     * The properties of the source
     */
    readonly properties: ObsProperties;

    /**
     * The validity of the source
     */
    readonly status: number;

    /**
     * Type of the source
     */
    readonly type: ESourceType;

    /**
     * The corresponding id of the source
     */
    readonly id: string;
    
    /**
     * Whether the source has properties or not
     */
    readonly configurable: boolean;
 
    /**
     * Name of the source when referencing it
     */
    name: string;

    /**
     * Unsigned bit-field concerning various flags
     */
    flags: number;
}

/**
 * Describes the type of source
 */
export const enum ESourceType {
    Input,
    Filter,
    Transition,
    Scene,
}

/**
 * Describes algorithm type to use for volume representation.
 */
export const enum EFaderType {
    Cubic,
    IEC /* IEC 60-268-18 */,
    Log /* Logarithmic */
}

/**
 * This is simply used to type check
 * objects passed back that hold internal
 * information when dealing with callbacks.
 */
export class ObsCallbackData {
    private constructor();
}

/**
 * Class representing a fader control corresponding to a source.
 */
export class ObsFader {
    /**
     * Create an instance of a fader object
     * @param type - What algorithm to use for new fader.
     */
    static create(type: EFaderType): ObsFader;

    /**
     * Negative float representing volume using decibels.
     */
    db: number;

    /**
     * Percentage representing level of volume from 0% to 100%
     */
    deflection: number;

    /**
     * Multiplier representing volume levels
     */
    mul: number;

    /**
     * Attach to a source to monitor the volume of
     * @param source Input source to attach to
     */
    attach(source: ObsInput): void;

    /**
     * Detach from currently attached source.
     * Otherwise, is a no-op.
     */
    detach(): void;

    /**
     * Add a callback to the fader. Callback will be called
     * each time volume associated with the attached source changes. 
     * @param cb - A callback that occurs when volume changes.
     */
    addCallback(cb: (data: { db: number; }) => void): ObsCallbackData;

    /**
     * Remove a callback to prevent events from occuring immediately. 
     * @param cbData - Object passed back from a call to {@link ObsFader#addCallback}
     */
    removeCallback(cbData: ObsCallbackData): void;
}


/**
 * Object representing a volmeter control corresponding to a source.
 */
export class ObsVolmeter {
    private constructor();

    /**
     * Create an instance of a volmeter object
     * @param type - What algorithm to use for new fader.
     */
    static create(type: EFaderType): ObsVolmeter;

    /**
     * How long should the volmeter hold the peak volume value for?
     */
    peakHold: number;

    /**
     * The interval at which the volmeter will call the callback.
     */
    updateInterval: number;

    /**
     * Attaches to the volmeter object to a source
     * @param source Source to monitor the volume of
     */
    attach(source: ObsInput): void;

    /**
     * Detaches the currently attached source from the volmeter object
     */
    detach(): void;

    /**
     * Add a callback to the fader. Callback will be called
     * each time volume associated with the attached source changes. 
     * @param cb - A callback that occurs when volume changes.
     */
    addCallback(
        cb: (data: {
            level: number;
            magnitude: number;
            peak: number;
            muted: boolean; }) => void): ObsCallbackData;

    /**
     * Remove a callback to prevent events from occuring immediately. 
     * @param cbData - Object passed back from a call to {@link ObsVolmeter#addCallback}
     */
    removeCallback(cbData: ObsCallbackData): void;
}

/**
 * Class representing a filter
 */
export class ObsFilter implements ObsSource {
    private constructor();

    /**
     * Returns a list of available filter types for creation
     */
    static types(): string[];

    /**
     * Create an instance of an ObsFilter
     * @param id - ID of the filter, possibly returned from types()
     * @param name - Name of the filter
     * @param settings - Optional, settings to create the filter with
     * @returns - Created instance of ObsFilter or null if failure
     */
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
 * Class representing a transition
 */
export class ObsTransition implements ObsSource {
    private constructor();

    /**
     * Returns a list of available filter types for creation
     */
    static types(): string[];

    /**
     * Create a new instance of an ObsTransition
     * @param id - The type of transition source to create, possibly from {@link types}
     * @param name - Name of the created transition source
     * @param settings - Optional, settings to create transition source with
     * @param hotkeys - Optional, hotkey data associated with transition
     * @returns - Returns instance or null if failure
     */
    static create(id: string, name: string, settings?: object, hotkeys?: object): ObsTransition;

    /**
     * Create a new instance of an ObsTransition that's private
     * Private in this context means any function that returns an 
     * ObsTransition will not return this source
     * @param id - The type of transition source to create, possibly from {@link types}
     * @param name - Name of the created inptransitionut source
     * @param settings - Optional, settings to create transition source with
     * @returns - Returns instance or null if failure
     */
    static createPrivate(id: string, name: string, settings?: object): ObsTransition;

    /**
     * Obtain currently set input source.
     */
    getActiveSource(): ObsScene | ObsInput;

    /**
     * Clear the currently set input source
     */
    clear(): void;

    /**
     * Set a new input without transitioning.
     * @param input - Source to transition to
     */
    set(input: ObsInput | ObsScene): void;

    /**
     * Begins a transition into another scene/input source
     * @param ms - Length of time transition to new scene should take
     * @param input - Source to transition to
     */
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
 * Class representing a source
 * 
 * An input source can be either an audio or video or even both. 
 * So some of these don't make sense right now. For instance, there's
 * no reason tot call volume on a source that only provides video input. 
 */
export class ObsInput implements ObsSource {
    private constructor();

    /**
     * Returns a list of available filter types for creation
     */
    static types(): string[];

    /**
     * Create a new instance of an ObsInput
     * @param id - The type of input source to create, possibly from {@link types}
     * @param name - Name of the created input source
     * @param settings - Optional, settings to create input sourc with
     * @param hotkeys - Optional, hotkey data associated with input
     * @returns - Returns instance or null if failure
     */
    static create(id: string, name: string, settings?: object, hotkeys?: object): ObsInput;

    /**
     * Create a new instance of an ObsInput that's private
     * Private in this context means any function that returns an 
     * ObsInput will not return this source
     * @param id - The type of input source to create, possibly from {@link types}
     * @param name - Name of the created input source
     * @param settings - Optional, settings to create input source with
     * @returns - Returns instance or null if failure
     */
    static createPrivate(id: string, name: string, settings?: object): ObsInput;

    /**
     * Create an instance of an ObsInput by fetching the source by name.
     * @param name - Name of the source to look for
     * @returns - Returns instance or null if it failed to find the source
     */
    static fromName(name: string): ObsInput;

    /**
     * Fetches a list of all public input sources available.
     */
    static getPublicSources(): ObsInput[];

    volume: number;
    syncOffset: number;
    showing: boolean;
    audioMixers: number;

    /**
     * Create a new instance using the current instance. 
     * If no parameters are provide, an instance is created
     * using the current instance as if it were new. 
     * @param name - Name of new source
     * @param isPrivate - Whether or not the new source is private
     */
    duplicate(name?: string, isPrivate?: boolean): ObsInput;

    /**
     * Find a filter associated with the input source by name.
     * @param name - Name of filter to find
     * @returns - Returns the filter instance or null if it couldn't find the filter
     */
    findFilter(name: string): ObsFilter;

    /**
     * Attach a filter instance to this input source
     * @param filter - The filter instance to attach to this input source.
     */
    addFilter(filter: ObsFilter): void;

    /**
     * Remove a filter instance from this input source
     * @param filter - The filter instance to remove from this input source.
     */
    removeFilter(filter: ObsFilter): void;

    /**
     * Obtain a list of all filters associated with the input source
     */
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
 * Class representing a scene
 */
export class ObsScene implements ObsSource {
    private constructor();

    /**
     * Create a new scene instance
     * @param name - Name of the scene to create
     * @returns - Returns the instance or null on failure
     */
    static create(name: string): ObsScene;

    /**
     * Create a new scene instance that's private
     * @param name - Name of the scene to create
     * @returns - Returns the instance or null on failure
     */
    static createPrivate(name: string): ObsScene;

    /**
     * Create a new scene instance by fetching it by name
     * @param name - Name of the scene to look for
     * @returns - Returns the instance or null on failure to find the scene
     */
    static fromName(name: string): ObsScene;

    /**
     * Create a new instance of a scene using the current scene
     * @param name - New name of the duplicated scene
     * @param type - Method of scene item duplication
     */
    duplicate(name: string, type: ESceneDupType): ObsScene;

    /**
     * Add an input source to the scene, creating a scene item.
     * @param source - Input source to add to the scene
     * @returns - Return the sceneitem or null on failure
     */
    add(source: ObsInput): ObsSceneItem;
    
    /**
     * A scene may be used as an input source (even though its type
     * will still be of the value Scene). To use a scene as an ObsInput,
     * simply fetch this property.
     */
    readonly source: ObsInput;

    /**
     * Orders an item from the old index to the new index (from bottom to top)
     * @param oldIndex - Item index
     * @param newIndex - Index where you want to move item
     */
    moveItem(oldIndex: number, newIndex: number): void;

    /**
     * Find an item within a scene
     * 
     * @param id - A string representing the name of the
     * underlying source of the item to search for or an integer specifying 
     * the id assigned to the item when it was created.
     * 
     * @returns - The found item instance or null
     */
    findItem(id: string | number): ObsSceneItem;

    /**
     * Find an item within a scene by index
     * 
     * @param idx - An integer representing the index the item sits at within the scene
     * @returns - The item instance or null if the index was bad
     */
    getItemAtIdx(idx: number): ObsSceneItem;

    /**
     * Fetch all items within the scene
     * @returns - The array of item instances
     */
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

/**
 * Interface describing the transform information in an item
 */
export interface ITransformInfo {
    readonly pos: IVec2;
    readonly rot: number;
    readonly scale: IVec2;
    readonly alignment: EAlignment;
    readonly boundsType: EBoundsType;
    readonly boundsAlignment: number;
    readonly bounds: IVec2;
}

/**
 * Interface describing the crop of an item.
 */
export interface ICropInfo {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

/**
 * A binary flag representing alignment
 */
export const enum EAlignment {
    Center = 0,
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
 * Class representing an item within a scene. 
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

    /** The underlying input source associated with this item */
    readonly source: ObsInput;

    /** The scene this item is in */
    readonly scene: ObsScene;

    /** The id assigned to this item when its created */
    readonly id: number;

    /** A flag determining whether the item is selected */
    selected: boolean;

    /** Position of the item */
    position: IVec2;

    /** Rotation of the in degrees */
    rotation: number;

    /** Scale of the item, with 1 being to scale */
    scale: IVec2;

    alignment: EAlignment;
    boundsAlignment: number;
    bounds: IVec2;

    /** How to apply bounds */
    boundsType: EBoundsType;

    /** How to apply scale */
    scaleFilter: EScaleType;

    /** Whether or not the item is visible */
    visible: boolean;

    /**
     * Transform information on the item packed into
     * a single convenient object
     */
    readonly transformInfo: ITransformInfo;

    /** Current crop applied to the item */
    crop: ICropInfo;

    /** Move the item towards the top-most item one spot */
    moveUp(): void;

    /** Move the item towards the bottom-most item one spot */
    moveDown(): void;

    /** Make the item the top-most item */
    moveTop(): void;

    /** Make the item the bottom-most item */
    moveBottom(): void;

    /**
     * Move the item to the specified position.
     * @param position Position relative to the bottom-most item
     */
    move(position: number): void;

    /** Remove the item from the scene it's attached to (destroys the item!) */
    remove(): void;

    /** Prevent updating of the item to prevent data races */
    deferUpdateBegin(): void;

    /** Allow updating of the item after calling {@link deferUpdateBegin} */
    deferUpdateEnd(): void;
}

/**
 * Enumeration describing the type of a property
 */
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

    /**
     * A list of options to be made available within the list.
     * You can determine if it's a string or number by testing
     * {@link IListProperty#format}
     */
    readonly items: string[] | number[];
}

export interface IEditableListProperty extends IListProperty {
    readonly type: EEditableListType;

     /** String describing allowed valued */
    readonly filter: string;

    /** Default value for the editable box */
    readonly defaultPath: string;

    //IListProperty
    readonly format: EListFormat;
    readonly items: string[] | number[];
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
 * Class representing an entry in a properties list (Properties).
 */
export class ObsProperty {
    private constructor();

    /** The validity of the current property instance */
    readonly status: number;

    /**
     * The name associated with the property
     * You can use this name to fetch from the source
     * settings object (see {@link ObsSource#settings})
     * if you need the value set on this property. 
     */
    readonly name: string;

    /** A short description of the property */
    readonly description: string;

    /** A long detailed description of the property */
    readonly longDescription: string;

    /** Whether or not the property is enabled */
    readonly enabled: boolean;

    /** Whether or not the property should be made visible */
    readonly visible: boolean;

    /** Type of the property */
    readonly type: EPropertyType;

    /**
     * If a property instance is of a certain type, you can
     * fetch additional data (such as items that should
     * be available within a list box) from this.
     * 
     * Check each individual enumeration for more details.
     * 
     * Use {@link ObsProperty#type} to test for property type.
     * If the type doesn't have additional info, this will be
     * a value of `{}`
     */
    readonly details: 
        IListProperty | IEditableListProperty | 
        IPathProperty | ITextProperty | 
        INumberProperty | {};

    /** Whether or not iterating is finished. */
    readonly done: boolean;

    /**
     * Uses the current object to obtain the next
     * property in the properties list.
     * 
     * Check status or done in order to make
     * sure the property is still valid after using.
     */
    next(): void;
}

/**
 * Object representing a list of properties. 
 * 
 * Use .properties member on an encoder, source, output, or service
 * to obtain an instance.
 */
export class ObsProperties {
    private constructor();
    /** Obtains the status of the list */
    readonly status: number;

    /** Obtains the first property in the list. */
    first(): ObsProperty;

    count(): number;

    /**
     * Obtains property matching name.
     * @param name The name of the property to fetch.
     * @returns - The property instance or null if not found
     */
    get(name: string): ObsProperty;
}

export class ObsModule {
    private constructor();
    static create(binPath: string, dataPath: string): ObsModule;
    static loadAll(): void;
    static addPath(path: string, dataPath: string): void;
    static logLoaded(): void;
    initialize(): void;
    filename(): string;
    name(): string;
    author(): string;
    description(): string;
    binPath(): string;
    dataPath(): string;
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

export const enum EOutputFormat {
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

export interface IVideoInfo {
    readonly graphicsModule: string;
    readonly fpsNum: number;
    readonly fpsDen: number;
    readonly baseWidth: number;
    readonly baseHeight: number;
    readonly outputWidth: number;
    readonly outputHeight: number;
    readonly outputFormat: EOutputFormat;
    readonly adapter: number;
    readonly gpuConversion: boolean;
    readonly colorspace: EColorSpace;
    readonly range: ERangeType;
    readonly scaleType: EScaleType;
}

/**
 * This represents a video_t structure from within libobs
 * For now, only the global context functions are implemented
 */
export class ObsVideo {
    private constructor();
    
    static reset(info: IVideoInfo): void;
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