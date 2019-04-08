test('get instance', () => {
  const { FileManagerService } = require('./file-manager');
  expect(FileManagerService.instance).toBeInstanceOf(FileManagerService);
});
