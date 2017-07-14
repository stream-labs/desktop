// Tools for dealing with forms in spectron

export async function setFormInput(t, label, value) {
  await t.context.app.client
    .$(`label=${label}`)
    .$('../..')
    .setValue('input', value);
}

export async function setFormDropdown(t, label, value) {
  await t.context.app.client
    .$(`label=${label}`)
    .$('../..')
    .click('.multiselect');

  await t.context.app.client
    .$(`label=${label}`)
    .$('../..')
    .click(`li=${value}`);
}

// Percent is a value between 0 and 1
export async function setSliderPercent(t, label, percent) {
  const width = await t.context.app.client
    .$(`label=${label}`)
    .$('../..')
    .$('.vue-slider')
    .getCssProperty('width');

  await t.context.app.client
    .$(`label=${label}`)
    .$('../..')
    .leftClick('.vue-slider', Math.floor(width.parsed.value * percent), 0);
}
