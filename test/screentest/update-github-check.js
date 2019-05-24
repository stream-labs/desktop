import { GithubClient } from '../../scripts/github-client';

const env = process.env;

(async function main() {

  console.log((
    env.STREAMLABS_BOT_ID,
      env.STREAMLABS_BOT_KEY,
      'stream-labs',
      env.BUILD_REPOSITORY_NAME
  ))

  const github = new GithubClient(
    env.STREAMLABS_BOT_ID,
    env.STREAMLABS_BOT_KEY,
    'stream-labs',
    env.BUILD_REPOSITORY_NAME
  );

  await github.login();

  console.log('commit', env.Build.SourceVersion);
  await github.postCheck({
    head_sha: env.Build.SourceVersion,
    status: 'in_progress',
    output: {
      title: 'This is a title ' + new Date()
    }
  });


})();


