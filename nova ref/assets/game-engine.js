export const WIDTH=800,HEIGHT=450;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function shuffled(values,rng=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export class Blocks{
 constructor(){this.score=0;this.lives=3;this.level=1;this.status='ready';this.elapsed=0;this.paddle={x:400,y:400,w:112,h:12};this.makeLevel();}
 makeLevel(){this.bricks=[];for(let row=0;row<4;row++)for(let col=0;col<9;col++)this.bricks.push({x:38+col*81,y:67+row*28,w:74,h:19,row,alive:true});this.serve();}
 serve(){this.ball={x:this.paddle.x,y:382,vx:140+this.level*18,vy:-240-this.level*25,r:7};this.wait=.8;}
 start(){if(this.status==='ready')this.status='running';}
 tick(dt,input={}){if(this.status!=='running')return;this.elapsed+=dt;
 const p=this.paddle;if(input.axis)p.x+=input.axis*510*dt;else if(Number.isFinite(input.x))p.x=input.x;p.x=clamp(p.x,p.w/2+10,WIDTH-p.w/2-10);
 if(this.wait>0){this.wait-=dt;this.ball.x=p.x;return;}
 const n=Math.ceil(dt/(1/240));for(let i=0;i<n;i++){if(this.status!=='running'||this.wait>0)break;this.step(dt/n);}
 }
 step(dt){const b=this.ball,p=this.paddle,oldX=b.x,oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.x<b.r+8){b.x=b.r+8;b.vx=Math.abs(b.vx);}if(b.x>WIDTH-b.r-8){b.x=WIDTH-b.r-8;b.vx=-Math.abs(b.vx);}if(b.y<b.r+8){b.y=b.r+8;b.vy=Math.abs(b.vy);}
 if(b.vy>0&&b.y+b.r>=p.y&&oldY+b.r<=p.y+p.h&&b.x>=p.x-p.w/2-b.r&&b.x<=p.x+p.w/2+b.r){const angle=clamp((b.x-p.x)/(p.w/2),-.95,.95)*1.03;const speed=Math.min(440,Math.hypot(b.vx,b.vy)+5);b.vx=Math.sin(angle)*speed;b.vy=-Math.cos(angle)*speed;b.y=p.y-b.r-.1;}
 for(const brick of this.bricks){if(!brick.alive)continue;const nx=clamp(b.x,brick.x,brick.x+brick.w),ny=clamp(b.y,brick.y,brick.y+brick.h);if((b.x-nx)**2+(b.y-ny)**2<=b.r*b.r){brick.alive=false;this.score+=(4-brick.row)*10;if(oldY+b.r<=brick.y||oldY-b.r>=brick.y+brick.h)b.vy=-b.vy;else b.vx=-b.vx;b.x=oldX;b.y=oldY;break;}}
 if(!this.bricks.some(v=>v.alive)){if(this.level===3){this.status='won';this.score+=this.lives*100;}else{this.level++;this.makeLevel();}return;}
 if(b.y>HEIGHT+20){this.lives--;if(!this.lives)this.status='lost';else this.serve();}
 }
}
export class Memory{
 constructor(rng=Math.random){this.cards=shuffled([...Array(8).keys(),...Array(8).keys()],rng).map((symbol,id)=>({id,symbol,up:false,matched:false}));this.score=0;this.moves=0;this.pairs=0;this.elapsed=0;this.status='ready';this.open=[];this.cooldown=0;this.revision=0;}
 start(){if(this.status==='ready')this.status='running';}
 flip(index){if(this.status!=='running'||this.cooldown>0||!Number.isInteger(index))return false;const card=this.cards[index];if(!card||card.up||card.matched)return false;card.up=true;this.open.push(index);this.revision++;
 if(this.open.length===2){this.moves++;const [a,b]=this.open.map(i=>this.cards[i]);if(a.symbol===b.symbol){a.matched=b.matched=true;this.pairs++;this.score+=100;this.open=[];if(this.pairs===8){this.status='won';this.score+=Math.max(0,400-(this.moves-8)*15-Math.floor(this.elapsed)*2);}}else this.cooldown=.8;}return true;
 }
 tick(dt){if(this.status!=='running')return;this.elapsed+=dt;if(this.cooldown>0){this.cooldown-=dt;if(this.cooldown<=0){this.open.forEach(i=>this.cards[i].up=false);this.open=[];this.revision++;}}}
}
export class Runner{
 constructor(rng=Math.random){this.rng=rng;this.status='ready';this.score=0;this.elapsed=0;this.lives=3;this.distance=0;this.stars=0;this.player={x:114,y:310,vy:0,w:36,h:40};this.obstacles=[];this.pickups=[];this.spawn=1.3;this.invincible=0;this.jumpQueued=false;this.ground=350;}
 start(){if(this.status==='ready')this.status='running';}
 jump(){if(this.status==='running'&&this.player.y>=this.ground-this.player.h-.5){this.player.vy=-520;return true;}return false;}
 tick(dt){if(this.status!=='running')return;this.elapsed+=dt;this.invincible=Math.max(0,this.invincible-dt);const speed=220+Math.min(100,this.elapsed*2);this.distance+=speed*dt;const p=this.player;p.vy+=1450*dt;p.y+=p.vy*dt;if(p.y+p.h>=this.ground){p.y=this.ground-p.h;p.vy=0;}
 this.spawn-=dt;if(this.spawn<=0){const h=28+Math.floor(this.rng()*18);this.obstacles.push({x:840,y:this.ground-h,w:28,h,hit:false});this.pickups.push({x:845,y:this.ground-100,r:10,taken:false});this.spawn=1.45+this.rng()*.6;}
 const overlaps=o=>p.x<o.x+o.w&&p.x+p.w>o.x&&p.y<o.y+o.h&&p.y+p.h>o.y;
 for(const o of this.obstacles){o.x-=speed*dt;if(!o.hit&&this.invincible<=0&&overlaps(o)){o.hit=true;this.lives--;this.invincible=1.1;if(!this.lives){this.status='lost';break;}}}
 for(const s of this.pickups){s.x-=speed*dt;if(!s.taken&&Math.hypot(p.x+p.w/2-s.x,p.y+p.h/2-s.y)<32){s.taken=true;this.stars++;}}
 this.obstacles=this.obstacles.filter(o=>o.x+o.w>-10);this.pickups=this.pickups.filter(s=>s.x>-10&&!s.taken);this.score=Math.floor(this.distance/25)+this.stars*30;if(this.elapsed>=45&&this.status==='running'){this.status='won';this.score+=this.lives*100;}
 }
}
