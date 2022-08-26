<script context="module" lang="ts">
	import { Buffer } from 'buffer';

	globalThis.Buffer = Buffer;
	// Q: Where should I try to pre-fetch account data?
</script>

<script lang="ts">
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { AppBar, ContentContainer, Footer, NotificationList } from '$lib/index';
	import { WalletProvider } from '@svelte-on-solana/wallet-adapter-ui';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl } from '@solana/web3.js';
	import idl from '../../../target/idl/solana_anchor_metaplex_mint_sell_nfts.json';
	import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
	import '../app.css';

	const localStorageKey = 'walletAdapter';
	const network = clusterApiUrl('devnet'); // localhost or mainnet */
	// const network = 'http://localhost:8899';

	let wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

	/* === ORIGINAL === */
	/* import { clusterApiUrl } from '@solana/web3.js'; */
	/* import { WalletProvider, ConnectionProvider } from '@svelte-on-solana/wallet-adapter-ui'; */
	/* import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'; */
	/* import type { Adapter } from '@solana/wallet-adapter-base'; */
	/* import { getLocalStorage } from '@svelte-on-solana/wallet-adapter-core'; */
	/* import { AppBar, ContentContainer, Footer, NotificationList } from '$lib/index'; */
	/* import { browser } from '$app/env'; */
	/* import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'; */
	/* import '../app.css'; */

	/* const localStorageKey = 'walletAdapter'; */
	/* const endpoint = WalletAdapterNetwork.Devnet; */
	/* const network = 'http://localhost:8899'; // clusterApiUrl(WalletAdapterNetwork.Devnet); */

	/* let wallets: Adapter[] = [new PhantomWalletAdapter(), new SolflareWalletAdapter()]; */

	/* $: autoConnect = browser && Boolean(getLocalStorage('autoconnect', false)); */
</script>

<WalletProvider {localStorageKey} {wallets} autoConnect />
<AnchorConnectionProvider {network} {idl} />
<AppBar />
<ContentContainer>
	<slot />
</ContentContainer>
<NotificationList />
<Footer />
