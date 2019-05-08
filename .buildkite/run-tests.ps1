yarn install
yarn compile
yarn test --match="Main and child window visibility"
echo "completed $LastExitCode";
exit $LastExitCode
