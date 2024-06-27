import test from 'ava';

test.only('get node version', t => {
  t.log(process.version);
  t.pass();
});
