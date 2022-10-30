/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Locals {}
	// interface PageData {}
	// interface Error {}
	// interface Platform {}
}

declare module '*.svelte';

declare module 'macy' {
	const mod: import('./types').MacyInit;
	export const constants: import('./types').MacyEvents;
	export default mod;
}
