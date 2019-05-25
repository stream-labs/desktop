import { EVideoCodes } from 'obs-studio-node';
import { test } from '../../helpers/spectron';
import { apiInitErrorResultToMessage as rtm } from '../../../app/services/app';

test('returns user-friendly error for ModuleNotFound status', t => {
  t.regex(rtm(EVideoCodes.ModuleNotFound), /DirectX could not be found/);
});

test('returns user-friendly error for NotSupported status', t => {
  t.regex(rtm(EVideoCodes.NotSupported), /Failed to initialize OBS/);
});

test('returns generic error string for Fail, InvalidParam and CurrentlyActive results', t => {
  t.regex(rtm(EVideoCodes.Fail), /unknown error/);
});
