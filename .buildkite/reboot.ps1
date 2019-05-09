# To avoid hanging zombie processes it's required to reboot the PC after tests run.

# The buildkite-agent process must be gracefully stoped
# If we stop process by simply killing it than the Buildkit srerver will not receive a `disconnect` message
# That causes multiple hanging agents

# The buildkite-agent process can be killed via sending an `SIGTERM` signal
# https://buildkite.com/docs/agent/v3#signal-handling
# Hovewer this aproach doesn't work in Windows
# Workaround here is send a Ctrl+C keys to the buildkite-agent window
$agentPid = (Get-Process | Where-Object {$_.ProcessName -eq "buildkite-agent"}).Id
$wshell = New-Object -ComObject wscript.shell;
$wshell.AppActivate($agentPid)
Sleep 1
$wshell.SendKeys("^(C)")

# give bulidekite-agent some time for gracefully exit and reboot the PC
Sleep 5
Restart-Computer;
