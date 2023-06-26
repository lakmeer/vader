
# V A D E R

A WebGL wrapper for shader-based visual effects in Svelte.


## How to use

1. Import the component:

    import Vader from 'vader';

2. Add the component to your markup with a 'shader' prop:

    <Vader shader={myFragmentSource} />
 
  OR with an internal script tag containing glsl fragment shader code:

    <Vader>
      <script type="x-shader/x-fragment">
        precision mediump float;
        uniform vec3 u_resolution;
 
        void main () {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          gl_FragColor = vec4(uv, 0.0, 1.0);
        }
      </script>
    </Vader>

  The script type doesn't matter; as long as it's not 'text/javascript'.

3. Any extra props passed with a prefix of `u_` will be injected as uniforms.

   You must have a matching uniform declaration in your shader code.

   The types will be worked out from your source.

    let red = [ 0.9, 0.1, 0.1 ];

    <Vader u_color={red} />
      <script type="x-shader/x-fragment">
        precision mediump float;
        uniform vec3 u_color;
 
        void main () {
          gl_FragColor = vec4(color, 1.0);
        }
      </script>
    </Vader>

4. Vader will only re-render when prop values change; unless you tell
   it to auto-render.

     <Vader shader={myFragmentSource} auto />

   Auto-rendering will be paused when the component is not visible.


## Advanced Features

### Shadertoy Support

Add the prop `mode="shadertoy"` and Vader will provide your fragment shader
with a (mostly) feature-compatible set of uniforms using ShaderToy's naming
and type conventions. You should be able to run most Shadertoy source without
modification in this mode.

  ```glsl
    <Vader mode="shadertoy" auto>
      <script type="x-shader/fragment">
        void mainImage (out vec4 fragColor, in vec2 fragCoord) {
          vec2 uv = fragCoord/iResolution.xy;
          vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
          fragColor = vec4(col,1.0); 
        }
      </script>
    </Vader>
  ```

You can also put `// VADER_MODE(shadertoy)` in your fragment shader to force
Vader to switch modes before it begins.

##### Limitations

- iChannels not available
- No plans to support any sound-based features


### Statics

Some GLSL variables must be immutable, like limits on `for` loops. Use this
syntax in your fragment shader and Vader will inject a prop value into the
source and recompile the shader program on demand:

  ```glsl
    $: maxIter = 10;

    <Vader u_max_iter={maxIter}>
      <script type="x-shader/x-fragment">
        precision mediump float;

        uniform vec2 u_resolution;

        #define MAX_ITER VADER_STATIC(u_max_iter)
 
        void main () {
          vec2 uv = gl_FragCoord.xy/u_resolution * 2.0 - 1.0;
          float v = 0.0;
          float p = 1.0/float(MAX_ITER);

          for (int i = 0; i < MAX_ITER; i++) {
            if (uv.x < float(i) * p) {
              float += p;
            }
          }

          gl_FragColor = vec4(vec3(p), 1.0);
        }
      </script>
    </Vader>
  ```

Statics can also take a default value in case the matching prop is not provided:

  ```glsl
    #define MAX_ITER VADER_STATIC(u_max_iter, 5)
  ```

## Options

Only props beginning with `u_` are interpreted as uniform values.

Real props include:

| Prop     | Type    | Default      | Usage   |
| -------- | ------- | ------------ | ------- |
| `shader` | string  | *REQUIRED*   | Source code of a GLSL fragment shader. |
| `auto`   | boolean | `false`      | Vader will run it's own 60Hz frame loop. |
| `mode`   | string  | `default`    | Either `default` or `shadertoy`. Sets uniform naming convention. |
| `label`  | string  | `[untitled]` | Associates a name with this instance (for error logging) |
| `aspect` | number  | `16 / 9`     | Override the intrinsic aspect ratio of the canvas |


## Default Uniforms

If your fragment shader declares uniforms with the following types and names,
Vader will create and update these uniforms for you:

  ```glsl
    uniform vec2  u_resolution; // Size of the canvas, in pixels
    uniform float u_time;       // Time elapsed since init, in seconds
    uniform vec4  u_mouse;      // [ x, y, click x, click y ], in clip space
  ```

If Vader is in Shadertoy mode, the are even more automatic uniforms available.

  ```glsl
    uniform vec3  iResolution;
    uniform float iTime;
    uniform vec4  iMouse;
    // ... among others
  ```

