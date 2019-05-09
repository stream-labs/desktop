echo "IP for RDP connections:" $(Invoke-RestMethod ipinfo.io/ip)

# ensure we have big anought resolution
Set-DisplayResolution -Width 1920 -Height 1080 -Force

yarn install
yarn compile
yarn test-flaky

$exitCode = $LastExitCode;

echo 'Start shutdown job';

Start-Process powershell -ArgumentList '-file ".buildkite/reboot.ps1"'

echo 'Done';
exit $exitCode
