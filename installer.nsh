!macro customInstall
  FileOpen $0 "$INSTDIR\installername" w
  FileWrite $0 $EXEFILE
  FileClose $0
!macroend
