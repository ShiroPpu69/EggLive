!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customInstall
  SetRegView 64
  StrCpy $0 0
  StrCpy $1 0
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
  ReadRegDWORD $1 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Minor"
  ${If} $0 != 1
  ${OrIf} $1 < 51
    DetailPrint "正在安装 Microsoft C++ 运行库，请批准可能出现的 Windows 系统授权。"
    ${StdUtils.ExecShellWaitEx} $2 $3 "$INSTDIR\prerequisites\vc_redist.x64.exe" "runas" "/install /passive /norestart"
    ${If} $2 == "ok"
      ${StdUtils.WaitForProcEx} $4 $3
      DetailPrint "Microsoft C++ 运行库安装返回：$4"
    ${Else}
      MessageBox MB_OK|MB_ICONEXCLAMATION "Microsoft C++ 运行库安装未完成。使用 OBS 前，请运行安装目录 prerequisites 中的 vc_redist.x64.exe 并批准系统授权。"
    ${EndIf}
  ${EndIf}
  SetRegView lastused
!macroend
