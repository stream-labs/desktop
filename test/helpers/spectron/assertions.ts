import { TExecutionContext } from './index';
import { FormMonkey } from '../form-monkey';
import { getDropdownOptions } from './forms';

export const createOptionsAssertion = (t: TExecutionContext, form: FormMonkey) => async (
  selector: string,
  expectedValue: string,
  expectedOptions: string[],
  dropdownSelector = '.multiselect__element',
) => {
  t.is(expectedValue, await form.getTextValue(selector));
  t.deepEqual(await getDropdownOptions(t, [selector, dropdownSelector].join(' ')), expectedOptions);
};

// The trailing space is apparently required for most OBS dropdown options
export const addTrailingSpace = (x: string) => `${x} `;
