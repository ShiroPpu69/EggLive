const {app,BrowserWindow,ipcMain,session,shell,dialog}=require('electron');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {WebSocketServer,WebSocket}=require('ws');
const PORT=18739, HOST=`http://127.0.0.1:${PORT}`, token=crypto.randomBytes(24).toString('hex');
let win,server,wss,lastFrame=null,lastFrameTime=0,diagnostics={},obsProcess;
const mime={'.html':'text/html','.js':'text/javascript','.cjs':'text/javascript','.css':'text/css','.wasm':'application/wasm','.task':'application/octet-stream','.png':'image/png','.svg':'image/svg+xml'};
function log(message){fs.appendFileSync(path.join(app.getPath('userData'),'egg-live.log'),new Date().toISOString()+' '+message+'\n');}
function startServer(){return new Promise((resolve,reject)=>{
 server=http.createServer((req,res)=>{
  if(!['127.0.0.1:'+PORT,'localhost:'+PORT].includes(req.headers.host)){res.writeHead(403).end();return;}
  const url=new URL(req.url,HOST);
  if(url.pathname==='/health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({app:'EggLive',version:app.getVersion(),frameAgeMs:lastFrameTime?Date.now()-lastFrameTime:null,consumers:[...wss.clients].filter(c=>!c.producer&&c.readyState===1).length,...diagnostics}));return;}
  let name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
  const root=path.join(__dirname,'dist'),file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);});
 });
 wss=new WebSocketServer({server,maxPayload:4*1024*1024});
 const notifyConsumers=()=>{const count=[...wss.clients].filter(c=>!c.producer&&c.readyState===1).length;for(const c of wss.clients)if(c.producer&&c.readyState===1)c.send(JSON.stringify({type:'consumers',count}));};
 wss.on('connection',(socket,req)=>{
  const url=new URL(req.url,HOST),origin=req.headers.origin;
  if(url.pathname!='/frames'||(origin&&!['http://127.0.0.1:'+PORT,'http://localhost:'+PORT].includes(origin))){socket.close();return;}
  socket.producer=url.searchParams.get('key')===token;socket.rtc=url.searchParams.get('transport')==='rtc';socket.viewerId=crypto.randomUUID();
  notifyConsumers();socket.on('close',notifyConsumers);
  const producers=()=>[...wss.clients].filter(c=>c.producer&&c.readyState===1);
  if(socket.rtc&&!socket.producer)for(const p of producers())p.send(JSON.stringify({type:'viewer',id:socket.viewerId}));
  if(socket.producer)for(const c of wss.clients)if(c.rtc&&!c.producer&&c.readyState===1)socket.send(JSON.stringify({type:'viewer',id:c.viewerId}));
  socket.on('close',()=>{if(socket.rtc&&!socket.producer)for(const p of producers())p.send(JSON.stringify({type:'viewer-left',id:socket.viewerId}));});
  if(!socket.producer&&!socket.rtc&&lastFrame&&Date.now()-lastFrameTime<2000)socket.send(lastFrame,{binary:true});
  socket.on('message',(data,isBinary)=>{
   if(!isBinary){let m;try{m=JSON.parse(data.toString());}catch{return;}
    if(socket.producer&&m.type==='activity'){lastFrameTime=Date.now();return;}
    if(!['offer','answer','candidate'].includes(m.type))return;
    if(socket.producer){const c=[...wss.clients].find(c=>!c.producer&&c.rtc&&c.viewerId===m.id&&c.readyState===1);if(c)c.send(JSON.stringify(m));}
    else if(socket.rtc)for(const p of producers())p.send(JSON.stringify({...m,id:socket.viewerId}));
    return;
   }
   if(!socket.producer||!isBinary)return;
   lastFrame=data;lastFrameTime=Date.now();
   for(const client of wss.clients)if(!client.producer&&!client.rtc&&client.readyState===1&&client.bufferedAmount<1500000)client.send(data,{binary:true});
  });
  socket.on('error',e=>log('WebSocket: '+e.message));
 });
 server.once('error',reject);server.listen(PORT,'127.0.0.1',resolve);
});}
function obsRoot(){
 if(!app.isPackaged)return path.join(__dirname,'OBS');
 const executableDir=path.dirname(app.getPath('exe')),installed=path.join(executableDir,'OBS');
 return fs.existsSync(path.join(installed,'bin','64bit','obs64.exe'))?installed:path.join(path.dirname(executableDir),'OBS');
}
function configureOBS(root){
 const config=path.join(root,'config','obs-studio');fs.mkdirSync(path.join(config,'basic','profiles','EggLive'),{recursive:true});
 const global=path.join(config,'global.ini');
 if(!fs.existsSync(global))fs.writeFileSync(global,'[General]\nLastVersion=537002496\nEnableAutoUpdates=false\nLanguage=zh-CN\n');
 const user=path.join(config,'user.ini');
 if(!fs.existsSync(user))fs.writeFileSync(user,'[General]\nFirstRun=true\nConfirmOnExit=false\n[Basic]\nProfile=EggLive\nProfileDir=EggLive\nSceneCollection=EggLive\nSceneCollectionFile=EggLive\nConfigOnNewProfile=false\n[BasicWindow]\nWarnBeforeStartingStream=true\n');
 const scenes=path.join(config,'basic','scenes');fs.mkdirSync(scenes,{recursive:true});
 const collection=path.join(scenes,'EggLive.json');
 if(!fs.existsSync(collection))fs.writeFileSync(collection,JSON.stringify({name:'EggLive',current_scene:'EggLive',current_program_scene:'EggLive',scene_order:[{name:'EggLive'}],sources:[{name:'EggLive',uuid:crypto.randomUUID(),id:'scene',versioned_id:'scene',settings:{items:[]},mixers:0,enabled:true,volume:1}],groups:[],transitions:[],current_transition:'Fade',transition_duration:300},null,2));
 const profile=path.join(config,'basic','profiles','EggLive','basic.ini');
 if(!fs.existsSync(profile))fs.writeFileSync(profile,'[General]\nName=EggLive\n[Video]\nBaseCX=1280\nBaseCY=720\nOutputCX=1280\nOutputCY=720\nFPSType=0\nFPSCommon=30\n[Output]\nMode=Simple\n[SimpleOutput]\nRecQuality=Small\nRecFormat2=mkv\nFilePath='+app.getPath('videos').replace(/\\/g,'/')+'\n');
 const settings=path.join(config,'plugin_config','obs-websocket');fs.mkdirSync(settings,{recursive:true});
 const file=path.join(settings,'config.json');let existing={};try{existing=JSON.parse(fs.readFileSync(file));}catch{}
 const password=existing.server_password||crypto.randomBytes(20).toString('hex');
 fs.writeFileSync(file,JSON.stringify({...existing,alerts_enabled:false,first_load:false,server_enabled:true,server_port:4457,auth_required:true,server_password:password},null,2));
 return password;
}
function connectOBS(password){return new Promise((resolve,reject)=>{
 const socket=new WebSocket('ws://127.0.0.1:4457');let seq=0,ready=false;const pending=new Map();
 const timer=setTimeout(()=>{socket.close();reject(new Error('OBS 连接超时'));},5000);
 socket.on('error',e=>{clearTimeout(timer);reject(e);});
 socket.on('message',raw=>{const msg=JSON.parse(raw.toString());
  if(msg.op===0){let authentication;const a=msg.d.authentication;if(a){const secret=crypto.createHash('sha256').update(password+a.salt).digest('base64');authentication=crypto.createHash('sha256').update(secret+a.challenge).digest('base64');}socket.send(JSON.stringify({op:1,d:{rpcVersion:1,authentication,eventSubscriptions:0}}));}
  if(msg.op===2){ready=true;clearTimeout(timer);resolve({close:()=>socket.close(),call:(type,data={})=>new Promise((yes,no)=>{const id=String(++seq);const t=setTimeout(()=>{pending.delete(id);no(new Error('OBS 请求超时'));},8000);pending.set(id,{yes,no,t});socket.send(JSON.stringify({op:6,d:{requestType:type,requestId:id,requestData:data}}));})});}
  if(msg.op===7){const p=pending.get(msg.d.requestId);if(p){clearTimeout(p.t);pending.delete(msg.d.requestId);msg.d.requestStatus.result?p.yes(msg.d.responseData||{}):p.no(new Error(msg.d.requestStatus.comment||msg.d.requestStatus.code));}}
 });socket.on('close',()=>{if(!ready){clearTimeout(timer);reject(new Error('OBS 连接关闭'));}for(const p of pending.values()){clearTimeout(p.t);p.no(new Error('OBS 连接关闭'));}pending.clear();});
});}
async function openOBS(virtual=false){
 const root=obsRoot(),exe=path.join(root,'bin','64bit','obs64.exe');
 if(!fs.existsSync(exe))throw new Error('未找到附带的 OBS，请保留软件目录内的 OBS 文件夹。');
 const password=configureOBS(root);
 let client;try{client=await connectOBS(password);}catch{}
 if(!client&&(!obsProcess||obsProcess.exitCode!==null)){
  // Only remove our portable OBS's zero-byte run markers after confirming no API is running.
  const markers=path.join(root,'config','obs-studio','.sentinel');
  if(fs.existsSync(markers))for(const name of fs.readdirSync(markers)){const file=path.join(markers,name);if(/^run_[a-f0-9-]+$/i.test(name)&&fs.statSync(file).isFile()&&fs.statSync(file).size===0){fs.unlinkSync(file);log('Recovered portable OBS stale run marker');}}
  obsProcess=spawn(exe,['--portable','--profile','EggLive','--collection','EggLive','--disable-updater','--disable-missing-files-check'],{cwd:path.dirname(exe),windowsHide:false,detached:true,stdio:'ignore'});obsProcess.unref();
 }
 for(let i=0;!client&&i<25;i++){try{client=await connectOBS(password);}catch{await new Promise(r=>setTimeout(r,600));}}
 if(!client)throw new Error('OBS 尚未就绪。请稍后再点一次；详情见日志。');
 try{
  // Authentication can finish before OBS has loaded its initial collection.
  let scenes;for(let attempt=0;attempt<20;attempt++){try{scenes=await client.call('GetSceneList');break;}catch(e){if(!/not ready|尚未就绪/i.test(e.message)||attempt===19)throw e;await new Promise(r=>setTimeout(r,350));}}
  if(!scenes.scenes.some(s=>s.sceneName==='EggLive'))await client.call('CreateScene',{sceneName:'EggLive'});
  const inputs=await client.call('GetInputList');
  const outputURL=HOST+'/output.html?v='+app.getVersion();
  if(!inputs.inputs.some(i=>i.inputName==='EggLive 透明形象'))await client.call('CreateInput',{sceneName:'EggLive',inputName:'EggLive 透明形象',inputKind:'browser_source',inputSettings:{url:outputURL,width:1280,height:720,fps:30,fps_custom:true,shutdown:false,restart_when_active:false},sceneItemEnabled:true});
  else await client.call('SetInputSettings',{inputName:'EggLive 透明形象',inputSettings:{url:outputURL,width:1280,height:720,fps:30,fps_custom:true},overlay:true});
  await client.call('SetCurrentProgramScene',{sceneName:'EggLive'});
  if(virtual){try{await client.call('StartVirtualCam');}catch(e){const state=await client.call('GetVirtualCamStatus');if(!state.outputActive)throw new Error('虚拟摄像头启动失败；首次使用可能需要点击“安装虚拟摄像头”并批准 Windows 系统授权。');}}
  diagnostics.obsConnected=true;return virtual?'OBS 虚拟摄像头已启动':'OBS 场景已就绪，可以录屏或直播';
 }finally{client.close();}
}
app.setName('EggLive');
if(process.env.EGGLIVE_DATA_DIR){const dataDir=path.resolve(process.env.EGGLIVE_DATA_DIR);fs.mkdirSync(dataDir,{recursive:true});app.setPath('userData',dataDir);}
if(!app.requestSingleInstanceLock())app.quit();
else{
 app.on('second-instance',()=>{if(win){win.restore();win.focus();}});
 app.whenReady().then(async()=>{
  if(process.argv.includes('--test-camera')){app.commandLine.appendSwitch('use-fake-device-for-media-stream');}
  session.defaultSession.setPermissionRequestHandler((contents,permission,callback,details)=>callback(permission==='media'&&contents.getURL().startsWith(HOST+'/')&&!details.mediaTypes?.includes('audio')));
  session.defaultSession.setPermissionCheckHandler((contents,permission,origin,details)=>{
   let local=false;try{local=new URL(origin).origin===HOST;}catch{}
   return permission==='media'&&local&&details.mediaType!=='audio';
  });
  try{await startServer();}catch(e){dialog.showErrorBox('EggLive 启动失败',e.code==='EADDRINUSE'?'本地端口 18739 已被其他程序占用。':e.message);app.quit();return;}
  win=new BrowserWindow({width:1220,height:820,minWidth:940,minHeight:700,title:'EggLive · 3D 鸡蛋直播',backgroundColor:'#171a1f',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  win.setMenuBarVisibility(false);win.loadURL(HOST+(process.env.EGGLIVE_TRACKING_BACKEND==='CPU'?'/?tracking=CPU':''));
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('console-message',details=>{if(details.level==='error')log('Renderer: '+details.message);});
  win.webContents.on('render-process-gone',(_,details)=>log('Renderer exited: '+details.reason));
  ipcMain.handle('config',()=>({token,outputURL:HOST+'/output.html',userData:app.getPath('userData')}));
  ipcMain.on('diagnostics',(_,data)=>{diagnostics={...diagnostics,...data};});
  ipcMain.handle('obs',async(_,virtual)=>{try{return {ok:true,message:await openOBS(!!virtual)};}catch(e){log(e.stack);return {ok:false,message:e.message};}});
  ipcMain.handle('install-virtualcam',async()=>{
   const dll=path.join(obsRoot(),'data','obs-plugins','win-dshow','obs-virtualcam-module64.dll');if(!fs.existsSync(dll))return {ok:false,message:'找不到 OBS 虚拟摄像头组件'};
   // Driver registration is the sole operation requiring a normal Windows UAC prompt.
   const escaped=dll.replace(/'/g,"''");
   return await new Promise(resolve=>{const child=spawn('powershell.exe',['-NoProfile','-WindowStyle','Hidden','-Command',`try { $registration = Start-Process -FilePath "$env:WINDIR\\System32\\regsvr32.exe" -ArgumentList '/s', '"${escaped}"' -Verb RunAs -Wait -PassThru; exit $registration.ExitCode } catch { exit 1 }`],{windowsHide:true,stdio:'ignore'});child.once('error',()=>resolve({ok:false,message:'无法打开 Windows 系统授权，请稍后重试。'}));child.once('exit',code=>resolve({ok:code===0,message:code===0?'虚拟摄像头安装完成，可以点击“启动虚拟摄像头”。':'虚拟摄像头安装未完成，系统授权可能已取消。'}));});
  });
  ipcMain.handle('save-recording',async(_,bytes)=>{const file=path.join(app.getPath('videos'),'EggLive-'+new Date().toISOString().replace(/[:.]/g,'-')+'.webm');await fs.promises.writeFile(file,Buffer.from(bytes));shell.showItemInFolder(file);return file;});
  ipcMain.handle('open-logs',()=>shell.openPath(app.getPath('userData')));
  log('Started '+app.getVersion());
 });
 app.on('window-all-closed',()=>app.quit());
 app.on('before-quit',()=>{if(wss){for(const client of wss.clients)client.terminate();wss.close();}if(server){server.closeAllConnections();server.close();}});
}
