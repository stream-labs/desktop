import { IWidgetSettings } from '../../widgets-api';

// GENERAL SETTINGS
interface IAlertBoxGeneralSettings extends IWidgetSettings {
  alert_delay: number;
  auto_host_enabled: boolean;
  background_color: string;
  layout: string;
  prime_sub_enabled: boolean;
  moderation_delay: number;
  recent_events_donation_min_amount: number;
  recent_events_host_min_viewer_count: number;
  unlimited_media_moderation_delay: boolean;

  // SHOW MESSAGES
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
}

// ALERT VARIATION
export interface IAlertBoxVariation {
  condition: string;
  conditionData: any;
  conditions: { type: string, description: string }[];
  name: string;
  settings: {
    customCss: string;
    customHtml: string;
    customHtmlEnabled: string;
    customJs: string;
    customJson: string;
    duration: number;
    hideAnimation: string;
    image: { href: string };
    layout: string;
    showAnimation: string;
    sound: { href: string, volume: number };
    text: {
      animation: string,
      color: string,
      color2: string,
      font: string,
      format: string,
      size: number,
      thickness: number
    };
    textDelay: number;
    type: string;
  }
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
  sub_variations: IAlertBoxVariation[]
}

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
  bit_variations: IAlertBoxVariation[];
  bits_alert_duration: number;
  bits_alert_message_min_amount: number;
  bits_alert_min_amount: number;
  bits_custom_css: string;
  bits_custom_html: string;
  bits_custom_html_enabled: boolean;
  bits_custom_js: string;
  bits_custom_json: string;
  bits_enabled: boolean;
  bits_font: string;
  bits_font_color: string;
  bits_font_color2: string;
  bits_font_size: string;
  bits_font_weight: number;
  bits_hide_animation: string;
  bits_image_href: string;
  bits_layout: string;
  bits_message_allow_emotes: boolean;
  bits_message_font: string;
  bits_message_font_color: string;
  bits_message_font_size: string;
  bits_message_font_weight: string;
  bits_message_template: string;
  bits_show_animation: string;
  bits_sound_href: string;
  bits_sound_volume: number;
  bits_text_animation: string;
  bits_text_delay: number;
  bits_tts_enabled: boolean;
  bits_tts_language: string;
  bits_tts_min_amount: number;
  bits_tts_security: number;
  bits_tts_volume: number;
}

// NORMAL DONATIONS
interface IAlertBoxDonationSettings {
  donation_alert_duration: number;
  donation_alert_message_min_amount: number;
  donation_alert_min_amount: number;
  donation_custom_css: string;
  donation_custom_html: string;
  donation_custom_html_enabled: boolean;
  donation_custom_js: string;
  donation_custom_json: string;
  donation_enabled: boolean;
  donation_font: string;
  donation_font_color: string;
  donation_font_color2: string;
  donation_font_size: string;
  donation_font_weight: number;
  donation_gfycat_library_enabled: boolean;
  donation_gif_animation: string;
  donation_gif_enabled: boolean;
  donation_gif_library_defaults: string;
  donation_gif_library_enabled: boolean;
  donation_gifs_min_amount_to_share: number;
  donation_hide_animation: string;
  donation_image_href: string;
  donation_layout: string;
  donation_max_gif_duration: number;
  donation_message_allow_emotes: boolean;
  donation_message_font: string;
  donation_message_font_color: string;
  donation_message_font_size: string;
  donation_message_font_weight: string;
  donation_message_template: string;
  donation_moderation: boolean;
  donation_show_animation: string;
  donation_sound_href: string;
  donation_sound_volume: number;
  donation_text_animation: string;
  donation_text_delay: number;
  donation_tts_enabled: boolean;
  donation_tts_language: string;
  donation_tts_min_amount: number;
  donation_tts_security: number;
  donation_tts_volume: number;
  donation_variations: IAlertBoxVariation[];
}

// FOLLOWS
interface IAlertBoxFollowSettings {
  follow_alert_duration: number;
  follow_custom_css: string;
  follow_custom_html: string;
  follow_custom_html_enabled: boolean;
  follow_custom_js: string;
  follow_custom_json: string;
  follow_enabled: boolean;
  follow_font: string;
  follow_font_color: string;
  follow_font_color2: string;
  follow_font_size: string;
  follow_font_weight: number;
  follow_hide_animation: string;
  follow_image_href: string;
  follow_layout: string;
  follow_message_template: string;
  follow_show_animation: string;
  follow_sound_href: string;
  follow_sound_volume: number;
  follow_text_animation: string;
  follow_text_delay: number;
  follow_variations: IAlertBoxVariation[];
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
  host_variations: IAlertBoxVariation[]
  host_viewer_minimum: number;
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
interface IAlertBoxRaidSettings {
  raid_alert_duration: number;
  raid_custom_css: string;
  raid_custom_html: string;
  raid_custom_html_enabled: boolean;
  raid_custom_js: string;
  raid_custom_json: string;
  raid_enabled: boolean;
  raid_font: string;
  raid_font_color: string;
  raid_font_color2: string;
  raid_font_size: string;
  raid_font_weight: number;
  raid_hide_animation: string;
  raid_image_href: string;
  raid_layout: string;
  raid_message_template: string;
  raid_raider_minimum: number;
  raid_show_animation: string;
  raid_sound_href: string;
  raid_sound_volume: number;
  raid_text_animation: string;
  raid_text_delay: number;
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
  donordrivedonation_variations: IAlertBoxVariation[]
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
  pledge_alert_duration: number;
  pledge_custom_css: string;
  pledge_custom_html: string;
  pledge_custom_html_enabled: boolean;
  pledge_custom_js: string;
  pledge_custom_json: string;
  pledge_enabled: boolean;
  pledge_font: string;
  pledge_font_color: string;
  pledge_font_color2: string;
  pledge_font_size: string;
  pledge_font_weight: string;
  pledge_hide_animation: string;
  pledge_image_href: string;
  pledge_layout: string;
  pledge_message_template: string;
  pledge_show_animation: string;
  pledge_sound_href: string;
  pledge_sound_volume: number;
  pledge_text_animation: string;
  pledge_text_delay: number;
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

export interface IAlertBoxApiSettings extends
IAlertBoxGeneralSettings,
IAlertBoxSubSettings,
IAlertBoxBitsSettings,
IAlertBoxDonationSettings,
IAlertBoxFollowSettings,
IAlertBoxHostSettings,
IAlertBoxRaidSettings,
IAlertBoxMerchSettings,
IAlertBoxResubSettings,
IAlertBoxTreatSettings,
IAlertBoxDonorDriveSettings,
IAlertBoxExtraLifeSettings,
IAlertBoxGamewsipSettings,
IAlertBoxJustGivingSettings,
IAlertBoxPatreonSettings,
IAlertBoxTiltifySettings {}

// SLOBS GENERAL SETTINGS
export interface IAlertBoxSetting {
  enabled: boolean;
  showMessage: boolean;
  variations: IAlertBoxVariation[]
}

export interface IAlertBoxSettings extends IAlertBoxGeneralSettings {
  subs: IAlertBoxSetting;
  bits: IAlertBoxSetting;
  donations: IAlertBoxSetting;
  follows: IAlertBoxSetting;
  hosts: IAlertBoxSetting;
  raids: IAlertBoxSetting;
  merch: IAlertBoxSetting;
  treat?: IAlertBoxSetting;
  donorDrive?: IAlertBoxSetting;
  extraLife?: IAlertBoxSetting;
  gamewisp?: IAlertBoxSetting;
  justGiving?: IAlertBoxSetting;
  patreon?: IAlertBoxSetting;
  tiltify?: IAlertBoxSetting;
}
