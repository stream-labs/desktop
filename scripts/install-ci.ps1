# Run this script as administrator to setup enviroment on new CI machine:
# powershell install.ps1 your_azure_token host_user host_password agent_pool?

$token=$args[0]
$username=$args[1]
$password=$args[2]
$pool=$args[3]
if (-Not $pool) { $pool = 'Default' }

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

echo "Install Yarn"
choco install yarn

echo "Install Git for Windows"
choco install git.install

echo "Install 7zip"
choco install 7zip

echo "Install CMake"
choco install cmake --installargs 'ADD_CMAKE_TO_PATH=System'

echo "Install Visual Studio 2017 Build Tools"
choco install visualstudio2017buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools;includeRecommended;includeOptional"

echo "Donwload and install Azure Agent"
cd /
Remove-Item -Recurse -Force -ErrorAction Ignore agent
mkdir agent ; cd agent;
Invoke-WebRequest -Uri https://vstsagentpackage.azureedge.net/agent/2.150.3/vsts-agent-win-x64-2.150.3.zip -OutFile "$PWD\agent.zip"
Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD\agent.zip", "$PWD")

echo "Configure Azure Agent"
$publicIp = (Invoke-RestMethod ipinfo.io/ip).trim()
.\config --unattended --url https://dev.azure.com/streamlabs --auth pat --token $token --agent "$env:computername $publicIp" --pool $pool

# Disable the lock screen to prevent the PC locking after the end of the RDP session
Set-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization" -Name 'NoLockScreen' -Value 1;

# Azure Agent has --AutoLogon option to add Anget to autostartup
# But it doesn't allow to pass any arguments to the Agent
# So call own implementation of AutoLogon here
echo "Setup auto-login when system starts"
$RegPath = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
Set-ItemProperty $RegPath "AutoAdminLogon" -Value "1" -type String
Set-ItemProperty $RegPath "DefaultUsername" -Value $username -type String
Set-ItemProperty $RegPath "DefaultPassword" -Value "$password" -type String

# Setup WinRM for remote connections
# Trusted hosts and ports must be confgured on the level above
# Use the example below to run scripts on several agents:
#   $LiveCred = Get-Credential
#   Invoke-Command -Computer Agent1, Agent2, Agent3 -Credential $LiveCred -ScriptBlock {Get-Process}
Enable-PSRemoting -Force
Set-Item -Force wsman:\localhost\client\trustedhosts *
New-NetFirewallRule -DisplayName "Allow inbound TCP port 5985" -Direction inbound -LocalPort 5985 -Protocol TCP -Action Allow
Restart-Service WinRM

echo "Add agent to startup"
Set-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name 'StartAsureAgent' -Value $agentPath;

echo "Installation completed. Restart PC to take effect"
