$agentPid = (Get-Process | Where-Object {$_.ProcessName -eq "buildkite-agent"}).Id
$wshell = New-Object -ComObject wscript.shell;
$wshell.AppActivate($agentPid)
Sleep 1
$wshell.SendKeys("^(C)")
Sleep 5
Restart-Computer;
