import { atom, useAtom, useAtomValue } from 'jotai';
import { atomWithObservable } from 'jotai/utils';
import { atomWithImmer } from 'jotai-immer';
import { Suspense } from 'react';
import { api } from '@/api/api';
import { Form, Input } from 'antd';

const streamInfoAtom = atomWithObservable(() => api.StreamingService.state$);
const userInfoAtom = atomWithObservable(() => api.UserService.state$);

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
  const lifecycle = useAtomValue(streamInfoAtom).lifecycle;
  const shouldShowSettings = ['waitForNewSettings'].includes(lifecycle);
  const shouldShowChecklist = ['runChecklist', 'live'].includes(lifecycle);

  return (
    <Suspense fallback={'Loading...'}>
      {shouldShowSettings && <GoLiveSettings key="settings" />}
      {shouldShowChecklist && <GoLiveChecklist key="checklist" />}
    </Suspense>
  );
}


const prepopulatedSettingsAtom = atom(api.StreamingService.prepopulateInfo);

// Atom to store Go Live settings
const streamSettingsAtom = atomWithImmer(async get => {
  const streamInfo = await get(streamInfoAtom);
  const canModifySettings = streamInfo.lifecycle === 'waitForNewSettings' || streamInfo.lifecycle === 'live';

  return {
    general: {
      title: '',
      description: '',
    },
    platforms: {} as unknown,
  }
});

/**
 * Renders the general stream settings and destination list.
 */
function GoLiveSettings() {
  const hasDescription = true;
  const descriptionIsRequired = true;
  const [settings, setSettings] = useAtom(goLiveSettingsAtom);
  const userName = useAtomValue(userInfoAtom).name;

  const handleInputChange =
    (field: 'title' | 'description') =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings((s) => {
          s.general[field] = e.target.value;
        });
      };

  return (
    <>
      <h2>General Settings for {userName}</h2>

      {/* Title */}
      <Form.Item label="Title" required>
        <Input
          value={settings.general.title}
          onChange={handleInputChange('title')}
        />
      </Form.Item>

      {/* Description */}
      {hasDescription && (
        <Form.Item label="Description" required={descriptionIsRequired}>
          <Input.TextArea
            rows={4}
            value={settings.general.description}
            onChange={handleInputChange('description')}
          />
        </Form.Item>
      )}

      {/* Destination List */}
      <DestinationList />
    </>
  );
}

/**
 * Renders the list of stream destinations.
 * Destinations can be connected platforms or a custom RTMP server.
 * Each destination is displayed as a card with a toggle to enable/disable it.
 * Note: Without the multistream feature, only one destination can be enabled.
 */
function DestinationPicker() {
  // TODO: Implement destination selection logic
  return <div>Destination List</div>;
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
