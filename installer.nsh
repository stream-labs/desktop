!macro customInstall
  NSISdl::download https://s3-us-west-2.amazonaws.com/obsstudionodes3.streamlabs.com/VC_redist.x64.exe "$INSTDIR\vc_redist.x64.exe"  
  
  ${If} ${FileExists} `$INSTDIR\vc_redist.x64.exe`
    ExecWait '$INSTDIR\vc_redist.x64.exe /passive /norestart' $1

    ${If} $1 != '0' 
      MessageBox MB_OK|MB_ICONEXCLAMATION 'WARNING: Streamlabs OBS was unable to install the latest Visual C++ Redistributable package from Microsoft.'
    ${EndIf}
  ${Else}
      MessageBox MB_OK|MB_ICONEXCLAMATION 'WARNING: Streamlabs OBS was unable to download the latest Visual C++ Redistributable package from Microsoft.'
  ${EndIf}

  FileOpen $0 "$INSTDIR\installername" w
  FileWrite $0 $EXEFILE
  FileClose $0
!macroend
