
//
// UNIFORMS
//

import type { VaderState, VaderMouseState, VaderSupportMode } from './core.ts';
import type { Drawable } from './textures.ts';

import { inferUniformTypeFromSource } from './shaders.js';
import { error, warn } from './misc.js';

import UNIFORM_TYPES from './uniform-config.js';


// Uniform types

export type AbstractUniform = {
  location: WebGLUniformLocation | null;
}

export type Uniform1I = AbstractUniform & {
  type: 'int';
  value: number
}

export type Uniform1F = AbstractUniform & {
  type: 'float';
  value: number
}

export type Uniform2F = AbstractUniform & {
  type: 'vec2';
  value: [ number, number ]
}

export type Uniform3F = AbstractUniform & {
  type: 'vec3';
  value: [ number, number, number ]
}

export type Uniform4F = AbstractUniform & {
  type: 'vec4';
  value: [ number, number, number, number ]
}

export type UniformTexture = AbstractUniform & {
  type: 'sampler2D';
  image: Drawable;
  value: WebGLTexture | null;
}

export type Static = AbstractUniform & {
  type: 'static';
  value: string;
}


// General uniform types

export type Uniform =
  | Uniform1I
  | Uniform1F
  | Uniform2F
  | Uniform3F
  | Uniform4F
  | UniformTexture
  | Static;

export type Uniforms = {
  [key: string]: Uniform
}


//
// Uniform-related Functions
//

// createUniformInferType
// - Creates a Uniform while infering the type from the matching shader source

export const createUniformInferType = (state:VaderState, name:string, value:Uniform['value']|Drawable, shader:string):Uniform => {
  const type     = inferUniformTypeFromSource(name, shader) as Uniform['type'];
  const location = state ? getUniformLocation(state, name) : null;

  if (!UNIFORM_TYPES[type]) error('createUniformInferType', `Unsupported uniform type '${type}'`);
  return UNIFORM_TYPES[type].create(state, location, value);
}


// updateUniform
// - Updates a Uniform with a new value

export const updateUniform = (state:VaderState, uniform:Uniform, value:Uniform['value'] | Drawable) => {
  return UNIFORM_TYPES[uniform.type].update(state, uniform, value);
}


// commitUniforms
// - Upload Uniform values to the shader program

export const commitUniforms = (state:VaderState, uniforms:Uniforms) => {
  const { gl } = state;
  let textureIndex = 0;

  for (let name in uniforms) {
    const uniform = uniforms[name];
    if (!UNIFORM_TYPES[uniform.type]) error('setUniforms', `Unsupported uniform type '${uniform.type}'`);
    if (!uniform.location) uniform.location = getUniformLocation(state, name);
    if (UNIFORM_TYPES[uniform.type].incTexIndex) textureIndex++;
    UNIFORM_TYPES[uniform.type].commit(state, uniform, textureIndex);
  }
}


//
// Default Uniforms
//
// Vader can provide common uniforms automatically, Shadertoy-compatible if required.
//
// The default Uniforms are:
// - vec2  u_resolution: The canvas resolution in pixels
// - float u_time:       The time in seconds since the start of the program
// - vec4  u_mouse:      The mouse position in pixels (z = 1 if button is down)
//
// See Shadertoy docs for default Shadertoy uniforms.
//

export const generateDefaultUniforms = (mode:VaderSupportMode):Uniforms => {
  const uniforms:Uniforms = {};
  const now = performance.now() / 1000;

  switch (mode) {
    case 'shadertoy':
      uniforms.iResolution = { type: 'vec3',  location: null, value: [0, 0, 1] };
      uniforms.iFrame      = { type: 'int',   location: null, value: 0 };
      uniforms.iFrameRate  = { type: 'float', location: null, value: 0 };
      uniforms.iTime       = { type: 'float', location: null, value: now };
      uniforms.iTimeDelta  = { type: 'float', location: null, value: 0 };
      uniforms.iMouse      = { type: 'vec4',  location: null, value: [0, 0, 0, 0] };
      break;

    default:
      uniforms.u_resolution = { type: 'vec2',  location: null, value: [0, 0] };
      uniforms.u_time       = { type: 'float', location: null, value: now };
      uniforms.u_mouse      = { type: 'vec4',  location: null, value: [0, 0, 0, 0] };
  }

  return uniforms;
}

export const updateDefaultUniforms = (state:VaderState, uniforms:Uniforms, canvas:HTMLCanvasElement, mouse:VaderMouseState):void => {
  if (!canvas) return;
  const now = performance.now() / 1000;

  switch (state.mode) {
    case 'shadertoy':
      uniforms.iResolution.value = [canvas.clientWidth, canvas.clientHeight, 1];
      uniforms.iFrame.value      = state.frame;
      uniforms.iTime.value       = now;
      uniforms.iTimeDelta.value  = now - (state.timeAtLastFrame ?? 0);
      uniforms.iFrameRate.value  = 1 / (uniforms.iTimeDelta.value as number);
      if (uniforms.iMouse) {
        uniforms.iMouse.value = [mouse.x, mouse.y, mouse.down ? 1 : 0, 0];
      }
      break;

    default:
      uniforms.u_resolution.value = [canvas.clientWidth, canvas.clientHeight, 1];
      uniforms.u_time.value = now;
      if (uniforms.u_mouse) {
        uniforms.u_mouse.value = [mouse.x, mouse.y, mouse.down ? 1 : 0, 0];
      }
  }
}


//
// Misc Utils
//

// getUniformLocation
// - Get the location of a uniform in the shader program by name

export const getUniformLocation = (state:VaderState, name:string):WebGLUniformLocation => {
  return state.gl.getUniformLocation(state.program, name);
}


// checkForMissingUniforms
// - Check that all Uniforms expected by the shader are present

export const checkForMissingUniforms = (uniforms:Uniforms, src:string):void => {
  const lines = src.split('\n');

  for (let i in lines) {
    const line = lines[i].trim();

    if (line.startsWith('uniform')) {
      const name = line.split(/\s+/)[2].replace(';', '');

      if (!uniforms[name]) {
        error(`uniforms::checkForMissingUniforms: uniform ${name} is referenced, but was not supplied.`);
      }
    }
  }
}


// dumpUniforms
// - Show the contents of a Uniform in a formatted way

export const dumpUniforms = (uniforms:Uniforms):string => {
  let str = "Vader::dumpUniforms\n";

  for (let name in uniforms) {
    const uniform = uniforms[name];
    str += `  ${uniform.type} ${name} = [${uniform.value}]\n`;
  }

  console.info(str);
  return str;
}

