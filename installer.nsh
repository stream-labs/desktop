
!macro registerProtocol Protocol
  DetailPrint "Register ${Protocol} URI Handler"
	DeleteRegKey HKCU "Software\Classes\${Protocol}"
	WriteRegStr HKCU "Software\Classes\${Protocol}" "" "URL:${Protocol}"
	WriteRegStr HKCU "Software\Classes\${Protocol}" "URL Protocol" ""
	WriteRegStr HKCU "Software\Classes\${Protocol}\shell" "" ""
	WriteRegStr HKCU "Software\Classes\${Protocol}\shell\Open" "" ""
	WriteRegStr HKCU "Software\Classes\${Protocol}\shell\Open\command" "" '"$appExe" "%1"'
!macroend

!macro unregisterProtocol Protocol
	DeleteRegKey HKCU "Software\Classes\${Protocol}"
!macroend

# English
LangString failed_install 1033 "WARNING: N Air was unable to install the latest Visual C++ Redistributable package from Microsoft."
LangString require_restart 1033 "You must restart your computer to complete the installation."
LangString failed_download 1033 "WARNING: N Air was unable to download the latest Visual C++ Redistributable package from Microsoft."

# Japanese
LangString failed_install 1041 "警告: Microsoft の最新の Visual C++ 再頒布可能パッケージのインストールができませんでした。"	
LangString require_restart 1041 "インストールを完了するには、コンピューターを再起動してください。"	
LangString failed_download 1041 "警告: Microsoft から最新の Visual C++ 再頒布可能パッケージをダウンロードできませんでした。"	

!macro customInstall
  NSISdl::download https://aka.ms/vs/17/release/vc_redist.x64.exe "$INSTDIR\vc_redist.x64.exe"  

  ${If} ${FileExists} `$INSTDIR\vc_redist.x64.exe`
    ExecWait '$INSTDIR\vc_redist.x64.exe /passive /norestart' $1

    ${If} $1 != '0' 
      ${If} $1 != '3010'
        MessageBox MB_OK|MB_ICONEXCLAMATION "$(failed_install)"
      ${EndIf}
    ${EndIf}

    # ${If} $1 == '3010'
    #     MessageBox MB_OK|MB_ICONEXCLAMATION "$(require_restart)"
    # ${EndIf}

  ${Else}
    MessageBox MB_OK|MB_ICONEXCLAMATION "$(failed_download)"
  ${EndIf}

  FileOpen $0 "$INSTDIR\installername" w
  FileWrite $0 $EXEFILE
  FileClose $0

  !insertMacro registerProtocol "n-air-app"
!macroend

!macro customUninstall
  !insertMacro unregisterProtocol "n-air-app"
!macroend
