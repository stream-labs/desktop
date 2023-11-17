import { test, useWebdriver } from '../../helpers/webdriver';
import { showSettingsWindow } from '../../helpers/modules/settings/settings';
import { assertFormContains } from '../../helpers/modules/forms';

useWebdriver();

test('Populates advanced settings', async t => {
  await showSettingsWindow('Advanced');

  await assertFormContains(
    {
      'Process Priority': 'Normal',
      'Color Format': 'NV12 (8-bit, 4:2:0, 2 planes)',
      'YUV Color Space': 'Rec. 709',
      'YUV Color Range': 'Limited',
      'Force GPU as render device': true,
      'Audio Monitoring Device': 'Default',
      'Disable Windows audio ducking': true,
      'Filename Formatting': '%CCYY-%MM-%DD %hh-%mm-%ss',
      'Overwrite if file exists': false,
      'Replay Buffer Filename Prefix': 'Replay',
      'Replay Buffer Filename Suffix': '',
      'Duration (seconds)': '20',
      'Preserved cutoff point (increase delay) when reconnecting': true,
      'Retry Delay (seconds)': '2',
      'Maximum Retries': '25',
      'Bind to IP': 'Default',
      'Dynamically change bitrate when dropping frames while streaming': false,
      'Enable new networking code': false,
      'Low latency mode': false,
      'Enable Browser Source Hardware Acceleration (requires a restart)': true,
      'Enable media file caching': true,
    },
    'title',
  );
  t.pass();
});
