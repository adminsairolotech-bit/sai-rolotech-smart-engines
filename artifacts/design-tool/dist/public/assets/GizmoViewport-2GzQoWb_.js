import{u as _,_ as L,a as Q,c as Ee}from"./OrbitControls-DyyFkwV7.js";import{r}from"./index-DyjskZgT.js";import{Z as _e,I as Le,F as K,a6 as k,a7 as T,a8 as Ae,B as X,f as pe,V as E,K as Ce,U as ee,a9 as te,e as me,b as Me,i as R,aa as Ue,d as he,Y as ze,C as Be,ab as Oe,ac as Pe,L as ne,ad as De,ae as Te,m as Re,a5 as Ie,Q as ie,af as He}from"./three.module-DiWkihna.js";const ve=parseInt(_e.replace(/\D+/g,"")),ge=ve>=125?"uv1":"uv2",oe=new X,I=new E;class Y extends Le{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],t=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],i=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(i),this.setAttribute("position",new K(e,3)),this.setAttribute("uv",new K(t,2))}applyMatrix4(e){const t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));const i=new k(t,6,1);return this.setAttribute("instanceStart",new T(i,3,0)),this.setAttribute("instanceEnd",new T(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));const n=new k(i,t*2,1);return this.setAttribute("instanceColorStart",new T(n,t,0)),this.setAttribute("instanceColorEnd",new T(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new Ae(e.geometry)),this}fromLineSegments(e){const t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new X);const e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),oe.setFromBufferAttribute(t),this.boundingBox.union(oe))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new pe),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){const i=this.boundingSphere.center;this.boundingBox.getCenter(i);let n=0;for(let o=0,c=e.count;o<c;o++)I.fromBufferAttribute(e,o),n=Math.max(n,i.distanceToSquared(I)),I.fromBufferAttribute(t,o),n=Math.max(n,i.distanceToSquared(I));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}class ye extends Y{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){const t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e,t=3){const i=e.length-t,n=new Float32Array(2*i);if(t===3)for(let o=0;o<i;o+=t)n[2*o]=e[o],n[2*o+1]=e[o+1],n[2*o+2]=e[o+2],n[2*o+3]=e[o+3],n[2*o+4]=e[o+4],n[2*o+5]=e[o+5];else for(let o=0;o<i;o+=t)n[2*o]=e[o],n[2*o+1]=e[o+1],n[2*o+2]=e[o+2],n[2*o+3]=e[o+3],n[2*o+4]=e[o+4],n[2*o+5]=e[o+5],n[2*o+6]=e[o+6],n[2*o+7]=e[o+7];return super.setColors(n,t),this}fromLine(e){const t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class Z extends Ce{constructor(e){super({type:"LineMaterial",uniforms:ee.clone(ee.merge([te.common,te.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new me(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${ve>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(t){this.uniforms.diffuse.value=t}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(t){t===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(t){this.uniforms.linewidth.value=t}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(t){!!t!="USE_DASH"in this.defines&&(this.needsUpdate=!0),t===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(t){this.uniforms.dashScale.value=t}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(t){this.uniforms.dashSize.value=t}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(t){this.uniforms.dashOffset.value=t}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(t){this.uniforms.gapSize.value=t}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(t){this.uniforms.opacity.value=t}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(t){this.uniforms.resolution.value.copy(t)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(t){!!t!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),t===!0?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}const j=new R,re=new E,se=new E,S=new R,w=new R,C=new R,F=new E,G=new he,x=new Ue,ae=new E,H=new X,W=new pe,M=new R;let U,B;function ce(a,e,t){return M.set(0,0,-e,1).applyMatrix4(a.projectionMatrix),M.multiplyScalar(1/M.w),M.x=B/t.width,M.y=B/t.height,M.applyMatrix4(a.projectionMatrixInverse),M.multiplyScalar(1/M.w),Math.abs(Math.max(M.x,M.y))}function We(a,e){const t=a.matrixWorld,i=a.geometry,n=i.attributes.instanceStart,o=i.attributes.instanceEnd,c=Math.min(i.instanceCount,n.count);for(let s=0,u=c;s<u;s++){x.start.fromBufferAttribute(n,s),x.end.fromBufferAttribute(o,s),x.applyMatrix4(t);const m=new E,f=new E;U.distanceSqToSegment(x.start,x.end,f,m),f.distanceTo(m)<B*.5&&e.push({point:f,pointOnLine:m,distance:U.origin.distanceTo(f),object:a,face:null,faceIndex:s,uv:null,[ge]:null})}}function je(a,e,t){const i=e.projectionMatrix,o=a.material.resolution,c=a.matrixWorld,s=a.geometry,u=s.attributes.instanceStart,m=s.attributes.instanceEnd,f=Math.min(s.instanceCount,u.count),d=-e.near;U.at(1,C),C.w=1,C.applyMatrix4(e.matrixWorldInverse),C.applyMatrix4(i),C.multiplyScalar(1/C.w),C.x*=o.x/2,C.y*=o.y/2,C.z=0,F.copy(C),G.multiplyMatrices(e.matrixWorldInverse,c);for(let h=0,g=f;h<g;h++){if(S.fromBufferAttribute(u,h),w.fromBufferAttribute(m,h),S.w=1,w.w=1,S.applyMatrix4(G),w.applyMatrix4(G),S.z>d&&w.z>d)continue;if(S.z>d){const v=S.z-w.z,b=(S.z-d)/v;S.lerp(w,b)}else if(w.z>d){const v=w.z-S.z,b=(w.z-d)/v;w.lerp(S,b)}S.applyMatrix4(i),w.applyMatrix4(i),S.multiplyScalar(1/S.w),w.multiplyScalar(1/w.w),S.x*=o.x/2,S.y*=o.y/2,w.x*=o.x/2,w.y*=o.y/2,x.start.copy(S),x.start.z=0,x.end.copy(w),x.end.z=0;const p=x.closestPointToPointParameter(F,!0);x.at(p,ae);const l=ze.lerp(S.z,w.z,p),z=l>=-1&&l<=1,O=F.distanceTo(ae)<B*.5;if(z&&O){x.start.fromBufferAttribute(u,h),x.end.fromBufferAttribute(m,h),x.start.applyMatrix4(c),x.end.applyMatrix4(c);const v=new E,b=new E;U.distanceSqToSegment(x.start,x.end,b,v),t.push({point:b,pointOnLine:v,distance:U.origin.distanceTo(b),object:a,face:null,faceIndex:h,uv:null,[ge]:null})}}}class Se extends Me{constructor(e=new Y,t=new Z({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let c=0,s=0,u=t.count;c<u;c++,s+=2)re.fromBufferAttribute(t,c),se.fromBufferAttribute(i,c),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+re.distanceTo(se);const o=new k(n,2,1);return e.setAttribute("instanceDistanceStart",new T(o,1,0)),e.setAttribute("instanceDistanceEnd",new T(o,1,1)),this}raycast(e,t){const i=this.material.worldUnits,n=e.camera;n===null&&!i&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const o=e.params.Line2!==void 0&&e.params.Line2.threshold||0;U=e.ray;const c=this.matrixWorld,s=this.geometry,u=this.material;B=u.linewidth+o,s.boundingSphere===null&&s.computeBoundingSphere(),W.copy(s.boundingSphere).applyMatrix4(c);let m;if(i)m=B*.5;else{const d=Math.max(n.near,W.distanceToPoint(U.origin));m=ce(n,d,u.resolution)}if(W.radius+=m,U.intersectsSphere(W)===!1)return;s.boundingBox===null&&s.computeBoundingBox(),H.copy(s.boundingBox).applyMatrix4(c);let f;if(i)f=B*.5;else{const d=Math.max(n.near,H.distanceToPoint(U.origin));f=ce(n,d,u.resolution)}H.expandByScalar(f),U.intersectsBox(H)!==!1&&(i?We(this,t):je(this,n,t))}onBeforeRender(e){const t=this.material.uniforms;t&&t.resolution&&(e.getViewport(j),this.material.uniforms.resolution.value.set(j.z,j.w))}}class Fe extends Se{constructor(e=new ye,t=new Z({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type="Line2"}}const Ke=r.forwardRef(function({points:e,color:t=16777215,vertexColors:i,linewidth:n,lineWidth:o,segments:c,dashed:s,...u},m){var f,d;const h=_(z=>z.size),g=r.useMemo(()=>c?new Se:new Fe,[c]),[y]=r.useState(()=>new Z),p=(i==null||(f=i[0])==null?void 0:f.length)===4?4:3,l=r.useMemo(()=>{const z=c?new Y:new ye,O=e.map(v=>{const b=Array.isArray(v);return v instanceof E||v instanceof R?[v.x,v.y,v.z]:v instanceof me?[v.x,v.y,0]:b&&v.length===3?[v[0],v[1],v[2]]:b&&v.length===2?[v[0],v[1],0]:v});if(z.setPositions(O.flat()),i){t=16777215;const v=i.map(b=>b instanceof Be?b.toArray():b);z.setColors(v.flat(),p)}return z},[e,c,i,p]);return r.useLayoutEffect(()=>{g.computeLineDistances()},[e,g]),r.useLayoutEffect(()=>{s?y.defines.USE_DASH="":delete y.defines.USE_DASH,y.needsUpdate=!0},[s,y]),r.useEffect(()=>()=>{l.dispose(),y.dispose()},[l]),r.createElement("primitive",L({object:g,ref:m},u),r.createElement("primitive",{object:l,attach:"geometry"}),r.createElement("primitive",L({object:y,attach:"material",color:t,vertexColors:!!i,resolution:[h.width,h.height],linewidth:(d=n??o)!==null&&d!==void 0?d:1,dashed:s,transparent:p===4},u)))});function Ge(a,e,t){const i=_(g=>g.size),n=_(g=>g.viewport),o=typeof a=="number"?a:i.width*n.dpr,c=i.height*n.dpr,s=(typeof a=="number"?t:a)||{},{samples:u=0,depth:m,...f}=s,d=m??s.depthBuffer,h=r.useMemo(()=>{const g=new Oe(o,c,{minFilter:ne,magFilter:ne,type:Pe,...f});return d&&(g.depthTexture=new De(o,c,Te)),g.samples=u,g},[]);return r.useLayoutEffect(()=>{h.setSize(o,c),u&&(h.samples=u)},[u,h,o,c]),r.useEffect(()=>()=>h.dispose(),[]),h}const Ne=a=>typeof a=="function",Ve=r.forwardRef(({envMap:a,resolution:e=256,frames:t=1/0,children:i,makeDefault:n,...o},c)=>{const s=_(({set:l})=>l),u=_(({camera:l})=>l),m=_(({size:l})=>l),f=r.useRef(null);r.useImperativeHandle(c,()=>f.current,[]);const d=r.useRef(null),h=Ge(e);r.useLayoutEffect(()=>{o.manual||f.current.updateProjectionMatrix()},[m,o]),r.useLayoutEffect(()=>{f.current.updateProjectionMatrix()}),r.useLayoutEffect(()=>{if(n){const l=u;return s(()=>({camera:f.current})),()=>s(()=>({camera:l}))}},[f,n,s]);let g=0,y=null;const p=Ne(i);return Q(l=>{p&&(t===1/0||g<t)&&(d.current.visible=!1,l.gl.setRenderTarget(h),y=l.scene.background,a&&(l.scene.background=a),l.gl.render(l.scene,f.current),l.scene.background=y,l.gl.setRenderTarget(null),d.current.visible=!0,g++)}),r.createElement(r.Fragment,null,r.createElement("orthographicCamera",L({left:m.width/-2,right:m.width/2,top:m.height/2,bottom:m.height/-2,ref:f},o),!p&&i),r.createElement("group",{ref:d},p&&i(h.texture)))});function qe({defaultScene:a,defaultCamera:e,renderPriority:t=1}){const{gl:i,scene:n,camera:o}=_();let c;return Q(()=>{c=i.autoClear,t===1&&(i.autoClear=!0,i.render(a,e)),i.autoClear=!1,i.clearDepth(),i.render(n,o),i.autoClear=c},t),r.createElement("group",{onPointerOver:()=>null})}function ke({children:a,renderPriority:e=1}){const{scene:t,camera:i}=_(),[n]=r.useState(()=>new Re);return r.createElement(r.Fragment,null,Ee(r.createElement(r.Fragment,null,a,r.createElement(qe,{defaultScene:t,defaultCamera:i,renderPriority:e})),n,{events:{priority:e+1}}))}const we=r.createContext({}),Qe=()=>r.useContext(we),Xe=2*Math.PI,N=new Ie,le=new he,[P,V]=[new ie,new ie],ue=new E,fe=new E,Ye=a=>"minPolarAngle"in a,de=a=>"getTarget"in a,et=({alignment:a="bottom-right",margin:e=[80,80],renderPriority:t=1,onUpdate:i,onTarget:n,children:o})=>{const c=_(A=>A.size),s=_(A=>A.camera),u=_(A=>A.controls),m=_(A=>A.invalidate),f=r.useRef(null),d=r.useRef(null),h=r.useRef(!1),g=r.useRef(0),y=r.useRef(new E(0,0,0)),p=r.useRef(new E(0,0,0));r.useEffect(()=>{p.current.copy(s.up),N.up.copy(s.up)},[s]);const l=r.useCallback(A=>{h.current=!0,(u||n)&&(y.current=n?.()||(de(u)?u.getTarget(y.current):u?.target)),g.current=s.position.distanceTo(ue),P.copy(s.quaternion),fe.copy(A).multiplyScalar(g.current).add(ue),N.lookAt(fe),V.copy(N.quaternion),m()},[u,s,n,m]);Q((A,$)=>{if(d.current&&f.current){var J;if(h.current)if(P.angleTo(V)<.01)h.current=!1,Ye(u)&&s.up.copy(p.current);else{const be=$*Xe;P.rotateTowards(V,be),s.position.set(0,0,1).applyQuaternion(P).multiplyScalar(g.current).add(y.current),s.up.set(0,1,0).applyQuaternion(P).normalize(),s.quaternion.copy(P),de(u)&&u.setPosition(s.position.x,s.position.y,s.position.z),i?i():u&&u.update($),m()}le.copy(s.matrix).invert(),(J=f.current)==null||J.quaternion.setFromRotationMatrix(le)}});const z=r.useMemo(()=>({tweenCamera:l}),[l]),[O,v]=e,b=a.endsWith("-center")?0:a.endsWith("-left")?-c.width/2+O:c.width/2-O,xe=a.startsWith("center-")?0:a.startsWith("top-")?c.height/2-v:-c.height/2+v;return r.createElement(ke,{renderPriority:t},r.createElement(we.Provider,{value:z},r.createElement(Ve,{makeDefault:!0,ref:d,position:[0,0,200]}),r.createElement("group",{ref:f,position:[b,xe,0]},o)))};function q({scale:a=[.8,.05,.05],color:e,rotation:t}){return r.createElement("group",{rotation:t},r.createElement("mesh",{position:[.4,0,0]},r.createElement("boxGeometry",{args:a}),r.createElement("meshBasicMaterial",{color:e,toneMapped:!1})))}function D({onClick:a,font:e,disabled:t,arcStyle:i,label:n,labelColor:o,axisHeadScale:c=1,...s}){const u=_(p=>p.gl),m=r.useMemo(()=>{const p=document.createElement("canvas");p.width=64,p.height=64;const l=p.getContext("2d");return l.beginPath(),l.arc(32,32,16,0,2*Math.PI),l.closePath(),l.fillStyle=i,l.fill(),n&&(l.font=e,l.textAlign="center",l.fillStyle=o,l.fillText(n,32,41)),new He(p)},[i,n,o,e]),[f,d]=r.useState(!1),h=(n?1:.75)*(f?1.2:1)*c,g=p=>{p.stopPropagation(),d(!0)},y=p=>{p.stopPropagation(),d(!1)};return r.createElement("sprite",L({scale:h,onPointerOver:t?void 0:g,onPointerOut:t?void 0:a||y},s),r.createElement("spriteMaterial",{map:m,"map-anisotropy":u.capabilities.getMaxAnisotropy()||1,alphaTest:.3,opacity:n?1:.75,toneMapped:!1}))}const tt=({hideNegativeAxes:a,hideAxisHeads:e,disabled:t,font:i="18px Inter var, Arial, sans-serif",axisColors:n=["#ff2060","#20df80","#2080ff"],axisHeadScale:o=1,axisScale:c,labels:s=["X","Y","Z"],labelColor:u="#000",onClick:m,...f})=>{const[d,h,g]=n,{tweenCamera:y}=Qe(),p={font:i,disabled:t,labelColor:u,onClick:m,axisHeadScale:o,onPointerDown:t?void 0:l=>{y(l.object.position),l.stopPropagation()}};return r.createElement("group",L({scale:40},f),r.createElement(q,{color:d,rotation:[0,0,0],scale:c}),r.createElement(q,{color:h,rotation:[0,0,Math.PI/2],scale:c}),r.createElement(q,{color:g,rotation:[0,-Math.PI/2,0],scale:c}),!e&&r.createElement(r.Fragment,null,r.createElement(D,L({arcStyle:d,position:[1,0,0],label:s[0]},p)),r.createElement(D,L({arcStyle:h,position:[0,1,0],label:s[1]},p)),r.createElement(D,L({arcStyle:g,position:[0,0,1],label:s[2]},p)),!a&&r.createElement(r.Fragment,null,r.createElement(D,L({arcStyle:d,position:[-1,0,0]},p)),r.createElement(D,L({arcStyle:h,position:[0,-1,0]},p)),r.createElement(D,L({arcStyle:g,position:[0,0,-1]},p)))))};export{et as G,Ke as L,tt as a,ve as v};
