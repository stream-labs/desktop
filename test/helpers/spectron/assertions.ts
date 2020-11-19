import { TExecutionContext } from './index';
import { FormMonkey } from '../form-monkey';

export async function assertOptions(
  t: TExecutionContext,
  inputName: string,
  expectedValue: string,
  expectedOptions: string[],
) {
  const form = new FormMonkey(t);
  const input = await form.getInput(inputName);
  const options = (await form.getListOptions(inputName)).map(opt => opt.title);
  const selectedOption = await form.getListSelectedOption(input.selector);
  t.is(expectedValue, selectedOption.title);
  t.true(expectedOptions.join(',') === options.join(','));
}
