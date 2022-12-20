<script context="module" lang="ts">
	import { Buffer } from 'buffer';

	globalThis.Buffer = Buffer;
	// Q: Where should I try to pre-fetch account data?
	// A: Think __layout component is a good spot. I tried doing
	// it inside /polls and /polls/[pda] routes, but had slightly
	// different behavior between the routes and sometimes stores
	// state would get stale.
	// REF Check out polls/__layout.svelte for the multiple polls program
</script>

<script lang="ts">
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AppBar, ContentContainer, Footer, NotificationList } from '$lib/index';
	import { WalletProvider } from '@svelte-on-solana/wallet-adapter-ui';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { getLocalStorage, setLocalStorage } from '@svelte-on-solana/wallet-adapter-core';
	import { browser } from '$app/env';
	import { clusterApiUrl } from '@solana/web3.js';
	import idl from '../../../target/idl/solana_anchor_sveltekit_multiple_programs.json';
	import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
	import '../app.css';

	const localStorageKey = 'walletAdapter';
	// const network = clusterApiUrl('devnet'); // localhost or mainnet */
	const network = 'http://localhost:8899';

	let wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

	$: autoConnect = browser && Boolean(getLocalStorage('autoconnect', false));

	// $: {
	// 	console.log('walletStore: ', $walletStore);
	// 	console.log('workspaceStore: ', $workspaceStore);
	// }

	// === ORIGINAL (w/o AnchorConnectionProvider)
	// REF: https://github.com/solana-developers/dapp-scaffold-svelte
	// import { clusterApiUrl } from '@solana/web3.js';
	// import { WalletProvider, ConnectionProvider } from '@svelte-on-solana/wallet-adapter-ui';
	// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
	// import type { Adapter } from '@solana/wallet-adapter-base';
	// import { getLocalStorage } from '@svelte-on-solana/wallet-adapter-core';
	// import { AppBar, ContentContainer, Footer, NotificationList } from '$lib/index';
	// import { browser } from '$app/env';
	// import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
	// import '../app.css';

	// const localStorageKey = 'walletAdapter';
	// const endpoint = WalletAdapterNetwork.Devnet;
	// const network = 'http://localhost:8899'; // clusterApiUrl(WalletAdapterNetwork.Devnet);

	// let wallets: Adapter[] = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

	// $: autoConnect = browser && Boolean(getLocalStorage('autoconnect', false));
</script>

<WalletProvider {localStorageKey} {wallets} {autoConnect} />
<AnchorConnectionProvider {network} {idl} />
<AppBar />
<ContentContainer>
	<slot />
</ContentContainer>
<NotificationList />
<Footer />
