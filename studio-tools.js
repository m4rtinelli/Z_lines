const $=id=>document.getElementById(id);
function notify(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('toast').classList.remove('show'),3500)}
function downloadFile(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function filename(name){return name.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').slice(0,70)||'z-study'}

// Import only explicitly supported fields, never arbitrary markup or object keys.
function validatePreset(input){
 if(!input||input.format!=='z-studio-preset'||input.version!==1)throw Error('Choose a Z Studio preset file (version 1).');
 const s=input.state;if(!s||!modes.includes(s.mode))throw Error('This preset has an unknown structure.');
 const number=(value,min,max)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error('The preset contains an invalid control value.');return value};
 if(s.ratio!==undefined&&!Object.hasOwn(canvasRatios,s.ratio))throw Error('This preset has an unknown canvas ratio.');
 const result={ratio:s.ratio||'1:1',mode:s.mode,density:number(s.density,5,40),spread:number(s.spread,5,90),tension:number(s.tension,0,100),seed:number(s.seed,0,2147483647),color:s.color,weight:s.weight||'progressive',details:{}};
 if(!Number.isInteger(result.density)||!Number.isInteger(result.seed)||!Object.hasOwn(palettes,result.color)||!['progressive','alternating','pulse','organic'].includes(result.weight))throw Error('The preset contains invalid settings.');
 for(const key of ['canvasColor','inkColor'])if(s[key]!==undefined){if(typeof s[key]!=='string'||!/^#[\da-f]{6}$/i.test(s[key]))throw Error('The preset contains an invalid color.');result[key]=s[key]}
 for(const mode of modes){if(s.details?.[mode]){result.details[mode]={};for(const [key,,min,max] of modeControls[mode])if(s.details[mode][key]!==undefined)result.details[mode][key]=number(s.details[mode][key],min,max)}}
 if(s.motionColors!==undefined){if(!Array.isArray(s.motionColors)||s.motionColors.length!==4||!s.motionColors.every(c=>typeof c==='string'&&/^#[\da-f]{6}$/i.test(c)))throw Error('The motion palette must contain four valid colors.');result.motionColors=[...s.motionColors]}
 if(s.colorSpeed!==undefined)result.colorSpeed=number(s.colorSpeed,.1,3);
 const motion=input.motion;if(!motion||typeof motion.enabled!=='boolean'||!['color','breathe','ripple','cascade'].includes(motion.preset))throw Error('The preset contains invalid motion settings.');
 return {state:result,motion:{enabled:motion.enabled,preset:motion.preset==='breathe'?'color':motion.preset,phase:number(motion.phase??0,0,1e9)},name:typeof input.name==='string'?input.name.slice(0,80):'Imported study'};
}

let controlsMode='';
window.syncExtras=()=>{
 $('canvas-ratio').value=state.ratio||'1:1';$('video-ratio').value=state.ratio||'1:1';fitArtboard();updateVideoDimensions();
 const palette=palettes[state.color];$('canvas-color').value=state.canvasColor||palette[0];$('ink-color').value=state.inkColor||palette[1];
 if(controlsMode!==state.mode){controlsMode=state.mode;$('tools-mode').textContent=state.mode[0].toUpperCase()+state.mode.slice(1);$('mode-controls').replaceChildren();
  for(const [key,label,min,max,,step] of modeControls[state.mode]){const row=document.createElement('div');row.className='control';const text=document.createElement('label'),output=document.createElement('output'),slider=document.createElement('input');slider.type='range';slider.min=min;slider.max=max;slider.step=step;slider.id='advanced-'+key;output.id='advanced-value-'+key;text.htmlFor=slider.id;text.textContent=label;slider.oninput=()=>{state.details??={};state.details[state.mode]??={};state.details[state.mode][key]=+slider.value;output.value=slider.value;draw()};row.append(text,output,slider);$('mode-controls').append(row)}
 }
 const options=modeOptions(state);for(const [key] of modeControls[state.mode]){$('advanced-'+key).value=options[key];$('advanced-value-'+key).value=String(options[key])}
};
for(const [id,key] of [['canvas-color','canvasColor'],['ink-color','inkColor']])$(id).oninput=e=>{state[key]=e.target.value;render()};
$('reset-mode').onclick=()=>{if(state.details)delete state.details[state.mode];render()};

function fitArtboard(){const stage=document.querySelector('.stage');const {width,height}=canvasDimensions(state);const rect=stage.getBoundingClientRect();const scale=Math.min((rect.width-28)/width,(rect.height-28)/height);const board=$('artboard');board.style.width=Math.max(1,width*scale)+'px';board.style.height=Math.max(1,height*scale)+'px';board.style.aspectRatio=width+'/'+height}
function updateVideoDimensions(){const d=canvasDimensions(state,+$('video-size').value||1080);$('video-dimensions').textContent=d.width+' × '+d.height+' pixels'}
for(const id of ['canvas-ratio','video-ratio'])$(id).onchange=e=>{state.ratio=e.target.value;render()};
$('video-size').onchange=updateVideoDimensions;
if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitArtboard).observe(document.querySelector('.stage'));
window.addEventListener('resize',fitArtboard);
const panel=$('tools-panel'),handle=$('drag-handle');
function keepPanelVisible(){const rect=panel.getBoundingClientRect();panel.style.left=Math.max(8,Math.min(rect.left,innerWidth-rect.width-8))+'px';panel.style.top=Math.max(8,Math.min(rect.top,innerHeight-rect.height-8))+'px';panel.style.right='auto'}
function closePanel(){panel.hidden=true;$('open-tools').setAttribute('aria-expanded','false');$('open-tools').focus()}
$('open-tools').onclick=()=>{if(!panel.hidden){closePanel();return}panel.hidden=false;$('open-tools').setAttribute('aria-expanded','true');window.syncExtras();keepPanelVisible();handle.focus()};$('close-tools').onclick=closePanel;
let drag=null;handle.onpointerdown=e=>{if(e.button!==0)return;const r=panel.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top};handle.setPointerCapture(e.pointerId);e.preventDefault()};handle.onpointermove=e=>{if(!drag)return;panel.style.left=(e.clientX-drag.x)+'px';panel.style.top=(e.clientY-drag.y)+'px';panel.style.right='auto';keepPanelVisible()};handle.onpointerup=handle.onpointercancel=()=>{drag=null};
handle.onkeydown=e=>{const delta={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[e.key];if(!delta)return;e.preventDefault();const r=panel.getBoundingClientRect();panel.style.left=r.left+delta[0]+'px';panel.style.top=r.top+delta[1]+'px';keepPanelVisible()};
panel.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel()});window.addEventListener('resize',()=>{if(!panel.hidden)keepPanelVisible()});

$('save-preset').onclick=()=>{$('preset-dialog').showModal();$('preset-name').focus();$('preset-name').select()};$('cancel-preset').onclick=()=>$('preset-dialog').close();
$('preset-form').onsubmit=e=>{e.preventDefault();const name=$('preset-name').value.trim()||'My Z study';const data={format:'z-studio-preset',version:1,name,state:structuredClone(state),motion:{enabled:motionEnabled,preset:motionPreset,phase}};downloadFile(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),filename(name)+'.zstudio.json');$('preset-dialog').close();notify('Preset file saved')};
$('import-preset').onclick=()=>$('preset-file').click();$('preset-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>100000)throw Error('Preset files must be smaller than 100 KB.');const preset=validatePreset(JSON.parse(await file.text()));state=preset.state;motionPreset=preset.motion.preset;motionEnabled=preset.motion.enabled;phase=preset.motion.phase;study++;$('motion-preset').value=motionPreset;syncMotion();render();notify('Preset imported: '+preset.name)}catch(error){notify(error instanceof SyntaxError?'This file is not valid JSON.':error.message)}finally{e.target.value=''}};

let videoJob=null;
$('open-video').onclick=()=>{$('video-status').textContent=motionEnabled?'Exports from the current motion frame.':'Motion is off. The export will be a still video.';$('video-dialog').showModal()};
$('cancel-video').onclick=()=>{if(videoJob){videoJob.cancelled=true;$('video-status').textContent='Cancelling…'}};
$('video-dialog').addEventListener('cancel',e=>{if(videoJob){e.preventDefault();$('cancel-video').click()}});

async function rasterizeSvg(svg,context,width,height){const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const img=new Image();img.src=url;await img.decode();context.drawImage(img,0,0,width,height)}finally{URL.revokeObjectURL(url)}}
async function exportVideo(){
 if(videoJob)return;
 const size=+$('video-size').value,fps=+$('video-fps').value,seconds=+$('video-duration').value;
 const snapshot=structuredClone(state),{width,height}=canvasDimensions(snapshot,size),startPhase=phase,motion=motionEnabled?motionPreset:'off';
 const job=videoJob={cancelled:false};let output;
 const status=$('video-status'),progress=$('video-progress');progress.hidden=false;progress.value=0;$('cancel-video').hidden=false;
 for(const id of ['start-video','close-video','video-size','video-ratio','video-fps','video-duration'])$(id).disabled=true;
 try{
  status.textContent='Preparing MP4 encoder…';
  const {Output,Mp4OutputFormat,BufferTarget,CanvasSource,Quality,canEncodeVideo}=await import('./vendor/mediabunny.mjs');
  const quality=new Quality({bitrate:(size===2160?48000000:16000000)*(width*height/(size*size))*(fps/30)});
  if(!await canEncodeVideo('avc',{width,height,quality}))throw Error('H.264 encoding is unavailable at this resolution in this browser. Try the 1080 setting or a browser with WebCodecs H.264 support.');
  if(job.cancelled)return;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d',{alpha:false});if(!context)throw Error('Canvas rendering is unavailable.');
  output=new Output({format:new Mp4OutputFormat(),target:new BufferTarget()});
  const source=new CanvasSource(canvas,{codec:'avc',quality,keyFrameInterval:2});output.addVideoTrack(source,{frameRate:fps});await output.start();
  const total=seconds*fps;
  for(let i=0;i<total;i++){
   if(job.cancelled){await output.cancel();output=null;return}
   await rasterizeSvg(artwork(snapshot,{motion,phase:startPhase+i/fps}),context,width,height);
   await source.add(i/fps,1/fps);
   progress.value=(i+1)/total;status.textContent=`Rendering ${i+1} / ${total} frames · ${Math.round(progress.value*100)}%`;
   if(i%4===0)await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(job.cancelled){await output.cancel();output=null;return}
  source.close();status.textContent='Finishing MP4…';await output.finalize();
  if(!job.cancelled){downloadFile(new Blob([output.target.buffer],{type:'video/mp4'}),`z-studio-${snapshot.mode}-${width}x${height}-${fps}fps.mp4`);status.textContent=`MP4 exported · ${width} × ${height} · ${fps} fps · ${seconds}s`;notify('MP4 exported')}
  output=null;
 }catch(error){if(output)try{await output.cancel()}catch{}status.textContent='Export failed: '+error.message}
 finally{if(job.cancelled)status.textContent='Export cancelled. Your study is unchanged.';videoJob=null;$('cancel-video').hidden=true;for(const id of ['start-video','close-video','video-size','video-ratio','video-fps','video-duration'])$(id).disabled=false}
}
$('start-video').onclick=exportVideo;window.syncExtras();
