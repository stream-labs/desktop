import { focusChild, focusMain, test, useSpectron } from '../../helpers/spectron';
import { logIn } from '../../helpers/spectron/user';
import { sleep } from '../../helpers/sleep';

useSpectron({ appArgs: '--nosync' });

test('Twitch Tags', async t => {
  const app = t.context.app;
  const hasTag = hasTagAssertion(app);

  if (!(await logIn(t))) {
    return;
  }

  const tagsControlSelector = '.tags-container .v-selectpage';

  await app.client.click('button=Go Live');
  await focusChild(t);

  // Check that we fetched the entire set of tags
  await sleep(5000);
  const tagRows = await getTagRows(app);
  t.true(tagRows.length >= 267);

  await clearTags(app);

  // Add a couple of tags
  await app.client.click(tagsControlSelector);
  await app.client.click('td=100%');
  await app.client.click('td=AMA');

  // Click away and wait for the control to dismiss
  await app.client.click('.tags-container .input-label');
  await app.client.waitForExist('.sp-input-container.sp-open', 500, true);

  // Start the stream
  await app.client.click('button=Confirm & Go Live');
  await focusMain(t);
  await app.client.waitForVisible('button=End Stream');

  // End the stream
  await focusMain(t);
  await app.client.click('button=End Stream');

  // Go to Edit Stream Info to assert tags have persisted on Twitch
  await app.client.waitForVisible('button=Go Live', 20000);
  await app.client.click('button=Go Live');
  await focusChild(t);
  await app.client.waitForVisible(tagsControlSelector);

  t.true(await hasTag('100%'));
  t.true(await hasTag('AMA'));
  t.false(await hasTag('Competitive'));
});

const getSelectedTags = async (app: any) => {
  const tags = await app.client.execute(() => {
    return Array.from(
      document.querySelectorAll('.sp-input-container .sp-selected-tag > span:first-child'),
    ).map(el => el.textContent);
  });

  return tags.value;
};

const hasTagAssertion = (app: any) => async (tag: string) => {
  try {
    const tags = await getSelectedTags(app);

    return tags.includes(tag);
  } catch {
    return false;
  }
};

const clearTags = async (app: any) => {
  const removeTagButtons = await app.client.$$('.tags-container .sp-selected-tag .sp-icon-close');

  for (const removeButton of removeTagButtons.reverse()) {
    await app.client.click(
      // @ts-ignore
      `.tags-container .sp-selected-tag:nth-child(${removeButton.index + 2}) .sp-icon-close`,
    );
  }
};

const getTagRows = async (app: any) => app.client.$$('.sp-result-area tbody tr');
