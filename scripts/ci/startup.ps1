# run this file on windows startup

cd $PSScriptRoot;

# register agent
."./register-agent.ps1";

# start agent and run one job
."./start-agent.ps1";

# unregister agent
."./register-agent.ps1 remove";
