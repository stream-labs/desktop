import { IWidgetSettings } from '../../widgets-api';

export interface IAlertBoxApiResponse {
  data: IAlertBoxSettings;
  message: string;
  success: boolean;
}

export interface IAlertTypesResponse {
  success: boolean;
  message: string;
  data: {
    streamlabs: {
      donation: IAlertType;
      merch: IAlertType;
      loyalty_store_redemption: IAlertType;
    };
    twitch_account: {
      follow: IAlertType;
      sub: IAlertType;
      resub: IAlertType;
      bits: IAlertType;
      raid: IAlertType;
      twitchcharitydonation: IAlertType;
    };
    youtube_account: {
      subscriber: IAlertType;
      sponsor: IAlertType;
      membershipGift: IAlertType;
      fanfunding: IAlertType;
    };
    facebook_account: {
      facebook_share: IAlertType;
      facebook_support: IAlertType;
      facebook_support_gifter: IAlertType;
      facebook_stars: IAlertType;
      facebook_like: IAlertType;
      facebook_follow: IAlertType;
    };
    trovo_account: {
      trovo_follow: IAlertType;
      trovo_sub: IAlertType;
      trovo_raid: IAlertType;
    };
    // Integrations
    patreon: {
      pledge: IAlertType;
    };
    streamlabscharity: {
      streamlabscharitydonation: IAlertType;
    };
    extralife: {
      eldonation: IAlertType;
    };
    tiltify: {
      tiltifydonation: IAlertType;
    };
    treatstream: {
      treat: IAlertType;
    };
    donordrive: {
      donordrivedonation: IAlertType;
    };
    justgiving: {
      justgivingdonation: IAlertType;
    };
  };
}

export interface IAlertType {
  type: string;
  title: string;
  default_message_template: string;
  variation_types: {
    alert_type: string;
    condition: string;
    description: string;
    condition_label: string;
    condition_data_label: string;
    default_message_template: string;
    available_tokens: string[];
  }[];
  platform: TServerPlatform;
  widget_test_type: string;
  widget_filter_query_param: string;
}

export type TServerPlatform =
  | 'twitch_account'
  | 'youtube_account'
  | 'facebook_account'
  | 'trovo_account';

export interface IAlertBoxSettings {
  settings: IAlertBoxApiSettings;
  active_profile: unknown;
  widget_url: string;
  widget_preview_url: string;
  donation_currency: DonationCurrency;
  show_onboarding: boolean;
  show_tutorial: boolean;
  show_old_media_share: boolean;
  preview_window: {
    muted: boolean;
  };
  // FIXME: to satisfy widget interface, will remove
  custom_enabled: never;
  custom_html: never;
  custom_css: never;
  custom_js: never;
}

export interface IAlertBoxApiSettings {
  global: {
    general: IAlertBoxGeneralSettings;
    tipping: IAlertBoxDonationSettings;
    cloudbot_redemption: unknown;
    live_actions: {
      alerts_master_sound_volume: PositiveNumber;
      tts_master_sound_volume: PositiveNumber;
    };
    merch: IAlertBoxMerchSettings;
    mobile: {
      mobile_custom_theme_id: PositiveNumber;
    };
  };
  platforms: {
    twitch: IAlertBoxTwitchSettings | null;
    youtube: IAlertBoxYouTubeSettings | null;
    facebook: IAlertBoxFacebookSettings | null;
    picarto: IAlertBoxPicartoSettings | null;
    trovo: IAlertBoxTrovoSettings | null;
  };
  /*
   * TODO: only Patreon is an object in API docs, but the rest are marked
   *  as strings, given interfaces exist for these we're not sure if there's
   *  something wrong with the docs until we can test.
   */
  integrations: {
    streamlabscharity: string | null;
    patreon: IAlertBoxPatreonSettings | null;
    extralife: string | null;
    tiltify: string | null;
    justgiving: string | null;
    treatstream: string | null;
    donordrive: string | null;
  };
}

export interface IAlertBoxTwitchSettings {
  follows: IAlertBoxFollowSettings;
  subscriptions: IAlertBoxTwitchSubSettings;
  bits: IAlertBoxBitsSettings;
  raids: IAlertBoxTwitchRaidSettings;
  twitch_charity: IAlertBoxTwitchCharitySettings;
}

export interface IAlertBoxYouTubeSettings {
  subscribers: IAlertBoxYoutubeSubscriberSettings;
  members: IAlertBoxYoutubeMemberSettings;
  super_chats: IAlertBoxSuperChatSettings;
}

export interface IAlertBoxFacebookSettings {}

export interface IAlertBoxPicartoSettings {}

export interface IAlertBoxTrovoSettings {
  follows: IAlertBoxTrovoFollowSettings;
  raids: IAlertBoxTrovoRaidSettings;
  subscriptions: IAlertBoxTrovoSubSettings;
}

export interface IAlertBoxTrovoSubSettings {
  trovo_sub_enabled: boolean;
  trovo_sub_layout: AlertLayout;
  trovo_sub_show_animation: ShowAnimation;
  trovo_sub_hide_animation: HideAnimation;
  trovo_sub_message_template: MessageTemplate;
  trovo_sub_text_animation: TextAnimation;
  trovo_sub_image_href: CDNUrl;
  trovo_sub_sound_href: RelativePathStr;
  trovo_sub_sound_volume: PositiveNumber;
  trovo_sub_alert_duration: DurationMs;
  trovo_sub_text_delay: PositiveNumber;
  trovo_sub_custom_html_enabled: boolean;
  trovo_sub_custom_html: CustomHTML;
  trovo_sub_custom_js: CustomJS;
  trovo_sub_custom_css: CustomCSS;
  trovo_sub_custom_json: CustomJSON;
  show_trovo_resub_message: boolean;
  trovo_resub_message_font: FontFamily;
  trovo_resub_message_font_size: FontSize;
  trovo_resub_message_font_weight: FontWeight;
  trovo_resub_message_font_color: FontColor;
  trovo_resub_tts_enabled: boolean;
  trovo_resub_tts_language: TTSLanguage;
  trovo_resub_tts_security: IntBool;
  trovo_resub_tts_repetition_block_length: 0;
  trovo_resub_tts_volume: 75;
  trovo_resub_tts_include_message_template: false;
  trovo_sub_font: 'Open Sans';
  trovo_sub_font_size: '64px';
  trovo_sub_font_weight: 800;
  trovo_sub_font_color: '#FFFFFF';
  trovo_sub_font_color2: '#32C3A6';
  trovo_resub_message_allow_emotes: true;
  trovo_sub_variations: [];
}

export interface IAlertBoxTrovoFollowSettings {
  trovo_follow_enabled: boolean;
  trovo_follow_layout: AlertLayout;
  trovo_follow_show_animation: ShowAnimation;
  trovo_follow_hide_animation: HideAnimation;
  trovo_follow_message_template: MessageTemplate;
  trovo_follow_text_animation: TextAnimation;
  trovo_follow_image_href: CDNUrl;
  trovo_follow_sound_href: RelativePathStr;
  trovo_follow_sound_volume: PositiveNumber;
  trovo_follow_alert_duration: DurationMs;
  trovo_follow_text_delay: PositiveNumber;
  trovo_follow_custom_html_enabled: boolean;
  trovo_follow_custom_html: CustomHTML;
  trovo_follow_custom_js: CustomJS;
  trovo_follow_custom_css: CustomCSS;
  trovo_follow_custom_json: CustomJSON;
  trovo_follow_font: FontFamily;
  trovo_follow_font_size: FontSize;
  trovo_follow_font_weight: FontWeight;
  trovo_follow_font_color: FontColor;
  trovo_follow_font_color2: FontColor;
  trovo_follow_variations: IAlertBoxVariation[];
}

export interface IAlertBoxTrovoRaidSettings {
  trovo_raid_enabled: true;
  trovo_raid_layout: 'above';
  trovo_raid_show_animation: 'fadeIn';
  trovo_raid_hide_animation: 'fadeOut';
  trovo_raid_raider_minimum: 0;
  trovo_raid_message_template: '{name} is raiding with a party of {count}!';
  trovo_raid_text_animation: 'wiggle';
  trovo_raid_image_href: 'https://cdn.streamlabs.com/library/giflibrary/jumpy-kevin.webm';
  trovo_raid_sound_href: '/sounds/gallery/default.ogg';
  trovo_raid_sound_volume: 50;
  trovo_raid_alert_duration: 8000;
  trovo_raid_text_delay: 0;
  trovo_raid_custom_html_enabled: false;
  trovo_raid_custom_html: '';
  trovo_raid_custom_js: '';
  trovo_raid_custom_css: '';
  trovo_raid_custom_json: null;
  trovo_raid_font: 'Open Sans';
  trovo_raid_font_size: '64px';
  trovo_raid_font_weight: 800;
  trovo_raid_font_color: '#FFFFFF';
  trovo_raid_font_color2: '#32C3A6';
  trovo_raid_variations: [];
}

export interface IAlertBoxSuperChatSettings {
  fanfunding_enabled: boolean;
  fanfunding_layout: AlertLayout;
  fanfunding_show_animation: ShowAnimation;
  fanfunding_hide_animation: HideAnimation;
  fanfunding_tts_enabled: boolean;
  fanfunding_tts_min_amount: PositiveNumber;
  fanfunding_tts_language: FontFamily;
  fanfunding_tts_security: IntBool;
  fanfunding_tts_repetition_block_length: PositiveNumber;
  fanfunding_tts_volume: PositiveNumber;
  fanfunding_tts_include_message_template: boolean;
  fanfunding_alert_min_amount: PositiveNumber;
  recent_events_fanfunding_min_amount: PositiveNumber;
  fanfunding_message_template: MessageTemplate;
  fanfunding_text_animation: TextAnimation;
  fanfunding_image_href: CDNUrl;
  fanfunding_sound_href: RelativePathStr;
  fanfunding_sound_volume: PositiveNumber;
  fanfunding_alert_duration: DurationMs;
  fanfunding_text_delay: PositiveNumber;
  fanfunding_custom_html_enabled: boolean;
  fanfunding_custom_html: CustomHTML;
  fanfunding_custom_js: CustomJS;
  fanfunding_custom_css: CustomCSS;
  fanfunding_custom_json: CustomJSON;
  show_fanfunding_message: boolean;
  fanfunding_alert_message_min_amount: PositiveNumber;
  fanfunding_message_font: FontFamily;
  fanfunding_message_font_size: FontSize;
  fanfunding_message_font_weight: FontWeight;
  fanfunding_message_font_color: FontColor;
  fanfunding_font: FontFamily;
  fanfunding_font_size: FontSize;
  fanfunding_font_weight: FontWeight;
  fanfunding_font_color: FontColor;
  fanfunding_font_color2: FontColor;
  fanfunding_variations: IAlertBoxVariation[];
}

export interface IAlertBoxYoutubeSubscriberSettings {
  subscriber_enabled: boolean;
  subscriber_layout: AlertLayout;
  subscriber_show_animation: ShowAnimation;
  subscriber_hide_animation: HideAnimation;
  subscriber_message_template: string;
  subscriber_text_animation: TextAnimation;
  subscriber_image_href: CDNUrl;
  subscriber_sound_href: RelativePathStr;
  subscriber_sound_volume: PositiveNumber;
  subscriber_alert_duration: PositiveNumber;
  subscriber_text_delay: PositiveNumber;
  subscriber_custom_html_enabled: boolean;
  subscriber_custom_html: CustomHTML;
  subscriber_custom_js: CustomJS;
  subscriber_custom_css: CustomCSS;
  subscriber_custom_json: CustomJSON;
  subscriber_font: FontFamily;
  subscriber_font_size: FontSize;
  subscriber_font_weight: FontWeight;
  subscriber_font_color: FontColor;
  subscriber_font_color2: FontColor;
  subscriber_variations: IAlertBoxVariation[];
}

export interface IAlertBoxYoutubeMemberSettings {
  sponsor_enabled: boolean;
  sponsor_layout: AlertLayout;
  sponsor_show_animation: ShowAnimation;
  sponsor_hide_animation: HideAnimation;
  sponsor_tts_enabled: boolean;
  sponsor_tts_min_amount: PositiveNumber;
  sponsor_tts_language: FontFamily;
  sponsor_tts_security: IntBool;
  sponsor_tts_repetition_block_length: PositiveNumber;
  sponsor_tts_volume: PositiveNumber;
  sponsor_tts_include_message_template: boolean;
  sponsor_message_template: MessageTemplate;
  sponsor_text_animation: TextAnimation;
  sponsor_image_href: CDNUrl;
  sponsor_sound_href: RelativePathStr;
  sponsor_sound_volume: PositiveNumber;
  sponsor_alert_duration: PositiveNumber;
  sponsor_text_delay: PositiveNumber;
  sponsor_custom_html_enabled: false;
  sponsor_custom_html: CustomHTML;
  sponsor_custom_js: CustomJS;
  sponsor_custom_css: CustomCSS;
  sponsor_custom_json: CustomJSON;
  show_sponsor_message: boolean;
  sponsor_message_font: FontFamily;
  sponsor_message_font_size: FontSize;
  sponsor_message_font_weight: FontWeight;
  sponsor_message_font_color: FontColor;
  sponsor_font: FontFamily;
  sponsor_font_size: FontSize;
  sponsor_font_weight: FontWeight;
  sponsor_font_color: FontColor;
  sponsor_font_color2: FontColor;
  member_gift_message_template: MessageTemplate;
  member_gift_message_level_template: MessageTemplate;
  member_gif_image_href: CDNUrl;
  member_gift_sound_href: CDNUrl;
  sponsor_variations: IAlertBoxVariation[];
}

// region Type Aliases
type ShowAnimation = 'fadeIn' | string;
type HideAnimation = 'fadeOut' | string;
type AlertLayout = string;
type TTSLanguage = string;
type IntBool = number;
type PositiveNumber = number;
type TextAnimation = 'wiggle' | string;
/** URL from cdn.streamlabs.com or uploads.twitchalerts.com **/
type CDNUrl = string;
type RelativePathStr = string;
type FontFamily = string;
type FontSize = string;
type FontWeight = PositiveNumber;
type HexColor = string;
type FontColor = HexColor;
type GifAnimation = 'before' | string;
type CustomCode = string | null;
type CustomHTML = CustomCode;
type CustomJS = CustomCode;
type CustomCSS = CustomCode;
type CustomJSON = CustomCode;
type MessageTemplate = string;
type DurationInSec = number;
type DurationMs = number;
type DonationCurrency = string;
type Volume = PositiveNumber;
type TextDelay = DurationInSec; // not sure
// endregion

export interface IAlertBoxTwitchCharitySettings {
  twitchcharitydonation_enabled: boolean;
  twitchcharitydonation_layout: AlertLayout;
  twitchcharitydonation_show_animation: ShowAnimation;
  twitchcharitydonation_hide_animation: HideAnimation;
  twitchcharitydonation_tts_enabled: boolean;
  twitchcharitydonation_tts_min_amount: PositiveNumber;
  twitchcharitydonation_tts_language: TTSLanguage;
  twitchcharitydonation_tts_security: IntBool;
  twitchcharitydonation_tts_repetition_block_length: number;
  twitchcharitydonation_tts_volume: PositiveNumber;
  twitchcharitydonation_tts_include_message_template: boolean;
  twitchcharitydonation_alert_min_amount: PositiveNumber;
  recent_events_twitchcharitydonation_min_amount: PositiveNumber;
  auto_twitchcharitydonation_enabled: boolean;
  twitchcharitydonation_viewer_minimum: PositiveNumber;
  twitchcharitydonation_gif_enabled: boolean;
  twitchcharitydonation_message_template: string;
  twitchcharitydonation_text_animation: TextAnimation;
  twitchcharitydonation_image_href: CDNUrl;
  twitchcharitydonation_sound_href: RelativePathStr;
  twitchcharitydonation_sound_volume: PositiveNumber;
  twitchcharitydonation_alert_duration: PositiveNumber;
  twitchcharitydonation_text_delay: PositiveNumber;
  twitchcharitydonation_custom_html_enabled: boolean;
  twitchcharitydonation_custom_html: string;
  twitchcharitydonation_custom_js: string;
  twitchcharitydonation_custom_css: string;
  twitchcharitydonation_custom_json: string;
  twitchcharitydonation_font: FontFamily;
  twitchcharitydonation_font_size: FontSize;
  twitchcharitydonation_font_weight: FontWeight;
  twitchcharitydonation_font_color: FontColor;
  twitchcharitydonation_font_color2: FontColor;
  show_twitchcharitydonation_message: boolean;
  twitchcharitydonation_alert_message_min_amount: PositiveNumber;
  twitchcharitydonation_message_font: FontFamily;
  twitchcharitydonation_message_font_size: FontSize;
  twitchcharitydonation_message_font_weight: FontWeight;
  twitchcharitydonation_message_font_color: FontColor;
  twitchcharitydonation_variations: IAlertBoxVariation[];
  twitchcharitydonation_gifs_min_amount_to_share: PositiveNumber;
  twitchcharitydonation_gif_library_enabled: boolean;
  twitchcharitydonation_gif_animation: GifAnimation;
  twitchcharitydonation_max_gif_duration: PositiveNumber;
}

export interface IAlertBoxFollowsSettings {
  follow_enabled: boolean;
  follow_layout: string;
}

// GENERAL SETTINGS
interface IAlertBoxGeneralSettings {
  alert_delay: number;
  auto_host_enabled: boolean;
  background_color: string;
  layout: string;
  moderation_delay: number;
  unlimited_media_moderation_delay: boolean;
  automatically_reset_session: boolean;
  censor_streamer_recent_events: boolean;
  display_mtg_codes: boolean;
  interrupt_mode: boolean;
  interrupt_mode_delay: number;

  // SHOW MESSAGES
  /*
  show_bits_message: boolean;
  show_donation_message: boolean;
  show_donordrivedonation_message: boolean;
  show_eldonation_message: boolean;
  show_justgivingdonation_message: boolean;
  show_merch_message: boolean;
  show_resub_message: boolean;
  show_smfredemption_message: boolean;
  show_tiltifydonation_message: boolean;
  show_treat_message: boolean;
  facebook_show_stars_message: boolean;

  // WHITE-LISTED SETTINGS
  bits_alert_min_amount: number;
  donation_alert_min_amount: number;
  host_viewer_minimum: number;
  raid_raider_minimum: number;
  recent_events_donation_min_amount: number;
  recent_events_host_min_viewer_count: number;
  fanfunding_alert_min_amount: number;
   */
}

// ALERT VARIATION
export interface IAlertBoxVariation {
  condition: string;
  conditionData: any;
  conditions: { type: string; description: string }[];
  name: string;
  id: string;
  deleteable?: boolean;
  settings: {
    useSkillImage?: boolean;
    embersEnabled?: boolean;
    minEmbersTrigger?: number;
    sparksEnabled?: boolean;
    minSparksTrigger?: number;
    customCss: string;
    customHtml: string;
    customHtmlEnabled: boolean;
    customJs: string;
    customJson: string;
    duration: number;
    hideAnimation: string;
    image: { href: string };
    layout: string;
    showAnimation: string;
    sound: { href: string; volume: number };
    text: {
      animation: string;
      color: string;
      color2: string;
      font: string;
      format: string;
      resubFormat?: string;
      tierUpgradeFormat?: string;
      size: number;
      thickness: number;
    };
    textDelay: number;
    type: string;
    useCustomImage?: boolean;
    moderation?: string;
    message?: {
      minAmount: number;
      allowEmotes: boolean;
      font: string;
      color: string;
      size: string;
      weight: string;
    };
    tts?: {
      minAmount: number;
      enabled: boolean;
      language: string;
      security: number;
      volume: number;
    };
    gif?: {
      enabled: boolean;
      gfycatLibraryEnabled: boolean;
      animation: string;
      libraryDefaults: string;
      libraryEnabled: boolean;
      minAmount: number;
      duration: number;
    };
  };
}

// SUBS
interface IAlertBoxSubSettings {
  sub_alert_duration: number;
  sub_custom_css: string;
  sub_custom_html: string;
  sub_custom_html_enabled: false;
  sub_custom_js: string;
  sub_custom_json: string;
  sub_enabled: boolean;
  sub_font: string;
  sub_font_color: string;
  sub_font_color2: string;
  sub_font_size: string;
  sub_font_weight: number;
  sub_hide_animation: string;
  sub_image_href: string;
  sub_layout: string;
  sub_message_template: string;
  sub_show_animation: string;
  sub_sound_href: string;
  sub_sound_volume: number;
  sub_text_animation: string;
  sub_text_delay: number;
  sub_variations: IAlertBoxVariation[];
}

type IAlertBoxTwitchSubSettings = IAlertBoxSubSettings & {
  prime_sub_enabled: boolean;
};

// RESUBS
interface IAlertBoxResubSettings {
  resub_message_allow_emotes: boolean;
  resub_message_font: string;
  resub_message_font_color: string;
  resub_message_font_size: string;
  resub_message_font_weight: string;
  resub_tts_enabled: boolean;
  resub_tts_language: string;
  resub_tts_security: number;
  resub_tts_volume: number;
}

// BITS
interface IAlertBoxBitsSettings {
  bits_enabled: boolean;
  bits_layout: AlertLayout;
  bits_show_animation: ShowAnimation;
  bits_hide_animation: HideAnimation;
  bits_tts_enabled: boolean;
  bits_tts_min_amount: PositiveNumber;
  bits_tts_language: TTSLanguage;
  bits_tts_security: IntBool;
  bits_tts_repetition_block_length: PositiveNumber;
  bits_tts_volume: PositiveNumber;
  bits_tts_include_message_template: boolean;
  bits_alert_min_amount: PositiveNumber;
  recent_events_bits_min_amount: PositiveNumber;
  bits_message_template: MessageTemplate;
  bits_text_animation: TextAnimation;
  bits_image_href: CDNUrl;
  bits_sound_href: CDNUrl;
  bits_sound_volume: Volume;
  bits_alert_duration: DurationMs;
  bits_text_delay: TextDelay;
  bits_custom_html_enabled: boolean;
  bits_custom_html: CustomHTML;
  bits_custom_js: CustomJS;
  bits_custom_css: CustomCSS;
  bits_custom_json: CustomJSON;
  show_bits_message: boolean;
  bits_message_allow_emotes: boolean;
  bits_alert_message_min_amount: PositiveNumber;
  bits_message_font: FontFamily;
  bits_message_font_size: FontSize;
  bits_message_font_weight: FontWeight;
  bits_message_font_color: FontColor;
  bits_font: FontFamily;
  bits_font_size: FontSize;
  bits_font_weight: FontWeight;
  bits_font_color: FontColor;
  bits_font_color2: FontColor;
}

// NORMAL DONATIONS
interface IAlertBoxDonationSettings {
  donation_enabled: boolean;
  donation_layout: AlertLayout;
  donation_show_animation: ShowAnimation;
  donation_hide_animation: HideAnimation;
  donation_tts_enabled: boolean;
  donation_tts_min_amount: PositiveNumber;
  donation_tts_language: TTSLanguage;
  donation_tts_security: IntBool;
  donation_tts_repetition_block_length: PositiveNumber;
  donation_tts_volume: PositiveNumber;
  donation_tts_include_message_template: boolean;
  donation_alert_min_amount: PositiveNumber;
  recent_events_donation_min_amount: PositiveNumber;
  donation_message_template: MessageTemplate;
  donation_text_animation: TextAnimation;
  donation_image_href: CDNUrl;
  donation_sound_href: RelativePathStr;
  donation_sound_volume: PositiveNumber;
  donation_alert_duration: DurationMs;
  donation_text_delay: PositiveNumber;
  donation_clipping_enabled: boolean;
  donation_custom_html_enabled: boolean;
  donation_custom_html: CustomHTML;
  donation_custom_js: CustomJS;
  donation_custom_css: CustomCSS;
  donation_custom_json: CustomJSON;
  show_donation_message: boolean;
  donation_message_allow_emotes: boolean;
  donation_alert_message_min_amount: PositiveNumber;
  donation_message_font: FontFamily;
  donation_message_font_size: FontSize;
  donation_message_font_weight: FontWeight;
  donation_message_font_color: FontColor;
  donation_font: FontFamily;
  donation_font_size: FontSize;
  donation_font_weight: FontWeight;
  donation_font_color: FontColor;
  donation_font_color2: FontColor;
  donation_gif_enabled: boolean;
  donation_effect_enabled: boolean;
  donation_variations: IAlertBoxVariation[];
  donation_gifs_min_amount_to_share: PositiveNumber;
  donation_gif_library_enabled: boolean;
  donation_gif_animation: GifAnimation;
  donation_max_gif_duration: DurationInSec;
}

// FOLLOWS
interface IAlertBoxFollowSettings {
  follow_enabled: boolean;
  follow_layout: string;
  follow_show_animation: string;
  follow_hide_animation: string;
  follow_message_template: string;
  follow_text_animation: string;
  follow_image_href: string;
  follow_sound_href: string;
  follow_sound_volume: number;
  follow_alert_duration: number;
  follow_text_delay: number;
  follow_custom_css: string;
  follow_custom_html_enabled: boolean;
  follow_custom_html: string;
  follow_custom_js: string;
  follow_custom_json: string;
  follow_font: string;
  follow_font_size: string;
  follow_font_weight: number;
  follow_font_color: string;
  follow_font_color2: string;
  follow_variations: IAlertBoxVariation[];
}

// STARS
interface IAlertBoxStarSettings {
  star_alert_duration: number;
  star_custom_css: string;
  star_custom_html: string;
  star_custom_html_enabled: boolean;
  star_custom_js: string;
  star_custom_json: string;
  star_enabled: boolean;
  star_font: string;
  star_font_color: string;
  star_font_color2: string;
  star_font_size: string;
  star_font_weight: number;
  star_hide_animation: string;
  star_image_href: string;
  star_layout: string;
  star_message_template: string;
  star_show_animation: string;
  star_sound_href: string;
  star_sound_volume: number;
  star_text_animation: string;
  star_text_delay: number;
  star_variations: IAlertBoxVariation[];
}

// LIKES
interface IAlertBoxLikeSettings {
  like_alert_duration: number;
  like_custom_css: string;
  like_custom_html: string;
  like_custom_html_enabled: boolean;
  like_custom_js: string;
  like_custom_json: string;
  like_enabled: boolean;
  like_font: string;
  like_font_color: string;
  like_font_color2: string;
  like_font_size: string;
  like_font_weight: number;
  like_hide_animation: string;
  like_image_href: string;
  like_layout: string;
  like_message_template: string;
  like_show_animation: string;
  like_sound_href: string;
  like_sound_volume: number;
  like_text_animation: string;
  like_text_delay: number;
  like_variations: IAlertBoxVariation[];
}

// SUPPORT
interface IAlertBoxSupportSettings {
  support_alert_duration: number;
  support_custom_css: string;
  support_custom_html: string;
  support_custom_html_enabled: boolean;
  support_custom_js: string;
  support_custom_json: string;
  support_enabled: boolean;
  support_font: string;
  support_font_color: string;
  support_font_color2: string;
  support_font_size: string;
  support_font_weight: number;
  support_hide_animation: string;
  support_image_href: string;
  support_layout: string;
  support_message_template: string;
  support_show_animation: string;
  support_sound_href: string;
  support_sound_volume: number;
  support_text_animation: string;
  support_text_delay: number;
  support_variations: IAlertBoxVariation[];
}

// HOSTS
interface IAlertBoxHostSettings {
  host_alert_duration: number;
  host_custom_css: string;
  host_custom_html: string;
  host_custom_html_enabled: boolean;
  host_custom_js: string;
  host_custom_json: string;
  host_enabled: boolean;
  host_font: string;
  host_font_color: string;
  host_font_color2: string;
  host_font_size: string;
  host_font_weight: number;
  host_hide_animation: string;
  host_image_href: string;
  host_layout: string;
  host_message_template: string;
  host_show_animation: string;
  host_sound_href: string;
  host_sound_volume: number;
  host_text_animation: string;
  host_text_delay: number;
  host_variations: IAlertBoxVariation[];
}

// MERCH
interface IAlertBoxMerchSettings {
  merch_alert_duration: number;
  merch_custom_css: string;
  merch_custom_html: string;
  merch_custom_html_enabled: boolean;
  merch_custom_js: string;
  merch_custom_json: string;
  merch_enabled: boolean;
  merch_font: string;
  merch_font_color: string;
  merch_font_color2: string;
  merch_font_size: string;
  merch_font_weight: string;
  merch_hide_animation: string;
  merch_image_href: string;
  merch_layout: string;
  merch_message_allow_emotes: boolean;
  merch_message_font: string;
  merch_message_font_color: string;
  merch_message_font_size: string;
  merch_message_font_weight: string;
  merch_message_template: string;
  merch_moderation: boolean;
  merch_show_animation: string;
  merch_sound_href: string;
  merch_sound_volume: number;
  merch_text_animation: string;
  merch_text_delay: number;
  merch_use_custom_image: boolean;
  merch_variations: IAlertBoxVariation[];
}

// RAIDS
interface IAlertBoxTwitchRaidSettings {
  raid_enabled: boolean;
  raid_layout: AlertLayout;
  raid_show_animation: ShowAnimation;
  raid_hide_animation: HideAnimation;
  raid_raider_minimum: PositiveNumber;
  recent_events_raid_min_viewer_count: PositiveNumber;
  raid_message_template: MessageTemplate;
  raid_text_animation: TextAnimation;
  raid_image_href: CDNUrl;
  raid_sound_href: RelativePathStr;
  raid_sound_volume: PositiveNumber;
  raid_alert_duration: DurationMs;
  raid_text_delay: DurationInSec; // not sure
  raid_custom_html_enabled: boolean;
  raid_custom_html: CustomHTML;
  raid_custom_js: CustomJS;
  raid_custom_css: CustomCSS;
  raid_custom_json: CustomJSON;
  raid_font: FontFamily;
  raid_font_size: FontSize;
  raid_font_weight: FontWeight;
  raid_font_color: FontColor;
  raid_font_color2: FontColor;
  raid_variations: IAlertBoxVariation[];
}

// ACCOUNT INTEGRATIONS
interface IAlertBoxDonorDriveSettings {
  donordrivedonation_alert_duration: number;
  donordrivedonation_alert_message_min_amount: number;
  donordrivedonation_custom_css: string;
  donordrivedonation_custom_html: string;
  donordrivedonation_custom_html_enabled: boolean;
  donordrivedonation_custom_js: string;
  donordrivedonation_custom_json: string;
  donordrivedonation_enabled: boolean;
  donordrivedonation_font: string;
  donordrivedonation_font_color: string;
  donordrivedonation_font_color2: string;
  donordrivedonation_font_size: string;
  donordrivedonation_font_weight: string;
  donordrivedonation_hide_animation: string;
  donordrivedonation_image_href: string;
  donordrivedonation_layout: string;
  donordrivedonation_message_font: string;
  donordrivedonation_message_font_color: string;
  donordrivedonation_message_font_size: string;
  donordrivedonation_message_font_weight: string;
  donordrivedonation_message_template: string;
  donordrivedonation_show_animation: string;
  donordrivedonation_sound_href: string;
  donordrivedonation_sound_volume: number;
  donordrivedonation_text_animation: string;
  donordrivedonation_text_delay: number;
  donordrivedonation_variations: IAlertBoxVariation[];
}

interface IAlertBoxExtraLifeSettings {
  eldonation_alert_duration: number;
  eldonation_alert_message_min_amount: number;
  eldonation_custom_css: string;
  eldonation_custom_html: string;
  eldonation_custom_html_enabled: boolean;
  eldonation_custom_js: string;
  eldonation_custom_json: string;
  eldonation_enabled: boolean;
  eldonation_font: string;
  eldonation_font_color: string;
  eldonation_font_color2: string;
  eldonation_font_size: string;
  eldonation_font_weight: string;
  eldonation_hide_animation: string;
  eldonation_image_href: string;
  eldonation_layout: string;
  eldonation_message_font: string;
  eldonation_message_font_color: string;
  eldonation_message_font_size: string;
  eldonation_message_font_weight: string;
  eldonation_message_template: string;
  eldonation_show_animation: string;
  eldonation_sound_href: string;
  eldonation_sound_volume: number;
  eldonation_text_animation: string;
  eldonation_text_delay: number;
  eldonation_variations: IAlertBoxVariation[];
}

interface IAlertBoxGamewsipSettings {
  gamewispsubscription_alert_duration: number;
  gamewispsubscription_custom_css: string;
  gamewispsubscription_custom_html: string;
  gamewispsubscription_custom_html_enabled: boolean;
  gamewispsubscription_custom_js: string;
  gamewispsubscription_custom_json: string;
  gamewispsubscription_enabled: boolean;
  gamewispsubscription_font: string;
  gamewispsubscription_font_color: string;
  gamewispsubscription_font_color2: string;
  gamewispsubscription_font_size: string;
  gamewispsubscription_font_weight: string;
  gamewispsubscription_hide_animation: string;
  gamewispsubscription_image_href: string;
  gamewispsubscription_layout: string;
  gamewispsubscription_message_template: string;
  gamewispsubscription_resub_message_template: string;
  gamewispsubscription_show_animation: string;
  gamewispsubscription_sound_href: string;
  gamewispsubscription_sound_volume: number;
  gamewispsubscription_text_animation: string;
  gamewispsubscription_text_delay: number;
  gamewispsubscription_tier_upgrade_message_template: string;
  gamewispsubscription_variations: IAlertBoxVariation[];
}

interface IAlertBoxJustGivingSettings {
  justgivingdonation_alert_duration: number;
  justgivingdonation_alert_message_min_amount: number;
  justgivingdonation_custom_css: string;
  justgivingdonation_custom_html: string;
  justgivingdonation_custom_html_enabled: boolean;
  justgivingdonation_custom_js: string;
  justgivingdonation_custom_json: string;
  justgivingdonation_enabled: boolean;
  justgivingdonation_font: string;
  justgivingdonation_font_color: string;
  justgivingdonation_font_color2: string;
  justgivingdonation_font_size: string;
  justgivingdonation_font_weight: string;
  justgivingdonation_hide_animation: string;
  justgivingdonation_image_href: string;
  justgivingdonation_layout: string;
  justgivingdonation_message_font: string;
  justgivingdonation_message_font_color: string;
  justgivingdonation_message_font_size: string;
  justgivingdonation_message_font_weight: string;
  justgivingdonation_message_template: string;
  justgivingdonation_show_animation: string;
  justgivingdonation_sound_href: string;
  justgivingdonation_sound_volume: number;
  justgivingdonation_text_animation: string;
  justgivingdonation_text_delay: number;
  justgivingdonation_variations: IAlertBoxVariation[];
}

interface IAlertBoxPatreonSettings {
  pledge_alert_duration: DurationMs;
  pledge_custom_css: CustomCSS;
  pledge_custom_html: CustomHTML;
  pledge_custom_html_enabled: boolean;
  pledge_custom_js: CustomJS;
  pledge_custom_json: CustomJSON;
  pledge_enabled: boolean;
  pledge_font: FontFamily;
  pledge_font_color: FontColor;
  pledge_font_color2: FontColor;
  pledge_font_size: FontSize;
  pledge_font_weight: FontWeight;
  pledge_hide_animation: HideAnimation;
  pledge_image_href: CDNUrl;
  pledge_layout: AlertLayout;
  pledge_message_template: MessageTemplate;
  pledge_show_animation: ShowAnimation;
  pledge_sound_href: RelativePathStr;
  pledge_sound_volume: PositiveNumber;
  pledge_text_animation: TextAnimation;
  pledge_text_delay: PositiveNumber;
  pledge_variations: IAlertBoxVariation[];
}

interface IAlertBoxTiltifySettings {
  tiltifydonation_alert_duration: number;
  tiltifydonation_alert_message_min_amount: number;
  tiltifydonation_custom_css: string;
  tiltifydonation_custom_html: string;
  tiltifydonation_custom_html_enabled: boolean;
  tiltifydonation_custom_js: string;
  tiltifydonation_custom_json: string;
  tiltifydonation_enabled: boolean;
  tiltifydonation_font: string;
  tiltifydonation_font_color: string;
  tiltifydonation_font_color2: string;
  tiltifydonation_font_size: string;
  tiltifydonation_font_weight: string;
  tiltifydonation_hide_animation: string;
  tiltifydonation_image_href: string;
  tiltifydonation_layout: string;
  tiltifydonation_message_font: string;
  tiltifydonation_message_font_color: string;
  tiltifydonation_message_font_size: string;
  tiltifydonation_message_font_weight: string;
  tiltifydonation_message_template: string;
  tiltifydonation_show_animation: string;
  tiltifydonation_sound_href: string;
  tiltifydonation_sound_volume: number;
  tiltifydonation_text_animation: string;
  tiltifydonation_text_delay: number;
  tiltifydonation_variations: IAlertBoxVariation[];
}

interface IAlertBoxTreatSettings {
  treat_alert_duration: number;
  treat_custom_css: number;
  treat_custom_html: string;
  treat_custom_html_enabled: boolean;
  treat_custom_js: string;
  treat_custom_json: string;
  treat_enabled: boolean;
  treat_font: string;
  treat_font_color: string;
  treat_font_color2: string;
  treat_font_size: string;
  treat_font_weight: string;
  treat_hide_animation: string;
  treat_image_href: string;
  treat_layout: string;
  treat_message_font: string;
  treat_message_font_color: string;
  treat_message_font_size: string;
  treat_message_font_weight: string;
  treat_message_template: string;
  treat_show_animation: string;
  treat_sound_href: string;
  treat_sound_volume: number;
  treat_text_animation: string;
  treat_text_delay: number;
  treat_variations: IAlertBoxVariation[];
}

// SLOBS GENERAL SETTINGS
export interface IAlertBoxSetting {
  enabled: boolean;
  showMessage: boolean;
  showResubMessage?: boolean;
  variations: IAlertBoxVariation[];
}
