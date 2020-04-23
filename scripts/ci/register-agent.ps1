# register agent in Azure Pipelines
$token=[System.Environment]::GetEnvironmentVariable('AZURE_PIPELINES_TOKEN', $token)

if (-Not($token)) {
  echo "Token is not found. Registration canceled";
  exit -1;
}

$pool = 'Default'
$publicIp = (Invoke-RestMethod ipinfo.io/ip).trim()
.\config --unattended --url https://dev.azure.com/streamlabs --auth pat --token $token --agent "$env:computername $publicIp" --pool $pool
