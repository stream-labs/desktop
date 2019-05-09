# runing tests on the CI machine

# fetching exernal IP address
echo "IP for RDP connections:" $(Invoke-RestMethod ipinfo.io/ip)

# ensure we have a big anought resolution
Set-DisplayResolution -Width 1920 -Height 1080 -Force

# compile and run tests
yarn install
yarn compile
yarn test-flaky

# save exit code
$exitCode = $LastExitCode;

# run the reboot task in separated process
Start-Process powershell -ArgumentList '-file ".buildkite/reboot.ps1"'

# zero exit code means successeful tests run
exit $exitCode
