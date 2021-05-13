<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import _Macy from "macy";
  import type { MacyInit, MacyInstance, MacyOptions } from "./types";
  
  const Macy: MacyInit = _Macy;

  export let options: Omit<MacyOptions, "container">;
  export let macy: MacyInstance = undefined;

  onMount(() => {
    macy = Macy({ container: "#macy", ...options });
  });
  onDestroy(() => {
    macy?.remove();
  });
</script>

<div id="macy">
  <slot />
</div>
