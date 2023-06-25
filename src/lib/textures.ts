
//
// Texture Stuff
//

import type { VaderState } from './core.ts';

import { isPowerOfTwo } from './misc.js';


// Types

export type Drawable = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;


// Reference Constants

const MAX_TEXTURE_SIZE = 4096;


//
// Helper Functions
//

// rescale
// - Produce a new Drawable of the requested size

const rescale = (image:Drawable, size:number):Drawable => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(image, 0, 0, size, size);
  return canvas;
}


// nearestPowerOfTwo
// - Given an image, return a power of two version of it that doen't require upscaling

export const nearestPowerOfTwo = (image:Drawable, targetSize = 0):Drawable => {

  // If the image is already a power of two, return it
  if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) return image;

  // If a specific size was requested, use that
  if (targetSize !== 0) return rescale(image, targetSize);

  // Find the nearest power of two size that does not require enlarging the image
  let n = 2;
  const longestDimension = Math.max(image.width, image.height);
  while (n < longestDimension && n < MAX_TEXTURE_SIZE) n *= 2;
  return rescale(image, n);

}


// makeTexture
// - Given a gl instance and a valid image, create a WebGL texture from it and configure

export const makeTexture = (state:VaderState, image:Drawable):WebGLTexture => {

  const { gl } = state;

  let tex = gl.createTexture() as WebGLTexture;
  gl.bindTexture(gl.TEXTURE_2D, tex);

  // Set the parameters so we can render any size image, bilinear filter
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // Find it's location
  return tex;
}

