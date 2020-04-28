# remove scripts from autostartup
$regPath = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run";
$RegKey = (Get-ItemProperty $regPath);

$RegKey.PSObject.Properties | ForEach-Object {
  If(-Not($_.Name -like 'PS*') -And ($_.Name -ne 'SecurityHealth')){
    Write-Host "Remove Value" $_.Name ' = ' $_.Value
    Remove-ItemProperty $regPath -Name $_.Name
  }
}
