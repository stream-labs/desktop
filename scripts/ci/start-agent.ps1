# start agent
$workingDir=[System.Environment]::GetEnvironmentVariable('AZURE_PIPELINES_WORKING_DIR', [System.EnvironmentVariableTarget]::User);

if (-Not($workingDir)) {
  echo "Working dir is not set. Did you run the installation script?";
  exit -1;
}
."$workingDir/run.cmd --once"
