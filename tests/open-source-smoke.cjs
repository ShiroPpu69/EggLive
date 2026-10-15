const {_electron}=require('playwright'),path=require('path'),fs=require('fs'),os=require('os'),assert=require('assert');
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'egglive-smoke-'));
 const app=await _electron.launch({executablePath:require('electron'),args:['.','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-gpu-sandbox'],cwd:path.resolve('.'),env:{...process.env,EGGLIVE_DATA_DIR:profile,EGGLIVE_TRACKING_BACKEND:'CPU'}});
 let p;const errors=[],external=[];try{
  p=await app.firstWindow();p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:18739\/|data:|blob:)/.test(r.url()))external.push(r.url());});
  await p.waitForFunction(()=>['ready','error'].includes(window.eggTest?.diagnostics().model),{},{timeout:60000,polling:250});assert.equal(await p.evaluate(()=>window.eggTest.diagnostics().model),'ready',JSON.stringify(await p.evaluate(()=>window.eggTest.diagnostics())));await p.click('#pause');
  const input=fs.readFileSync('docs/assets/demo-portrait.png').toString('base64');
  const result=await p.evaluate(async input=>{
   const api=window.eggTest,img=new Image();img.src='data:image/png;base64,'+input;await img.decode();const r=await api.captureResult(img);if(!r.faceLandmarks?.length)throw Error('Synthetic portrait was not detected');r.frame.close();delete r.frame;
   const closed=structuredClone(r);for(const [t,b] of [[159,145],[386,374]]){const lm=closed.faceLandmarks[0],x=(lm[t].x+lm[b].x)/2,y=(lm[t].y+lm[b].y)/2;lm[t]={...lm[t],x,y:y-.0001};lm[b]={...lm[b],x,y:y+.0001};}
   api.captureEye('open',img,r);let rejected=false;try{api.captureEye('closed',img,r);}catch{rejected=true;}
   const ready=api.captureEye('closed',img,closed); // Synthetic control fixture; not visual closed-eye quality evidence.
   api.reset();const a=api.renderSource(img,r),solid=document.createElement('canvas');solid.width=img.width;solid.height=img.height;const ctx=solid.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,solid.width,solid.height);api.reset();const b=api.renderSource(solid,r);
   const pixels=async src=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);return {width:c.width,height:c.height,p:x.getImageData(0,0,c.width,c.height).data};};
   const aa=await pixels(a),bb=await pixels(b);let eyeDelta=0,opaque=0;for(let y=0;y<aa.height/2;y++)for(let x=0;x<aa.width;x++){const i=(y*aa.width+x)*4;for(let c=0;c<4;c++)eyeDelta+=Math.abs(aa.p[i+c]-bb.p[i+c]);if(aa.p[i+3]>240)opaque++;}
   const saved=localStorage.getItem('egg-eye-reference');return {landmarks:r.faceLandmarks[0].length,rejected,ready:ready.enabled,eyeDelta,opaque,saved:!!saved};
  },input);
  assert.equal(result.landmarks,478);assert(result.rejected&&result.ready&&result.saved);assert.equal(result.eyeDelta,0);assert(result.opaque>1000);
  await p.reload();await p.waitForFunction(()=>window.eggTest?.eyeState().enabled,{},{timeout:20000,polling:250});await p.click('#eye-clear');assert(await p.evaluate(()=>localStorage.getItem('egg-eye-reference')===null));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log(JSON.stringify({pass:true,...result,restoredAndDeleted:true,rendererErrors:errors.length,externalRequests:external.length},null,2));
 }catch(e){console.error('Smoke diagnostics',JSON.stringify({url:p?.url(),errors,page:p?await p.evaluate(()=>({status:document.getElementById('status')?.textContent,diagnostics:window.eggTest?.diagnostics()})).catch(()=>null):null,gpu:await app.evaluate(({app})=>app.getGPUFeatureStatus()).catch(()=>null)}));throw e;}finally{await Promise.race([app.close(),new Promise(r=>setTimeout(r,10000))]);}
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
