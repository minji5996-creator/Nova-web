// Original ambient score and interface sounds synthesized locally. Nothing autoplays.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(any-pointer: fine)');
const canvas=document.createElement('canvas');canvas.className='nova-pixel-trail';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
const pen=canvas.getContext('2d');let particles=[],frame=0,lastEmit=0,lastX=0,lastY=0,lastFrame=0;
function resize(){const scale=Math.min(devicePixelRatio||1,2);canvas.width=Math.ceil(innerWidth*scale);canvas.height=Math.ceil(innerHeight*scale);pen?.setTransform(scale,0,0,scale,0,0);}
function clearTrail(){cancelAnimationFrame(frame);frame=0;lastFrame=0;particles=[];pen?.clearRect(0,0,innerWidth,innerHeight);}
function draw(now){frame=0;const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):.016;lastFrame=now;pen.clearRect(0,0,innerWidth,innerHeight);
 particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=14*dt;pen.globalAlpha=Math.max(0,p.life/p.max)*.6;pen.fillStyle=p.color;pen.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);}pen.globalAlpha=1;
 if(particles.length)frame=requestAnimationFrame(draw);else lastFrame=0;
}
document.addEventListener('pointermove',event=>{
 if(!pen||event.pointerType!=='mouse'||!fine.matches||reduced.matches||document.hidden)return;
 const now=performance.now();if(now-lastEmit<26)return;
 const dx=Math.max(-25,Math.min(25,event.clientX-lastX)),dy=Math.max(-25,Math.min(25,event.clientY-lastY));lastX=event.clientX;lastY=event.clientY;lastEmit=now;
 for(let i=0;i<2;i++){const life=.28+Math.random()*.24;particles.push({x:lastX+(Math.random()-.5)*8,y:lastY+7+(Math.random()-.5)*6,vx:-dx*.65+(Math.random()-.5)*22,vy:-dy*.4+8+Math.random()*13,life,max:life,size:Math.random()>.78?3:2,color:Math.random()>.3?'#8ce7df':'#dbefff'});}if(particles.length>46)particles.splice(0,particles.length-46);if(!frame)frame=requestAnimationFrame(draw);
},{passive:true});
addEventListener('resize',resize,{passive:true});addEventListener('blur',clearTrail);reduced.addEventListener('change',clearTrail);resize();

const audioButton=document.createElement('button');audioButton.type='button';audioButton.className='nova-audio-toggle';audioButton.setAttribute('aria-pressed','false');audioButton.title='잔잔한 배경 음악과 버튼 효과음 켜기';audioButton.innerHTML='<span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="sound-label">사운드 켜기</span>';document.body.append(audioButton);
let audio,master,padBus,bellBus,enabled=false,timer=0,chordIndex=0,lastHover=0,busy=false;
const voices=new Set();
const frequency=midi=>440*2**((midi-69)/12);
function tone(midi,start,duration,volume,bus,type='sine',detune=0){
 const oscillator=audio.createOscillator(),envelope=audio.createGain();oscillator.type=type;oscillator.frequency.value=frequency(midi);oscillator.detune.value=detune;
 const attack=duration>3?1.8:.012;envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(volume,start+attack);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);oscillator.connect(envelope);envelope.connect(bus);voices.add(oscillator);
 oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();envelope.disconnect();};oscillator.start(start);oscillator.stop(start+duration+.03);
}
function init(){
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');audio=new Audio();master=audio.createGain();master.gain.value=0;
 const compressor=audio.createDynamicsCompressor();compressor.threshold.value=-20;compressor.ratio.value=4;master.connect(compressor);compressor.connect(audio.destination);
 padBus=audio.createBiquadFilter();padBus.type='lowpass';padBus.frequency.value=850;padBus.Q.value=.4;padBus.connect(master);
 bellBus=audio.createGain();bellBus.gain.value=.7;bellBus.connect(master);
 const delay=audio.createDelay(1);delay.delayTime.value=.38;const feedback=audio.createGain();feedback.gain.value=.22;const wet=audio.createGain();wet.gain.value=.26;bellBus.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(master);
 audio.addEventListener('statechange',()=>{if(audio.state==='interrupted'&&enabled){enabled=false;clearMusic();updateButton();}});
}
// Dm9 → Bbmaj7 → Fmaj9 → Cadd9; one slow, breath-like chord every 6.4 seconds.
const chords=[[50,57,60,64,69],[46,53,57,60,65],[41,53,57,60,67],[48,55,60,62,67]];
function phrase(){
 if(!enabled||document.hidden||audio.state!=='running')return;
 const start=audio.currentTime+.08,notes=chords[chordIndex%4];
 for(const note of notes){tone(note,start,8.1,.022,padBus,'sine',-3);tone(note+12,start+.04,7.5,.007,padBus,'triangle',3);}
 [0,2,4].forEach((index,i)=>tone(notes[index]+24,start+1.2+i*1.65,2.9,.011,bellBus));
 chordIndex++;timer=setTimeout(phrase,6400);
}
function clearMusic(){clearTimeout(timer);timer=0;for(const oscillator of voices){try{oscillator.stop();}catch{}}voices.clear();}
function updateButton(){audioButton.setAttribute('aria-pressed',String(enabled));audioButton.classList.toggle('playing',enabled);audioButton.querySelector('.sound-label').textContent=enabled?'사운드 끄기':'사운드 켜기';audioButton.title=enabled?'배경 음악과 효과음 끄기':'잔잔한 배경 음악과 버튼 효과음 켜기';}
audioButton.addEventListener('click',async()=>{
 if(busy)return;busy=true;
 try{
  if(enabled){enabled=false;updateButton();clearTimeout(timer);master.gain.cancelScheduledValues(audio.currentTime);master.gain.setTargetAtTime(0,audio.currentTime,.06);await new Promise(resolve=>setTimeout(resolve,240));clearMusic();await audio.suspend();}
  else{if(!audio)init();await audio.resume();enabled=true;updateButton();master.gain.cancelScheduledValues(audio.currentTime);master.gain.setTargetAtTime(.5,audio.currentTime,.45);phrase();}
 }catch{enabled=false;clearMusic();updateButton();audioButton.querySelector('.sound-label').textContent='사운드 다시 켜기';}finally{busy=false;}
});
function hoverSound(target){
 if(!enabled||!audio||audio.state!=='running'||document.hidden||target.disabled||target.getAttribute('aria-disabled')==='true')return;
 const now=performance.now();if(now-lastHover<150)return;lastHover=now;
 tone(88,audio.currentTime,.13,.025,bellBus);tone(95,audio.currentTime+.025,.1,.011,bellBus);
}
document.addEventListener('pointerover',event=>{if(event.pointerType!=='mouse')return;const target=event.target.closest('a[href],button,summary,[role="button"]');if(target&&!target.contains(event.relatedTarget))hoverSound(target);});
document.addEventListener('focusin',event=>{const target=event.target.closest('a[href],button,summary,[role="button"]');if(target&&target.matches(':focus-visible'))hoverSound(target);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTrail();if(audio){clearMusic();audio.suspend().catch(()=>{});}}else if(enabled&&audio){audio.resume().then(()=>{if(enabled&&!timer)phrase();}).catch(()=>{enabled=false;updateButton();});}});
addEventListener('pagehide',()=>{enabled=false;clearMusic();clearTrail();audio?.suspend().catch(()=>{});});
