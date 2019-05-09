echo "IP for RDP connections:" $(Invoke-RestMethod ipinfo.io/ip)

yarn install
yarn compile
yarn test-flaky

#Restart-Computer
$exitCode = $LastExitCode;

echo 'Start shutdown job';

Start-Process powershell -ArgumentList '-file ".buildkite/reboot.ps1"'

echo 'Done';
exit $exitCode
