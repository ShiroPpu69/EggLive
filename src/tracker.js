export function createFaceTracker(onReady){
 return new Promise((resolve,reject)=>{
  const cpu=new URLSearchParams(location.search).get('tracking')==='CPU';
  const worker=new Worker('/tracking-worker.js'+(cpu?'?delegate=CPU':'')),pending=new Map();let seq=0;
  worker.onmessage=e=>{const m=e.data;if(m.type==='fatal'){reject(new Error(m.error));return;}if(m.type==='ready'){onReady(m.delegate);resolve({detectForVideo:async(source,timestamp)=>{const bitmap=await createImageBitmap(source);const id=++seq;return new Promise((yes,no)=>{pending.set(id,{yes,no});worker.postMessage({id,bitmap,timestamp},[bitmap]);});},close:()=>worker.terminate()});return;}const p=pending.get(m.id);if(!p){m.bitmap?.close();return;}pending.delete(m.id);m.error?p.no(new Error(m.error)):p.yes({...m.result,frame:m.bitmap,capturedAt:m.timestamp});};
  worker.onerror=e=>{const error=new Error(e.message);reject(error);for(const p of pending.values())p.no(error);pending.clear();};
 });
}
