// Prototype shaders: project the original 3D orbit coordinates, then draw
// anti-aliased screen-space ribbons and electron billboards.
const common = /* wgsl */ `
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
  let a = p.motion.y*0.44;
  let b = p.motion.z*0.32;
  let x = q.x*cos(a)+q.z*sin(a);
  let z0 = -q.x*sin(a)+q.z*cos(a);
  let y = q.y*cos(b)-z0*sin(b);
  let z = q.y*sin(b)+z0*cos(b);
  let perspective = 1650.0/(1650.0-z);
  let xy = vec2f(x,y)*perspective;
  let tilt = -17.0*3.14159265/180.0;
  let rotated = vec2f(xy.x*cos(tilt)-xy.y*sin(tilt), (xy.x*sin(tilt)+xy.y*cos(tilt))*cos(11.0*3.14159265/180.0));
  return vec4f(p.globe.xy + rotated*p.globe.z, z, perspective);
}
fn clip(pixel: vec2f) -> vec4f {
  return vec4f(pixel.x/p.viewport.x*2.0-1.0, 1.0-pixel.y/p.viewport.y*2.0, 0.0, 1.0);
}
fn corner(index: u32) -> vec2f {
  let corners = array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
  return corners[index%6u];
}
`
export const orbitShader =
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
  result.color = vec4f(p.color.rgb,p.color.a*select(0.28,1.0,point.z>=0.0));
  return result;
}
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
  let extent = radius + select(1.0,3.0*p.globe.z*3.0,p.dot.z>0.5);
  var result: Out;
  result.position = clip(q.xy+c*extent);
  result.uv = c*extent;
  let opacity = select(0.22,select(min(1.0,p.v.w+0.35),1.0,p.dot.z>0.5),q.z>=0.0);
  result.color = vec4f(p.color.rgb*(0.5+0.5*opacity)*p.color.a,1.0);
  return result;
}
@fragment fn fs_main(i: Out) -> @location(0) vec4f {
  let q = project(p.dot.x);
  let radius = max(0.4,p.dot.y*q.w)*p.globe.z;
  let d = length(i.uv);
  let solid = 1.0-smoothstep(radius-0.6,radius+0.6,d);
  let sigma = max(1.0,3.0*p.globe.z);
  let glow = exp(-max(0.0,d-radius)*max(0.0,d-radius)/(2.0*sigma*sigma))*0.34*p.dot.z;
  // Analytic sphere normal gives a rounded surface without changing the
  // orbit center. Opaque cores occlude the rail; only the halo is translucent.
  let xy=i.uv/max(radius,0.4);
  let normal=normalize(vec3f(xy.x,-xy.y,sqrt(max(0.0,1.0-dot(xy,xy)))));
  let light=normalize(vec3f(-0.45,0.6,0.8));
  let diffuse=max(0.0,dot(normal,light));
  let halfVector=normalize(light+vec3f(0,0,1));
  let specular=pow(max(0.0,dot(normal,halfVector)),28.0)*0.4;
  let material=i.color.rgb*(0.35+0.65*diffuse)+vec3f(specular);
  let alpha=max(solid,glow);
  let color=mix(i.color.rgb,material,solid);
  return vec4f(color,alpha);
}
`
export const distantStarsShader = /* wgsl */ `
struct Params { viewport: vec4f, motion: vec4f }
@group(0) @binding(0) var<uniform> p: Params;
struct Out {
 @builtin(position) position: vec4f,
 @location(0) uv: vec2f,
 @location(1) color: vec4f,
}
fn hash(n:f32) -> f32 { return fract(sin(n*127.1+311.7)*43758.5453); }
@vertex fn vs_main(@builtin(vertex_index) v:u32, @builtin(instance_index) instance:u32) -> Out {
 let n = f32(instance)+1837.0;
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 let c=corners[v];
 let depth=0.15+hash(n+3.0)*0.85;
 // World positions span a deep volume; perspective and camera displacement
 // make near stars travel farther than the distant field.
 let z=-300.0-depth*2200.0;
 let perspective=1650.0/(1650.0-z);
 let world=vec2f((hash(n)-0.5)*p.viewport.x/perspective*1.15,hash(n+1.0)*p.viewport.y/perspective);
 let camera=vec2f(p.motion.y,p.motion.z)*90.0*p.motion.w;
 let pixel=world*perspective-camera*perspective+vec2f(p.viewport.x*0.5,0);
 let radius=(0.45+hash(n+4.0)*0.85)*mix(1.25,0.6,depth);
 let extent=radius*4.0;
 var o: Out;
 let point=pixel+c*extent;
 o.position=vec4f(point.x/p.viewport.x*2.0-1.0,1.0-point.y/p.viewport.y*2.0,0,1);
 o.uv=c*4.0;
 let edge=1.0-smoothstep(0.76,1.0,pixel.y/p.viewport.y);
 let quiet=1.0-0.65*exp(-pow((pixel.x/p.viewport.x-0.5)*3.0,2.0))*smoothstep(0.08,0.22,pixel.y/p.viewport.y)*(1.0-smoothstep(0.5,0.72,pixel.y/p.viewport.y));
 let brightness=(0.25+hash(n+7.0)*0.6)*edge*quiet;
 o.color=vec4f(mix(vec3f(0.67,0.74,0.9),vec3f(1.0,0.91,0.84),hash(n+9.0)),brightness);
 return o;
}
@fragment fn fs_main(i:Out)->@location(0) vec4f {
 let d=length(i.uv);
 let alpha=exp(-d*d*2.4)+exp(-d*d*0.5)*0.13;
 return vec4f(i.color.rgb,i.color.a*alpha);
}
`

// Continuous spherical volume: no depth bands or screen-space particle sheets.
export const starsShader = /* wgsl */ `
struct Params { viewport: vec4f, motion: vec4f }
@group(0) @binding(0) var<uniform> p: Params;
struct Out {
 @builtin(position) position: vec4f,
 @location(0) uv: vec2f,
 @location(1) color: vec4f,
 @location(2) softness: f32,
}
fn hash(n:f32) -> f32 { return fract(sin(n*127.1+311.7)*43758.5453); }
fn turn(q:vec3f, yaw:f32, pitch:f32) -> vec3f {
 let x=q.x*cos(yaw)+q.z*sin(yaw);
 let z=-q.x*sin(yaw)+q.z*cos(yaw);
 return vec3f(x,q.y*cos(pitch)-z*sin(pitch),q.y*sin(pitch)+z*cos(pitch));
}
@vertex fn vs_main(@builtin(vertex_index) v:u32, @builtin(instance_index) instance:u32) -> Out {
 let n=f32(instance)+1837.0;
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 let c=corners[v];
 let azimuth=hash(n)*6.2831853;
 let latitude=hash(n+1.0);
 let radial=sqrt(1.0-latitude*latitude);
 let radius=500.0+2600.0*pow(hash(n+2.0),0.3333333);
 var world=vec3f(cos(azimuth)*radial,sin(azimuth)*radial,-latitude)*radius;
 let near=1.0-smoothstep(500.0,3100.0,radius);
 let dust=smoothstep(0.42,0.94,hash(n+4.0));
 let time=p.motion.x*1.7;
 let phase=hash(n+5.0)*6.2831853;
 // A slow common circulation with local, asynchronous eddies. Drift grows
 // continuously toward nearby dust; distant lights stay almost anchored.
 world=turn(world,time*0.0018,time*0.00065);
 let flow=time*(0.035+0.018*hash(n+6.0));
 world+=vec3f(sin(flow+phase)-sin(phase),cos(flow*0.73+phase)-cos(phase),sin(flow*0.51+phase)-sin(phase))*(12.0+65.0*dust)*(0.3+near);
 // Turning the view produces curved travel across the dome. A small camera
 // translation adds perspective separation without sliding whole layers.
 world-=vec3f(p.motion.y*45.0,p.motion.z*35.0,0);
 world=turn(world,-p.motion.y*0.045,-p.motion.z*0.032);
 let distance=1450.0-world.z;
 let focal=max(p.viewport.x,p.viewport.y)*0.95;
 let perspective=focal/max(400.0,distance);
 let pixel=world.xy*perspective+vec2f(p.viewport.x*0.5,p.viewport.y*0.43);
 let proximity=clamp(1450.0/max(400.0,distance),0.2,1.3);
 let pointRadius=(0.45+hash(n+7.0)*0.85+dust*near*3.2)*proximity;
 let extent=max(1.2,pointRadius*4.0);
 var o:Out;
 let point=pixel+c*extent;
 o.position=vec4f(point.x/p.viewport.x*2.0-1.0,1.0-point.y/p.viewport.y*2.0,0,1);
 o.uv=c*4.0;
 o.softness=dust;
 let edge=1.0-smoothstep(0.74,1.0,pixel.y/p.viewport.y);
 let quiet=1.0-0.68*exp(-pow((pixel.x/p.viewport.x-0.5)*3.0,2.0))*smoothstep(0.08,0.22,pixel.y/p.viewport.y)*(1.0-smoothstep(0.5,0.72,pixel.y/p.viewport.y));
 let visibility=smoothstep(450.0,900.0,distance);
 let brightness=(0.3+hash(n+8.0)*0.65)*mix(1.0,0.36,dust)*edge*quiet*visibility;
 o.color=vec4f(mix(vec3f(0.68,0.75,0.9),vec3f(1.0,0.88,0.77),hash(n+9.0)),brightness);
 return o;
}
@fragment fn fs_main(i:Out)->@location(0) vec4f {
 let d=length(i.uv);
 let light=exp(-d*d*2.4)+exp(-d*d*0.5)*0.13;
 let dust=exp(-d*d*0.65)*0.64;
 return vec4f(i.color.rgb,i.color.a*mix(light,dust,i.softness));
}
`
