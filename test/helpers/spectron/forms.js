// Tools for dealing with forms in spectron

export async function setFormInput(t, label, value) {
  await t.context.app.client
    .$(`label=${label}`)
    .$('../..')
    .setValue('input', value);
}
