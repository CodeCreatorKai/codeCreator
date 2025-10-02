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

let vehicles=[], aiCars=[], playerCar=null, playerIndex=0;
let scene, camera, renderer, clock, keys={}, lap=0, bestLapTime=0, startTime=0;
let currentWaypoint=0, cameraMode='third';
let gear=1, raceStarted=false;

const carSelect=document.getElementById('carSelect');
f1Cars.forEach((c,i)=>{let o=document.createElement('option'); o.value=i; o.textContent=c.name; carSelect.appendChild(o);});

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

// Initialize scene, camera, cars
function init(){
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,5000);
  renderer=new THREE.WebGLRenderer({canvas:document.getElementById('game')});
  renderer.setSize(window.innerWidth,window.innerHeight);
  clock=new THREE.Clock();

  scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1));
  let dirLight=new THREE.DirectionalLight(0xffffff,0.6);
  dirLight.position.set(100,200,100); scene.add(dirLight);

  let trackGeom=new THREE.Shape();
  TRACK_POINTS.forEach((p,i)=> i===0 ? trackGeom.moveTo(p.x,p.z) : trackGeom.lineTo(p.x,p.z));
  trackGeom.lineTo(TRACK_POINTS[0].x,TRACK_POINTS[0].z);
  let extrude=new THREE.ExtrudeGeometry(trackGeom,{depth:10,bevelEnabled:false});
  let trackMesh=new THREE.Mesh(extrude,new THREE.MeshPhongMaterial({color:0x333333}));
  trackMesh.rotation.x=-Math.PI/2; scene.add(trackMesh);

  let grass=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000), new THREE.MeshPhongMaterial({color:0x0a3d0a}));
  grass.rotation.x=-Math.PI/2; scene.add(grass);

  // Player car
  let carGeom=new THREE.BoxGeometry(10,4,20);
  let carMat=new THREE.MeshPhongMaterial({color:f1Cars[carSelect.value].color});
  playerCar=new THREE.Mesh(carGeom,carMat);
  playerCar.position.set(TRACK_POINTS[0].x + (Math.random()*10-5),2,TRACK_POINTS[0].z + (Math.random()*10-5));
  scene.add(playerCar); vehicles.push(playerCar); playerIndex=0; currentWaypoint=1; startTime=performance.now();

  // AI cars
  for(let i=0;i<AI_COUNT;i++){
    let ai=new THREE.Mesh(carGeom,new THREE.MeshPhongMaterial({color:Math.random()*0xffffff}));
    ai.position.set(TRACK_POINTS[0].x + (Math.random()*10-5),2,TRACK_POINTS[0].z + (Math.random()*10-5));
    scene.add(ai); aiCars.push({mesh:ai, waypoint:1, speed:2+Math.random()*1, lap:0}); vehicles.push(ai);
  }

  camera.position.set(0,50,-80); camera.lookAt(playerCar.position);

  window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth,window.innerHeight);});
  document.addEventListener('keydown',e=>keys[e.key]=true);
  document.addEventListener('keyup',e=>keys[e.key]=false);
  document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='c') cameraMode=cameraMode==='third'?'first':'third';});
}

function update(dt){
  if(raceStarted){
    let accel=0, rotSpeed=0;
    if((keys['ArrowUp']||keys['w'])) accel=Math.min(120*dt,60*dt);
    if(keys['ArrowDown']||keys['s']) accel=-80*dt;
    if(keys['ArrowLeft']||keys['a']) rotSpeed=1.5*dt;
    if(keys['ArrowRight']||keys['d']) rotSpeed=-1.5*dt;
    playerCar.rotation.y+=rotSpeed;
    playerCar.translateZ(accel);
    gear=Math.min(7,Math.max(1,Math.floor(Math.abs(accel)/20)));

    // Waypoints & laps
    let wp=TRACK_POINTS[currentWaypoint], dx=wp.x-playerCar.position.x, dz=wp.z-playerCar.position.z;
    if(Math.sqrt(dx*dx+dz*dz)<15){currentWaypoint=(currentWaypoint+1)%TRACK_POINTS.length; if(currentWaypoint===0){lap++; let lapTime=(performance.now()-startTime)/1000; if(bestLapTime===0 || lapTime<bestLapTime) bestLapTime=lapTime; startTime=performance.now();}}

    //

