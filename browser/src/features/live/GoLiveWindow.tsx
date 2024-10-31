import { atom, useAtom, useAtomValue } from 'jotai';
import { atomWithDefault, atomWithObservable } from 'jotai/utils';
import { atomWithImmer } from 'jotai-immer';
import { Suspense, useEffect, useMemo } from 'react';
import { api } from '@/api/api';
import { Button, Card, Form, Input, Switch } from 'antd';
import { produce } from 'immer';
import { focusAtom } from 'jotai-optics'

const streamStateAtom = atomWithObservable(() => api.StreamingService.state$);
const userAtom = atomWithObservable(() => api.UserService.state$);
const appDataAtom = atom(async () => {
  const data = await new Promise<{appName: string}>(r => {
    setTimeout(() => r({appName: 'My App'}), 3000)
  });
  return data;
});

/**
 * Root component for the Go Live window.
 *
 * Step 1:
 * - Lets the user pick stream destinations and fill out settings.
 * Step 2:
 * - Starts the stream via StreamingService.
 * - Displays a checklist to report progress or errors.
 */
export function GoLiveWindow() {
  const lifecycle = useAtomValue(streamStateAtom).info.lifecycle;
  const shouldShowSettings = ['waitForNewSettings'].includes(lifecycle);
  const shouldShowChecklist = ['runChecklist', 'live'].includes(lifecycle);
  const userName = useAtomValue(userAtom).userId;

  useEffect(() => {

    // Prepopulate stream info when first time opening the Go Live window
    // if (lifecycle === 'empty') {
      api.StreamingService.prepopulateInfo().then(info => {
        console.log('Prepopulated stream info:', info);
      })
    // }
  }, []);

  return (
    <>
      {userName }
      <h1>Go Live: {lifecycle}</h1>
      {shouldShowSettings && <GoLiveSettings key="settings" />}
      {shouldShowChecklist && <GoLiveChecklist key="checklist" />}
    </>

  );
}





// Atom to store Go Live settings
const streamSettingsAtom = atomWithDefault(async get => {
  const savedSettings = await api.StreamingService.getSavedSettings();
  const commonFields = await api.StreamingService.getCommonFields();
  console.log('Saved settings:', savedSettings);

  return {
    commonFields,
    ...savedSettings
  }
});

/**
 * Renders the general stream settings and destination list.
 */
function GoLiveSettings() {
  const hasDescription = true;
  const descriptionIsRequired = true;
  const [settings, setSettings] = useAtom(streamSettingsAtom);
  const userId = useAtomValue(userAtom).userId;

  const handleInputChange =
    (field: 'title' | 'description') =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings((s) => {

          // s[field] = e.target.value;
          return produce(settings, draft => {
            draft.commonFields[field] = e.target.value;
          });
         // return {...settings, [field]: e.target.value};
        });
      };

  return (
    <>
      <h2>General Settings for {userId}</h2>

      {/* Title */}
      <Form.Item label="Title" required>
        <Input
          value={settings.title}
          onChange={handleInputChange('title')}
        />
      </Form.Item>

      {/* Description */}
      {hasDescription && (
        <Form.Item label="Description" required={descriptionIsRequired}>
          <Input.TextArea
            rows={4}
            value={settings.description}
            onChange={handleInputChange('description')}
          />
        </Form.Item>
      )}

      {/* Destination List */}
      <DestinationPicker />

      {/* Go Live Button */}
      <Button>Go Live</Button>
    </>
  );
}
const platformsAtom = atom(async (get) => {
  const settings = await get(streamSettingsAtom);
  return settings.platforms;
});

/**
 * Renders the list of stream destinations.
 * Destinations can be connected platforms or a custom RTMP server.
 * Each destination is displayed as a card with a toggle to enable/disable it.
 * Note: Without the multistream feature, only one destination can be enabled.
 */
function DestinationPicker() {
  console.log('Render DestinationPicker');

  // THIS IS WORKING FINE
  // const [settings, setSettings] = useAtom(streamSettingsAtom);
  // const { platforms } = settings;

  // THIS IS NOT WORKING, platforms are undefined
  const platforms = useAtomValue(platformsAtom);


  function onPlatformChange(platform, newSettings) {
    // setSettings((s) => {
    //   // s.platforms[platform] = newSettings;
    // });
  }

  return (
  <div>
     {/* Render platform-specific components */}
     {Object.entries(platforms).map(([platformKey, settings]) => (
        <PlatformSettings
          key={platformKey}
          platform={platformKey}
          settings={settings}
          onChange={newSettings => onPlatformChange(platformKey, newSettings)}
        />
      ))}

      {/* Render custom destination components */}
      {/*{customDestinations.map((destination, index) => (*/}
      {/*  <CustomDestinationCard*/}
      {/*    key={index}*/}
      {/*    index={index}*/}
      {/*    settings={destination}*/}
      {/*  />*/}
      {/*))}*/}
  </div>
  );
}

function PlatformSettings({ platform, settings, onChange }) {
  switch (platform) {
    case 'twitch':
      return <TwitchCard settings={settings} onChange={onChange} />;
    case 'youtube':
      return <YoutubeCard settings={settings} onChange={onChange} />;
    // Add more platforms as needed
    default:
      return null;
  }
}

function DestinationCard({ settings, title, children, onChange }) {
  return (
    <Card
      title={title}
      extra={
        <Switch checked={settings.enabled} onChange={enabled => onChange({ ...settings, enabled})} />
      }>
      {children}
    </Card>
  )
}

function TwitchCard({ settings, onChange }) {
  return (
    <DestinationCard title="Twitch" settings={settings} onChange={onChange}>
      {/* Render Twitch-specific settings */}
      Twitch Card Settings
      <Form.Item label="Description">
        <Input
          value={settings.description}
          onChange={e => onChange({ ...settings, description: e.target.value })}
        />
      </Form.Item>
    </DestinationCard>
  );
}

function YoutubeCard({ settings, onChange }) {
  return (
    <DestinationCard title="Youtube" settings={settings} onChange={onChange}>
      {/* Render Youtube-specific settings */}
      Youtube Card Settings
    </DestinationCard>
  );
}

/**
 * Displays the current status of the go-live process using a Timeline component.
 * Syncs with the StreamingService state to reflect progress or errors.
 */
function GoLiveChecklist() {
  // TODO: Implement checklist display logic
  return <div>Go Live Checklist</div>;
}

/**
 * Shows a message indicating the success or failure of the go-live process.
 */
function GoLiveMessage() {
  // TODO: Implement success/error message display logic
  return <div>Go Live Message</div>;
}
