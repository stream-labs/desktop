import { focusChild, focusMain, test, useSpectron } from '../../../helpers/spectron';
import { logIn } from '../../../helpers/spectron/user';
import { sleep } from '../../../helpers/sleep';
import { getClient } from '../../../helpers/api-client';
import { ScenesService } from 'services/api/external-api/scenes';
import { Application } from 'spectron';

useSpectron();

test('Twitch Tags', async t => {
  const app = t.context.app;
  const hasTag = hasTagAssertion(app);

  if (!(await logIn(t))) {
    return;
  }

  const tagsControlSelector = '.tags-container .v-selectpage';

  // create a single source to prevent the no-sources message
  (await getClient())
    .getResource<ScenesService>('ScenesService')
    .activeScene.createAndAddSource('MyColorSource', 'color_source');

  await (await app.client.$('button=Go Live')).click();
  await focusChild(t);

  // Check that we fetched the entire set of tags
  await sleep(5000);
  const tagRows = await getTagRows(app);
  t.true(tagRows.length >= 267);

  await clearTags(app);

  // Add a couple of tags
  await (await app.client.$(tagsControlSelector)).click();
  await (await app.client.$('td=100%')).click();
  await (await app.client.$('td=AMA')).click();

  // Click away and wait for the control to dismiss
  await (await app.client.$('.tags-container .input-label')).click();
  await (await app.client.$('.sp-input-container.sp-open')).waitForExist({
    timeout: 500,
    reverse: true,
  });

  // Start the stream
  await (await app.client.$('button=Confirm & Go Live')).click();
  await focusMain(t);
  await (await app.client.$('button=End Stream')).waitForDisplayed();

  // End the stream
  await focusMain(t);
  await (await app.client.$('button=End Stream')).click();

  // Go to Edit Stream Info to assert tags have persisted on Twitch
  await (await app.client.$('button=Go Live')).waitForDisplayed({ timeout: 20000 });
  await sleep(3000);
  await (await app.client.$('button=Go Live')).click();
  await focusChild(t);
  await (await app.client.$(tagsControlSelector)).waitForDisplayed();

  t.true(await hasTag('100%'));
  t.true(await hasTag('AMA'));
  t.false(await hasTag('Competitive'));
});

const getSelectedTags = async (app: Application) => {
  const tags = await app.client.execute(() => {
    return Array.from(
      document.querySelectorAll('.sp-input-container .sp-selected-tag > span:first-child'),
    ).map(el => el.textContent);
  });

  return tags;
};

const hasTagAssertion = (app: Application) => async (tag: string) => {
  try {
    const tags = await getSelectedTags(app);

    return tags.includes(tag);
  } catch {
    return false;
  }
};

const clearTags = async (app: Application) => {
  const removeTagButtons = await app.client.$$('.tags-container .sp-selected-tag .sp-icon-close');

  for (const removeButton of removeTagButtons.reverse()) {
    await (
      await app.client.$(
        `.tags-container .sp-selected-tag:nth-child(${removeButton.index + 2}) .sp-icon-close`,
      )
    ).click();
  }
};

const getTagRows = async (app: Application) => app.client.$$('.sp-result-area tbody tr');
