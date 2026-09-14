import * as THREE from './three.module.js';

// Every face layer follows the same ellipsoid. No overlapping offset spheres.
export function faceSurface(thetaStart,thetaEnd,offset=0){
 const positions=[],uv=[],indices=[],rings=48,segments=128,aperture=Math.sin(1.10);
 for(let row=0;row<=rings;row++){
  const theta=thetaStart+(thetaEnd-thetaStart)*row/rings;
  for(let col=0;col<=segments;col++){
   const phi=col/segments*Math.PI*2;
   const x=Math.sin(theta)*Math.cos(phi),y=Math.sin(theta)*Math.sin(phi),z=Math.cos(theta);
   positions.push((1.34+offset)*x,(1.38+offset)*y,(.98+offset)*z);
   uv.push(.5+x/(2*aperture),.5+y/(2*aperture));
   if(row<rings&&col<segments){const a=row*(segments+1)+col,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

const host=typeof document!=='undefined'?document.getElementById('model'):null;
if(host)try{
 const scene=new THREE.Scene();
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 host.appendChild(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(32,1,.1,80);camera.position.set(0,.8,9.8);camera.lookAt(0,.22,0);
 // Large studio reflectors make silver read as metal without point-light glare.
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x2d3340);
 function softbox(x,y,z,w,h,intensity){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(intensity,intensity,intensity),side:THREE.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);studio.add(p);}
 softbox(-4,3,4,3,6,4);softbox(4,2,1,2,5,2.5);softbox(0,6,-1,5,3,3);softbox(0,0,-6,2,4,1.5);
 const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.04).texture;pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xdbe8ff,0x2c2f3d,1.1));
 const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(-3,5,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;key.shadow.normalBias=.035;scene.add(key);
 const fill=new THREE.DirectionalLight(0xc4e2ff,.8);fill.position.set(4,1,4);scene.add(fill);
 const rim=new THREE.DirectionalLight(0x5e9af0,1.3);rim.position.set(3,3,-4);scene.add(rim);
 const pearl=new THREE.MeshPhysicalMaterial({color:0xe6e8e7,metalness:.04,roughness:.3,clearcoat:.55,clearcoatRoughness:.25,envMapIntensity:.5});
 const silver=new THREE.MeshStandardMaterial({color:0xbcc4cc,metalness:.85,roughness:.26,envMapIntensity:1});
 const seam=new THREE.MeshStandardMaterial({color:0x65707b,metalness:.45,roughness:.4});
 const nova=new THREE.Group();scene.add(nova);
 function mesh(geometry,material,parent=nova){const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function oval(material,x,y,z,sx,sy,sz){const m=mesh(new THREE.SphereGeometry(1,64,48),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
 oval(pearl,0,.85,0,1.34,1.38,.98);
 const bezel=mesh(faceSurface(1.087,1.112,.006),silver);bezel.position.y=.85;
 const faceCanvas=document.createElement('canvas');faceCanvas.width=1024;faceCanvas.height=1024;const ctx=faceCanvas.getContext('2d');
 ctx.fillStyle='#000000';ctx.fillRect(0,0,1024,1024);
 function eye(x,y,rx,ry,angle){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.shadowColor='#59daca';ctx.shadowBlur=24;const gradient=ctx.createLinearGradient(-rx,-ry,rx,ry);gradient.addColorStop(0,'#c2f3ed');gradient.addColorStop(1,'#79d7cc');ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 eye(335,430,72,119,-.15);eye(689,430,72,119,.15);eye(512,652,43,23,0);
 const texture=new THREE.CanvasTexture(faceCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
 const glass=new THREE.MeshPhysicalMaterial({color:0xffffff,map:texture,emissive:0xbffff2,emissiveMap:texture,emissiveIntensity:.48,metalness:.03,roughness:.28,clearcoat:.5,clearcoatRoughness:.3,envMapIntensity:.16});
 const face=mesh(faceSurface(0,1.091,.008),glass);face.position.y=.85;
 // Smooth pear profile, sampled along a spline, instead of a stretched sphere.
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-1.86,0),new THREE.Vector3(.53,-1.82,0),new THREE.Vector3(.79,-1.57,0),new THREE.Vector3(.82,-1.2,0),new THREE.Vector3(.71,-.72,0),new THREE.Vector3(.55,-.27,0),new THREE.Vector3(.48,-.12,0),new THREE.Vector3(0,-.08,0)]);
 const profile=curve.getPoints(80).map(p=>new THREE.Vector2(Math.max(0,p.x),p.y));const torso=mesh(new THREE.LatheGeometry(profile,96),pearl);torso.scale.z=.79;
 const armL=oval(silver,-.95,-.78,.01,.215,.62,.23);armL.rotation.z=-.4;
 const armR=oval(silver,.95,-.78,.01,.215,.62,.23);armR.rotation.z=.4;
 oval(pearl,-.43,-1.76,.12,.38,.26,.49);oval(pearl,.43,-1.76,.12,.38,.26,.49);
 oval(silver,-.43,-1.965,.12,.335,.048,.41);oval(silver,.43,-1.965,.12,.335,.048,.41);
 // Controls sit almost flush on the front surface, following its local tangent.
 function control(x,y,r,z){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.x=.21;g.rotation.y=x*.6;nova.add(g);const edge=mesh(new THREE.CylinderGeometry(r,r,.018,64),seam,g);edge.rotation.x=Math.PI/2;const cap=mesh(new THREE.CylinderGeometry(r-.009,r-.009,.018,64),pearl,g);cap.rotation.x=Math.PI/2;cap.position.z=.007;}
 control(-.36,-.63,.123,.473);control(0,-.61,.155,.527);control(.36,-.63,.123,.473);
 const shape=new THREE.Shape();const w=.28,h=.3,r=.05;shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
 const square=mesh(new THREE.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:true,bevelSize:.009,bevelThickness:.005,bevelSegments:3}),seam);square.position.set(0,-1.12,.646);const cap=square.clone();cap.material=pearl;cap.scale.set(.94,.94,1);cap.position.z=.653;nova.add(cap);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.ShadowMaterial({opacity:.22}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-2.018;shadow.receiveShadow=true;scene.add(shadow);
 // Start at a stable three-quarter angle; 360 rotation is an explicit control.
 let rotating=false,drag=false,previousX=0,target=-.24,visible=true,lastTime=0;
 nova.rotation.y=target;
 const rotate=document.getElementById('rotate'),reset=document.getElementById('reset');
 function buttons(){rotate.textContent=rotating?'회전 멈추기 Ⅱ':'360° 자동 회전';rotate.setAttribute('aria-pressed',String(rotating));}
 buttons();rotate.onclick=()=>{rotating=!rotating;buttons();};reset.onclick=()=>{target=0;rotating=false;buttons();};
 host.addEventListener('pointerdown',e=>{drag=true;previousX=e.clientX;host.setPointerCapture(e.pointerId);rotating=false;buttons();});
 host.addEventListener('pointermove',e=>{if(drag){target+=(e.clientX-previousX)*.008;previousX=e.clientX;}});
 for(const event of ['pointerup','pointercancel'])host.addEventListener(event,()=>drag=false);
 host.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();target+=e.key==='ArrowLeft'?-.15:.15;rotating=false;buttons();}});
 new IntersectionObserver(([entry])=>visible=entry.isIntersecting).observe(host);
 new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=w/h<.75?10.7:9.8;camera.updateProjectionMatrix();}).observe(host);
 renderer.setAnimationLoop(time=>{const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;if(!visible||document.hidden)return;if(rotating)target+=dt*.3;nova.rotation.y+=(target-nova.rotation.y)*(1-Math.exp(-12*dt));renderer.render(scene,camera);});
 document.getElementById('device-stage').classList.add('model-ready');
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer.setAnimationLoop(null);document.getElementById('device-stage').classList.remove('model-ready');document.querySelector('.model-controls').hidden=true;});
}catch(error){console.warn('Showing NOVA reference because 3D is unavailable.',error);document.getElementById('device-stage').classList.remove('model-ready');document.querySelector('.model-controls').hidden=true;}
