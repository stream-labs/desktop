#yarn install
#yarn compile
#yarn test --match="Main and child window visibility"
echo 'jobsdone';
#Restart-Computer
$exitCode = $LastExitCode;


Start-Job -Name "RestartPC" -ScriptBlock {
  $wshell = New-Object -ComObject wscript.shell;
  $wshell.AppActivate("Administrator: C:\buildkite-agent\bin\buildkite-agent.exe")
  Sleep 1
  $wshell.SendKeys("^(C)")
  Sleep 5
  Restart-Computer
}

exit $exitCode
