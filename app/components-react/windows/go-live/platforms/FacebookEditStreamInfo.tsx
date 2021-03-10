import electron from 'electron';
import { TSetPlatformSettingsFn, TUpdatePlatformSettingsFn, useGoLiveSettings } from '../go-live';
import CommonPlatformFields from '../CommonPlatformFields';
import React, { useState } from 'react';
import { Services } from '../../../service-provider';
import { TTwitchTag } from '../../../../services/platforms/twitch/tags';
import { IGoLiveSettings } from '../../../../services/streaming';
import { TPlatform } from '../../../../services/platforms';
import Form from '../../../shared/inputs/Form';
import { useOnCreate, useFormState, useVuex } from '../../../hooks';
import { assertIsDefined } from '../../../../util/properties-type-guards';
import { EDismissable } from '../../../../services/dismissables';
import { $t } from '../../../../services/i18n';
import { createBinding, ListInput } from '../../../shared/inputs';
import GameSelector from '../GameSelector';
import {
  IFacebookLiveVideo,
  IFacebookStartStreamOptions,
  TDestinationType,
  TFacebookStreamPrivacy,
} from '../../../../services/platforms/facebook';
import moment from 'moment';
import Translate from '../../../shared/Translate';
import { IListOption } from '../../../shared/inputs/ListInput';
import MessageLayout from '../MessageLayout';

interface IProps {
  settings: IGoLiveSettings;
  updatePlatformSettings: TUpdatePlatformSettingsFn;
  isScheduleMode?: boolean;
  isUpdateMode?: boolean;
  isAdvancedMode: (p: any) => boolean;
}

export default function FacebookEditStreamInfo(p: IProps) {
  const { isScheduleMode, isUpdateMode } = p;
  const { settings, updatePlatform } = useGoLiveSettings('FacebookEditStreamInfo', state => [
    state.platforms.facebook,
  ]);
  const fbSettings = settings.platforms.facebook;
  assertIsDefined(fbSettings);
  const isAdvanced = p.isAdvancedMode(p.settings);
  const shouldShowGroups = fbSettings.destinationType === 'group' && !isUpdateMode;
  const shouldShowPages = fbSettings.destinationType === 'page' && !isUpdateMode;
  const shouldShowEvents = !isUpdateMode && !isScheduleMode;
  const shouldShowPrivacy = fbSettings.destinationType === 'me';
  const shouldShowPrivacyWarn =
    (!fbSettings.liveVideoId && fbSettings.privacy?.value !== 'SELF') ||
    (fbSettings.liveVideoId && fbSettings.privacy?.value);
  const bind = createBinding(fbSettings, newFbSettings =>
    updatePlatform('facebook', newFbSettings),
  );

  // inject services
  const {
    FacebookService,
    DismissablesService,
    StreamingService,
    UserService,
    NavigationService,
    WindowsService,
  } = Services;

  // define the local state
  const { s, setItem, updateState } = useFormState({
    pictures: {} as Record<string, string>,
    scheduledVideos: [] as IFacebookLiveVideo[],
    scheduledVideosLoaded: false,
  });

  // define the vuex state
  const v = useVuex(() => {
    const state = FacebookService.state;
    const hasPages = !!state.facebookPages.length;
    const canStreamToTimeline = state.grantedPermissions.includes('publish_video');
    const canStreamToGroup = state.grantedPermissions.includes('publish_to_groups');
    return {
      canStreamToTimeline,
      canStreamToGroup,
      hasPages,
      shouldShowGamingWarning: hasPages && fbSettings.game,
      shouldShowPermissionWarn:
        (!canStreamToTimeline || !canStreamToGroup) &&
        DismissablesService.views.shouldShow(EDismissable.FacebookNeedPermissionsTip),
      groups: state.facebookGroups,
      pages: state.facebookPages,
      isPrimary: StreamingService.views.checkPrimaryPlatform('facebook'),
    };
  });

  useOnCreate(() => {
    loadScheduledBroadcasts();
    if (fbSettings.pageId) loadPicture(fbSettings.pageId);
    if (fbSettings.groupId) loadPicture(fbSettings.groupId);
  });

  function setPrivacy(privacy: TFacebookStreamPrivacy) {
    updatePlatform('facebook', { privacy: { value: privacy } });
  }

  async function loadScheduledBroadcasts() {
    let destinationId = FacebookService.views.getDestinationId(fbSettings);
    if (!destinationId) return;

    // by some unknown reason FB returns scheduled events for groups
    // only if you request these events from the user's personal page
    const destinationType =
      fbSettings.destinationType === 'group' ? 'me' : fbSettings.destinationType;
    if (destinationType === 'me') destinationId = 'me';

    updateState({
      scheduledVideos: await FacebookService.fetchScheduledVideos(destinationType, destinationId),
      scheduledVideosLoaded: true,
    });
  }

  async function loadPicture(objectId: string) {
    if (s.pictures[objectId]) return s.pictures[objectId];
    setItem('pictures', objectId, await FacebookService.fetchPicture(objectId));
  }

  function loadPictures(groupOrPage: IFacebookStartStreamOptions['destinationType']) {
    const ids =
      groupOrPage === 'group'
        ? FacebookService.state.facebookGroups.map(item => item.id)
        : FacebookService.state.facebookPages.map(item => item.id);
    ids.forEach(id => loadPicture(id));
  }

  function verifyGroup() {
    const groupId = fbSettings.groupId;
    electron.remote.shell.openExternal(`https://www.facebook.com/groups/${groupId}/edit`);
  }

  function dismissWarning() {
    DismissablesService.actions.dismiss(EDismissable.FacebookNeedPermissionsTip);
  }

  function reconnectFB() {
    const platform = 'facebook';
    NavigationService.actions.navigate('PlatformMerge', { platform });
    WindowsService.actions.closeChildWindow();
  }

  function getPrivacyOptions(): IListOption<TFacebookStreamPrivacy>[] {
    const options: any = [
      {
        value: 'EVERYONE',
        label: $t('Public'),
        image: 'https://slobs-cdn.streamlabs.com/media/fb_privacy_public.png',
      },
      {
        value: 'ALL_FRIENDS',
        label: $t('Friends'),
        image: 'https://slobs-cdn.streamlabs.com/media/fb_privacy_friends.png',
      },
      {
        value: 'SELF',
        label: $t('Only Me'),
        image: 'https://slobs-cdn.streamlabs.com/media/fb_privacy_noone.png',
      },
    ];

    // we cant read the privacy property of already created video
    if (fbSettings.liveVideoId || isUpdateMode) {
      options.unshift({ value: '', title: $t('Do not change privacy settings') });
    }
    return options;
  }

  async function reLogin() {
    await UserService.actions.return.reLogin();
    await StreamingService.actions.showGoLiveWindow();
  }

  function renderCommonFields() {
    return <CommonPlatformFields key="common" {...p} platform="facebook" />;
  }

  function renderRequiredFields() {
    return (
      <div key="required">
        {!p.isUpdateMode && (
          <>
            <ListInput
              label={$t('Facebook Destination')}
              {...bind.destinationType}
              hasImage
              imageSize={{ width: 35, height: 35 }}
              onSelect={loadScheduledBroadcasts}
              options={getDestinationOptions()}
            />
            {shouldShowPages && (
              <ListInput
                {...bind.pageId}
                label={$t('Facebook Page')}
                onChange={val => console.log(val)}
                hasImage
                imageSize={{ width: 44, height: 44 }}
                onDropdownVisibleChange={shown => shown && loadPictures('page')}
                onSelect={loadScheduledBroadcasts}
                options={v.pages.map(page => ({
                  value: page.id,
                  label: `${page.name} | ${page.category}`,
                  image: s.pictures[page.id],
                }))}
              />
            )}
            {shouldShowGroups && (
              <>
                <ListInput
                  {...bind.groupId}
                  label={$t('Facebook Group')}
                  hasImage
                  imageSize={{ width: 44, height: 44 }}
                  options={v.groups.map(group => ({
                    value: group.id,
                    label: group.name,
                    image: s.pictures[group.id],
                  }))}
                  onDropdownVisibleChange={() => loadPictures('group')}
                  extra={
                    <p>
                      {$t('Make sure the Streamlabs app is added to your Group.')}
                      <a onClick={verifyGroup}> {$t('Click here to verify.')}</a>
                    </p>
                  }
                />
              </>
            )}
          </>
        )}
      </div>
    );
  }

  function renderOptionalFields() {
    return (
      <div key="optional">
        {shouldShowEvents && (
          <ListInput
            {...bind.liveVideoId}
            label={$t('Scheduled Video')}
            loading={!s.scheduledVideosLoaded}
            placeholder={$t('Not selected')}
            options={[
              { value: '', label: $t('Not selected') },
              ...s.scheduledVideos.map(v => ({
                label: `${v.title} ${v.planned_start_time &&
                  moment(new Date(v.planned_start_time)).calendar()}`,
                value: v.id,
              })),
            ]}
          />
        )}

        {shouldShowPrivacy && (
          <ListInput
            value={fbSettings.privacy?.value}
            onChange={setPrivacy}
            hasImage={true}
            imageSize={{ width: 24, height: 24 }}
            options={getPrivacyOptions()}
            // TODO: class={styles.privacySelector}
            extra={
              shouldShowPrivacyWarn && (
                <Translate message={$t('FBPrivacyWarning')}>
                  <a
                    slot="link"
                    onClick={() =>
                      electron.remote.shell.openExternal(
                        'https://www.facebook.com/settings?tab=business_tools',
                      )
                    }
                  />
                </Translate>
              )
            }
          />
        )}

        <GameSelector
          {...bind.game}
          platform="facebook"
          extra={
            v.shouldShowGamingWarning && (
              <Translate message={$t('facebookGamingWarning')}>
                <a slot="createPageLink" onClick={() => FacebookService.actions.createFBPage()} />
              </Translate>
            )
          }
        />
      </div>
    );
  }

  function renderMissedPermissionsWarning() {
    return (
      <MessageLayout
        message={$t('You can stream to your timeline and groups now')}
        type={'success'}
      >
        {v.isPrimary && (
          <div>
            <p>{$t('Please log-out and log-in again to get these new features')}</p>
            <button className="button button--facebook" onClick={reLogin}>
              {$t('Re-login now')}
            </button>
            <button className="button button--trans" onClick={dismissWarning}>
              {$t('Do not show this message again')}
            </button>
          </div>
        )}
        {!v.isPrimary && (
          <div>
            <p>{$t('Please reconnect Facebook to get these new features')}</p>
            <button className="button button--facebook" onClick={reconnectFB}>
              {$t('Reconnect now')}
            </button>
            <button className="button button--trans" onClick={dismissWarning}>
              {$t('Do not show this message again')}
            </button>
          </div>
        )}
      </MessageLayout>
    );
  }

  function getDestinationOptions(): IListOption<TDestinationType>[] {
    const options: IListOption<TDestinationType>[] = [
      {
        value: 'me' as TDestinationType,
        label: $t('Share to Your Timeline'),
        image: FacebookService.state.userAvatar,
      },
      {
        value: 'page' as TDestinationType,
        label: $t('Share to a Page You Manage'),
        image: 'https://slobs-cdn.streamlabs.com/media/fb-page.png',
      },
      {
        value: 'group' as TDestinationType,
        label: $t('Share in a Group'),
        image: 'https://slobs-cdn.streamlabs.com/media/fb-group.png',
      },
    ].filter(opt => {
      if (opt.value === 'me' && !v.canStreamToTimeline) return false;
      if (opt.value === 'group' && !v.canStreamToGroup) return false;
      return true;
    });
    return options;
  }

  return (
    <Form name="facebook-settings">
      {isAdvanced
        ? [renderRequiredFields(), renderOptionalFields(), renderCommonFields()]
        : [renderCommonFields(), renderRequiredFields()]}

      {v.shouldShowPermissionWarn && renderMissedPermissionsWarning()}
    </Form>
  );
}
