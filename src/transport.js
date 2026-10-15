// Local WebRTC video uses inter-frame encoding instead of CPU-heavy WebP stills.
// RGB and alpha occupy separate halves of one frame; OBS reconstructs transparency.
export function createTransport(canvas){
 const packed=document.createElement('canvas');packed.width=canvas.width*2;packed.height=canvas.height;const ctx=packed.getContext('2d');
 let stream,socket,lastActivity=0,lastStats=0,codecStats={};const peers=new Map();
 function send(message){if(socket?.readyState===1)socket.send(JSON.stringify(message));}
 function stop(){for(const p of peers.values())p.pc.close();peers.clear();stream?.getTracks().forEach(t=>t.stop());stream=null;}
 async function message(m){
  if(m.type==='viewer'){
   if(peers.has(m.id))return;
   if(!stream){stream=packed.captureStream(0);stream.getVideoTracks()[0].contentHint='detail';}
   const pc=new RTCPeerConnection({iceServers:[]}),entry={pc,candidates:[]};peers.set(m.id,entry);
   // Some drivers gather localhost ICE before setLocalDescription resolves.
   // Keep signaling ordered: the receiver must see the offer before its ICE.
   let offerSent=false;const localCandidates=[];
   pc.onicecandidate=e=>{if(!e.candidate)return;const candidate=e.candidate.toJSON();if(offerSent)send({type:'candidate',id:m.id,candidate});else localCandidates.push(candidate);};
   pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'){pc.close();peers.delete(m.id);}};
   const sender=pc.addTrack(stream.getVideoTracks()[0],stream);
   const transceiver=pc.getTransceivers()[0],codecs=RTCRtpSender.getCapabilities('video')?.codecs||[];
   if(transceiver.setCodecPreferences)transceiver.setCodecPreferences([...codecs.filter(c=>c.mimeType==='video/H264'),...codecs.filter(c=>c.mimeType!=='video/H264')]);
   await pc.setLocalDescription(await pc.createOffer());send({type:'offer',id:m.id,description:pc.localDescription});offerSent=true;for(const candidate of localCandidates)send({type:'candidate',id:m.id,candidate});
   const parameters=sender.getParameters();if(parameters.encodings?.length){parameters.encodings[0].maxBitrate=4000000;parameters.encodings[0].maxFramerate=30;await sender.setParameters(parameters);}
  }else if(m.type==='answer'){
   const p=peers.get(m.id);if(!p)return;await p.pc.setRemoteDescription(m.description);for(const candidate of p.candidates)await p.pc.addIceCandidate(candidate);p.candidates=[];
  }else if(m.type==='candidate'){
   const p=peers.get(m.id);if(!p)return;if(p.pc.remoteDescription)await p.pc.addIceCandidate(m.candidate);else p.candidates.push(m.candidate);
  }else if(m.type==='viewer-left'){
   peers.get(m.id)?.pc.close();peers.delete(m.id);if(!peers.size){stream?.getTracks().forEach(t=>t.stop());stream=null;}
  }
 }

 return {attach:s=>{stop();socket=s;},message,frame:now=>{if(!stream||!peers.size)return;const w=canvas.width,h=canvas.height;if(packed.width!==w*2||packed.height!==h){packed.width=w*2;packed.height=h;}ctx.clearRect(0,0,w*2,h);ctx.globalCompositeOperation='source-over';ctx.drawImage(canvas,w,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#fff';ctx.fillRect(w,0,w,h);ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#000';ctx.fillRect(0,0,w*2,h);ctx.globalCompositeOperation='source-over';ctx.drawImage(canvas,0,0);stream.getVideoTracks()[0].requestFrame();if(now-lastActivity>200){send({type:'activity'});lastActivity=now;}if(now-lastStats>2000){lastStats=now;const pc=peers.values().next().value.pc;pc.getStats().then(stats=>{for(const s of stats.values())if(s.type==='outbound-rtp'&&s.kind==='video'){codecStats={codec:stats.get(s.codecId)?.mimeType,encoder:s.encoderImplementation,powerEfficientEncoder:s.powerEfficientEncoder,encodedFPS:s.framesPerSecond,framesEncoded:s.framesEncoded};}}).catch(()=>{});}},close:stop,stats:()=>({transport:'WebRTC RGB+alpha',peers:peers.size,connectedPeers:[...peers.values()].filter(p=>p.pc.connectionState==='connected').length,...codecStats})};
}
