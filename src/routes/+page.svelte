<script>
  import Vader from '../lib/Vader.svelte';

  import Heading from './Heading.svelte';
</script>

<Heading />

<p>A WebGL wrapper for shader-based visual effects in Svelte.</p>

<section>
  <h3> Turns Svelte props into uniform variables. </h3>

  <p> Any prop passed to Vader with the prefix <code>u_</code> will be automatically made
    available to the fragment shader.</p>

  <div class="code">
    <pre>&lt;Vader u_brightness=&lbrace;brightness&rbrace; /&gt;</pre>

    <span>&rarr;</span>

    <pre>uniform float u_brightness;</pre>
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
      <pre>&lt;Vader u_limit=&lbrace;3&rbrace; /&gt;</pre>
      <pre>#define VADER_STATIC(u_limit, 10)</pre>
    </div>
    <span>&rarr;</span>
    <pre>#define u_limit 3;</pre>
  </div>

  <p> Yes this is bad for performance. Don't use it every frame. </p>
</section>

<section>
  <h3> Supports ShaderToy shaders </h3>

  <p> Vader supports copy-pasting shader source from Shadertoy.com.
    Use the `mode="shadertoy"` prop to enable Shadertoy support mode.</p>
  <p> ⚠ Audio features are not supported. </p>
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
    margin: 0 1rem;
    align-self: center;
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

</style>
