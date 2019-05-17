# Run this script as administrator to setup enviroment on new CI machine:
# powershell install.ps1 your_azure_token host_user host_password

$token=$args[0]
$username=$args[1]
$password=$args[2]
$agentPath = "C:\agent\run.cmd"


if (-Not($token) -Or -Not($username) -Or -Not($password)) {
  echo "Provide a token, system user name and password";
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

echo "Install CMake"
choco install cmake --installargs 'ADD_CMAKE_TO_PATH=System'

echo "Donwload and install Azure Agent"
cd /
Remove-Item agent -Recurse -ErrorAction Ignore
mkdir agent ; cd agent;
Invoke-WebRequest -Uri https://vstsagentpackage.azureedge.net/agent/2.150.3/vsts-agent-win-x64-2.150.3.zip -OutFile "$PWD\agent.zip"
Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD\agent.zip", "$PWD")

echo "Configure Azure Agent"
.\config --unattended --url https://dev.azure.com/streamlabs --auth pat --token $token --agent "$env:computername $(Get-Random)"

# Azure Agent has --AutoLogon option to add Anget to autostartup
# But it doesn't allow to pass any arguments to the Agent
# So call own implementation of AutoLogon here
echo "Setup auto-login when system starts"
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
Set-ItemProperty $RegPath "AutoAdminLogon" -Value "1" -type String
Set-ItemProperty $RegPath "DefaultUsername" -Value $username -type String
Set-ItemProperty $RegPath "DefaultPassword" -Value "$password" -type String

# -once argument gracefuly stops Agent after first job
echo "Add agent to startup"
Set-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name 'StartAsureAgent' -Value "$agentPath --once";

echo "Installation completed. Restart PC to take effect"
