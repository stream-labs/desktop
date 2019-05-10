# Run this script as administrator to setup enviroment on new CI machine:
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

echo "Install Visual C++ Redistributable (required for node-win32-np module)"
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

echo "Installation completed. Restart PC to take effect"
