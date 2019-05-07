# CI installation script
# Run this script as administrator:
# powershell install.ps1 your_buildkite_token

$token=$args[0]
if (-Not ($token)) {
  echo "Provide a buildkite token:";
  echo "powershell install.ps1 your_buildkite_token";
  echo "Installation canceled";
  exit;
}

echo "Install Chocolately"
if (-NOT(Get-Command "choco" -errorAction SilentlyContinue)) {
  Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'));
  choco feature enable -n allowGlobalConfirmation
}

echo "Install Nodejs"
choco install nodejs --version 10.15.3

echo "Install Git for Windows"
choco choco install git.install

echo "Buildkite Agent"
$env:buildkiteAgentToken = $token
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/buildkite/agent/master/install.ps1'))

echo "Install NSSM Serivce Manager"
choco install nssm

echo "Register Buildkite Agent as a service"
nssm install buildkite-agent "C:\buildkite-agent\bin\buildkite-agent.exe" "start"
nssm set buildkite-agent AppStdout "C:\buildkite-agent\buildkite-agent.log"
nssm set buildkite-agent AppStderr "C:\buildkite-agent\buildkite-agent.log"
nssm stop buildkite-agent
nssm start buildkite-agent

echo "Checking Agent status"
nssm status buildkite-agent
echo "Installation completed"
