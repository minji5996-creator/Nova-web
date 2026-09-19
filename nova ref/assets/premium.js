const visual=document.getElementById('product-visual');
const product=document.getElementById('nova-character');
const aura=visual.querySelector('.product-aura');
const motionButton=document.getElementById('motion-toggle');
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let enabled=!preference.matches,visible=false,frame=0,previousTime=0,time=0;
let targetX=0,targetY=0,x=0,y=0;
const moods=['mint','blue','gold'];
let mood='mint',nextChange=6,reactionStart=-10;
function setMood(value,manual=false){
 if(!moods.includes(value))return;
 mood=value;visual.dataset.mood=value;
 visual.querySelectorAll('[data-expression]').forEach(image=>image.classList.toggle('active',image.dataset.expression===value));
 visual.querySelectorAll('[data-mood]').forEach(button=>{const selected=button.dataset.mood===value;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
 nextChange=time+(manual?12:6);reactionStart=enabled?time:-10;
}
visual.querySelectorAll('[data-mood]').forEach(button=>button.addEventListener('click',()=>setMood(button.dataset.mood,true)));
product.addEventListener('click',()=>setMood(moods[(moods.indexOf(mood)+1)%moods.length],true));
function label(){motionButton.textContent=enabled?'움직임 멈추기 Ⅱ':'움직임 켜기 ▷';motionButton.setAttribute('aria-pressed',String(enabled));}
function neutral(){product.style.transform='translate3d(0,0,0) rotate(-2deg)';aura.style.transform='translate3d(0,0,0)';}
function stop(){cancelAnimationFrame(frame);frame=0;previousTime=0;}
function animate(now){
 frame=0;if(!enabled||!visible||document.hidden)return;
 const dt=previousTime?Math.min((now-previousTime)/1000,.05):0;previousTime=now;time+=dt;
 if(time>=nextChange)setMood(moods[(moods.indexOf(mood)+1)%moods.length]);
 const ease=1-Math.exp(-16*dt);x+=(targetX-x)*ease;y+=(targetY-y)*ease;
 const lift=Math.sin(time*.85)*8;const sway=Math.sin(time*.55)*.9;
 const progress=Math.min(1,Math.max(0,(time-reactionStart)/1.1));
 const pulse=Math.sin(progress*Math.PI),wave=Math.sin(progress*Math.PI*2)*pulse;
 const bounce=mood==='gold'?-Math.abs(Math.sin(progress*Math.PI*2))*18*(1-progress):0;
 const nod=mood==='blue'?wave*9:0,roll=mood==='mint'?wave*4:0;
 product.style.transform=`translate3d(${x*9}px,${lift+y*5+bounce}px,0) rotateX(${-y*5+nod}deg) rotateY(${x*9}deg) rotateZ(${-2+sway+x*1.3+roll}deg)`;
 aura.style.transform=`translate3d(${-x*17}px,${-y*12}px,0)`;
 frame=requestAnimationFrame(animate);
}
function start(){if(enabled&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(animate);}
function setEnabled(value){enabled=value;reactionStart=-10;label();if(enabled)start();else{stop();neutral();}}
visual.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||!enabled)return;const rect=visual.getBoundingClientRect();targetX=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));targetY=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));},{passive:true});
function release(){targetX=0;targetY=0;}
addEventListener('blur',release);
visual.addEventListener('pointerleave',release);visual.addEventListener('pointercancel',release);
visual.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')release();});
motionButton.addEventListener('click',()=>setEnabled(!enabled));
preference.addEventListener('change',event=>setEnabled(!event.matches));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();else stop();},{threshold:.02}).observe(visual);
product.querySelectorAll('img').forEach(image=>image.draggable=false);setMood('mint');reactionStart=-10;label();neutral();
const details=[['눈을 마주치고.<br>이야기를 시작하고.','둥근 얼굴과 은은하게 빛나는 눈.<br>말을 걸고 싶은 작은 존재로 디자인했습니다.','HELLO, HUMAN.'],['“헤이 키라.”<br>대화의 시작은 가볍게.','버튼과 메뉴를 찾지 않아도 됩니다.<br>말을 끊고 이어가는 대화도 자연스럽게.','VOICE FIRST.'],['당신의 선택으로.<br>우리의 기억을 쌓다.','승인한 항목만 기억합니다.<br>언제든 확인하고, 항목별로 지울 수 있습니다.','YOUR MEMORY.']];
document.querySelectorAll('[data-detail]').forEach(button=>button.addEventListener('click',()=>{const detail=details[Number(button.dataset.detail)];document.querySelectorAll('[data-detail]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});document.getElementById('detail-title').innerHTML=detail[0];document.getElementById('detail-description').innerHTML=detail[1];document.getElementById('marker-label').textContent=detail[2];}));
