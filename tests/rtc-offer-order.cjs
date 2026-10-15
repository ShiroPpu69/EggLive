const fs=require('fs'),vm=require('vm'),assert=require('assert');
const sent=[];
class FakePeer{
 constructor(){this.connectionState='new';}
 addTrack(){return {getParameters:()=>({encodings:[]})};}
 getTransceivers(){return [{}];}
 async createOffer(){return {type:'offer',sdp:'test'};}
 async setLocalDescription(description){this.onicecandidate({candidate:{toJSON:()=>({candidate:'early localhost candidate'})}});this.localDescription=description;}
 close(){}
}
const stream={getVideoTracks:()=>[{contentHint:'',stop(){}}],getTracks:()=>[{stop(){}}]};
const create=vm.runInNewContext(fs.readFileSync('src/transport.js','utf8').replace('export function','function')+';createTransport',{RTCPeerConnection:FakePeer,RTCRtpSender:{getCapabilities:()=>({codecs:[]})},document:{createElement:()=>({getContext:()=>({}),captureStream:()=>stream})}});
(async()=>{const t=create({width:640,height:360});t.attach({readyState:1,send:s=>sent.push(JSON.parse(s))});await t.message({type:'viewer',id:'viewer'});assert.deepEqual(sent.map(s=>s.type),['offer','candidate']);console.log('PASS: ICE collected before local description is transmitted after the offer');})().catch(e=>{console.error(e);process.exit(1)});
