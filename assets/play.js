import {Blocks,Memory,Runner,WIDTH,HEIGHT,clamp} from './game-engine.js';
const $=id=>document.getElementById(id),canvas=$('game-canvas'),ctx=canvas.getContext('2d'),overlay=$('game-overlay'),board=$('memory-board');
const nova=new Image();nova.src='assets/nova-cursor.png';nova.onload=()=>draw();
const meta={blocks:{name:'COSMIC BLOCKS',title:'블록을 향해, 출발!',description:'NOVA 패들로 공을 튕겨<br>3개의 스테이지를 클리어하세요.',controls:'<kbd>←</kbd><kbd>→</kbd> 또는 마우스·터치로 이동',label:'코스믹 블록. 방향키 또는 마우스로 패들을 움직이세요.',create:()=>new Blocks()},memory:{name:'MEMORY MATCH',title:'우리의 신호를 찾아봐.',description:'카드를 뒤집어 같은 기호를 찾아주세요.<br>16장의 카드, 8개의 짝. 적은 시도로 도전!',controls:'카드 클릭·터치 · <kbd>Tab</kbd> + <kbd>Enter</kbd>',create:()=>new Memory()},runner:{name:'STAR RUNNER',title:'별을 모으러 떠날까?',description:'장애물을 뛰어넘고 별을 모으세요.<br>45초를 버티면 미션 성공!',controls:'<kbd>Space</kbd><kbd>↑</kbd> 또는 화면 터치로 점프',label:'스타 러너. 스페이스 또는 위쪽 방향키로 점프하세요.',create:()=>new Runner()}};
const symbols=['✦','◆','●','▲','♥','☾','✚','≋'],symbolNames=['별','마름모','원','삼각형','하트','달','십자','물결'];
const colors=['#b6f1d1','#98c5ff','#d4b2ff','#facb86','#f3a5c0','#c6daf0','#91e1dc','#e4dda4'];
let selected='blocks',game=meta.blocks.create(),raf=0,lastTime=0,lastUI=0,best=0,memoryRevision=-1;const keys=new Set();const input={axis:0,x:null};let touchAxis=0;
function loadBest(){try{const n=Number(localStorage.getItem('nova-play-best-'+selected));best=Number.isFinite(n)&&n>0?Math.floor(n):0;}catch{best=0;}}
function saveBest(){if(game.score<=best)return;best=game.score;try{localStorage.setItem('nova-play-best-'+selected,String(best));}catch{}}
function announce(text){$('game-announcement').textContent=text;}
function stats(){
 $('score').textContent=String(game.score).padStart(4,'0');$('best').textContent=String(best).padStart(4,'0');
 $('stat-label').textContent=selected==='blocks'?'STAGE':selected==='memory'?'PAIRS':'TIME LEFT';
 $('stat').textContent=selected==='blocks'?`0${game.level} / 03`:selected==='memory'?`${game.pairs} / 8`:`${Math.max(0,45-Math.floor(game.elapsed))}s`;
 $('life-label').textContent=selected==='memory'?'MOVES':'LIVES';$('lives').textContent=selected==='memory'?String(game.moves).padStart(2,'0'):'♥ '.repeat(game.lives).trim()||'—';
 $('game-state').textContent=({ready:'READY TO PLAY',running:'NOW PLAYING',paused:'PAUSED',won:'MISSION COMPLETE',lost:'TRY AGAIN'})[game.status];
 $('pause-game').disabled=!['running','paused'].includes(game.status);$('pause-game').textContent=game.status==='paused'?'계속하기 ▷':'일시정지 Ⅱ';
}
function showOverlay(kicker,title,description,button){overlay.hidden=false;$('overlay-kicker').textContent=kicker;$('overlay-title').textContent=title;$('overlay-description').innerHTML=description;$('start-game').innerHTML=button+' <span>▷</span>';}
function prepare(key=selected){cancelAnimationFrame(raf);raf=0;lastTime=0;selected=key;game=meta[key].create();loadBest();keys.clear();touchAxis=0;input.axis=0;input.x=null;memoryRevision=-1;
 document.querySelectorAll('.game-choice').forEach(b=>{b.classList.toggle('selected',b.dataset.game===key);b.setAttribute('aria-pressed',String(b.dataset.game===key));});
 $('game-name').textContent=meta[key].name;$('controls-description').innerHTML=meta[key].controls;canvas.hidden=key==='memory';canvas.style.display=key==='memory'?'none':'block';board.hidden=key!=='memory';canvas.setAttribute('aria-label',meta[key].label||'');
 $('touch-controls').hidden=key==='memory';$('touch-controls').style.display=key==='memory'?'none':'';document.querySelectorAll('[data-axis]').forEach(b=>b.hidden=key!=='blocks');$('jump-game').hidden=key!=='runner';
 showOverlay('PLAYER ONE, READY?',meta[key].title,meta[key].description,'게임 시작');if(key==='memory')createCards();stats();draw();
}
function start(){
 if(game.status==='running')return;
 if(['won','lost'].includes(game.status))prepare();
 if(game.status==='paused')game.status='running';else game.start();overlay.hidden=true;stats();announce(meta[selected].name+' 시작');lastTime=0;raf=requestAnimationFrame(loop);if(selected==='memory')board.querySelector('button')?.focus({preventScroll:true});else canvas.focus({preventScroll:true});
}
function pause(){if(game.status==='paused'){start();return;}if(game.status!=='running')return;game.status='paused';keys.clear();touchAxis=0;input.axis=0;cancelAnimationFrame(raf);raf=0;showOverlay('TAKE YOUR TIME.','잠깐 쉬어가요.','준비되면 다시 이어서 플레이하세요.','이어서 플레이');stats();announce('게임이 일시정지되었습니다.');}
function finish(){saveBest();cancelAnimationFrame(raf);raf=0;const win=game.status==='won';showOverlay(win?'MISSION COMPLETE!':'ONE MORE TRY?',win?'NOVA와 함께 해냈어요!':'다음엔 더 멀리!',`이번 점수 <strong>${game.score}</strong> · 최고 기록 <strong>${best}</strong><br>${selected==='memory'?`${game.moves}번의 시도로 ${Math.floor(game.elapsed)}초 만에 완성했어요.`:win?'새로운 게임에도 도전해 보세요.':'다시 도전해서 나의 기록을 넘어보세요.'}`,'다시 도전');stats();announce((win?'미션 성공. ':'게임 종료. ')+game.score+'점.');$('start-game').focus({preventScroll:true});}
function loop(now){raf=0;if(game.status!=='running')return;const dt=lastTime?Math.min((now-lastTime)/1000,.035):0;lastTime=now;input.axis=touchAxis+(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0);input.axis=clamp(input.axis,-1,1);const oldLives=game.lives;game.tick(dt,input);
 if(selected==='memory'&&game.revision!==memoryRevision)updateCards();else if(selected!=='memory')draw();
 if(oldLives!==game.lives&&game.status==='running')announce(`남은 기회 ${game.lives}번`);
 if(now-lastUI>120){stats();lastUI=now;}
 if(['won','lost'].includes(game.status)){finish();return;}raf=requestAnimationFrame(loop);
}
function mascot(x,y,size=40,alpha=1){ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;if(nova.complete&&nova.naturalWidth)ctx.drawImage(nova,x,y,size,size);ctx.globalAlpha=1;}
function backdrop(){ctx.fillStyle='#081321';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.fillStyle='#3a596e';for(let i=0;i<52;i++){const x=(i*137+29)%WIDTH,y=(i*71+17)%HEIGHT;ctx.globalAlpha=.25+(i%4)*.13;ctx.fillRect(x,y,i%6===0?2:1,i%6===0?2:1);}ctx.globalAlpha=1;ctx.strokeStyle='#1e344544';ctx.lineWidth=1;for(let x=0;x<WIDTH;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,HEIGHT);ctx.stroke();}for(let y=10;y<HEIGHT;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WIDTH,y);ctx.stroke();}}
function draw(){if(!ctx||selected==='memory')return;backdrop();
 if(selected==='blocks'){
  const palette=['#a4eacf','#86cbd8','#799ed3','#ad94d1'];for(const b of game.bricks){if(!b.alive)continue;ctx.fillStyle=palette[b.row];ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#ffffff35';ctx.fillRect(b.x,b.y,b.w,3);ctx.fillStyle='#09172330';ctx.fillRect(b.x,b.y+b.h-3,b.w,3);}
  const p=game.paddle,b=game.ball;ctx.fillStyle='#273d50';ctx.fillRect(p.x-p.w/2+3,p.y+7,p.w,12);ctx.fillStyle='#aff3d5';ctx.fillRect(p.x-p.w/2,p.y,p.w,p.h);mascot(p.x-18,p.y-22,36);
  ctx.shadowColor='#a8ffe1';ctx.shadowBlur=15;ctx.fillStyle='#e2fff4';ctx.fillRect(Math.round(b.x-b.r),Math.round(b.y-b.r),b.r*2,b.r*2);ctx.shadowBlur=0;
  if(game.wait>0&&game.status==='running'){ctx.font='13px monospace';ctx.fillStyle='#82acb4';ctx.textAlign='center';ctx.fillText('READY…',400,285);}
 }else{
  const g=game.ground,offset=game.distance%40;ctx.fillStyle='#182d42';ctx.fillRect(0,g,WIDTH,HEIGHT-g);ctx.fillStyle='#74b5bd';ctx.fillRect(0,g,WIDTH,3);ctx.fillStyle='#28425b';for(let x=-offset;x<WIDTH;x+=40)ctx.fillRect(x,g+20,22,4);
  const far=game.distance*.18;ctx.fillStyle='#15263b';for(let i=0;i<12;i++){const x=((i*95-far)%1140+1140)%1140-110;ctx.fillRect(x,260-(i%3)*30,45+(i%2)*15,90+(i%3)*30);}
  for(const o of game.obstacles){ctx.fillStyle=o.hit?'#725a76':'#bc86be';ctx.fillRect(o.x,o.y,o.w,o.h);ctx.fillStyle='#f4c9e5';ctx.fillRect(o.x+4,o.y+4,o.w-8,4);ctx.fillStyle='#543757';ctx.fillRect(o.x+4,o.y+13,5,5);ctx.fillRect(o.x+o.w-9,o.y+13,5,5);}
  for(const s of game.pickups){ctx.fillStyle='#fae3a0';ctx.fillRect(s.x-3,s.y-11,6,22);ctx.fillRect(s.x-11,s.y-3,22,6);ctx.fillStyle='#fff8d4';ctx.fillRect(s.x-4,s.y-4,8,8);}
  const p=game.player;mascot(p.x-10,p.y-17,58,game.invincible>0?.55:1);
  ctx.font='11px monospace';ctx.fillStyle='#6f91aa';ctx.textAlign='left';ctx.fillText('STARS '+String(game.stars).padStart(2,'0'),25,30);ctx.textAlign='right';ctx.fillText('DOT STATION →',775,30);
 }
}
function createCards(){board.replaceChildren();for(let i=0;i<16;i++){const button=document.createElement('button');button.type='button';button.className='memory-card';button.dataset.card=String(i);button.setAttribute('aria-label',`${i+1}번 카드 뒤집기`);button.innerHTML='<img src="assets/nova-cursor.png" alt=""><span class="card-symbol" aria-hidden="true"></span>';button.addEventListener('click',()=>{if(game.flip(i)){updateCards();stats();if(game.status==='won')finish();}});board.append(button);}updateCards();}
function updateCards(){memoryRevision=game.revision;board.querySelectorAll('button').forEach((button,i)=>{const card=game.cards[i],open=card.up||card.matched;button.classList.toggle('flipped',open);button.classList.toggle('matched',card.matched);button.style.setProperty('--card-color',colors[card.symbol]);button.querySelector('.card-symbol').textContent=open?symbols[card.symbol]:'';button.setAttribute('aria-label',`${i+1}번 카드: ${open?symbolNames[card.symbol]:'뒤집기'}${card.matched?', 짝 맞춤':''}`);button.setAttribute('aria-pressed',String(open));});}
board.addEventListener('keydown',event=>{const i=Number(event.target.dataset.card);const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4}[event.key];if(delta&&Number.isInteger(i)){event.preventDefault();board.children[(i+delta+16)%16].focus();}});
function point(event){const rect=canvas.getBoundingClientRect(),scale=Math.min(rect.width/WIDTH,rect.height/HEIGHT),left=rect.left+(rect.width-WIDTH*scale)/2;return clamp((event.clientX-left)/scale,0,WIDTH);}
canvas.addEventListener('pointermove',event=>{if(selected==='blocks')input.x=point(event);},{passive:true});
canvas.addEventListener('pointerdown',event=>{if(game.status!=='running')return;canvas.focus({preventScroll:true});if(selected==='runner')game.jump();else{input.x=point(event);canvas.setPointerCapture(event.pointerId);}});
document.addEventListener('keydown',event=>{if(!['running','paused'].includes(game.status)||event.target.closest('input,textarea,select'))return;if(event.key.toLowerCase()==='p'){event.preventDefault();pause();return;}if(event.target.closest('button'))return;if(['ArrowLeft','ArrowRight','ArrowUp',' ','a','d','w'].includes(event.key)){if(selected==='memory')return;event.preventDefault();keys.add(event.key);input.x=null;if(selected==='runner'&&!event.repeat&&['ArrowUp',' ','w'].includes(event.key))game.jump();}});
document.addEventListener('keyup',event=>keys.delete(event.key));
document.querySelectorAll('[data-axis]').forEach(button=>{button.addEventListener('pointerdown',event=>{event.preventDefault();touchAxis=Number(button.dataset.axis);input.x=null;button.setPointerCapture(event.pointerId);});for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>touchAxis=0);});
$('jump-game').addEventListener('pointerdown',event=>{event.preventDefault();game.jump?.();});$('jump-game').addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();game.jump?.();}});
document.querySelectorAll('.game-choice').forEach(button=>button.addEventListener('click',()=>{if(selected!==button.dataset.game){prepare(button.dataset.game);announce(button.textContent.trim()+' 선택');}}));
$('start-game').addEventListener('click',start);$('pause-game').addEventListener('click',pause);$('restart-game').addEventListener('click',()=>{prepare();start();});
function autoPause(){keys.clear();touchAxis=0;if(game.status==='running')pause();}
addEventListener('blur',autoPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});addEventListener('pagehide',()=>cancelAnimationFrame(raf));
prepare();
