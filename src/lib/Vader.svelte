<script lang="ts">
  import type { Uniforms } from "./uniforms.js";
  import type { VaderState, VaderMouseState, VaderSupportMode } from "./core.js";

  import { onMount, onDestroy, afterUpdate } from "svelte";
  import { writable, derived } from "svelte/store";

  import * as Vader from "./core.js";


  // Props

  export let shader = "";
  export let label  = "[untitled]";
  export let mode   = 'default' as VaderSupportMode;
  export let auto   = mode === 'shadertoy'; 
  export let aspect = 16/9;


  // State

  let vaderGl:VaderState;
  let uniforms:Uniforms;
  let self:HTMLDivElement;
  let canvas:HTMLCanvasElement;
  let clientWidth:number;
  let clientHeight:number;

  let rafref  = 0;
  let initted = false;
  let running = auto;

  let ownScript:HTMLScriptElement | null;


  // Prop-to-uniform pipeline

  let restStore    = writable($$restProps);
  let uniformStore = derived(restStore, (props:Record<string, any>):Uniforms => {
    return Object.keys(props)
      .filter((prop:string) => prop.startsWith('u_') || prop === 'shader')
      .reduce((result, prop:string) => {
        result[prop] = props[prop];
        return result;
      }, {} as Record<string, any>);
  });

  const applyPropsAsUniforms = (props:any) => {
    Object.entries(props).map(([name, value]:[string, any]) => {
      if (!uniforms[name]) {
        uniforms[name] = Vader.createUniformInferType(vaderGl, name, value, shader);
      }

      if (uniforms[name].value !== value) {
        Vader.updateUniform(vaderGl, uniforms[name], value);
      }
    });

    // If auto-render isn't on, updates to props should trigger a render
    if (!auto) render();
  }



  // Mouse Support

  let mouse:VaderMouseState = { x: 0.5, y: 0.5, down: false };

  const updateMouse = (e:MouseEvent) => {
    const bcr = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - bcr.left) / bcr.width;
    mouse.y = (bcr.height - (e.clientY - bcr.top)) / bcr.height; // inverts Y
    if (initted && !auto) render();
  }

  export { mouse };


  // Render Function

  const render = () => {
    if (!vaderGl) return;
    if (canvas)  Vader.updateDefaultUniforms(vaderGl, uniforms, canvas, mouse);
    if (vaderGl) Vader.render(vaderGl, uniforms);
    if (auto && running) {
      cancelAnimationFrame(rafref); // There can only be one
      rafref = requestAnimationFrame(render);
    }
  }


  // Init procedure

  const init = () => {
    if (canvas && !initted) {
      if (!shader) {
        ownScript = self.querySelector('script');
        shader = ownScript?.innerHTML ?? shader;
        if (!shader) return console.warn("Vader::init - No shader source or embedded script provided.");
      }

      if (shader && Vader.hasShadertoyDirective(shader)) {
        mode = 'shadertoy';
        auto = true;
      }

      uniforms = Vader.generateDefaultUniforms(mode);
      uniformStore.subscribe(applyPropsAsUniforms);
      vaderGl = Vader.init(label, canvas, shader, uniforms, mode);
      initted = true;

      if (auto) render();
    }
  }


  // Lifecycle Hooks

  afterUpdate(() => {
    restStore.set($$restProps);

    if (ownScript && ownScript.innerHTML !== shader) {
      shader = ownScript.innerHTML;
      vaderGl.needsRecompile = true;
    }

    if (auto) render();
  });

  onMount(() => {
    init();

    return () => {
      running = false;
      cancelAnimationFrame(rafref);
    }
  });
</script>


<div class="Vader" style="--aspect: {aspect}" bind:this={self} bind:clientWidth bind:clientHeight on:mousemove={updateMouse} on:mousedown on:mouseup>
  <canvas bind:this={canvas} width={clientWidth ?? 1600} height={clientHeight ?? 900}>
    <h1> Your browser does not support WebGL </h1>
  </canvas>
  <slot />
</div>


<style>
  .Vader {
    aspect-ratio: var(--aspect);
  }

  canvas {
    display: block;
    width: 100%;
    max-width: 100%;
  }
</style>

