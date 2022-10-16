<script lang="ts">
	import { RequestAirdrop } from '$lib/index';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { balanceStore } from '$stores/balance';
	import type { PublicKey } from '@solana/web3.js';

	// NOTE The below syntax forces JS to intepret the statement as an expression,
	// destructuring the values.
	// REF: https://svelte-recipes.netlify.app/language/#variable-deconstruction
	// $: ({ publicKey, sendTransaction } = $walletStore);
	// REF: https://svelte-recipes.netlify.app/language/#defining-dependencies
  // NOTE Similarly, if you only want to rerun a function when a variable changes AND is truthy
  // then you can use the following pattern:
	$: $walletStore.connected &&
		balanceStore.getUserSOLBalance($walletStore.publicKey as PublicKey, $workspaceStore.connection);
</script>

<div class="p-4 mx-auto md:hero">
	<div class="flex flex-col md:hero-content">
		<h1
			class="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Scaffold Lite <span class="text-sm font-normal align-top text-slate-700">
				{process.env.VERSION}
			</span>
		</h1>
		<h4 class="my-2 text-center md:w-full text-slate-300">
			<p>Simply the fastest way to get started.</p>
			SvelteKit, tailwind, wallet, web3.js, and more.
		</h4>
		<div class="max-w-md p-6 mx-auto my-2 mockup-code bg-primary">
			<pre data-prefix=">">
		  <code class="truncate">Start building on Solana  </code>
			</pre>
		</div>
		<div class="text-center">
			<RequestAirdrop />
			{#if $walletStore.connected}
				<p>SOL Balance: {($balanceStore.balance || 0).toLocaleString()}</p>
			{/if}
		</div>
	</div>
</div>
