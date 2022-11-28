<script lang="ts">
	import { goto } from '$app/navigation';
	import { escrowStore } from '$stores/escrow/escrow-store';
	import { PublicKey } from '@solana/web3.js';
	import type { EscrowObject } from '$stores/escrow/escrow-store';

	// Q: Do I need to have all variables come in?
	// U: When iterate over $escrowsStore, I get the following typeof (below).
	// So, I can't seem to simply {...poll} the Poll Object. I may
	// need to do some sort of type transformation beforehand.
	// A: It's flexible! You can descructure the vars or whatever.
	// export let authority: string, // object
	//    pollNumber: number, // object
	// 	isActive: boolean, // boolean
	// 	optionADisplayLabel: string, // string
	//    optionBDisplayLabel: string, // string
	//    optionACount: number, // object
	//    optionBCount: number, // object
	//    voteCount: number, // object
	//    bump: number; // number

	// U: You can pass the Store as a prop
	// REF: https://stackoverflow.com/a/59352781
	// REF: https://svelte.dev/repl/05a7c00c0d574e9a89533c6f0ef9833e?version=3.16.4
	export let escrow;
	export let pda: string;
	// Now create local vars from deconstructing the passed Store
	// NOTE The idea behind this is that you don't 'import' the Store.
	// When you import, then Store is like a singleton and you need to
	// determine WHERE to import i.e., WHICH components own the store vs.
	// simply consuming its data?

	// Reset the types for Store structure
	let currentEscrow = escrow as EscrowObject;
	let currentEscrowPda = new PublicKey(pda);

	// Q: How to persist Store state? Should I immediately set() pollStore
	// inside this with these props?
	// U: Trying this approach using goto() since I want to use the dynamic
	// routing (/[pda]), but would like to set the pollStore. Had to change
	// <a> links to <button on:click> using this handler.
	async function navigateAndSetEscrowStore() {
		await goto(`escrow/${pda}`);
		// Now go something with the data/db, etc. (e.g., set Store values):
		escrowStore.set({ escrow: currentEscrow, pda: currentEscrowPda });
	}
</script>

<div class="card w-96 bg-neutral text-neutral-content">
	<div class="card-body items-center text-center">
		<button class="link link-secondary" href="escrow/{pda}" on:click={navigateAndSetEscrowStore}>
			<h2 class="card-title">Escrow: {pda}</h2>
      <pre>escrow: {JSON.stringify(currentEscrow, null, 2)}</pre> 
		</button>
	</div>
</div>

