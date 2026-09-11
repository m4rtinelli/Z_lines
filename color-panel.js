const colorPanel=$('color-panel'),colorGrip=$('color-grip');
function syncPalette(){const colors=state.motionColors||['#ff4060','#ffbd38','#35cbb5','#7065ff'];colors.forEach((c,i)=>$('motion-color-'+i).value=c);$('color-speed').value=state.colorSpeed??1;$('color-speed-value').value=(state.colorSpeed??1)+'×'}
function placeColorPanel(){const r=colorPanel.getBoundingClientRect();colorPanel.style.left=Math.max(8,Math.min(r.left,innerWidth-r.width-8))+'px';colorPanel.style.top=Math.max(8,Math.min(r.top,innerHeight-r.height-8))+'px';colorPanel.style.right='auto'}
function showColorPanel(){syncPalette();colorPanel.hidden=false;$('open-color-panel').setAttribute('aria-expanded','true');placeColorPanel();colorGrip.focus()}
function hideColorPanel(){colorPanel.hidden=true;$('open-color-panel').setAttribute('aria-expanded','false')}
window.syncColorMotion=()=>{syncPalette();$('open-color-panel').hidden=motionPreset!=='color';if(motionPreset!=='color')hideColorPanel()};
const previousMotionChange=$('motion-preset').onchange;
$('motion-preset').onchange=e=>{previousMotionChange(e);if(motionPreset==='color'){motionEnabled=true;phase=0;syncMotion();showColorPanel()}};
$('open-color-panel').onclick=()=>{if(colorPanel.hidden)showColorPanel();else hideColorPanel()};
const previousToggle=$('motion-toggle').onclick;$('motion-toggle').onclick=()=>{previousToggle();if(motionEnabled&&motionPreset==='color')showColorPanel()};
$('close-color-panel').onclick=()=>{hideColorPanel();$('open-color-panel').focus()};
for(let i=0;i<4;i++)$('motion-color-'+i).oninput=e=>{state.motionColors??=['#ff4060','#ffbd38','#35cbb5','#7065ff'];state.motionColors[i]=e.target.value;draw()};
$('color-speed').oninput=e=>{const next=+e.target.value;phase*= (state.colorSpeed??1)/next;state.colorSpeed=next;$('color-speed-value').value=next+'×';draw()};
let colorDrag=null;colorGrip.onpointerdown=e=>{if(e.button!==0)return;const r=colorPanel.getBoundingClientRect();colorDrag={x:e.clientX-r.left,y:e.clientY-r.top};colorGrip.setPointerCapture(e.pointerId);e.preventDefault()};colorGrip.onpointermove=e=>{if(!colorDrag)return;colorPanel.style.left=e.clientX-colorDrag.x+'px';colorPanel.style.top=e.clientY-colorDrag.y+'px';placeColorPanel()};colorGrip.onpointerup=colorGrip.onpointercancel=()=>{colorDrag=null};
colorGrip.onkeydown=e=>{const d={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[e.key];if(!d)return;e.preventDefault();const r=colorPanel.getBoundingClientRect();colorPanel.style.left=r.left+d[0]+'px';colorPanel.style.top=r.top+d[1]+'px';placeColorPanel()};
colorPanel.addEventListener('keydown',e=>{if(e.key==='Escape'){hideColorPanel();$('open-color-panel').focus()}});window.addEventListener('resize',()=>{if(!colorPanel.hidden)placeColorPanel()});window.syncColorMotion();
