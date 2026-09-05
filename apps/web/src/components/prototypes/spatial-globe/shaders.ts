// Prototype shaders: project the original 3D orbit coordinates, then draw
// anti-aliased screen-space ribbons and electron billboards.
const camera = /* wgsl */ `
// World-to-view rotation for a camera orbiting the globe at distance 1650.
fn orbitView(q: vec3f, yaw: f32, pitch: f32) -> vec3f {
  let x = q.x*cos(yaw)+q.z*sin(yaw);
  let z = -q.x*sin(yaw)+q.z*cos(yaw);
  return vec3f(x,q.y*cos(pitch)-z*sin(pitch),q.y*sin(pitch)+z*cos(pitch));
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
  /* wgsl */ `
struct Params {
  viewport: vec4f,
  globe: vec4f,
  motion: vec4f,
  u: vec4f,
  v: vec4f,
  color: vec4f,
  dot: vec4f,
}
@group(0) @binding(0) var<uniform> p: Params;
struct Out {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) color: vec4f,
}
fn project(theta: f32) -> vec4f {
  let original = (p.u.xyz*cos(theta) + p.v.xyz*sin(theta))*340.0;
  let axis = normalize(vec3f(0.32,1.0,0.18));
  let angle = p.motion.x * 6.2831853 / (70.0/0.3);
  let q = original*cos(angle) + cross(axis,original)*sin(angle) + axis*dot(axis,original)*(1.0-cos(angle));
  let tilt = -17.0*3.14159265/180.0;
  let posed = vec3f(q.x*cos(tilt)-q.y*sin(tilt), (q.x*sin(tilt)+q.y*cos(tilt))*cos(11.0*3.14159265/180.0), q.z);
  let view = orbitView(posed,p.motion.y,p.motion.z);
  let perspective = 1650.0/(1650.0-view.z);
  return vec4f(p.globe.xy + domeProject(view.xy,1650.0-view.z,1650.0*p.globe.z), view.z, perspective);
}
fn clip(pixel: vec2f) -> vec4f {
  return vec4f(pixel.x/p.viewport.x*2.0-1.0, 1.0-pixel.y/p.viewport.y*2.0, 0.0, 1.0);
}
fn corner(index: u32) -> vec2f {
  let corners = array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
  return corners[index%6u];
}
`
const orbitVertex =
  common +
  /* wgsl */ `
@vertex fn vs_main(@builtin(vertex_index) vertex: u32) -> Out {
  let segment = vertex/6u;
  let c = corner(vertex);
  let a = project(f32(segment)/288.0*6.2831853);
  let b = project(f32(segment+1u)/288.0*6.2831853);
  let tangent = normalize(b.xy-a.xy);
  let normal = vec2f(-tangent.y,tangent.x);
  let point = mix(a,b,(c.x+1.0)*0.5);
  let width = p.u.w*p.globe.z*0.5;
  let offset = normal*c.y*(width+1.0);
  var result: Out;
  result.position = clip(point.xy+offset);
  result.uv = vec2f(c.y*(width+1.0),width);
  result.color = vec4f(p.color.rgb,p.color.a*mix(0.28,1.0,smoothstep(-55.0,55.0,point.z)));
  return result;
}
`
export const orbitMaskShader =
  orbitVertex +
  /* wgsl */ `
@fragment fn fs_main(i: Out) -> @location(0) vec4f {
  let coverage = 1.0-smoothstep(max(0.0,i.uv.y-0.7),i.uv.y+0.7,abs(i.uv.x));
  return vec4f(0.0,0.0,0.0,coverage);
}
`
export const orbitShader =
  orbitVertex +
  /* wgsl */ `
@fragment fn fs_main(i: Out) -> @location(0) vec4f {
  let coverage = 1.0-smoothstep(max(0.0,i.uv.y-0.7),i.uv.y+0.7,abs(i.uv.x));
  return vec4f(i.color.rgb,i.color.a*coverage);
}
`
export const dotShader =
  common +
  /* wgsl */ `
@vertex fn vs_main(@builtin(vertex_index) vertex: u32) -> Out {
  let q = project(p.dot.x);
  let c = corner(vertex);
  let radius = max(0.4,p.dot.y*q.w)*p.globe.z;
  let extent = radius + 1.0;
  var result: Out;
  result.position = clip(q.xy+c*extent);
  result.uv = c*extent;
  let opacity = mix(0.22,select(min(1.0,p.v.w+0.35),1.0,p.dot.z>0.5),smoothstep(-55.0,55.0,q.z));
  result.color = vec4f(p.color.rgb*(0.5+0.5*opacity)*p.color.a,1.0);
  return result;
}
@fragment fn fs_main(i: Out) -> @location(0) vec4f {
  let q = project(p.dot.x);
  let radius = max(0.4,p.dot.y*q.w)*p.globe.z;
  let d = length(i.uv);
  let solid = 1.0-smoothstep(radius-0.6,radius+0.6,d);
  // Analytic sphere normal gives a rounded surface without changing the
  // orbit center. Opaque cores occlude the rail.
  let xy=i.uv/max(radius,0.4);
  let normal=normalize(vec3f(xy.x,-xy.y,sqrt(max(0.0,1.0-dot(xy,xy)))));
  // The surrounding globe supplies broad red light from its center, rather
  // than a separate white key light in the upper corner of every bead.
  let inward=p.globe.xy-q.xy;
  let light=normalize(vec3f(inward.x,-inward.y,max(1.0,length(inward)*0.25)));
  let diffuse=max(0.0,dot(normal,light));
  let warmth=vec3f(1.0,0.063,0.0);
  let softRim=pow(1.0-normal.z,2.0)*diffuse;
  let material=i.color.rgb*(0.62+0.22*normal.z)+warmth*(0.09*diffuse+0.07*softRim);
  let alpha=solid;
  let color=mix(i.color.rgb,material,solid);
  return vec4f(color,alpha);
}
`
// Continuous spherical volume: no depth bands or screen-space particle sheets.
export const starsShader =
  camera +
  /* wgsl */ `
struct Params { viewport: vec4f, motion: vec4f, globe: vec4f, rotation: vec4f }
@group(0) @binding(0) var<uniform> p: Params;
struct Out {
 @builtin(position) position: vec4f,
 @location(0) uv: vec2f,
 @location(1) color: vec4f,
}
fn hash(n:f32) -> f32 { return fract(sin(n*127.1+311.7)*43758.5453); }
@vertex fn vs_main(@builtin(vertex_index) v:u32, @builtin(instance_index) instance:u32) -> Out {
 let n=f32(instance)+1837.0;
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 let c=corners[v];
 let azimuth=hash(n)*6.2831853;
 let latitude=hash(n+1.0)*2.0-1.0;
 let radial=sqrt(1.0-latitude*latitude);
 let nearbyDust=instance>=4000u;
 let backfield=instance>=1900u && !nearbyDust;
 let radius=select(select(10000.0*pow(900.0,pow(hash(n+2.0),0.65)),5000000.0+4000000.0*hash(n+2.0),backfield),8000.0+12000.0*hash(n+2.0),nearbyDust);
 var world=vec3f(cos(azimuth)*radial,sin(azimuth)*radial,-latitude)*radius;
 let near=1.0-smoothstep(5000.0,24000.0,radius);
 let dust=select(smoothstep(0.42,0.94,hash(n+4.0)),0.7+0.3*hash(n+4.0),nearbyDust);
 let time=p.motion.x*1.7;
 let phase=hash(n+5.0)*6.2831853;
 // Sparse nearby dust drifts independently inside the surrounding volume.
 let flow=time*(0.035+0.018*hash(n+6.0))*(1.0+2.0*near*dust);
 world+=vec3f(sin(flow+phase)-sin(phase),cos(flow*0.73+phase)-cos(phase),sin(flow*0.51+phase)-sin(phase))*650.0*dust*near*near;
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
 world=orbitView(world,p.motion.y,p.motion.z);
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
struct Params { viewport: vec4f, motion: vec4f, globe: vec4f }
@group(0) @binding(0) var<uniform> p: Params;
struct Out {
 @builtin(position) position: vec4f,
 @location(0) uv: vec2f,
 @location(1) opacity: f32,
}
fn hash(n:f32) -> f32 { return fract(sin(n*127.1+311.7)*43758.5453); }
fn skyPoint(world:vec3f) -> vec2f {
 let view=orbitView(world,p.motion.y,p.motion.z);
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
