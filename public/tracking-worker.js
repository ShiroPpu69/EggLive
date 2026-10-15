self.exports={};importScripts('/vision_bundle.cjs');
let tracker;
(async()=>{
 try{
  const {FaceLandmarker,FilesetResolver}=self.exports,files=await FilesetResolver.forVisionTasks(location.origin+'/wasm');
  const options={canvas:new OffscreenCanvas(1,1),baseOptions:{modelAssetPath:location.origin+'/models/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:false,outputFacialTransformationMatrixes:true,minFaceDetectionConfidence:.6,minFacePresenceConfidence:.6,minTrackingConfidence:.6};
  let delegate=new URLSearchParams(location.search).get('delegate')==='CPU'?'CPU':'GPU';options.baseOptions.delegate=delegate;try{tracker=await FaceLandmarker.createFromOptions(files,options);}catch{delegate='CPU';options.baseOptions.delegate='CPU';tracker=await FaceLandmarker.createFromOptions(files,options);}
  postMessage({type:'ready',delegate});
 }catch(e){postMessage({type:'fatal',error:e.message});}
})();
// Return the exact pixels used for inference, so an old landmark set is never
// applied to a newer camera image after the worker's asynchronous round trip.
onmessage=e=>{const {id,bitmap,timestamp}=e.data;try{const result=tracker.detectForVideo(bitmap,timestamp);postMessage({id,result,bitmap,timestamp},[bitmap]);}catch(e){bitmap.close();postMessage({id,error:e.message});}};
