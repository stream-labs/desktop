# run this file on windows shutdown
cd $PSScriptRoot;

# unregister agent
Start-Process -NoNewWindow -Wait "powershell" -ArgumentList "./register-agent.ps1", "remove"

