import './style.css';
import {createFaceTracker} from './tracker.js';
import {createAvatar} from './avatar.js';
import {createTransport} from './transport.js';

document.querySelector('#app').innerHTML=`
<header><h1>EggLive <span>真人表情 · 3D 鸡蛋</span></h1><div class="badge">本地运行 · 离线追踪</div></header>
<main><div><div class="stage" id="stage"><div class="stage-label">LIVE AVATAR / 30 FPS</div></div>
<div class="status-row"><div class="status"><i class="dot" id="dot"></i><span id="status">正在准备追踪模型…</span></div><div class="stats" id="stats">—</div></div>
<div class="notice" id="notice">插上 USB 摄像头后自动连接。真人眼睛与嘴巴将在识别到人脸时出现。</div>
<div class="buttons"><button class="primary" id="connect">连接摄像头</button><button id="calibrate">正脸校准</button><button id="pause">暂停追踪</button><button id="record">录制形象</button><button id="demo">展示晃动</button></div>
<div class="hint">OBS 输出只包含鸡蛋，背景透明。追踪丢失时隐藏眼嘴；摄像头完整画面不会进入直播输出。</div></div>
<aside class="side"><div class="section"><h2>摄像头与形象</h2><label for="cameras">视频设备</label><select id="cameras"><option value="">自动选择 USB 摄像头</option></select>
<label for="quality">直播画质 · 30 帧</label><select id="quality"><option value="low">省 CPU（640 × 360）</option><option value="balanced">均衡（960 × 540）</option><option value="high">清晰（1280 × 720）</option></select>
<label for="shell">蛋壳颜色</label><select id="shell"><option value="white">自然乳白蛋壳</option><option value="brown">浅褐蛋壳</option></select>
<label for="glare">眼镜反光抑制 <span id="glareVal">85%</span></label><input id="glare" type="range" min="0" max="100" value="85"><div class="hint">抑制蓝紫色镜片反光及白色亮斑。强反光遮住的眼睛无法完整还原；过暗时降低此项。</div>
<div class="eye-panel"><h2>无镜参考眼睛</h2><div class="hint">摘下眼镜，依次记录睁眼和闭眼（点击后倒数 3 秒）。完成后戴回眼镜，使用你的干净眼睛画面，由面捕驱动眨眼；视线和细微眼部表情不会实时重现。</div><button class="small" id="eye-open">① 摘镜记录睁眼</button><button class="small" id="eye-closed">② 摘镜记录闭眼</button><div class="hint" id="eye-status" role="status">尚未记录。参考只保存在这台电脑。</div><img id="eye-preview" alt="已记录的双眼，上排睁眼、下排闭眼" hidden><label>启用参考眼睛<input id="eye-enabled" type="checkbox" disabled></label><button class="small" id="eye-clear">删除参考眼睛</button></div>
<label for="elasticity">惯性与弹性 <span id="elasticityVal">60%</span></label><input id="elasticity" type="range" min="0" max="100" value="60">
<label for="strength">头部动作幅度 <span id="strengthVal">100%</span></label><input id="strength" type="range" min="30" max="150" value="100">
<label for="zoom">形象大小 <span id="zoomVal">100%</span></label><input id="zoom" type="range" min="60" max="120" value="100">
<label>镜像动作<input id="mirror" type="checkbox" checked></label><label>透明背景预览<input id="checker" type="checkbox"></label></div>
<div class="section"><h2>直播与虚拟摄像头</h2><div class="output-url" id="url">http://127.0.0.1:18739/output.html</div>
<button class="primary" id="obs">打开已配置的 OBS</button><button id="virtual">启动虚拟摄像头</button><button class="small" id="install">安装虚拟摄像头</button>
<div class="hint">附带 OBS 自动创建透明形象场景。首次安装虚拟摄像头需批准 Windows 系统授权。会议软件选择“OBS Virtual Camera”。录音请在 OBS 添加麦克风。</div></div>
<button class="small" id="logs">打开诊断日志</button></aside></main><footer>EggLive 1.6.1 · 30 帧直播模式 · 模型已内置 · 摄像头仅在本机处理</footer><div class="toast" id="toast" role="status"></div><video id="video" autoplay muted playsinline></video>`;
const $=id=>document.getElementById(id),video=$('video');
const avatar=createAvatar($('stage'),video),transport=createTransport(avatar.canvas);let tracker,stream,paused=false,modelReady=false,cameraBusy=false,demo=false,recording,recordCanvas,recordTrack,recordChunks=[],lastVideoTime=-1,lastTrack=0,lastFound=0,frames=0,trackFrames=0,lastStats=performance.now(),lastRender=0,trackBusy=false,cameraSerial=0,consumers=0,socket,config={},lastResult,calibrationPending=true;
const diagnostics={camera:'initializing',tracking:false,model:'loading',renderFPS:0,trackingFPS:0,landmarks:0};
let lastStatus='',lastLive=false;function status(message,live=false){if(message!==lastStatus){$('status').textContent=message;lastStatus=message;}if(live!==lastLive){$('dot').classList.toggle('live',live);lastLive=live;}}
let toastTimer;function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',10000);}
let eyeCapture=null;
function eyeUI(message){const s=avatar.eyeReference.state();$('eye-enabled').disabled=!s.ready;$('eye-enabled').checked=s.enabled;$('eye-open').disabled=!!eyeCapture;$('eye-closed').disabled=!!eyeCapture||!s.open;$('eye-status').textContent=message||(s.enabled?'已启用：参考眼睛 + 实时眨眼，镜片画面不进入输出。':s.ready?'已记录，当前使用实时眼睛。':s.open?'睁眼已记录；请摘镜闭眼，点击②。':'尚未记录。参考只保存在这台电脑。');$('eye-preview').hidden=!s.open;if(s.open)$('eye-preview').src=avatar.eyeReference.save().atlas;}
function saveEye(){try{localStorage.setItem('egg-eye-reference',JSON.stringify(avatar.eyeReference.save()));localStorage.setItem('egg-eye-enabled',String(avatar.eyeReference.state().enabled));}catch(e){toast('参考已采集，但本地保存失败：'+e.message);}}
function cancelEye(message){if(!eyeCapture)return;eyeCapture=null;eyeUI(message);}
function collectEye(source,result){
 if(!eyeCapture||performance.now()<eyeCapture.at)return;
 try{avatar.eyeReference.capture(eyeCapture.kind,source,result);eyeCapture=null;saveEye();eyeUI();toast(avatar.eyeReference.state().ready?'参考眼睛已启用，可以戴回眼镜直播。':'睁眼已记录。接下来点击②，闭眼保持到采集完成。');}
 catch(e){if(performance.now()>eyeCapture.expires){eyeCapture=null;eyeUI('未记录：'+e.message+'。请重试。');}else eyeUI(e.message+'，正在等待…');}
}
function startEye(kind){if(!stream||!diagnostics.tracking){toast('请先连接摄像头，确保能识别人脸。');return;}eyeCapture={kind,at:performance.now()+3000,expires:performance.now()+9000};eyeUI('请摘下眼镜，'+(kind==='open'?'正对镜头睁开双眼':'闭上双眼保持 4 秒')+'。3 秒后采集…');}
$('eye-open').onclick=()=>startEye('open');$('eye-closed').onclick=()=>startEye('closed');$('eye-enabled').onchange=()=>{avatar.eyeReference.setEnabled($('eye-enabled').checked);saveEye();eyeUI();};$('eye-clear').onclick=()=>{eyeCapture=null;avatar.eyeReference.clear();localStorage.removeItem('egg-eye-reference');localStorage.removeItem('egg-eye-enabled');eyeUI('参考已删除；当前使用实时眼睛和反光抑制。');};
eyeUI();try{const saved=JSON.parse(localStorage.getItem('egg-eye-reference')||'null');if(saved)avatar.eyeReference.load(saved).then(ok=>{if(ok){avatar.eyeReference.setEnabled(localStorage.getItem('egg-eye-enabled')==='true');eyeUI();}else eyeUI('参考文件无效，请重新记录。');}).catch(()=>eyeUI('参考读取失败，请重新记录。'));}catch{}
function report(){window.eggDesktop?.diagnostics(diagnostics);}
function settings(){const data={materialVersion:2,glareVersion:2,shell:$('shell').value,quality:$('quality').value,glare:+$('glare').value,elasticity:+$('elasticity').value,strength:+$('strength').value,zoom:+$('zoom').value,mirror:$('mirror').checked,checker:$('checker').checked,camera:$('cameras').value};localStorage.setItem('egg-settings',JSON.stringify(data));avatar.setShell(data.shell==='white');const size={low:[640,360],balanced:[960,540],high:[1280,720]}[data.quality];if(size&&avatar.canvas.width!==size[0])avatar.setResolution(...size);avatar.setOptions({elasticity:data.elasticity/100,strength:data.strength/100,zoom:data.zoom/100,mirror:data.mirror,glare:data.glare/100});$('stage').classList.toggle('checker',data.checker);['glare','elasticity','strength','zoom'].forEach(k=>$(k+'Val').textContent=data[k]+'%');}
let stored={};try{stored=JSON.parse(localStorage.getItem('egg-settings')||'{}');}catch{}
if(!stored.materialVersion)stored.shell='white';if(stored.glareVersion!==2)stored.glare=Math.max(85,stored.glare||0);
for(const id of ['shell','quality','glare','elasticity','strength','zoom','mirror','checker']){if(stored[id]!==undefined){if($(id).type==='checkbox')$(id).checked=stored[id];else $(id).value=stored[id];}$(id).addEventListener('input',settings);}settings();
async function listCameras(){const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput'&&!/OBS Virtual Camera/i.test(d.label));const selected=stream?.getVideoTracks()[0]?.getSettings().deviceId||stored.camera||$('cameras').value;$('cameras').replaceChildren(new Option('自动选择 USB 摄像头',''),...devices.map((d,i)=>new Option(d.label||'摄像头 '+(i+1),d.deviceId)));if(devices.some(d=>d.deviceId===selected))$('cameras').value=selected;return devices;}
function stopCamera(){cameraSerial++;cancelEye('采集已取消：摄像头已停止。');avatar.hide();if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;lastVideoTime=-1;diagnostics.tracking=false;diagnostics.landmarks=0;}
async function connect(){
 if(cameraBusy||paused)return;cameraBusy=true;$('connect').disabled=true;status('正在连接摄像头…');
 try{
  stopCamera();const devices=await listCameras();let selected=$('cameras').value;
  if(!selected){const physical=devices.find(d=>!/OBS|virtual|snap|manycam|droidcam/i.test(d.label));if(physical)selected=physical.deviceId;}
  if(devices.length&&devices.every(d=>d.label&&/OBS|virtual|snap|manycam/i.test(d.label))&&!selected)throw new DOMException('没有物理摄像头','NotFoundError');
  stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{...(selected?{deviceId:{exact:selected}}:{}),width:{ideal:640},height:{ideal:480},frameRate:{ideal:30,max:30}}});
  if(!selected&&/OBS|virtual|snap|manycam/i.test(stream.getVideoTracks()[0].label)){await listCameras();throw new DOMException('没有物理摄像头','NotFoundError');}
  video.srcObject=stream;await video.play();await listCameras();settings();calibrationPending=true;
  stream.getVideoTracks()[0].addEventListener('ended',()=>{stopCamera();diagnostics.camera='disconnected';status('摄像头已断开，等待重新插入');report();});
  diagnostics.camera='connected';diagnostics.device=stream.getVideoTracks()[0].label;status(modelReady?'摄像头已连接 · 等待人脸':'摄像头已连接 · 模型准备中');$('notice').textContent='请看向摄像头。眨眼、张嘴或轻轻转头，鸡蛋会跟随你的动作。';
 }catch(e){stopCamera();diagnostics.camera=e.name;const errors={NotFoundError:'未发现摄像头。插上 USB 摄像头后会自动重试。',NotAllowedError:'摄像头访问被拒绝。请在 Windows 设置 → 隐私和安全性 → 摄像头中允许桌面应用访问。',NotReadableError:'摄像头无法打开，可能被其他程序占用。关闭占用程序后点击连接。',OverconstrainedError:'所选摄像头已不可用，请改选设备。'};status('摄像头未就绪');$('notice').textContent=errors[e.name]||('连接失败：'+e.message);}
 finally{cameraBusy=false;$('connect').disabled=false;report();}
}
async function initModel(){
 try{tracker=await createFaceTracker(delegate=>diagnostics.delegate=delegate);
 modelReady=true;diagnostics.model='ready';if(stream)status('模型已就绪 · 等待人脸');else if(diagnostics.camera==='initializing')status('模型已就绪 · 正在查找摄像头');
 }catch(e){diagnostics.model='error';diagnostics.error=e.message;status('追踪模型加载失败');$('notice').textContent='模型无法加载：'+e.message+'。请保留软件文件夹完整，查看诊断日志。';}report();
}
function connectOutput(){if(!config.token)return;socket=new WebSocket('ws://'+location.host+'/frames?key='+config.token);transport.attach(socket);socket.onmessage=e=>{try{const m=JSON.parse(e.data);if(m.type==='consumers')consumers=m.count;else transport.message(m).catch(e=>{diagnostics.transportError=e.message;});}catch{}};socket.onclose=()=>{transport.close();consumers=0;setTimeout(connectOutput,1500);};socket.onerror=()=>socket.close();}
const FRAME_MS=1000/30;let nextRender=performance.now();
function loop(now){
 nextRender=now+FRAME_MS;lastRender=now;frames++;
 if(tracker&&stream&&!paused&&!trackBusy&&video.readyState>=2&&video.currentTime!==lastVideoTime&&now-lastTrack>=55){
  lastVideoTime=video.currentTime;lastTrack=now;trackBusy=true;const serial=cameraSerial;
  tracker.detectForVideo(video,now).then(result=>{
   if(serial!==cameraSerial||!stream){result.frame?.close();return;}trackFrames++;diagnostics.trackingLatencyMs=Math.round(performance.now()-result.capturedAt);if(diagnostics.trackingLatencyMs>450){result.frame?.close();diagnostics.staleFrames=(diagnostics.staleFrames||0)+1;return;}const found=avatar.update(result.frame,result);if(found)lastResult=result;else result.frame?.close();
   if(found){collectEye(result.frame,result);lastFound=performance.now();if(calibrationPending){avatar.calibrate();calibrationPending=false;}diagnostics.tracking=true;diagnostics.landmarks=result.faceLandmarks[0].length;status(avatar.eyeReference.state().enabled?'正在追踪 · 参考眼睛 / 真人嘴巴':'正在追踪 · 真人眼嘴已融合',true);}
   else if(performance.now()-lastFound>700){diagnostics.tracking=false;diagnostics.landmarks=0;status('未识别人脸 · 眼嘴已隐藏');}
  }).catch(e=>{if(serial!==cameraSerial)return;diagnostics.error=e.message;if(performance.now()-lastFound>700){diagnostics.tracking=false;status('追踪暂不可用 · 等待恢复');}}).finally(()=>trackBusy=false);
 }
 avatar.frame(now);
 if(eyeCapture&&now>eyeCapture.expires)cancelEye('采集超时：请保持正脸并确认摄像头能识别人脸。');
 if(recordCanvas){recordCanvas.getContext('2d').drawImage(avatar.canvas,0,0,avatar.canvas.width,avatar.canvas.height,0,0,960,540);recordTrack?.requestFrame();}
 transport.frame(now);
 if(now-lastStats>1000){Object.assign(diagnostics,transport.stats());diagnostics.eyeReference=avatar.eyeReference.state().enabled;diagnostics.consumers=consumers;diagnostics.outputSize=avatar.canvas.width+'x'+avatar.canvas.height;diagnostics.glare=+$('glare').value;diagnostics.renderFPS=Math.round(frames*1000/(now-lastStats));diagnostics.trackingFPS=Math.round(trackFrames*1000/(now-lastStats));$('stats').textContent=diagnostics.renderFPS+' FPS · 追踪 '+diagnostics.trackingFPS+' FPS';frames=0;trackFrames=0;lastStats=now;report();}
 setTimeout(()=>loop(performance.now()),Math.max(1,Math.ceil(nextRender-performance.now())));
}
$('connect').onclick=()=>{paused=false;$('pause').textContent='暂停追踪';connect();};$('cameras').onchange=()=>{stored.camera=$('cameras').value;settings();connect();};
$('calibrate').onclick=()=>{if(!diagnostics.tracking){toast('请先连接摄像头，并保持脸部在画面中。');return;}avatar.calibrate();toast('正脸已校准，当前姿势作为动作中心。');};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'恢复追踪':'暂停追踪';if(paused){stopCamera();diagnostics.camera='paused';status('已暂停 · 摄像头已释放');report();}else connect();};
$('demo').onclick=()=>{demo=!demo;avatar.setDemo(demo);$('demo').textContent=demo?'停止展示':'展示晃动';};
async function desktopAction(id,action){if(!window.eggDesktop){toast('此功能请在 EggLive 桌面软件中使用。');return;}$(id).disabled=true;try{const result=await action();toast(result.message);}catch(e){toast(e.message);}finally{$(id).disabled=false;}}
$('obs').onclick=()=>desktopAction('obs',()=>window.eggDesktop.obs(false));$('virtual').onclick=()=>desktopAction('virtual',()=>window.eggDesktop.obs(true));$('install').onclick=()=>desktopAction('install',()=>window.eggDesktop.installVirtualcam());$('logs').onclick=()=>window.eggDesktop?.openLogs();
$('record').onclick=()=>{
 if(recording?.state==='recording'){recording.stop();$('record').textContent='正在保存…';$('record').disabled=true;return;}
 recordCanvas=document.createElement('canvas');recordCanvas.width=960;recordCanvas.height=540;const capture=recordCanvas.captureStream(0);recordTrack=capture.getVideoTracks()[0];recordChunks=[];const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));recording=new MediaRecorder(capture,{mimeType,videoBitsPerSecond:6000000});recording.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data);};recording.onstop=async()=>{try{const blob=new Blob(recordChunks,{type:mimeType});if(window.eggDesktop){const file=await window.eggDesktop.saveRecording(await blob.arrayBuffer());toast('已保存无声形象视频：'+file);}else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='EggLive.webm';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}}catch(e){toast('保存失败：'+e.message);}finally{capture.getTracks().forEach(t=>t.stop());recordCanvas=null;recordTrack=null;recordChunks=[];$('record').textContent='录制形象';$('record').disabled=false;$('record').classList.remove('recording');}};recording.start(1000);$('record').textContent='停止并保存';$('record').classList.add('recording');toast('正在录制形象（无声）。带麦克风录屏请使用 OBS。');
};
window.addEventListener('beforeunload',()=>{stopCamera();tracker?.close();});
navigator.mediaDevices.addEventListener('devicechange',async()=>{await listCameras();if(!stream&&!paused)connect();});
setInterval(async()=>{if(!stream&&!paused&&!cameraBusy&&diagnostics.camera==='NotFoundError'){const devices=await listCameras();if(devices.some(d=>!/OBS|virtual/i.test(d.label)))connect();}},3000);
window.eggTest={captureEye:(kind,source,result)=>{const state=avatar.eyeReference.capture(kind,source,result);saveEye();eyeUI();return state;},eyeState:()=>avatar.eyeReference.state(),loadEye:async data=>{await avatar.eyeReference.load(data);const state=avatar.eyeReference.setEnabled(true);eyeUI();return state;},eyeData:()=>avatar.eyeReference.save(),reset:()=>avatar.resetTracking(),captureResult:source=>tracker.detectForVideo(source,performance.now()),acceptFrame:result=>avatar.update(result.frame,result),tick:now=>avatar.frame(now),diagnostics:()=>({...diagnostics}),pose:()=>avatar.getPose(),detect:async source=>{if(!tracker)throw new Error('model not ready');const r=await tracker.detectForVideo(source,performance.now());lastResult=r;avatar.update(source,r);r.frame?.close();avatar.calibrate();return {count:r.faceLandmarks?.[0]?.length||0,blendshapes:r.faceBlendshapes?.[0]?.categories,matrices:r.facialTransformationMatrixes?.length};},renderSource:(source,result)=>{avatar.update(source,result);avatar.calibrate();avatar.frame(performance.now());const c=document.createElement('canvas');c.width=avatar.canvas.width;c.height=avatar.canvas.height;c.getContext('2d').drawImage(avatar.canvas,0,0);return c.toDataURL('image/png');},getResult:()=>lastResult};
loop(performance.now());initModel();connect();
if(window.eggDesktop)window.eggDesktop.config().then(c=>{config=c;$('url').textContent=c.outputURL;connectOutput();});
