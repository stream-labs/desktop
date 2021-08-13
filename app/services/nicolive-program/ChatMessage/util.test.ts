import { ChatMessage } from '../ChatMessage';
import {
  isPremium,
  isOperator,
  isOperatorCommand,
  isOperatorComment,
  isAnonymous,
  getScore,
  parseCommandName,
  parseCommandArgument,
  parseJsonContent,
  parseContent,
} from './util';

const mockBase = {
  content: 'yay',
  date: 1582281644,
  date_usec: 565389,
  no: 1,
  thread: 1663875910,
  user_id: '2SDKBcLAxx6x81a28qJOU7S9wt0',
  vpos: 5640,
};

function makeMockChat(overwrite: ChatMessage = {}) {
  return { ...mockBase, ...overwrite };
}

const standard = makeMockChat({ premium: 0 });
const standardWithoutPremium = makeMockChat({ premium: undefined });
const premium = makeMockChat({ premium: 0b1 });
const yugi = makeMockChat({ premium: 0b10 });
const staff = makeMockChat({ premium: 0b100 });
const yugiAndStaff = makeMockChat({ premium: 0b110 });
const nonOperatorChat = makeMockChat({ content: '/vote stop', premium: 0b1 });
const operatorCommand = makeMockChat({ content: '/vote stop', premium: 0b10 });
const operatorComment = makeMockChat({ content: '175622', premium: 0b11 });
const anonymous = makeMockChat({ anonymity: 1 });
const scored = makeMockChat({ score: -500 });
const jsonContent = makeMockChat({ content: '/type {"value":true}' });
const textContent = makeMockChat({ content: '/type some message values' });

test('isPremium', () => {
  expect(isPremium(premium)).toBe(true);
  expect(isPremium(standard)).toBe(false);
  expect(isPremium(standardWithoutPremium)).toBe(false);
});

test('isOperator', () => {
  expect(isOperator(yugi)).toBe(true);
  expect(isOperator(staff)).toBe(true);
  expect(isOperator(yugiAndStaff)).toBe(true);
  expect(isOperator(operatorCommand)).toBe(true);
  expect(isOperator(operatorComment)).toBe(true);

  expect(isOperator(standard)).toBe(false);
  expect(isOperator(standardWithoutPremium)).toBe(false);
  expect(isOperator(premium)).toBe(false);
});

test('isOperatorCommand', () => {
  expect(isOperatorCommand(operatorCommand)).toBe(true);

  expect(isOperatorCommand(operatorComment)).toBe(false);
  expect(isOperatorCommand(nonOperatorChat)).toBe(false);
});

test('isOperatorComment', () => {
  expect(isOperatorComment(operatorComment)).toBe(true);

  expect(isOperatorComment(operatorCommand)).toBe(false);
  expect(isOperatorComment(nonOperatorChat)).toBe(false);
});

test('isAnonymous', () => {
  expect(isAnonymous(anonymous)).toBe(true);

  expect(isAnonymous(nonOperatorChat)).toBe(false);
});

test('getScore', () => {
  expect(getScore(scored)).toBe(-500);
  expect(getScore(anonymous)).toBe(0);
  expect(getScore(nonOperatorChat)).toBe(0);
});

test('parseCommandName', () => {
  expect(parseCommandName(standard)).toBe('');
  expect(parseCommandName(operatorCommand)).toBe('vote');
});

test('parseCommandArgument', () => {
  expect(parseCommandArgument(standard)).toBe('');
  expect(parseCommandArgument(operatorCommand)).toBe('stop');
});

test('parseJsonContent', () => {
  expect(parseJsonContent(standard)).toBeNull;
  expect(parseJsonContent(jsonContent)).toEqual({ commandName: '/type', value: { value: true } });
});

test('parseContent', () => {
  expect(parseContent(operatorCommand)).toEqual({ commandName: '/vote', values: ['stop'] });
  expect(parseContent(textContent)).toEqual({
    commandName: '/type',
    values: ['some', 'message', 'values'],
  });
  expect(
    parseContent({
      content: '[header] "quo ted" [trailer]',
    }).values,
  ).toEqual(['[header]', 'quo ted', '[trailer]']);

  expect(
    parseContent({
      content: '[header] \\"esc aped [trailer]',
    }).values,
  ).toEqual(['[header]', '"esc', 'aped', '[trailer]']);

  expect(
    parseContent({
      content: '[header] "\\"esc aped value" [trailer]',
    }).values,
  ).toEqual(['[header]', '"esc aped value', '[trailer]']);
});
