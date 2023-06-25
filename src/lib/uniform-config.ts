
//
// Uniform Config Library
//
// Allows each Uniform type to define how it should be created, updated and
// comitted (uploaded to the shader program)
//

import type { VaderState } from './core.ts';
import type { Uniform } from './uniforms.ts';

import { makeTexture, nearestPowerOfTwo } from './textures.js';
import { id } from './misc.js';


// Types

type UniformConfig = {
  create: UniformCreater,
  update: UniformUpdater,
  commit: UniformCommitter,
  incTexIndex?: boolean,  // Whether this type consumes a texture slot on commit
}

type UniformCreater   = (state:VaderState, location:WebGLUniformLocation|null, value:Uniform['value']) => Uniform;
type UniformUpdater   = (state:VaderState, uniform:Uniform, value:Uniform['value']) => void;
type UniformCommitter = (state:VaderState, uniform:Uniform, tIx?:number) => void;


// Helper Functions

const defaultCreate = (type:string):UniformCreater => (state, location, value) => {
  return {
    type,
    location,
    value,
  } as Uniform;
}

const defaultUpdate = (type:string):UniformUpdater => (state, uniform, value) => {
  uniform.value = value;
}

const defaultUpdateV = (type:string):UniformUpdater => (state, uniform, value) => {
  uniform.value = value;
}

const defaultCommit = (method:string):UniformCommitter => (state, uniform) => {
  //@ts-ignore
  state.gl[method](uniform.location, uniform.value);
}

const spreadCommit = (method:string):UniformCommitter => (state, uniform) => {
  //@ts-ignore
  state.gl[method](uniform.location, ...uniform.value);
}



//
// Uniform Support Library
//
// Will add to this list to support more uniform types as progress is made
//

export default {
  float: {
    commit: defaultCommit('uniform1f'),
    create: defaultCreate('float'),
    update: defaultUpdate('float'),
  },

  vec4: {
    commit: spreadCommit('uniform4f'),
    create: defaultCreate('vec4'),
    update: defaultUpdate('vec4'),
  },

  vec3: {
    commit: spreadCommit('uniform3f'),
    create: defaultCreate('vec3'),
    update: defaultUpdate('vec3'),
  },

  vec2: {
    commit: spreadCommit('uniform2f'),
    create: defaultCreate('vec2'),
    update: defaultUpdate('vec2'),
  },

  int: {
    commit: defaultCommit('uniform1i'),
    create: defaultCreate('int'),
    update: defaultUpdate('int'),
  },

  sampler2D: {
    incTexIndex: true,
    commit: (state, uniform, textureIndex) => {
      uniform = uniform as UniformTexture;
      state.gl.uniform1i(uniform.location, textureIndex);
      if (!uniform.image) return;
      if (!uniform.value) return;
      state.gl.activeTexture(state.gl.TEXTURE0 + textureIndex);
      state.gl.bindTexture(state.gl.TEXTURE_2D, uniform.value);
    },
    update: (state, uniform, value) => {
      if (!state) return;
      // by returning without updating, this uniform will still be recognised
      // as dirty next update cycle, by which time the state might be ready
      uniform = uniform as UniformTexture;
      if (value !== uniform.image) {
        uniform.image = value as Drawable;
        uniform.value = makeTexture(state, nearestPowerOfTwo(uniform.image));
      }
    },
    create: (state, location, value) => {
      return {
        type: 'sampler2D',
        location,
        image: value as Drawable,
        value: null
      } as UniformTexture;
    }
  },

  static: {
    commit: id,
    update: (state, uniform, value) => {
      if (!state) return;
      // by returning without updating, this uniform will still be recognised
      // as dirty next update cycle, by which time the state might be ready
      uniform.value = value as string;
      state.needsRecompile = true;
    },
    create: (state, location, value) => {
      return {
        type: 'static',
        location: null,
        value: value?.toString() ?? ""
      } as Static;
    }
  }
} as Record<Uniform['type'], UniformConfig>;
