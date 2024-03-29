### Svelte Macy

A Svelte Masonry component which wraps [macy.js](https://github.com/bigbite/macy.js)

#### Installation

```bash
npm install svelte-macy
```

#### Usage

```html
<script>
	import Macy from 'svelte-macy'; // default export
	import { Macy } from 'svelte-macy'; // named export
</script>

<Macy>
	<div>Child 1</div>
	<div>Child 2</div>
	<div>Child 3</div>
	<div>Child 4</div>
</Macy>
```

For a basic usage example, checkout the Svelte REPL demo [here](https://svelte.dev/repl/a2e9c3e155e44813888e6d7fcb8ac603)

##### Props

###### `options`

Since this component is a simple wrapper for macy.js, the options are close to identical (`options.container` has been handled by the component so it is not exposed).

Here is a list of supported options along with their default values

```js
{
    columns: 4,
    trueOrder: false,
    margin: 0,
    waitForImages: false,
    useOwnImageLoader: false,
    mobileFirst: false,
    breakAt: undefined,
    cancelLegacy: false,
    useContainerForBreakpoints: false,
}
```

You can find the full documentation for these options [here](https://github.com/bigbite/macy.js#options)

###### `macy`

You can use the `macy` prop to gain access to the underlying macy instance and its methods.

Using Svelte's bind directive

```html
<script>
	let macy;

	function someFunction() {
		if (macy) {
			macy.recalculate();
		}
	}
</script>

<Macy bind:macy="{macy}">
	<div />
</Macy>
```

Available methods are `recalculate`, `runOnImageLoad`, `remove`, `reInit`, `on`, `emit`. Full documentation can be found [here](https://github.com/bigbite/macy.js#methods)

macy.js also provides some constants that are used with its events system, namely `on` and `emit`. These are re-exported for convenience.

```html
<script>
	import { EVENTS } from 'svelte-macy';
</script>
```

#### Typescript

Typescript is supported out of the box.

For the component, simply import as you would normally. This will provide typings for the component's props.

```html
<script lang="ts">
	import { Macy } from 'svelte-macy';
</script>
```

To import type definitions

```html
<script lang="ts">
	import type { MacyInit, MacyInstance, MacyOptions, MacyEvents } from 'svelte-macy';
</script>
```

##### Component Type

```ts
// top level import
import type { Macy } from 'svelte-macy';
import type Macy from 'svelte-macy';

let MacyComponentType: typeof Macy;

// type import
let MacyComponentType: typeof import('svelte-macy').default;
let MacyComponentType: typeof import('svelte-macy').Macy;
```

#### SvelteKit/ SSR

Unfortunately the macy.js dependency relies on `window`/ `document` which is not available on the server. A workaround is to
only import this component on the client.

```html
<script>
	import { onMount } from "svelte";

	let MacyComponent: typeof import("svelte-macy").Macy;

	onMount(async () => {
	  MacyComponent = (await import("svelte-macy")).Macy // or .default;
	});

	let macy;
</script>

<svelte:component this="{MacyComponent}" bind:macy options="{{}}">
	<div />
</svelte:component>
```

#### License

[MIT](LICENSE)
