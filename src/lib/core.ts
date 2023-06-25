
//
// Vader Core Functions
//

import type { Uniforms } from './uniforms.ts';

import { commitUniforms } from './uniforms.js';
import { compile }        from './shaders.js';
import { warn, error }    from './misc.js';


// Types

export type VaderState = {
  mode: VaderSupportMode,
  label: string;

  gl: WebGLRenderingContext,
  program: WebGLProgram,
  positionAttributeLocation: number,
  vertexBuffer: WebGLBuffer | null,

  frame: number,
  fragSrc: string,
  timeAtLastFrame?: number,
  needsRecompile: boolean,
}

export type VaderMouseState = { x: number, y: number, down: boolean };

export type VaderSupportMode = 'default' | 'shadertoy';


//
// Reference Constants
//

const SCREEN_QUAD = [-1,-1, 1, -1,-1, 1, -1, 1, 1, -1, 1, 1 ];


//
// Main Initialization Function
//
// TODO: Detect and destroy unusable contexts
//

export const init = (label:string, canvas:HTMLCanvasElement, fragSrc:string, uniforms:Uniforms, mode = 'default') => {


  // console.log(`Vader::init[${label}]`, canvas, Object.keys(uniforms));

  const state = {
    label,
    mode,
    frame: 0,
    timeAtLastFrame: performance.now() / 1000,
    needsRecompile: false,
  } as VaderState;

  // WebGL Init
  const gl = canvas.getContext("webgl");
  if (!gl) throw new Error("WebGL not supported");
  state.gl = gl as WebGLRenderingContext;

  // Compile shaders
  compile(state, fragSrc, uniforms);

  // Create vertex buffer and put a fullscreen quad in it
  state.positionAttributeLocation = state.gl.getAttribLocation(state.program, "a_position");
  state.vertexBuffer = state.gl.createBuffer();

  // Bind vertex buffer
  state.gl.bindBuffer(state.gl.ARRAY_BUFFER, state.vertexBuffer);
  state.gl.bufferData(state.gl.ARRAY_BUFFER, new Float32Array(SCREEN_QUAD), state.gl.STATIC_DRAW);

  return state;
}


//
// Main Render Function
//

export const render = (state:VaderState, uniforms:Uniforms) => {

  const { gl } = state;

  if (state.needsRecompile) {
    compile(state, state.fragSrc, uniforms);
  }

  // Setup
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.useProgram(state.program);
  gl.enableVertexAttribArray(state.positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, state.vertexBuffer);
  gl.vertexAttribPointer(state.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // Update uniform values
  commitUniforms(state, uniforms);

  // Draw call
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  state.frame += 1;
  state.timeAtLastFrame = performance.now() / 1000;
}


// Proxy other modules

export * from './shaders';
export * from './uniforms';
export * from './textures';

