
      ///                             ///
     ///          V A D E R          ///
    ///                             ///
   ///     A WebGL wrapper for     ///
  ///     shader-based visual     ///
 ///     effects in Svelte.      ///
///                             ///

export { default } from './Vader.svelte';

 
/*

TODO
----

- Intersection observer
- iMouse.zw (click position)
- Aspect ratio prop


ShaderToy Uniforms to implement
-------------------------------

[X] float   iTime         Current time in seconds
[X] vec3    iResolution   The viewport resolution (z is pixel aspect ratio, usually 1.0)
[X] vec4    iMouse        xy = current pixel coords (if LMB is down). zw = click pixel
[X] float   iTimeDelta    Time it takes to render a frame, in seconds
[X] int     iFrame        Current frame
[ ] float   iFrameRate    Number of frames rendered per second
[ ] vec4    iDate         Year, month, day, time in seconds in .xyzw

*/
