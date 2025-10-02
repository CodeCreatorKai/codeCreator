<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>F1 Realistic Racer</title>
<style>
html,body{height:100%;margin:0;overflow:hidden;background:#111;color:#eee;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial}
#hud{position:absolute;top:10px;left:10px;z-index:10;color:#eee;font-size:14px}
#hud div{margin-bottom:4px}
#menu{position:absolute;top:0;left:0;width:100%;height:100%;background:#000d;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:20;color:#fff}
#menu button{margin:8px;padding:10px 16px;background:#222;border:1px solid #444;color:#fff;border-radius:8px;cursor:pointer}
#lights{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:30;display:flex;flex-direction:column;align-items:center}
.light{width:40px;height:40px;margin:5px;border-radius:50%;background:#500;box-shadow:0 0 5px #000;}
.light.on{background:red;box-shadow:0 0 20px red;}
canvas{display:block;width:100vw;height:100vh}
</style>
</head>
<body>
<div id="hud">
  <div id="lap">Lap: 0/3</div>
  <div id="pos">Position: --</div>
  <div id="speed">Speed: 0 km/h</div>
  <div id="gear">Gear: 1</div>
  <div id="bestlap">Best Lap: --</div>
</div>
<div id="menu">
  <h1>F1 Realistic Racer</h1>
  <p>Select your car and start the race</p>
  <select id="carSelect"></select>
  <button id="startRace">Race</button>
  <p>Press <strong>C</strong> to toggle First/Third Person camera</p>
</div>
<div id="lights" style="display:none;">
  <div class="light" id="light1"></div>
  <div class="light" id="light2"></div>
  <div class="light" id="light3"></div>
  <div class="light" id="light4"></div>
  <div class="light" id="light5"></div>
</div>
<canvas id="game"></canvas>
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script>
// --- Configuration ---
const f1Cars=[
  {name:"Ferrari SF-24", color:0xff0000},
  {name:"Mercedes W15", color:0xaaaaaa},
  {name:"Red Bull RB20", color:0x0000ff},
  {name:"McLaren MCL38", color:0xff6600},
  {name:"Aston Martin AMR24", color:0x006600}
];
const AI_COUNT=10;
const LAP_COUNT=3;
const TRACK_POINTS=[
  {x:0,z:300},{x:200,z:300},{x:400,z:100},{x:400,z:-100},{x:200,z:-300},
  {x:0,z:-300},{x:-200,z:-300},{x:-400,z:-100},{x:-400,z:100},{x:-200,z:300}
];
let vehicles=[],aiCars=[],playerCar=null,playerIndex=0;
let scene,camera,renderer,clock,keys={},lap=0,bestLapTime=0,startTime=0;
let currentWaypoint=0,cameraMode='third';
let gear=1;
let raceStarted=false;

// --- Menu ---
const carSelect=document.getElementById('carSelect');
f1Cars.forEach((c,i)=>{let o=document.createElement('option');o.value=i;o.textContent=c.name;carSelect.appendChild(o);});

// --- Lights ---
const lightsDiv=document.getElementById('lights');
const lightEls=[...document.querySelectorAll('.light')];
function startLights(callback){
  lightsDiv.style.display='flex';
  let i=0;
  function nextLight(){
    if(i>0) lightEls[i-1].classList.remove('on');
    if(i<5){
      lightEls[i].classList.add('on');
      i++;
      setTimeout(nextLight,700);
    } else {
      lightsDiv.style.display='none';
      raceStarted=true;
      callback();
    }
  }
  nextLight();
}

// --- Initialization ---
function init(){
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,5000);
  renderer=new THREE.WebGLRenderer({canvas:document.getElementById('game')});
  renderer.setSize(window.innerWidth,window.innerHeight);
  clock=new THREE.Clock();

  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1));
  let dirLight=new THREE.DirectionalLight(0xffffff,0.6);
  dirLight.position.set(100,200,100);
  scene.add(dirLight);

  // Track mesh
  let trackGeom=new THREE.Shape();
  TRACK_POINTS.forEach((p,i)=>{
    if(i==0) trackGeom.moveTo(p.x,p.z);
    else trackGeom.lineTo(p.x,p.z);
  });
  trackGeom.lineTo(TRACK_POINTS[0].x,TRACK_POINTS[0].z);
  let extrude=new THREE.ExtrudeGeometry(trackGeom,{depth:10,bevelEnabled:false});
  let trackMat=new THREE.MeshPhongMaterial({color:0x333333});
  let trackMesh=new THREE.Mesh(extrude,trackMat);
  trackMesh.rotation.x=-Math.PI/2;
  scene.add(trackMesh);

  // Grass
  let grassGeom=new THREE.PlaneGeometry(1000,1000);
  let grassMat=new THREE.MeshPhongMaterial({color:0x0a3d0a});
  let grass=new THREE.Mesh(grassGeom,grassMat);
  grass.rotation.x=-Math.PI/2;
  scene.add(grass);

  // Player car with random offset
  let carGeom=new THREE.BoxGeometry(10,4,20);
  let carMat=new THREE.MeshPhongMaterial({color:f1Cars[carSelect.value].color});
  playerCar=new THREE.Mesh(carGeom,carMat);
  let offsetX=(Math.random()*10-5), offsetZ=(Math.random()*10-5);
  playerCar.position.set(TRACK_POINTS[0].x+offsetX,2,TRACK_POINTS[0].z+offsetZ);
  scene.add(playerCar);
  vehicles.push(playerCar);
  playerIndex=0;
  currentWaypoint=1;
  startTime=performance.now();

  // AI cars with random grid offset
  for(let i=0;i<AI_COUNT;i++){
    let mat=new THREE.MeshPhongMaterial({color:Math.random()*0xffffff});
    let ai=new THREE.Mesh(carGeom,mat);
    let offsetX=(Math.random()*10-5), offsetZ=(Math.random()*10-5);
    ai.position.set(TRACK_POINTS[0].x+offsetX,2,TRACK_POINTS[0].z+offsetZ);
    scene.add(ai);
    aiCars.push({mesh:ai,waypoint:1,speed:2+Math.random()*1,lap:0});
    vehicles.push(ai);
  }

  camera.position.set(0,50,-80);
  camera.lookAt(playerCar.position);

  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  });
  document.addEventListener('keydown',e=>keys[e.key]=true);
  document.addEventListener('keyup',e=>keys[e.key]=false);

  document.addEventListener('keydown',e=>{
    if(e.key.toLowerCase()==='c') cameraMode=cameraMode==='third'?'first':'third';
  });
}

// --- Physics & AI ---
function update(dt){
  if(raceStarted){
    // Player physics with launch control
    let accel=0,rotSpeed=0;
    if((keys['ArrowUp']||keys['w']) && raceStarted) accel=Math.min(120*dt,60*dt); // limit initial acceleration
    if(keys['ArrowDown']||keys['s']) accel=-80*dt;
    if(keys['ArrowLeft']||keys['a']) rotSpeed=1.5*dt;
    if(keys['ArrowRight']||keys['d']) rotSpeed=-1.5*dt;
    playerCar.rotation.y+=rotSpeed;
    playerCar.translateZ(accel);

    // Simple gear based on speed
    gear=Math.min(7,Math.max(1,Math.floor(Math.abs(accel)/20)));

    // Waypoint check for lap counting
    let wp=TRACK_POINTS[currentWaypoint];
    let dx=wp.x-playerCar.position.x;
    let dz=wp.z-playerCar.position.z;
    if(Math.sqrt(dx*dx+dz*dz)<15){
      currentWaypoint=(currentWaypoint+1)%TRACK_POINTS.length;
      if(currentWaypoint===0){lap++; 
        let lapTime=(performance.now()-startTime)/1000;
        if(bestLapTime===0 || lapTime<bestLapTime) bestLapTime=lapTime;
        startTime=performance.now();
      }
    }

    // AI movement with overtaking
    aiCars.forEach(ai=>{
      let target=TRACK_POINTS[ai.waypoint];
      let dx=target.x-ai.mesh.position.x;
      let dz=target.z-ai.mesh.position.z;
      let angle=Math.atan2(dz,dx);
      let dist=Math.sqrt(dx*dx+dz*dz);

      // Avoid other cars
      vehicles.forEach(v=>{
        if(v!==ai.mesh){
          let d=Math.hypot(v.position.x-ai.mesh.position.x,v.position.z-ai.mesh.position.z);
          if(d<20) ai.speed=Math.max(1,ai.speed-0.5*dt);
        }
      });
      // Overtake boost on straight
      if(Math.abs(Math.sin(angle))<0.1) ai.speed=Math.min(4,ai.speed+0.5*dt);

      ai.mesh.rotation.y=angle-Math.PI/2;
      let speed=ai.speed*dt*60;
      ai.mesh.position.x+=Math.cos(angle)*speed;
      ai.mesh.position.z+=Math.sin(angle)*speed;
      if(dist<10){ai.waypoint=(ai.waypoint+1)%TRACK_POINTS.length;}
    });

    // Camera
    if(cameraMode==='third'){
      let offset=new THREE.Vector3(0,30,-60);
      offset.applyAxisAngle(new THREE.Vector3(0,1,0),playerCar.rotation.y);
      camera.position.copy(playerCar.position.clone().add(offset));
      camera.lookAt(playerCar.position);
    }else{
      let offset=new THREE.Vector3(0,4,2);
      offset.applyAxisAngle(new THREE.Vector3(0,1,0),playerCar.rotation.y);
      camera.position.copy(playerCar.position.clone().add(offset));
      let lookAt=new THREE.Vector3(0,4,50);
      lookAt.applyAxisAngle(new THREE.Vector3(0,1,0),playerCar.rotation.y);
      camera.lookAt(playerCar.position.clone().add(lookAt));
    }

    // HUD update
    document.getElementById('lap').textContent="Lap: "+lap+"/"+LAP_COUNT;
    document.getElementById('speed').textContent="Speed: "+Math.round(accel/dt)+" km/h";
    document.getElementById('gear').textContent="Gear: "+gear;
    document.getElementById('pos').textContent="Position: 1"; // Can be extended
    document.getElementById('bestlap').textContent="Best Lap: "+(bestLapTime>0?bestLapTime.toFixed(2)+"s":"--");
  }
}

// --- Animation loop ---
function animate(){
  requestAnimationFrame(animate);
  let dt=clock.getDelta();
  update(dt);
  renderer.render(scene,camera);
}

// --- Start race ---
document.getElementById('startRace').onclick=()=>{
  document.getElementById('menu').style.display='none';
  init();
  startLights(()=>animate());
};
</script>
</body>
</html>
