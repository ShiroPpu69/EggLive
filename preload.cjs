const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('eggDesktop',{
 config:()=>ipcRenderer.invoke('config'),diagnostics:data=>ipcRenderer.send('diagnostics',data),
 obs:virtual=>ipcRenderer.invoke('obs',virtual),installVirtualcam:()=>ipcRenderer.invoke('install-virtualcam'),
 saveRecording:bytes=>ipcRenderer.invoke('save-recording',bytes),openLogs:()=>ipcRenderer.invoke('open-logs')
});
