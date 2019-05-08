# CI installation script
# Run this script as administrator:
# powershell install.ps1 your_buildkite_token your_buildkite_token your_password

$token=$args[0]
$username=$args[1]
$password=$args[2]

$buildkitAgentPath = "C:\buildkite-agent\bin\buildkite-agent.exe"

if (-Not($token) -Or -Not($username) -Or -Not($password)) {
  echo "Provide a buildkite token, system user name and password";
  echo "Installation canceled";
  exit;
}

echo "Install Chocolately"
if (-NOT(Get-Command "choco" -errorAction SilentlyContinue)) {
  Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'));
  choco feature enable -n allowGlobalConfirmation
}

echo "Install Visual C++ Redistributable (needed for node-win32-np module)"
choco install vcredist2015

echo "Install Nodejs"
choco install nodejs --version=10.15.3

echo "Instal global npm packages"
npm install webpack webpack-cli rimraf -g

echo "Install Yarn"
choco install yarn

echo "Install Git for Windows"
choco install git.install

echo "Install Buildkite Agent"
$env:buildkiteAgentToken = $token
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/buildkite/agent/master/install.ps1'))

echo "Setup auto-login when system starts"
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
Set-ItemProperty $RegPath "AutoAdminLogon" -Value "1" -type String
Set-ItemProperty $RegPath "DefaultUsername" -Value $username -type String
Set-ItemProperty $RegPath "DefaultPassword" -Value "$password" -type String

echo "Add Buildkite agent to startup"
Set-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name 'StartBuildkite' -Value "$buildkitAgentPath start";

#echo "Install NSSM Serivce Manager"
#choco install nssm
#echo "Register Buildkite Agent as a service"
#nssm install buildkite-agent "C:\buildkite-agent\bin\buildkite-agent.exe" "start"
#nssm set buildkite-agent AppStdout "C:\buildkite-agent\buildkite-agent.log"
#nssm set buildkite-agent AppStderr "C:\buildkite-agent\buildkite-agent.log"
#nssm stop buildkite-agent
#nssm start buildkite-agent
#echo "Checking Agent status"
#nssm status buildkite-agent

echo "Installation completed. Restart PC to take effect"
