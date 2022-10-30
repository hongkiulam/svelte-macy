<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { MacyInit, MacyInstance, MacyOptions } from "../types";

  export let options: MacyOptions;
  export let macy: MacyInstance | undefined = undefined;

  let Macy: MacyInit
  let mounted = false;
  onMount(async () => {
    Macy = (await import('macy')).default
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
