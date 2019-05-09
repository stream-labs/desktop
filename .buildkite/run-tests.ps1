#yarn install
#yarn compile
#yarn test --match="Main and child window visibility"
echo 'jobsdone';
#Restart-Computer
$exitCode = $LastExitCode;

echo 'Start shutdown job';
#Get-ScheduledJob | Where-Object {$_.Name -eq "RestartJob"} | Unregister-ScheduledJob -Force
#(Register-ScheduledJob -Name "RestartJob" -ScriptBlock {
#  $agentPid = (Get-Process | Where-Object {$_.ProcessName -eq "buildkite-agent"}).Id
#  $wshell = New-Object -ComObject wscript.shell;
#  $wshell.AppActivate($agentPid)
#  Sleep 1
#  $wshell.SendKeys("^(C)")
#  Sleep 5
#  Restart-Computer;
#}).StartJob()
Start-Process powershell -ArgumentList '-file ".buildkite/reboot.ps1"'

echo 'Done';
exit $exitCode
