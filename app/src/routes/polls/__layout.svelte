<script lang="ts">
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import type { PublicKey } from '@solana/web3.js';
	import idl from '../../../../target/idl/onchain_voting_multiple_polls.json';
	import { get } from 'svelte/store';
	import {
		customProgramStore,
		profileStore,
		profilesStore,
		pollStore,
		pollsStore,
		votesStore
	} from '$stores/polls/index';
	import * as constants from '../../helpers/polls/constants';
	import { getAllProgramAccounts } from '../../helpers/polls/getAllProgramAccounts';

	// const network = clusterApiUrl('devnet'); // localhost or mainnet */
	const network = constants.NETWORK;

	// Q: Where should I try to pre-fetch account data?
	// A: Think __layout component is a good spot. I tried doing
	// it inside /polls and /polls/[pda] routes, but had slightly
	// different behavior between the routes and sometimes stores
	// state would get stale.
	// REF Check out polls/__layout.svelte for the multiple polls program

	// Create some variables to react to Stores' state
	$: hasWorkspaceProgramReady =
		$workspaceStore &&
		$workspaceStore.program &&
		$workspaceStore.program.programId.toBase58() ===
			constants.ONCHAIN_VOTING_MULTIPLE_POLLS_PROGRAM_ID.toBase58();
	$: hasWalletReadyForFetch =
		$walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting;
	$: hasPollsStoreValues = $pollsStore.length > 0;
	$: hasPollStoreValues = $pollStore.pda !== null && $pollStore.poll !== null;

	$: if (hasWalletReadyForFetch && hasWorkspaceProgramReady) {
		getAllProgramAccounts(
			constants.ONCHAIN_VOTING_MULTIPLE_POLLS_PROGRAM_ID,
			$workspaceStore.connection,
			$walletStore.publicKey as PublicKey
		);
	}
</script>

<AnchorConnectionProvider {network} {idl} />
<slot />
