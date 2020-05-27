# run this file on windows startup

cd $PSScriptRoot;

# register agent
."./register-agent.ps1";

# start agent and run one job
."./start-agent.ps1";

# unregister agent
Start-Process -NoNewWindow -Wait "powershell" -ArgumentList "./register-agent.ps1", "remove"

Restart-Computer -Force
