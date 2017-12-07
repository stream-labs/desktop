
export async function getInputValueId(t, element, index) {
    return (await t.context.app.client.$$(element))[index].ELEMENT;
}

export async function getInputValue(t, element, index = 0) {
    const id = await getInputValueId(t, element, index);

    return t.context.app.client
    .elementIdElement(id, '.')
    .getValue('input');
}

export async function getInputCheckboxValue(t, element, index = 0) {
    const id = await getInputValueId(t, element, index);

    return t.context.app.client
    .elementIdElement(id, '.')
    .isSelected('input');
}