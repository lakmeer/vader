
//
// Shader Stuff
//

import type { VaderState } from './core.ts';
import type { Uniforms, UniformInferredType } from './uniforms.ts';

import { getUniformLocation, checkForMissingUniforms } from './uniforms.js';
import { warn, error } from './misc.js';


// Reference Constants

const CUSTOM_DIRECTIVE_SHADERTOY = "VADER_MODE(shadertoy)";
const STATIC_REPLACEMENT = "VADER_STATIC";

const VERTEX_SHADER = `
attribute vec4 a_position;

void main() {
  gl_Position = a_position;
}`;

const VADER_PROLOGUE = `
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;

/// END VADER PROLOGUE

`;

const SHADERTOY_PROLOGUE = `
precision highp float;

uniform vec3  iResolution;
uniform vec4  iMouse;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;

/// END SHADERTOY PROLOGUE

`;

const SHADERTOY_EPILOGUE = `
/// BEGIN SHADERTOY EPILOGUE

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;


// compile
// The main way the instance will interact with this module

export const compile = (state:VaderState, fragSrc:string, uniforms:Uniforms):void => {

  // Keep (unmodified) source for recompiles later on
  state.fragSrc = fragSrc;

  // Source modifications
  if (state.mode === 'shadertoy') {
    fragSrc = SHADERTOY_PROLOGUE + fragSrc + SHADERTOY_EPILOGUE;
  }
  fragSrc = replaceStatics(fragSrc, uniforms);

  // Make the program. If a program already exists on this state, destroy it
  if (state.program) state.gl.deleteProgram(state.program);
  state.program = createProgram(state.gl, fragSrc);
  if (!state.program) error('compile', "Failed to create program");

  // Update uniform locations for the new program
  for (let name in uniforms) {
    uniforms[name].location = getUniformLocation(state, name);
  }
  checkForMissingUniforms(uniforms, fragSrc);

  state.needsRecompile = false;
}


// glslCompile
// Low level WebGL stuff - build the shader, report errors

const glslCompile = (gl:WebGLRenderingContext, src:string, type:number):WebGLShader => {
  const shader = gl.createShader(type) as WebGLShader; // ignore nulls
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    let report  = gl.getShaderInfoLog(shader) ?? "Error report unavailable";
    let lineNum = parseInt(matchRxOr(report, /ERROR: \d+:(\d+):/, "1"));

    const peekLines = src.split('\n')
      .slice(lineNum - 3, lineNum + 2)
      .map((line, i) => formatErrorLine(line, i + lineNum - 2, lineNum))
      .join('\n');

    error(`shaders::glslCompile`, `COMPILE ERROR: ${report}\n------\n${peekLines}\n------\n`)
    console.group("Full Source");
    console.log(src);
    console.groupEnd();

    gl.deleteShader(shader);
  }

  return shader;
}

const createProgram = (gl:WebGLRenderingContext, fragSrc:string):WebGLProgram => {
  const vert = glslCompile(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
  const frag = glslCompile(gl, fragSrc, gl.FRAGMENT_SHADER);

  const program = gl.createProgram() as WebGLProgram; // ignore nulls
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    error('shaders::createProgram', `LINK ERROR: ${gl.getProgramInfoLog(program)}`);
    gl.deleteProgram(program);
  }

  return program;
}


//
// Other source-code related functions
//

export const inferUniformTypeFromSource = (name:string, src:string):UniformInferredType => {
  const lines = src.split('\n');

  for (let i in lines) {
    const line = lines[i].trim();

    if (line.startsWith('uniform') && line.includes(name)) {
      let [ UNIFORM, type, rest ] = line.split(/\s+/);
      let isArray = rest.match(/\[(.+)\];$/);
      let length = (isArray ? parseInt(isArray[1]) : 'single') || 'dynamic';
      if (isArray) type = type + 'v';
      return { name, type, length } as UniformInferredType;
    }

    if (line.startsWith('#define') && line.includes(STATIC_REPLACEMENT) && line.includes(name)) {
      return { name, type: "static", length: "single" };
    }
  }

  return { name, type: "unused", length: "single" };
}

export const hasShadertoyDirective = (src:string):boolean => {
  const lines = src.trim().split('\n');

  for (let i in lines) {
    const line = lines[i].trim();

    if (line.indexOf(CUSTOM_DIRECTIVE_SHADERTOY) !== -1) {
      console.info(`Vader::init - '${CUSTOM_DIRECTIVE_SHADERTOY}' forcing support mode`);
      return true;
    }
  }

  return false;
}


//
// Static Replacement
//

const rxStatic = (name = '\\w+') =>
  new RegExp(`\\b${STATIC_REPLACEMENT}\\(\\s*${name}\\s*(,\\s*.+)?\\s*\\)`, 'g');

const rxName =
  new RegExp(`${STATIC_REPLACEMENT}\\(\\s*([_\\w]+)`);

const rxValue =
  new RegExp(`${STATIC_REPLACEMENT}\\(\\s*\\w+\\s*,\\s*(.+)\\s*\\)`);

const pad = (size:number, value:any):string => {
  let str = value.toString();
  while (str.length < size) str = ' ' + str;
  return str;
}

const formatErrorLine = (line:string, lineNum:number, errorPos:number):string => {
  const head = lineNum === errorPos ? '> ' : '  ';
  return `${pad(5, head + lineNum)}: ${line}`
}

const matchRxOr = (str:string, rx:RegExp, fallback:string):string => {
  const match = str.match(rx);
  if (match) return match[1];
  return fallback;
}


// replace
// Performs replacement of a Vader Static into it's value in the shader source

export const replace = (src:string, name:string, value:string):string => {
  const pattern = rxStatic(name);
  if (src.match(pattern)) {
    src = src.replaceAll(pattern, value);
  } else {
    warn(`shaders::replaceStatics - '${name}' not found in source`);
  }
  return src;
}


// replaceStatics
// Replaces of all Vader Statics, and performs sanity checking on the source.

export const replaceStatics = (src:string, uniforms:Uniforms):string => {
  for (let name in uniforms) {
    const uniform = uniforms[name];
    if (uniform.type === 'static') {
      src = replace(src, name, uniform.value);
    }
  }

  const missed = src.match(rxStatic());

  if (missed) {
    for (let i = 0; i < missed.length; i++) {
      const name  = matchRxOr(missed[i], rxName, '???'); // Should never not match
      const value = missed[i].match(rxValue);

      if (value) {
        src = src.replace(missed[i], value[1]);
      } else {
        error('shaders::replaceStatics', `'${name}' not found in source.`);
      }
    }
  }

  return src;
}

