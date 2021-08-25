
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

!macro customInstall
  FileOpen $0 "$INSTDIR\installername" w
  FileWrite $0 $EXEFILE
  FileClose $0

  !insertMacro registerProtocol "n-air-app"
!macroend

!macro customUninstall
  !insertMacro unregisterProtocol "n-air-app"
!macroend
