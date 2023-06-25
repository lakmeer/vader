<script>
  import Vader from '../lib/Vader.svelte';

  import Heading from './Heading.svelte';

  import stExample from '../iq-heart.glsl?raw';

  let maxIter = 4;
</script>

<Heading />

<p>A WebGL wrapper for shader-based visual effects in Svelte.</p>

<section>
  <h3> Turns Svelte props into uniform variables. </h3>

  <p> Any prop passed to Vader with the prefix <code>u_</code> will automatically
    be made available to the fragment shader using it's declared type.</p>

  <div class="code">
    <pre>&lt;Vader u_brightness=&lbrace;brightness&rbrace;
       color=&lbrace;color&rbrace; /&gt;</pre>

    <span>&rarr;</span>

    <pre>uniform float u_brightness;
uniform vec3  u_color;</pre>
  </div>
</section>

<section>
  <h3> Render on reactive updates, or use a frame loop</h3>

  <p> Vader will only render a frame if any of the props actually change.
    To use a normal 60fps frame loop, set the `auto` prop to true.</p>

  <div class="code single">
    <pre>&lt;Vader auto /&gt;</pre>
  </div>
</section>

<section>
  <h3> Dynamically change <code>#define</code>'d constants with <code>VADER_STATIC</code></h3>

  <p> Use <code>VADER_STATIC</code> in your fragement source to define constants 
    that can be changed at runtime. Vader will dynamically recomplie the shader
    between frames when these constants change.</p>

  <div class="code">
    <div>
      <pre>$: maxIter = 4;

&lt;Vader u_max_iter=&lbrace;maxIter&rbrace; /&gt;</pre>
      <span>+</span>
      <pre>#define VADER_STATIC(u_max_iter, 20)</pre>
    </div>
    <span>&rarr;</span>
    <pre>#define u_max_iter 4;</pre>
  </div>

  <p> Yes this is bad for performance. Don't use it every frame. </p>


  <div class="example" style="margin-top: 4rem;">
    <div class="input">
      <label><code>u_max_iter:</code> {maxIter} </label>
      <input bind:value={maxIter} type="range" min="2" max="20" step="1" />
    </div>

    <Vader u_max_iter={maxIter}>
      <script type="x-shader/x-fragment">
        precision mediump float;

        uniform vec2 u_resolution;

        #define MAX_ITER VADER_STATIC(u_max_iter)
 
        void main () {
          vec2 uv = gl_FragCoord.xy/u_resolution;
          float v = 0.0;
          float p = 1.0/float(MAX_ITER);

          for (int i = 0; i < MAX_ITER; i++) {
            if (uv.x > float(i) * p) {
              v += p;
            }
          }

          gl_FragColor = vec4(v, 1.0 - v, 0.5, 1.0);
        }
      </script>
    </Vader>
  </div>
</section>


<section>
  <h3> Supports ShaderToy shaders </h3>

  <p> Vader supports directly running source code from Shadertoy.com.
    Use the `mode="shadertoy"` prop to enable Shadertoy support mode.</p>
  <p> <em>⚠</em> Audio features are not supported. </p>

  <div class="example" style="margin-top: 4rem;">
    <Vader auto mode="shadertoy" shader={stExample}> </Vader>
  </div>

  <p> <i>Heart - gradient 2D</i> by <em>iq</em> from <a target="_blank" href="https://www.shadertoy.com/view/DldXRf">ShaderToy</a>.</p>
</section>


<section>
  <h3> Example</h3>

  <div class="example">
    <Vader auto>
      <script type="x">
        precision mediump float;

        uniform vec2 u_resolution;
        uniform float u_time;

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          gl_FragColor = vec4(uv, 0.5 + 0.5 * sin(u_time), 1.0);
        }
      </script>
    </Vader>
  </div>
</section>


<style>

  section {
    width: 80vw;
    max-width: 1000px;
    margin: 5vh auto;
  }

  section h3 {
    margin-bottom: 2rem;
    color: #f3ec78;
  }

  section p {
    margin: 1em 0;
  }

  .example {
    box-shadow: 0 10px 10px rgba(0,0,20,0.5), 0 20px 40px rgba(0,0,20,0.5);
  }

  .code {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    text-align: left;
    margin-top: 2rem;
  }

  .code.single {
    grid-template-columns: 1fr;
    margin-left: 20%;
    margin-right: 20%;
  }

  .code pre {
    background: #1a1a1a;
    padding: 1rem;
  }

  .code div pre + pre {
    margin-top: 1em;
  }

  .code span {
    font-size: 2rem;
    line-height: 1;
    margin: 0.3rem 1rem 0.5rem;
    align-self: center;
    text-align: center;
    display: block;
  }

  h3 code, p code {
    display: inline-block;
    background: rgba(0,0,0,0.4);
    padding: 0.0em 0.3em;
    border-radius: 0.2em;
    letter-spacing: 0.05em;
  }

  h3 code {
    font-size: 1.2em;
  }

  .input {
    background: rgba(0,0,0,0.3);
    display: grid;
    gap: 1rem;
    padding: 1rem 1rem 1.5rem;
    justify-content: center;
  }

  label {
    display: block;
    margin-bottom: 1rem;
    color: #f3ec78;
  }

  label + input {
    max-width: 10rem;
  }

  em, a {
    color: #f3ec78;
    font-style: normal;
    font-weight: bold;
  }

</style>
