import * as THREE from 'three';

// A personal clean-eye atlas, captured locally. No live lens pixels are used
// in reference mode. Only small eye crops are persisted, never the full face.
export function createEyeReference(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
 const enabled={value:0},map={value:texture},slots=[{value:0},{value:1}],openness=[{value:1},{value:1}];
 let recorded={open:false,closed:false},levels={open:[.28,.28],closed:[.04,.04]},requested=false;
 const specs=[[33,133,159,145],[362,263,386,374]];
 function ratios(lm,w,h){return specs.map(([a,b,t,d])=>Math.hypot((lm[t].x-lm[d].x)*w,(lm[t].y-lm[d].y)*h)/Math.max(1,Math.hypot((lm[a].x-lm[b].x)*w,(lm[a].y-lm[b].y)*h)));}
 function update(lm,w,h){const r=ratios(lm,w,h);r.forEach((v,i)=>{const range=Math.max(.06,levels.open[i]-levels.closed[i]);const target=THREE.MathUtils.clamp((v-levels.closed[i])/range,0,1);openness[i].value=target;});}
 function capture(kind,source,result){
  if(!['open','closed'].includes(kind))throw Error('未知参考类型');
  const lm=result.faceLandmarks?.[0],w=source.videoWidth||source.width,h=source.videoHeight||source.height;
  if(!lm||!w||!h)throw Error('没有可用的人脸画面');
  const values=ratios(lm,w,h);
  if(kind==='open'&&values.some(v=>v<.17))throw Error('请睁开双眼，并正对镜头');
  if(kind==='closed'&&!recorded.open)throw Error('请先记录睁眼');
  if(kind==='closed'&&values.some((v,i)=>v>levels.open[i]*.65))throw Error('请完全闭上双眼，保持到采集完成');
  const ctx=canvas.getContext('2d'),row=kind==='open'?0:128;
  specs.forEach(([a,b,t,d],i)=>{
   const dx=(lm[b].x-lm[a].x)*w,dy=(lm[b].y-lm[a].y)*h,angle=Math.atan2(dy,dx),width=Math.hypot(dx,dy)*1.65,height=width*.58;
   const cx=(lm[a].x+lm[b].x)*.5*w,cy=((lm[t].y+lm[d].y)*.5-.006)*h;
   const aa=256/width*Math.cos(angle),bb=-128/height*Math.sin(angle),cc=256/width*Math.sin(angle),dd=128/height*Math.cos(angle);
   ctx.save();ctx.beginPath();ctx.rect(i*256,row,256,128);ctx.clip();ctx.clearRect(i*256,row,256,128);ctx.setTransform(aa,bb,cc,dd,i*256+128-aa*cx-cc*cy,row+64-bb*cx-dd*cy);ctx.drawImage(source,0,0);ctx.restore();
  });
  levels[kind]=values;recorded[kind]=true;
  // A new open sample invalidates the former closed sample/calibration.
  if(kind==='open'){recorded.closed=false;requested=false;enabled.value=0;}
  else{requested=true;enabled.value=1;}
  texture.needsUpdate=true;return state();
 }
 function state(){return {ready:recorded.open&&recorded.closed,open:recorded.open,closed:recorded.closed,enabled:enabled.value===1,levels:structuredClone(levels),openness:openness.map(v=>v.value)};}
 function setEnabled(v){requested=!!v;enabled.value=requested&&recorded.open&&recorded.closed?1:0;return state();}
 function save(){return {version:1,atlas:canvas.toDataURL('image/png'),recorded,levels};}
 async function load(data){
  if(data?.version!==1||!data.atlas?.startsWith('data:image/png;base64,')||data.atlas.length>1500000)return false;
  if(!['open','closed'].every(k=>Array.isArray(data.levels?.[k])&&data.levels[k].length===2&&data.levels[k].every(v=>Number.isFinite(v)&&v>=0&&v<1)))return false;
  const img=new Image();img.src=data.atlas;await img.decode();if(img.width!==512||img.height!==256)return false;
  canvas.getContext('2d').drawImage(img,0,0);recorded={open:!!data.recorded?.open,closed:!!data.recorded?.closed};levels=data.levels;texture.needsUpdate=true;return true;
 }
 function clear(){recorded={open:false,closed:false};requested=false;enabled.value=0;canvas.getContext('2d').clearRect(0,0,512,256);texture.needsUpdate=true;return state();}
 return {enabled,map,slots,openness,update,capture,state,setEnabled,save,load,clear};
}
