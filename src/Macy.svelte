<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import _Macy from "macy";
  import type { MacyInit, MacyInstance, MacyOptions } from "./types";

  const Macy: MacyInit = _Macy;

  export let options: MacyOptions;
  export let macy: MacyInstance = undefined;

  let mounted = false;
  onMount(() => {
    macy = Macy({ container: "#macy", ...options });
    mounted = true;
  });
  onDestroy(() => {
    macy?.remove();
  });

  // if options changes, recreate
  $: if (mounted) {
    macy?.remove();
    macy = Macy({ container: "#macy", ...options });
  }
</script>

<div id="macy">
  <slot />
</div>
