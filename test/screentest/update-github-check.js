import { GithubClient } from '../../scripts/github-client';

const env = process.env;


const client = new GithubClient(
  env.STREAMLABS_BOT_ID,

);
