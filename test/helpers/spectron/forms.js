// Tools for dealing with forms in spectron

async function getNthLabelId(t, label, index) {
  return (await t.context.app.client.$$(label))[index].ELEMENT;
}

export async function setFormInput(t, label, value, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client
    .elementIdElement(id, 'input')
    .setValue(value);
}

export async function getFormInput(t, label, index = 0) {
  const id = await getNthLabelId(t, label, index);

  return t.context.app.client
    .elementIdElement(id, 'input')
    .getValue();
}

export async function clickFormInput(t, label, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client
    .elementIdElement(id, 'input')
    .click();
}

export async function setFormDropdown(t, label, value, index = 0) {
  const id = await getNthLabelId(t, label, index);

  await t.context.app.client
    .elementIdElement(id, '.multiselect')
    .click();

  await t.context.app.client
    .elementIdElement(id, `[data-test="${value}"]`)
    .click();
}

export async function getFormDropdown(t, label, index = 0) {
  const id = await getNthLabelId(t, label, index);

  return t.context.app.client
    .elementIdAttribute(id, 'data-test-value');
}

// Percent is a value between 0 and 1
export async function setSliderPercent(t, label, percent, index = 0) {
  const id = await getNthLabelId(t, label, index);

  const width = await t.context.app.client
    .elementIdElement(id, '../..')
    .$('.vue-slider')
    .getCssProperty('width');

  await t.context.app.client
    .elementIdElement(id, '../..')
    .leftClick('.vue-slider', Math.floor(width.parsed.value * percent), 0);
}
