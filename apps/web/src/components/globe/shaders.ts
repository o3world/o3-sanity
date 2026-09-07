import { starHashWGSL } from './star-seed'

// Solid meshes share one depth buffer; soft emission is drawn behind their surfaces.
const camera = /* wgsl */ `
// World-to-view rotation for a camera orbiting the globe at distance 1650.
fn orbitView(q: vec3f, yaw: f32, pitch: f32) -> vec3f {
  let x = q.x*cos(yaw)+q.z*sin(yaw);
  let z = -q.x*sin(yaw)+q.z*cos(yaw);
  return vec3f(x,q.y*cos(pitch)-z*sin(pitch),q.y*sin(pitch)+z*cos(pitch));
}
// Compress the sky's enormous depth range for the camera move only.
// At the resting camera position every seeded star keeps its original projection.
fn skyCamera(world: vec3f, position: vec3f) -> vec3f {
  let depth = clamp(log(length(world)/8000.0)/log(1125.0),0.0,1.0);
  let travelDistance = 900.0*pow(32.0,depth);
  let eyeDistance = length(world-vec3f(0.0,0.0,1650.0));
  return world-position*(eyeDistance/travelDistance);
}
// Blend toward an angular lens so peripheral motion follows a rounded dome.
// Shared by the sky and rails; the central globe keeps almost identical scale.
fn domeProject(xy: vec2f, distance: f32, focal: f32) -> vec2f {
  let radius = length(xy);
  let depth = max(100.0,distance);
  let angular = atan(radius/depth)/max(radius,0.001);
  return xy*focal*mix(1.0/depth,angular,0.75);
}
`
const common =
  camera +
  starHashWGSL +
  /* wgsl */ `
struct Params {
  viewport: vec4f,
  camera: vec4f,
  globe: vec4f,
  motion: vec4f,
  u: vec4f,
  v: vec4f,
  color: vec4f,
  dot: vec4f,
  dotGround: vec4f,
}
@group(0) @binding(0) var<uniform> p: Params;
const glowLightColor = vec3f(1.0,0.063,0.0);
struct Out {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) color: vec4f,
}
fn orbitPose(original: vec3f) -> vec3f {
  let axis = normalize(vec3f(0.32,1.0,0.18));
  let angle = p.motion.x * 6.2831853 / (70.0/0.3);
  let q = original*cos(angle) + cross(axis,original)*sin(angle) + axis*dot(axis,original)*(1.0-cos(angle));
  let tilt = -17.0*3.14159265/180.0;
  let posed = vec3f(q.x*cos(tilt)-q.y*sin(tilt), (q.x*sin(tilt)+q.y*cos(tilt))*cos(11.0*3.14159265/180.0), q.z);
  return orbitView(posed-p.camera.xyz,p.motion.y,p.motion.z);
}
fn orbitPoint(theta: f32) -> vec3f {
  return orbitPose((p.u.xyz*cos(theta)+p.v.xyz*sin(theta))*340.0);
}
fn sceneDepth(z: f32) -> f32 {
  return (1000.0-z)/2000.0;
}
fn clip(pixel: vec2f, z: f32) -> vec4f {
  return vec4f(pixel.x/p.viewport.x*2.0-1.0, 1.0-pixel.y/p.viewport.y*2.0, sceneDepth(z), 1.0);
}
fn corner(index: u32) -> vec2f {
  let corners = array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
  return corners[index%6u];
}
fn heatCorner(cell: vec2f) -> f32 {
  let key = (bitcast<u32>(i32(cell.x))*0x7feb352du)
    ^ (bitcast<u32>(i32(cell.y))*0x846ca68bu);
  return stableStarHash(f32(key & 0xffffffu));
}
fn heatNoise(q: vec2f) -> f32 {
  let cell = floor(q);
  let f = fract(q);
  let blend = f*f*(3.0-2.0*f);
  // Hash the shared lattice corners identically on both sides of each cell.
  let values = vec4f(heatCorner(cell),heatCorner(cell+vec2f(1,0)),
    heatCorner(cell+vec2f(0,1)),heatCorner(cell+vec2f(1,1)));
  return mix(mix(values.x,values.y,blend.x),mix(values.z,values.w,blend.x),blend.y);
}
// The glow stays in the SVG bloom's plane while following the camera descent.
fn glowPoint(angle: f32, radius: f32) -> vec3f {
  return vec3f(cos(angle)*radius,sin(angle)*radius*cos(11.0*3.14159265/180.0),0.0)-p.camera.xyz;
}
fn glowRadius(angle: f32) -> f32 {
  let ring = vec2f(cos(angle),sin(angle));
  let drift = vec2f(p.motion.x*0.075,-p.motion.x*0.045);
  let ripple = (heatNoise(ring*3.0+drift*0.6)-0.5)*10.0
    +(heatNoise(ring*8.0+drift)-0.5)*5.0
    +(heatNoise(ring*19.0-drift*0.7)-0.5)*1.5;
  return 342.0+ripple*p.motion.w;
}
`
const solid =
  common +
  /* wgsl */ `
struct SolidOut {
  @builtin(position) position: vec4f,
  @location(0) @interpolate(perspective, sample) point: vec3f,
  @location(1) @interpolate(perspective, sample) normal: vec3f,
}
fn solidVertex(point: vec3f, normal: vec3f) -> SolidOut {
  var result: SolidOut;
  result.position = clip(p.globe.xy+domeProject(point.xy,1650.0-point.z,1650.0*p.globe.z),point.z);
  result.point = point;
  result.normal = normal;
  return result;
}
fn coreCenter() -> vec3f {
  return orbitView(-p.camera.xyz,p.motion.y,p.motion.z);
}
fn linearColor(color: vec3f) -> vec3f {
  return select(color/12.92,pow((color+0.055)/1.055,vec3f(2.4)),color>vec3f(0.04045));
}
fn displayColor(color: vec3f) -> vec3f {
  let light = max(color,vec3f(0.0));
  return select(light*12.92,1.055*pow(light,vec3f(1.0/2.4))-0.055,light>vec3f(0.0031308));
}
fn illumination(point: vec3f, normal: vec3f) -> vec3f {
  if (p.dot.w < 0.5) { return vec3f(0.65+0.35*max(0.0,dot(normal,normalize(coreCenter()-point)))); }
  let center = coreCenter();
  let delta = center-point;
  let distanceSquared = dot(delta,delta);
  // The luminous core has area, so the terminator receives a little wrapped light.
  let core = max(0.0,(dot(normal,normalize(delta))+0.18)/1.18)*90000.0/(distanceSquared+30000.0);
  let localPoint = point-center;
  let azimuth = atan2(localPoint.y,localPoint.x);
  var rim = 0.0;
  for (var sample = -2; sample <= 2; sample++) {
    let angle = azimuth+f32(sample)*0.28;
    let source = glowPoint(angle,glowRadius(angle));
    let toRim = source-point;
    let d2 = dot(toRim,toRim);
    rim += max(0.0,dot(normal,toRim/max(sqrt(d2),0.001)))*40000.0/(d2+40000.0);
  }
  return vec3f(0.20)+linearColor(glowLightColor)*min(1.4,core+rim/3.0);
}
fn wireReflection(point: vec3f, normal: vec3f) -> f32 {
  let eye = normalize(vec3f(0.0,0.0,1650.0)-point);
  let local = point-coreCenter();
  let azimuth = atan2(local.y,local.x);
  var highlight = 0.0;
  for (var sample = 0; sample < 4; sample++) {
    let angle = azimuth+f32(sample-1)*0.24;
    let source = select(glowPoint(angle,glowRadius(angle)),coreCenter(),sample==3);
    let delta = source-point;
    let d2 = dot(delta,delta);
    let direction = delta/max(sqrt(d2),0.001);
    let halfVector = direction+eye;
    let halfway = halfVector/max(length(halfVector),0.001);
    let reflection = pow(max(0.0,dot(normal,halfway)),32.0);
    let facing = smoothstep(0.0,0.25,dot(normal,direction));
    highlight = max(highlight,reflection*facing*40000.0/(d2+40000.0));
  }
  let grazing = pow(1.0-max(0.0,dot(normal,eye)),3.0);
  return highlight*0.65+grazing*0.045;
}
`
export const orbitShader =
  solid +
  /* wgsl */ `
@vertex fn vs_main(@builtin(vertex_index) vertex: u32) -> SolidOut {
  let theta = f32(vertex/13u)/576.0*6.2831853;
  let phi = f32(vertex%13u)/12.0*6.2831853;
  var center = orbitPoint(theta);
  let radial = normalize(orbitPoint(theta)-orbitPose(vec3f(0.0)));
  let axis = normalize(cross(orbitPoint(theta+0.001)-center,radial));
  var normal = radial*cos(phi)+axis*sin(phi);
  if (p.dot.z > 1.5) {
    // The former SVG limb is now solid geometry at the bloom's depth.
    center = glowPoint(theta,340.0);
    normal = normalize(vec3f(cos(theta),sin(theta)/cos(11.0*3.14159265/180.0),0.0))*cos(phi)+vec3f(0,0,1)*sin(phi);
  }
  let point = center+normal*p.u.w*0.5;
  var result = solidVertex(point,normal);
  // Match the SVG bloom's projection while retaining the rim's mesh depth.
  if (p.dot.z > 1.5) { result.position = clip(p.globe.xy+point.xy*p.globe.z,point.z); }
  return result;
}
@fragment fn fs_main(i: SolidOut) -> @location(0) vec4f {
  let normal = normalize(i.normal);
  let brightness = p.color.a*mix(0.45,1.0,smoothstep(-100.0,100.0,i.point.z-coreCenter().z));
  var material = p.color.rgb*brightness*illumination(i.point,normal);
  if (p.dot.w > 0.5) {
    // Keep neutral wire neutral; reserve the glow's full color for the red accent material.
    var light = illumination(i.point,normal);
    let chroma = max(p.color.r,max(p.color.g,p.color.b))-min(p.color.r,min(p.color.g,p.color.b));
    if (chroma < 0.12) {
      let energy = dot(light,vec3f(0.2126,0.7152,0.0722));
      let warmth = smoothstep(0.6,1.25,light.r)*0.035;
      light = mix(vec3f(energy),light,warmth);
    }
    let albedo = linearColor(p.color.rgb);
    let reflectionColor = select(albedo,vec3f(0.88,0.94,1.0),chroma<0.12);
    let body = albedo*p.color.a*light*0.68;
    let sheen = reflectionColor*wireReflection(i.point,normal)*sqrt(p.color.a);
    material = displayColor(body+sheen);
  }
  if (p.dot.z > 1.5) { material = p.color.rgb*p.color.a; }
  if (p.dotGround.a > 0.5) { material = mix(p.dotGround.rgb,p.color.rgb,brightness); }
  return vec4f(material,1.0);
}
`
export const dotShader =
  solid +
  /* wgsl */ `
@vertex fn vs_main(@builtin(vertex_index) vertex: u32) -> SolidOut {
  let longitude = f32(vertex/17u)/32.0*6.2831853;
  let latitude = f32(vertex%17u)/16.0*3.14159265;
  let normal = vec3f(cos(longitude)*sin(latitude),cos(latitude),sin(longitude)*sin(latitude));
  return solidVertex(orbitPoint(p.dot.x)+normal*p.dot.y,normal);
}
@fragment fn fs_main(i: SolidOut) -> @location(0) vec4f {
  var material = p.color.rgb*illumination(i.point,normalize(i.normal));
  if (p.dot.w > 0.5) {
    material = displayColor(linearColor(p.color.rgb)*illumination(i.point,normalize(i.normal)));
  }
  if (p.dotGround.a > 0.5) { material = mix(p.dotGround.rgb,material,p.globe.w); }
  return vec4f(material,1.0);
}
`
export const heatHazeShader =
  common +
  /* wgsl */ `
@vertex fn vs_main(@builtin(vertex_index) vertex: u32) -> Out {
  let c = corner(vertex);
  let angle = (f32(vertex/6u)+(c.x+1.0)*0.5)/288.0*6.2831853;
  let local = vec2f(cos(angle),sin(angle))*(342.0+c.y*48.0);
  let pixel = p.globe.xy+glowPoint(angle,342.0+c.y*48.0).xy*p.globe.z;
  var result: Out;
  result.position = clip(pixel,0.0);
  result.uv = local;
  result.color = vec4f(glowLightColor,1.0);
  return result;
}
@fragment fn fs_main(i: Out) -> @location(0) vec4f {
  let angle = atan2(i.uv.y,i.uv.x);
  let distance = length(i.uv)-glowRadius(angle);
  let drift = vec2f(p.motion.x*0.075,-p.motion.x*0.045);
  let texture = heatNoise(i.uv*0.045+drift);
  let inwardSpread = mix(1.0,2.0,smoothstep(0.0,12.0,-distance));
  let softness = (6.8+texture*0.4)*inwardSpread*mix(1.0,0.65,smoothstep(0.0,6.0,distance));
  let haze = exp(-distance*distance/(2.0*softness*softness));
  let strength = mix(0.04,0.05,smoothstep(0.2,0.85,texture));
  let edge = 1.0-smoothstep(36.0,47.0,abs(length(i.uv)-342.0));
  return vec4f(i.color.rgb,haze*strength*edge*p.motion.w);
}
`
export const globeCompositeShader = /* wgsl */ `
@group(0) @binding(0) var scene: texture_2d<f32>;
@vertex fn vs_main(@builtin(vertex_index) vertex: u32) -> @builtin(position) vec4f {
  let points = array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
  return vec4f(points[vertex],0,1);
}
@fragment fn fs_main(@builtin(position) point: vec4f) -> @location(0) vec4f {
  return textureLoad(scene,vec2i(point.xy),0);
}
`
// Continuous spherical volume: no depth bands or screen-space particle sheets.
export const starsShader =
  camera +
  starHashWGSL +
  /* wgsl */ `
struct Params { viewport: vec4f, camera: vec4f, motion: vec4f, globe: vec4f, rotation: vec4f }
@group(0) @binding(0) var<uniform> p: Params;
struct Out {
 @builtin(position) position: vec4f,
 @location(0) uv: vec2f,
 @location(1) color: vec4f,
}
fn hash(n:f32) -> f32 {
 if (p.viewport.w > 0.5 && p.motion.w < 0.5) { return fract(sin(n*127.1+311.7)*43758.5453); }
 return stableStarHash(n);
}
@vertex fn vs_main(@builtin(vertex_index) v:u32, @builtin(instance_index) instance:u32) -> Out {
 // The footer samples the hero's entire depth range within its 1,100-star budget.
 let footer=p.motion.w>0.5;
 let distantOnly=p.viewport.w>0.5 && !footer;
 let seed=select(instance,instance*4180u/1100u,footer);
 let n=f32(seed)+1837.0+select(0.0,1900.0,distantOnly);
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 let c=corners[v];
 let azimuth=hash(n)*6.2831853;
 let latitude=hash(n+1.0)*2.0-1.0;
 let radial=sqrt(1.0-latitude*latitude);
 let nearbyDust=seed>=4000u && !distantOnly;
 let backfield=(seed>=1900u || distantOnly) && !nearbyDust;
 let radius=select(select(10000.0*pow(900.0,pow(hash(n+2.0),0.65)),5000000.0+4000000.0*hash(n+2.0),backfield),8000.0+12000.0*hash(n+2.0),nearbyDust);
 var world=vec3f(cos(azimuth)*radial,sin(azimuth)*radial,-latitude)*radius;
 let near=1.0-smoothstep(5000.0,24000.0,radius);
 let dust=select(smoothstep(0.42,0.94,hash(n+4.0)),0.7+0.3*hash(n+4.0),nearbyDust);
 let time=p.motion.x*select(1.7,0.85,footer);
 let phase=hash(n+5.0)*6.2831853;
 // Sparse nearby dust drifts independently inside the surrounding volume.
 if (near>0.0) {
   let flow=time*(0.035+0.018*hash(n+6.0))*(1.0+2.0*near*dust);
   world+=vec3f(sin(flow+phase)-sin(phase),cos(flow*0.73+phase)-cos(phase),sin(flow*0.51+phase)-sin(phase))*650.0*dust*near*near;
 }
 // Seeded local wander: smooth independent paths instead of synchronized drift.
 if (nearbyDust) {
   let phaseY=hash(n+12.0)*6.2831853;
   let phaseZ=hash(n+13.0)*6.2831853;
   let wander=time*(0.045+0.12*hash(n+14.0));
   let range=180.0+420.0*hash(n+15.0);
   world+=vec3f(
     sin(wander+phase)-sin(phase),
     sin(wander*(0.55+hash(n+16.0))+phaseY)-sin(phaseY),
     sin(wander*(0.35+hash(n+17.0)*0.7)+phaseZ)-sin(phaseZ)
   )*range;
 }
 // Accumulated orientation retains the most recent cursor-directed spin.
 world+=2.0*cross(p.rotation.xyz,cross(p.rotation.xyz,world)+p.rotation.w*world);
 world=orbitView(skyCamera(world,p.camera.xyz),p.motion.y,p.motion.z);
 let distance=1650.0-world.z;
 // All six vertices take the same branch: a clipped, degenerate triangle
 // never reaches fragment shading. Keep the existing near-plane fade.
 var o:Out;
 o.position=vec4f(2.0,2.0,0.0,1.0);
 o.uv=vec2f(0.0);
 o.color=vec4f(0.0);
 if (distance<=100.0) { return o; }
 let focal=max(p.viewport.x,p.viewport.y)*0.5;
 let radiusOnView=length(world.xy);
 let angular=atan(radiusOnView/max(100.0,distance));
 let pixel=world.xy/max(0.001,radiusOnView)*angular*focal+vec2f(p.viewport.x*0.5,p.viewport.y*0.43-p.viewport.z);
 let depth=clamp(log(radius/10000.0)/log(900.0),0.0,1.0);
 let pointRadius=clamp((0.55+pow(hash(n+7.0),2.0)*1.3)*mix(1.08,0.8,depth)*select(1.0,0.7,backfield),0.38,1.85);
 let extent=max(1.2,pointRadius*4.0);
 if (pixel.x < -extent || pixel.x > p.viewport.x+extent || pixel.y < -extent || pixel.y > p.viewport.y+extent) { return o; }
 let point=pixel+c*extent;
 o.position=vec4f(point.x/p.viewport.x*2.0-1.0,1.0-point.y/p.viewport.y*2.0,0,1);
 o.uv=c*4.0;
 let edge=1.0-smoothstep(0.92,1.0,pixel.y/p.viewport.y);
 let visibility=smoothstep(100.0,400.0,distance);
 let prominence=smoothstep(0.65,0.98,hash(n+7.0));
 let backgroundLight=(0.3+pow(hash(n+8.0),1.8)*0.7)*mix(1.0,0.8,dust)*mix(1.0,0.72,depth);
 let brightness=mix(backgroundLight,0.98,prominence)*edge*visibility*select(1.0,0.72,backfield);
 o.color=vec4f(mix(vec3f(0.88,0.92,1.0),vec3f(1.0,0.95,0.88),hash(n+9.0)),brightness);
 return o;
}
@fragment fn fs_main(i:Out)->@location(0) vec4f {
 let d=length(i.uv);
 // A solid point with a one-pixel antialiased boundary, not a Gaussian blob.
 let edge=max(fwidth(d)*0.5,0.035);
 let coverage=1.0-smoothstep(0.85-edge,0.85+edge,d);
 let core=1.0-smoothstep(0.0,0.7,d);
 return vec4f(mix(i.color.rgb,vec3f(1.0),core*0.75),i.color.a*coverage);
}
`

export const shootingStarShader =
  camera +
  /* wgsl */ `
struct Params { viewport: vec4f, camera: vec4f, motion: vec4f, globe: vec4f }
@group(0) @binding(0) var<uniform> p: Params;
struct Out {
 @builtin(position) position: vec4f,
 @location(0) uv: vec2f,
 @location(1) opacity: f32,
}
fn hash(n:f32) -> f32 { return fract(sin(n*127.1+311.7)*43758.5453); }
fn skyPoint(world:vec3f) -> vec2f {
 let view=orbitView(skyCamera(world,p.camera.xyz),p.motion.y,p.motion.z);
 let r=length(view.xy);
 let angle=atan(r/max(100.0,1650.0-view.z));
 return view.xy/max(r,0.001)*angle*max(p.viewport.x,p.viewport.y)*0.5+vec2f(p.viewport.x*0.5,p.viewport.y*0.43-p.viewport.z);
}
@vertex fn vs_main(@builtin(vertex_index) vertex:u32) -> Out {
 let cycle=select(floor(p.motion.x/32.0),0.0,p.motion.w>0.5);
 let age=select(p.motion.x-cycle*32.0-(8.0+hash(cycle+41.0)*10.0),0.14,p.motion.w>0.5);
 let streakVisible=age>=0.0 && age<0.5;
 let corners=array<vec2f,6>(vec2f(0,-1),vec2f(1,-1),vec2f(0,1),vec2f(0,1),vec2f(1,-1),vec2f(1,1));
 let c=corners[vertex];
 let focal=max(p.viewport.x,p.viewport.y)*0.5;
 let offset=vec2f((hash(cycle+3.0)-0.5)*p.viewport.x*0.7,(hash(cycle+5.0)*0.25-0.35)*p.viewport.y);
 let angle=length(offset)/focal;
 let world=vec3f(normalize(offset)*sin(angle),-cos(angle))*500000.0;
 let direction=normalize(vec3f(select(-1.0,1.0,hash(cycle+7.0)>0.5),0.3+hash(cycle+9.0)*0.35,0));
 let head=skyPoint(world+direction*clamp(age,0.0,0.5)*350000.0);
 let tail=skyPoint(world+direction*(clamp(age,0.0,0.5)*350000.0-30000.0));
 let tangent=normalize(head-tail);
 let point=mix(tail,head,c.x)+vec2f(-tangent.y,tangent.x)*c.y*0.8;
 var o:Out;
 o.position=vec4f(point.x/p.viewport.x*2.0-1.0,1.0-point.y/p.viewport.y*2.0,0,1);
 o.uv=c;
 o.opacity=select(0.0,smoothstep(0.0,0.035,age)*(1.0-smoothstep(0.28,0.5,age))*0.65,streakVisible);
 return o;
}
@fragment fn fs_main(i:Out)->@location(0) vec4f {
 let coverage=1.0-smoothstep(0.15,1.0,abs(i.uv.y));
 return vec4f(0.88,0.94,1.0,coverage*pow(i.uv.x,1.6)*i.opacity);
}
`
