import * as THREE from './three.module.js';
const host=document.getElementById('model');
if(host)try{
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,1.15,9.2);camera.lookAt(0,.35,0);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;host.appendChild(renderer.domElement);
 const hemi=new THREE.HemisphereLight(0xdbfff4,0x29302d,2.5);scene.add(hemi);
 function light(color,intensity,x,y,z,size){const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);if(size){l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.camera.left=-4;l.shadow.camera.right=4;l.shadow.camera.top=5;l.shadow.camera.bottom=-4;}return l;}
 light(0xffffff,4,-3,5,4,true);light(0x91fbd6,2.2,4,2,-3);light(0xc3d3ff,1.8,-4,1,-2);light(0xffe5c6,1,3,0,4);
 const nova=new THREE.Group();scene.add(nova);
 const pearl=new THREE.MeshPhysicalMaterial({color:0xe5e9e5,metalness:.2,roughness:.22,clearcoat:1,clearcoatRoughness:.16});
 const chrome=new THREE.MeshStandardMaterial({color:0x9faeac,metalness:.83,roughness:.21});const screen=new THREE.MeshPhysicalMaterial({color:0x030808,metalness:.3,roughness:.13,clearcoat:1});const glow=new THREE.MeshStandardMaterial({color:0xa7f5e2,emissive:0x7bffe1,emissiveIntensity:2.4,roughness:.25});
 function orb(parent,mat,pos,scale){const m=new THREE.Mesh(new THREE.SphereGeometry(1,64,40),mat);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 // Rounded shell, pear-shaped torso and the T-shaped controls follow the supplied character.
 orb(nova,pearl,[0,-.67,0],[.92,1.28,.64]);orb(nova,pearl,[0,.88,0],[1.34,1.38,.78]);orb(nova,chrome,[0,.91,.4],[1.245,1.273,.47]);orb(nova,screen,[0,.92,.54],[1.19,1.22,.44]);
 const face=new THREE.Group();nova.add(face);const left=orb(face,glow,[-.43,1.12,.946],[.225,.365,.055]);left.rotation.z=.15;const right=orb(face,glow,[.43,1.12,.946],[.225,.365,.055]);right.rotation.z=-.15;orb(face,glow,[0,.54,.971],[.12,.065,.035]);
 const armL=orb(nova,chrome,[-1.01,-.65,0],[.24,.64,.3]);armL.rotation.z=-.45;const armR=orb(nova,chrome,[1.01,-.65,0],[.24,.64,.3]);armR.rotation.z=.45;
 orb(nova,pearl,[-.47,-1.68,.06],[.41,.36,.55]);orb(nova,pearl,[.47,-1.68,.06],[.41,.36,.55]);orb(nova,chrome,[-.47,-1.88,.07],[.38,.11,.5]);orb(nova,chrome,[.47,-1.88,.07],[.38,.11,.5]);
 function button(x,y,r){const edge=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.045,48),chrome);edge.rotation.x=Math.PI/2;edge.position.set(x,y,.619);nova.add(edge);const cap=new THREE.Mesh(new THREE.CylinderGeometry(r*.88,r*.88,.05,48),pearl);cap.rotation.x=Math.PI/2;cap.position.set(x,y,.643);nova.add(cap);}
 button(-.4,-.42,.135);button(0,-.4,.17);button(.4,-.42,.135);
 const shape=new THREE.Shape();const w=.29,h=.31,r=.065;shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const square=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:3,steps:1}),chrome);square.position.set(0,-.94,.615);nova.add(square);const inner=square.clone();inner.material=pearl;inner.scale.set(.91,.91,1);inner.position.z=.64;nova.add(inner);
 const port=new THREE.Mesh(new THREE.BoxGeometry(.26,.09,.045),screen);port.position.set(0,-1.2,-.57);nova.add(port);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(3,96),new THREE.ShadowMaterial({opacity:.35}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.02;floor.receiveShadow=true;scene.add(floor);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.65,1.75,.1,96),new THREE.MeshStandardMaterial({color:0x18352b,metalness:.55,roughness:.45}));base.position.y=-2.1;base.receiveShadow=true;scene.add(base);
 let rotating=!matchMedia('(prefers-reduced-motion: reduce)').matches,drag=false,previous=0,target=-.18;
 const rotate=document.getElementById('rotate');function update(){rotate.textContent=rotating?'회전 멈추기 Ⅱ':'자동 회전 ▷';rotate.setAttribute('aria-pressed',String(rotating));}update();rotate.onclick=()=>{rotating=!rotating;update();};document.getElementById('reset').onclick=()=>{target=0;rotating=false;update();};
 host.addEventListener('pointerdown',e=>{drag=true;previous=e.clientX;host.setPointerCapture(e.pointerId);rotating=false;update();});host.addEventListener('pointermove',e=>{if(!drag)return;target+=(e.clientX-previous)*.012;previous=e.clientX;});host.addEventListener('pointerup',()=>drag=false);host.addEventListener('pointercancel',()=>drag=false);host.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotating=false;target+=e.key==='ArrowLeft'?-.18:.18;update();}});
 function size(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=w/h<.75?10.5:9.2;camera.updateProjectionMatrix();}new ResizeObserver(size).observe(host);size();document.getElementById('device-stage').classList.add('model-ready');
 let previousTime=0;renderer.setAnimationLoop(t=>{const dt=Math.min((t-previousTime)/1000,.05);previousTime=t;if(rotating)target+=dt*.22;nova.rotation.y+=(target-nova.rotation.y)*.12;renderer.render(scene,camera);});
}catch(error){console.warn('3D unavailable; showing character reference.',error);document.querySelector('.model-controls').hidden=true;}
