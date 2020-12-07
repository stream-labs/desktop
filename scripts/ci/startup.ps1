# run this file on windows startup

cd $PSScriptRoot;

# remove offline agents
Start-Process -NoNewWindow -Wait "node" -ArgumentList "./remove-offline-agents.js"

# register agent
."./register-agent.ps1";

# start agent and run one job
."./start-agent.ps1";

# unregister agent
Start-Process -NoNewWindow -Wait "powershell" -ArgumentList "./register-agent.ps1", "remove"

Restart-Computer -Force
