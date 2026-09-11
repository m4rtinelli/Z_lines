const palettes={paper:['#f0eee8','#171717'],stone:['#c9c4b5','#121310'],red:['#f33250','#130705'],black:['#202123','#eeeae0']};
const initial={mode:'ribbon',density:18,spread:42,tension:65,color:'stone',seed:1,weight:'progressive',ratio:'1:1'};let state={...initial},study=1;
const presets=[{name:'Folded ribbon',mode:'ribbon',density:18,spread:42,tension:65,color:'stone',seed:1},{name:'Fine frequency',mode:'fan',density:9,spread:49,tension:85,color:'paper',seed:22},{name:'Signal study',mode:'ribbon',density:23,spread:72,tension:90,color:'red',seed:33},{name:'Cross current',mode:'hatch',density:27,spread:50,tension:50,color:'stone',seed:14}];
function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

const canvasRatios={'1:1':[1,1],'4:5':[4,5],'3:4':[3,4],'9:16':[9,16],'4:3':[4,3],'3:2':[3,2],'16:9':[16,9]};
function canvasDimensions(s,shortSide=1000){const [x,y]=canvasRatios[s.ratio]||canvasRatios['1:1'];const unit=shortSide/Math.min(x,y);return {width:Math.round(x*unit/2)*2,height:Math.round(y*unit/2)*2}}
const modeControls={
 ribbon:[['thickness','Line thickness',.3,3,1,.1],['taper','Taper',0,2,1,.05],['fold','Fold offset',0,2,1,.05]],
 fan:[['thickness','Line thickness',.3,3,1,.1],['reach','Fan reach',0,2,1,.05],['trim','Diagonal trim',0,2,1,.05]],
 hatch:[['thickness','Stripe thickness',.3,3,1,.1],['length','Stripe length',.3,2,1,.05],['slant','Stripe slant',-50,80,40,1]],
 wave:[['thickness','Line thickness',.3,3,1,.1],['amplitude','Wave amplitude',0,60,26,1],['frequency','Wave frequency',1,10,5,.25]],
 arc:[['thickness','Line thickness',.3,3,1,.1],['bow','Curve depth',-65,65,26,1],['bias','Curve asymmetry',-1,1,0,.05]],
 zigzag:[['thickness','Line thickness',.3,3,1,.1],['amplitude','Tooth height',0,55,26,1],['frequency','Tooth count',1,12,5,.5]],
 dash:[['thickness','Dash thickness',.3,3,1,.1],['dash','Dash length',2,65,26,1],['gap','Dash gap',2,45,15,1],['stagger','Row stagger',0,30,4,1]],
 dots:[['size','Dot size',.3,4,1,.1],['spacing','Dot spacing',5,55,22,1],['stagger','Row stagger',0,30,0,1]],
 weave:[['thickness','Line thickness',.3,3,1,.1],['amplitude','Weave width',0,55,26,1],['frequency','Crossing count',1,10,5,.25],['cross','Strand offset',0,2,1,.05]]
};
function modeOptions(s){return Object.fromEntries(modeControls[s.mode].map(([key,label,min,max,value])=>[key,s.details?.[s.mode]?.[key]??value]))}

// Weight profiles change geometry only; every mark uses fully opaque ink.
function lineWeight(s,i,n){
 const u=i/Math.max(1,n-1),profile=s.weight||'progressive';
 if(profile==='alternating')return i%3===0?1:i%3===1?.08:.38;
 if(profile==='pulse')return .06+.94*Math.pow((Math.sin(u*Math.PI*4-Math.PI/2)+1)/2,1.6);
 if(profile==='organic')return .06+.94*Math.pow(random(s.seed+i*997)(),1.7);
 return .06+.94*Math.pow(u,1.5);
}
function artwork(s,{background=true,mini=false,motion='off',phase=0}={}){const palette=palettes[s.color]||palettes.stone,bg=s.canvasColor||palette[0],fg=s.inkColor||palette[1],opts=modeOptions(s),r=random(s.seed),n=s.density,spread=s.spread*1.35,t=s.tension/100;let paths='';let strip=0; const moving=()=>{const i=strip++;if(motion==='ripple')return `translate(0 ${(Math.sin(phase*1.4+i*.38)*12).toFixed(2)})`;if(motion==='cascade')return `translate(${(Math.sin(phase+i*.2)*18).toFixed(2)} ${(Math.cos(phase+i*.2)*8).toFixed(2)})`;return ''};const poly=(points)=>{paths+=`<polygon transform="${moving()}" points="${points.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')}"/>`};
// Each arm is built from tapered strips, preserving the three strokes of a Z.
if(s.mode==='ribbon'||s.mode==='fan'){for(let i=0;i<n;i++){const u=i/(n-1),offset=(u-.5)*spread;const drift=(r()-.5)*t*11;const fan=s.mode==='fan';const thick=(.6+lineWeight(s,i,n)*Math.min(9,spread/(n-1)*.88))*opts.thickness;const inset=fan?u*155*opts.reach:Math.pow(1-u,1.5)*t*175*opts.taper;const top=235+offset;const bottom=765+offset;poly([[200+inset,top],[790,top+drift],[790,top+thick+drift],[200+inset,top+.35]]);poly([[210,bottom+drift],[800-inset,bottom],[800-inset,bottom+.35],[210,bottom+thick+drift]]);const shift=offset*(fan?.65:opts.fold);const trim=fan?u*75*opts.trim:Math.pow(u,1.3)*t*25*opts.fold;poly([[790+shift*.5-trim,235+shift],[210+shift*.5+trim,765+shift],[210+shift*.5+trim+thick,765+shift+thick*.6],[790+shift*.5-trim+.45,235+shift+.35]]);}}
else if(s.mode==='hatch'){const width=(28+spread*.65)*opts.length;const segments=[[[200,235],[790,235]],[[790,235],[210,765]],[[210,765],[800,765]]];for(const [a,b] of segments){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;for(let i=0;i<n;i++){const u=i/(n-1),x=a[0]+dx*u,y=a[1]+dy*u;const w=(.9+lineWeight(s,i,n)*(10+t*6))*opts.thickness,slant=opts.slant;poly([[x-nx*width/2-slant,y-ny*width/2],[x+nx*width/2+slant,y+ny*width/2],[x+nx*width/2+slant+w,y+ny*width/2],[x-nx*width/2-slant+w,y-ny*width/2]])}}}

else {
 const segments=[[[200,235],[790,235]],[[790,235],[210,765]],[[210,765],[800,765]]];
 for(const [a,b] of segments){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
  for(let i=0;i<n;i++){
   const u=i/(n-1),offset=(u-.5)*spread,amp=(opts.amplitude??26)*(.4+t),frequency=opts.frequency??5,seedPhase=r()*1.6;
   const point=(v,d)=>[a[0]+dx*v+nx*d,a[1]+dy*v+ny*d];
   const coords=[];
   for(let k=0;k<=72;k++){
    const v=k/72;let d=offset;
    if(s.mode==='wave')d+=Math.sin(v*Math.PI*2*frequency+u*2+seedPhase)*amp*Math.sin(Math.PI*v);
    if(s.mode==='arc')d+=Math.sin(Math.PI*v)*opts.bow*(.4+u*2)*(1+opts.bias*(v-.5));
    if(s.mode==='zigzag')d+=(2/Math.PI)*Math.asin(Math.sin(v*Math.PI*2*frequency))*amp;
    if(s.mode==='weave')d+=Math.sin(v*Math.PI*2*frequency+(i%2)*Math.PI*opts.cross)*amp;
    coords.push(point(v,d));
   }
   const dash=s.mode==='dash'? 'stroke-dasharray="'+opts.dash+' '+opts.gap+'" stroke-dashoffset="'+(i*opts.stagger)+'"':s.mode==='dots'?'stroke-dasharray="0 '+opts.spacing+'" stroke-dashoffset="'+(i*opts.stagger)+'" stroke-linecap="round"':'';
   paths+='<path transform="'+moving()+'" d="'+coords.map((p,k)=>(k?'L':'M')+p.map(v=>v.toFixed(2)).join(' ')).join(' ')+'" fill="none" stroke="'+(mini?'currentColor':fg)+'" stroke-width="'+((.6+lineWeight(s,i,n)*Math.min(s.mode==='dots'?10:8,spread/(n-1)*.88))*(opts.size??opts.thickness))+'" '+dash+'/>';
  }
 }
}
const {width,height}=canvasDimensions(s);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Generative Z ${s.mode} line study"><title>Z Studio — ${s.mode} study</title>${background?`<rect width="${width}" height="${height}" fill="${bg}"/>`:''}<g transform="translate(${(width-1000)/2} ${(height-1000)/2})"><g transform="${motion==='breathe'?`translate(500 500) scale(${(1+Math.sin(phase)*.055).toFixed(4)} ${ (1-Math.sin(phase)*.035).toFixed(4)}) translate(-500 -500)`: ''}" fill="${mini?'currentColor':fg}">${paths}</g></g></svg>`}
let motionPreset='breathe',motionEnabled=false,phase=0,frame=0,lastTime=0;
function draw(){const d=canvasDimensions(state);document.querySelector('#export-note').textContent=motionEnabled?'SVG exports the current frame':`VECTOR · ${d.width} × ${d.height}`;document.querySelector('#artboard').innerHTML=artwork(state,{motion:motionEnabled?motionPreset:'off',phase})}
function animate(now){frame=0;if(!motionEnabled||document.hidden)return;if(!lastTime)lastTime=now;if(now-lastTime>=32){phase+=Math.min((now-lastTime)/1000,.1);lastTime=now;draw()}frame=requestAnimationFrame(animate)}
function syncMotion(){cancelAnimationFrame(frame);frame=0;lastTime=0;document.querySelector('#motion-toggle').setAttribute('aria-checked',String(motionEnabled));document.querySelector('#motion-status').textContent=motionEnabled?'On':'Off';document.querySelector('#export-note').textContent=motionEnabled?'SVG exports the current frame':'VECTOR · 1000 × 1000';draw();if(motionEnabled&&!document.hidden)frame=requestAnimationFrame(animate)}
function render(){draw();window.syncExtras?.();document.querySelector('#weight-profile').value=state.weight||'progressive';for(const key of ['density','spread','tension']){document.getElementById(key).value=state[key];document.getElementById(key+'-value').value=state[key]}document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===state.mode;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});document.querySelectorAll('[data-color]').forEach(b=>{const on=b.dataset.color===state.color;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on)});document.querySelector('#mode-label').textContent=`${state.mode.toUpperCase()} / ${state.density} LINES`;document.querySelector('#study-number').textContent=`Study ${String(study).padStart(3,'0')}`}
const modes=['ribbon','fan','hatch','wave','arc','zigzag','dash','dots','weave'];
document.querySelector('#structures').innerHTML=modes.map(mode=>`<button data-mode="${mode}"><span class="mini" data-mini="${mode}"></span>${mode[0].toUpperCase()+mode.slice(1)}</button>`).join('');
document.querySelector('#weight-profile').onchange=e=>{state.weight=e.target.value;render()};
document.querySelector('#motion-toggle').onclick=()=>{motionEnabled=!motionEnabled;syncMotion()};
document.querySelector('#motion-preset').onchange=e=>{motionPreset=e.target.value;phase=0;syncMotion()};
document.addEventListener('visibilitychange',syncMotion);
document.querySelectorAll('[data-mini]').forEach(el=>el.innerHTML=artwork({...initial,mode:el.dataset.mini,density:9},{background:false,mini:true}));
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;render()});document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{state.color=b.dataset.color;delete state.canvasColor;delete state.inkColor;render()});for(const key of ['density','spread','tension'])document.getElementById(key).oninput=e=>{state[key]=+e.target.value;render()};
document.querySelector('#presets').innerHTML=presets.map((p,i)=>`<button class="preset" data-preset="${i}" aria-label="Load ${p.name}"><div class="preset-image">${artwork(p)}</div><div class="preset-caption"><span>${p.name}</span><span>0${i+1}</span></div></button>`).join('');document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{state={...presets[+b.dataset.preset],weight:state.weight,ratio:state.ratio};study++;render()});
function generate(){state.seed=Math.floor(Math.random()*1000000);state.spread=15+Math.floor(Math.random()*65);state.tension=20+Math.floor(Math.random()*81);state.density=7+Math.floor(Math.random()*29);study++;render()}
document.querySelector('#generate').onclick=generate;document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','BUTTON','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();generate()}});document.querySelector('#reset').onclick=()=>{state={...initial};study=1;motionEnabled=false;phase=0;motionPreset='breathe';document.querySelector('#motion-preset').value=motionPreset;syncMotion();render()};
function applyTheme(dark){document.body.classList.toggle('dark',dark);document.querySelector('#theme').setAttribute('aria-label',`Switch to ${dark?'light':'dark'} mode`)}let preference;try{preference=localStorage.getItem('z-theme')}catch{}applyTheme(preference?preference==='dark':matchMedia('(prefers-color-scheme: dark)').matches);document.querySelector('#theme').onclick=()=>{const dark=!document.body.classList.contains('dark');applyTheme(dark);try{localStorage.setItem('z-theme',dark?'dark':'light')}catch{}};
document.querySelector('#export').onclick=()=>{const blob=new Blob([artwork(state,{motion:motionEnabled?motionPreset:'off',phase})],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`z-studio-${state.mode}-${String(study).padStart(3,'0')}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);const toast=document.querySelector('#toast');toast.textContent=motionEnabled?'Current frame exported as SVG':'SVG exported';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)};render();
