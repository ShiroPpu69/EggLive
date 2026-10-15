import * as THREE from 'three';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {createEyeReference} from './eye-reference.js';

export function createAvatar(container,liveVideo){
 const eyeReference=createEyeReference();
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setSize(640,360,false);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 container.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1280/720,.1,100);camera.position.set(0,0,7.1);
 const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
 new RGBELoader().load('/lighting/studio_small_03_1k.hdr',hdr=>{scene.environment=pmrem.fromEquirectangular(hdr).texture;scene.environmentRotation.set(0,.65,0);hdr.dispose();pmrem.dispose();});
 scene.add(new THREE.HemisphereLight(0xfffcf5,0x343c49,.16));
 const key=new THREE.DirectionalLight(0xfff7ed,1.55);key.position.set(-4,3,4);scene.add(key);
 const fill=new THREE.DirectionalLight(0xf2f6ff,.10);fill.position.set(3,0,2);scene.add(fill);
 const rim=new THREE.DirectionalLight(0xfffaf2,.65);rim.position.set(1,2,-3);scene.add(rim);
 const group=new THREE.Group();scene.add(group);
 // Restrained continuous microtexture avoids photographic pigment patches,
 // scratches and mirrored streaks. A constant map enables Three's bump helpers.
 const texture=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1,THREE.RGBAFormat);texture.needsUpdate=true;
 const material=new THREE.MeshPhysicalMaterial({color:0xcba378,bumpMap:texture,bumpScale:.0012,roughness:.62,metalness:0,clearcoat:0,envMapIntensity:.25,ior:1.38});
 material.onBeforeCompile=shader=>{
  // Analytic object-space grain has no UV seam or triplanar blend boundaries.
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
   varying vec3 vShellPosition;
   varying vec3 vShellNormal;
  `).replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
   vShellNormal = normalize(objectNormal);
  `).replace('#include <begin_vertex>',`#include <begin_vertex>
   vShellPosition = transformed;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vShellPosition;
   varying vec3 vShellNormal;
   float shellHash(vec3 p) {
    p = fract(p*0.1031); p += dot(p,p.yzx+33.33);
    return fract((p.x+p.y)*p.z);
   }
   float shellNoise(vec3 p) {
    vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(shellHash(i),shellHash(i+vec3(1,0,0)),f.x),mix(shellHash(i+vec3(0,1,0)),shellHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(shellHash(i+vec3(0,0,1)),shellHash(i+vec3(1,0,1)),f.x),mix(shellHash(i+vec3(0,1,1)),shellHash(i+vec3(1,1,1)),f.x),f.y),f.z);
   }
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   float shellGrain = shellNoise(vShellPosition*155.0);
   diffuseColor.rgb *= 0.997 + 0.006*shellGrain;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor += (shellGrain-0.5)*0.02;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
   float shellHeight = (shellGrain*0.3-pow(1.0-shellGrain,8.0)*0.1)*bumpScale;
   normal = perturbNormalArb(-vViewPosition,normal,vec2(dFdx(shellHeight),dFdy(shellHeight)),faceDirection);
  `);
 };
 material.customProgramCacheKey=()=> 'clean-continuous-eggshell-v5';
 // A normal chicken egg is shorter and fuller than the previous long oval,
 // with a broad lower shoulder and a gently narrowed rounded upper end.
 function radius(y){const t=y/1.48;return 1.075*Math.sqrt(Math.max(0,1-t*t))*(1-.155*t-.025*t*t);}
 function offsetX(y){const t=y/1.48;return .008*(1-t*t)*Math.sin(y*1.8);}
 function offsetZ(y){const t=y/1.48;return .003*(1-t*t)*Math.cos(y*2.2);}
 function irregularity(y,a){return 1+.0015*Math.sin(y*4.8+.8)*Math.sin(a*3+.4)+.001*Math.cos(a*5)*Math.cos(y*6);}
 function surface(x,y){const dx=x-offsetX(y),z=Math.sqrt(Math.max(.0001,radius(y)**2-dx*dx)),a=Math.atan2(dx,z);return Math.sqrt(Math.max(.0001,(radius(y)*irregularity(y,a))**2-dx*dx))+offsetZ(y)+.012;}
 const points=[];for(let i=0;i<=128;i++){const y=-1.48+i/128*2.96;points.push(new THREE.Vector2(radius(y),y));}
 const geometry=new THREE.LatheGeometry(points,160),shellPosition=geometry.attributes.position;
 for(let i=0;i<shellPosition.count;i++){const x=shellPosition.getX(i),y=shellPosition.getY(i),z=shellPosition.getZ(i),f=irregularity(y,Math.atan2(x,z));shellPosition.setXYZ(i,x*f+offsetX(y),y,z*f+offsetZ(y));}geometry.computeVertexNormals();
 // The duplicated UV seam vertices need identical normals after deformation.
 const normals=geometry.attributes.normal,normal=new THREE.Vector3(),opposite=new THREE.Vector3();
 for(let i=0;i<points.length;i++){const end=160*points.length+i;normal.fromBufferAttribute(normals,i);opposite.fromBufferAttribute(normals,end);normal.add(opposite).normalize();normals.setXYZ(i,normal.x,normal.y,normal.z);normals.setXYZ(end,normal.x,normal.y,normal.z);}
 const shell=new THREE.Mesh(geometry,material);group.add(shell);
 const patches=[];
 const makeTexture=()=>{const t=new THREE.Texture();t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;return t;};
 let liveTexture=makeTexture(),previousTexture=makeTexture(),source=null,previousSource=null,lastSourceTime=0,blendStart=0,blendDuration=66,interpolating=false;
 const bitmapFlip={value:0},previousBitmapFlip={value:0},previousMap={value:liveTexture},frameBlend={value:1};
 function setSource(next){
  if(next===source){liveTexture.needsUpdate=true;return;}
  const now=performance.now();interpolating=next instanceof ImageBitmap&&source instanceof ImageBitmap;
  if(previousSource instanceof ImageBitmap)previousSource.close();
  previousSource=source;source=next;const old=liveTexture;liveTexture=previousTexture;previousTexture=old;
  previousMap.value=previousSource?previousTexture:liveTexture;previousBitmapFlip.value=bitmapFlip.value;bitmapFlip.value=next instanceof ImageBitmap?1:0;
  blendStart=now;blendDuration=THREE.MathUtils.clamp(now-lastSourceTime,45,100);lastSourceTime=now;
  liveTexture.image=next;liveTexture.needsUpdate=true;
  patches.forEach(p=>{p.previousCenter.value.copy(p.featureCenter.value);p.previousX.value.copy(p.featureX.value);p.previousY.value.copy(p.featureY.value);p.mesh.material.map=liveTexture;});
 }
 function patch(x,y,w,h,eye=false){
  const map=liveTexture;
  const mat=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,side:THREE.FrontSide});
  const glareUniform={value:eye?0.7:0},featureCenter={value:new THREE.Vector2(.5,.5)},featureX={value:new THREE.Vector2(.1,0)},featureY={value:new THREE.Vector2(0,.1)},featureMirror={value:-1};
  const previousCenter={value:new THREE.Vector2(.5,.5)},previousX={value:new THREE.Vector2(.1,0)},previousY={value:new THREE.Vector2(0,.1)},referenceSlot={value:0},referenceOpen={value:1};
  mat.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,{glareStrength:glareUniform,featureCenter,featureX,featureY,featureMirror,bitmapFlip,previousCenter,previousX,previousY,previousMap,previousBitmapFlip,frameBlend,eyeReferenceMap:eyeReference.map,eyeReferenceEnabled:eye?eyeReference.enabled:{value:0},referenceSlot,referenceOpen});
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
    uniform float glareStrength;
    uniform sampler2D eyeReferenceMap;uniform float eyeReferenceEnabled,referenceSlot,referenceOpen;
    uniform vec2 featureCenter,featureX,featureY;uniform float featureMirror,bitmapFlip;
    uniform vec2 previousCenter,previousX,previousY;uniform sampler2D previousMap;uniform float previousBitmapFlip,frameBlend;
   `).replace('#include <map_pars_fragment>',`#include <map_pars_fragment>
    vec4 featureSample(vec2 uv){
     vec2 cameraUV=featureCenter+featureX*(uv.x-0.5)*featureMirror+featureY*(uv.y-0.5);
     cameraUV.y=mix(cameraUV.y,1.0-cameraUV.y,bitmapFlip);
     vec4 color=texture2D(map,cameraUV);
     #ifdef DECODE_VIDEO_TEXTURE
      color=sRGBTransferEOTF(color);
     #endif
     if(frameBlend<0.999){
      vec2 oldUV=previousCenter+previousX*(uv.x-0.5)*featureMirror+previousY*(uv.y-0.5);
      oldUV.y=mix(oldUV.y,1.0-oldUV.y,previousBitmapFlip);
      color=mix(texture2D(previousMap,oldUV),color,frameBlend);
     }
     return color;
    }
   `).replace('#include <map_fragment>',`
    if(eyeReferenceEnabled>0.5){
     // These are the user's own uncovered eyes. The live camera contributes
     // landmarks/blinks only, so even saturated lens reflections cannot leak in.
     vec2 refUV=vMapUv;refUV.x=mix(refUV.x,1.0-refUV.x,step(featureMirror,0.0));
     float u=(referenceSlot+refUV.x)*0.5;
     vec4 opened=texture2D(eyeReferenceMap,vec2(u,0.5+refUV.y*0.5));
     vec4 closed=texture2D(eyeReferenceMap,vec2(u,refUV.y*0.5));
     diffuseColor*=mix(closed,opened,smoothstep(0.12,0.88,referenceOpen));
    }else diffuseColor*=featureSample(vMapUv);
    // Restrict correction to bright neutral/cyan lens highlights. Sample nearby
    // captured pixels on the GPU; never invent an iris or read back CPU pixels.
    vec2 insetUV=vMapUv;
    float patchRadius=length((insetUV-0.5)*2.0);
    float edge=smoothstep(0.0,0.30,1.0-patchRadius);
    diffuseColor.a*=edge;
    if(glareStrength>0.0 && eyeReferenceEnabled<0.5) {
     vec3 original=diffuseColor.rgb;
     float lum=dot(original,vec3(0.2126,0.7152,0.0722));
     float low=min(original.r,min(original.g,original.b));
     float high=max(original.r,max(original.g,original.b));
     float white=smoothstep(0.62,0.92,lum)*(1.0-smoothstep(0.16,0.40,high-low));
     float cyan=smoothstep(0.24,0.65,min(original.g,original.b))*smoothstep(0.06,0.25,min(original.g,original.b)-original.r);
     // The supplied replay contains dark blue/violet monitor reflections,
     // rather than white highlights. Remove their color cast using the less
     // contaminated red/green channels; preserve the remaining eye detail.
     float blue=smoothstep(0.008,0.045,original.b-max(original.r,original.g))*smoothstep(0.018,0.07,original.b);
     float purple=smoothstep(0.006,0.045,min(original.r,original.b)-original.g)*smoothstep(0.02,0.08,original.b);
     float colorCast=max(blue,purple);
     vec3 decast=original;
     decast.b=min(decast.b,max(original.r,original.g)*1.08+0.003);
     decast.r=mix(decast.r,min(decast.r,original.g*1.15+0.006),purple);
     vec3 neighbors=vec3(0.0);float weights=0.0;
     for(int i=0;i<4;i++) {
      vec2 offset=i==0?vec2(0.055,0.0):i==1?vec2(-0.055,0.0):i==2?vec2(0.0,0.075):vec2(0.0,-0.075);
      vec3 nearby=featureSample(clamp(insetUV+offset,vec2(0.01),vec2(0.99))).rgb;
      float weight=1.0-smoothstep(0.55,0.92,dot(nearby,vec3(0.2126,0.7152,0.0722)));
      neighbors+=nearby*weight;weights+=weight;
     }
     vec3 softened=original*0.60;
     if(weights>0.1)softened=mix(softened,neighbors/weights,0.65);
     float center=1.0-smoothstep(0.86,1.0,patchRadius);
     vec3 corrected=mix(original,decast,colorCast*glareStrength*center);
     diffuseColor.rgb=mix(corrected,softened,max(white,cyan)*glareStrength*center);
    }
   `);
  };
  mat.customProgramCacheKey=()=> 'personal-clean-eye-reference-v1';
  const geometry=new THREE.PlaneGeometry(w,h,24,16),pos=geometry.attributes.position;
  for(let i=0;i<pos.count;i++){const px=pos.getX(i)+x,py=pos.getY(i)+y;pos.setXYZ(i,px,py,surface(px,py));}geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,mat);mesh.visible=false;mesh.renderOrder=2;group.add(mesh);
  const p={map,mesh,x,y,w,h,eye,glareUniform,featureCenter,featureX,featureY,featureMirror,previousCenter,previousX,previousY,referenceSlot,referenceOpen,oldOpen:1,targetOpen:1};patches.push(p);return p;
 }
 const left=patch(-.35,.34,.59,.34,true),right=patch(.35,.34,.59,.34,true),mouth=patch(0,-.37,.91,.63);
 function crop(p,video,lm,a,b,cy,widthFactor,heightFactor){
  const vw=video.videoWidth||video.width,vh=video.videoHeight||video.height;
  const pa=lm[a],pb=lm[b],dx=(pb.x-pa.x)*vw,dy=(pb.y-pa.y)*vh;
  const width=Math.hypot(dx,dy)*widthFactor,height=width*heightFactor;
  const cx=(pa.x+pb.x)*.5*vw,centerY=cy*vh,angle=Math.atan2(dy,dx);
  p.featureCenter.value.set(cx/vw,1-centerY/vh);p.featureX.value.set(Math.cos(angle)*width/vw,-Math.sin(angle)*width/vh);p.featureY.value.set(Math.sin(angle)*height/vw,Math.cos(angle)*height/vh);p.featureMirror.value=options.mirror?-1:1;p.mesh.visible=true;
 }
 let lastFace=-Infinity,pose={x:0,y:0,z:0,tx:0,ty:0,scale:1},neutral={x:0,y:0,z:0,tx:0,ty:0},current={...pose},velocity={x:0,y:0,z:0,tx:0,ty:0,scale:0},options={elasticity:.6,strength:1,mirror:true,zoom:1},time=performance.now(),demo=false,rejected=0,accepted=0,totalRejected=0;
 function updateFeatures(video,result){
  const lm=result.faceLandmarks?.[0];if(!lm)return false;
  setSource(video);
  // Align each live face inset to its own eye/lip axis, removing webcam head roll.
  crop(options.mirror?right:left,video,lm,33,133,(lm[159].y+lm[145].y)*.5-.006,1.65,.58);
  crop(options.mirror?left:right,video,lm,362,263,(lm[386].y+lm[374].y)*.5-.006,1.65,.58);
  crop(mouth,video,lm,61,291,(lm[13].y+lm[14].y)*.5,1.42,.69);
  eyeReference.update(lm,video.videoWidth||video.width,video.videoHeight||video.height);
  [options.mirror?right:left,options.mirror?left:right].forEach((p,i)=>{p.referenceSlot.value=i;p.oldOpen=p.referenceOpen.value;p.targetOpen=eyeReference.openness[i].value;});
  return true;
 }
 function update(video,result,features=true){
  const lm=result.faceLandmarks?.[0];if(!lm)return false;
  const anchors=[1,33,133,263,362,61,291,234,454];
  if(anchors.some(i=>!Number.isFinite(lm[i]?.x)||!Number.isFinite(lm[i]?.y)))return false;
  const faceWidth=Math.abs(lm[454].x-lm[234].x);if(faceWidth<.07||faceWidth>.95)return false;
  const eyeWidths=[[33,133],[362,263]].map(([a,b])=>Math.hypot(lm[a].x-lm[b].x,lm[a].y-lm[b].y));
  if(eyeWidths.some(w=>w<faceWidth*.055||w>faceWidth*.5)||Math.max(...eyeWidths)/Math.min(...eyeWidths)>4)return false;
  const next={...pose};
  const data=result.facialTransformationMatrixes?.[0]?.data;
  if(data){if([...data].some(n=>!Number.isFinite(n)))return false;const matrix=new THREE.Matrix4().fromArray(data),rot=new THREE.Euler().setFromRotationMatrix(matrix,'YXZ');next.x=THREE.MathUtils.clamp(rot.x,-.55,.55);next.y=THREE.MathUtils.clamp(rot.y,-.85,.85);next.z=THREE.MathUtils.clamp(rot.z,-.6,.6);}
  else{next.z=-Math.atan2((lm[263].y-lm[33].y)*(video.videoHeight||video.height),(lm[263].x-lm[33].x)*(video.videoWidth||video.width));next.y=THREE.MathUtils.clamp((lm[1].x-(lm[234].x+lm[454].x)/2)*5,-.8,.8);}
  next.tx=(.5-lm[1].x)*3;next.ty=(.5-lm[1].y)*2;
  const now=performance.now(),age=now-lastFace,dt=Math.min(.15,Math.max(.025,age/1000));
  const jump=accepted&&age<700&&(Math.hypot(next.tx-pose.tx,next.ty-pose.ty)>.38||Math.max(...['x','y','z'].map(k=>Math.abs(next[k]-pose[k])))>.55);
  if(jump&&++rejected<3){totalRejected++;return false;}rejected=0;
  for(const key of ['x','y','z','tx','ty']){const limit=(key.length===1?2.5:1.8)*dt;const delta=THREE.MathUtils.clamp(next[key]-pose[key],-limit,limit);pose[key]+=(accepted&&age<950)?delta*(1-Math.exp(-dt/.055)):next[key]-pose[key];}
  if(features)updateFeatures(video,result);
  lastFace=now;accepted++;return true;
 }
 function calibrate(){neutral={x:pose.x,y:pose.y,z:pose.z,tx:pose.tx,ty:pose.ty};}
 function frame(now){
  const dt=Math.min(.05,Math.max(0,(now-time)/1000));time=now;const age=now-lastFace,live=age<950;
  const opacity=1-THREE.MathUtils.smoothstep(age,700,950);
  frameBlend.value=interpolating?THREE.MathUtils.clamp((now-blendStart)/blendDuration,0,1):1;
  patches.forEach(p=>{p.referenceOpen.value=THREE.MathUtils.lerp(p.oldOpen,p.targetOpen,frameBlend.value);});
  patches.forEach(p=>{p.mesh.material.opacity=opacity;if(!live)p.mesh.visible=false;});
  const k=95-options.elasticity*65,damping=2*Math.sqrt(k)*(1.05-options.elasticity*.35),sg=options.mirror?-1:1;
  const target={x:live?(pose.x-neutral.x)*options.strength:Math.sin(now*.0007)*.025,y:live?(pose.y-neutral.y)*options.strength*sg:Math.sin(now*.0004)*.10,z:live?(pose.z-neutral.z)*options.strength*sg:Math.sin(now*.0008)*.015,tx:live?(pose.tx-neutral.tx)*sg:0,ty:live?(pose.ty-neutral.ty):Math.sin(now*.0012)*.025,scale:options.zoom};
  if(demo){target.y=Math.sin(now*.001)*.55;target.z=Math.sin(now*.0017)*.15;}
  for(const key of Object.keys(current)){velocity[key]+=(k*(target[key]-current[key])-damping*velocity[key])*dt;current[key]+=velocity[key]*dt;}
  group.rotation.set(current.x,current.y,current.z,'YXZ');group.position.set(current.tx,current.ty,0);
  const squash=1+THREE.MathUtils.clamp(Math.abs(velocity.ty)*.023,0,.08);group.scale.set(current.scale/squash,current.scale*squash,current.scale);
  // Mirror only the captured feature texture, never expose the full camera image.
  patches.forEach(p=>{p.featureMirror.value=options.mirror?-1:1;});
  // Capture/readback can disturb the drawing buffer's depth-write state.
  // Clear with an explicitly writable depth buffer to prevent holes next frame.
  renderer.getContext().depthMask(true);renderer.clearDepth();renderer.render(scene,camera);
 }
 function resetTracking(){if(source instanceof ImageBitmap)source.close();if(previousSource instanceof ImageBitmap&&previousSource!==source)previousSource.close();source=null;previousSource=null;interpolating=false;frameBlend.value=1;lastFace=-Infinity;accepted=0;rejected=0;pose={x:0,y:0,z:0,tx:0,ty:0,scale:1};neutral={x:0,y:0,z:0,tx:0,ty:0};current={...pose};velocity={x:0,y:0,z:0,tx:0,ty:0,scale:0};patches.forEach(p=>p.mesh.visible=false);}
 return {renderer,eyeReference,canvas:renderer.domElement,update,updateFeatures,frame,calibrate,resetTracking,setResolution:(w,h)=>renderer.setSize(w,h,false),setOptions:o=>{Object.assign(options,o);if(o.glare!==undefined)patches.forEach(p=>p.glareUniform.value=p.eye?o.glare:0);},setShell:white=>material.color.set(white?0xeee9de:0xcba378),setDemo:v=>{demo=v;},hide:resetTracking,getPose:()=>({...pose,current:{...current},acceptedFrames:accepted,rejectedFrames:totalRejected,featureOpacity:patches[0].mesh.material.opacity,frameBlend:frameBlend.value,eyeReference:eyeReference.state()})};
}
