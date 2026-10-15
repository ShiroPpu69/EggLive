import {mkdir,copyFile,readdir,readFile,rename,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=data=>createHash('sha256').update(data).digest('hex');
async function download(url,target,expected){
 const destination=path.join(root,target);await mkdir(path.dirname(destination),{recursive:true});
 try{const existing=await readFile(destination);if(expected&&hash(existing)===expected){console.log('Verified '+target);return;}}catch{}
 console.log('Downloading '+target);const response=await fetch(url);if(!response.ok)throw Error(`Download failed: ${response.status} ${url}`);
 const data=Buffer.from(await response.arrayBuffer());if(expected&&hash(data)!==expected)throw Error('SHA256 mismatch: '+target);
 await writeFile(destination+'.tmp',data);await rename(destination+'.tmp',destination);
}
await mkdir(path.join(root,'public/wasm'),{recursive:true});
const vision=path.join(root,'node_modules/@mediapipe/tasks-vision');
await copyFile(path.join(vision,'vision_bundle.cjs'),path.join(root,'public/vision_bundle.cjs'));
for(const name of await readdir(path.join(vision,'wasm')))if(/\.(wasm|js)$/.test(name))await copyFile(path.join(vision,'wasm',name),path.join(root,'public/wasm',name));
await download('https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task','public/models/face_landmarker.task','64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff');
await mkdir(path.join(root,'release/licenses'),{recursive:true});
for(const name of await readdir(path.join(root,'licenses')))await copyFile(path.join(root,'licenses',name),path.join(root,'release/licenses',name));
await copyFile(path.join(root,'THIRD_PARTY_NOTICES.md'),path.join(root,'release/第三方许可.md'));
if(process.argv.includes('--with-obs')){
 if(process.platform!=='win32')throw Error('Bundled OBS preparation is Windows only');
 await download('https://github.com/obsproject/obs-studio/releases/download/32.2.2/OBS-Studio-32.2.2-Windows-x64.zip','downloads/obs.zip','4d6e40e3ab155f56b30de517380566a206d74b63cdf5ad49aa596924768f97e1');
 await mkdir(path.join(root,'OBS'),{recursive:true});execFileSync('tar',['-xf',path.join(root,'downloads/obs.zip'),'-C',path.join(root,'OBS')],{stdio:'inherit'});
 await writeFile(path.join(root,'OBS/portable_mode.txt'),'');
}
if(process.argv.includes('--with-runtime')){
 // Microsoft updates this official redistributable URL. The release binary
 // SHA256 is recorded in docs/building.md; verify its signature before shipping.
 await download('https://aka.ms/vc14/vc_redist.x64.exe','installer-resources/vc_redist.x64.exe');
 if(process.platform==='win32'){
  const command="$s=Get-AuthenticodeSignature -LiteralPath 'installer-resources/vc_redist.x64.exe'; if($s.Status -ne 'Valid' -or $s.SignerCertificate.Subject -notmatch 'Microsoft Corporation'){throw 'Invalid Microsoft signature'}";
  execFileSync('powershell.exe',['-NoProfile','-Command',command],{cwd:root,stdio:'inherit'});
 }
}
console.log('Assets ready. npm start runs offline; OBS needs --with-obs for automatic setup.');
