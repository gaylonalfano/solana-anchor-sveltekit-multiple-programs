<script lang="ts">
	import type * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import idl from '../../../../target/idl/non_custodial_escrow.json';
	import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
	import { get } from 'svelte/store';
	import { balanceStore } from '$stores/balance';
	import { walletTokenAccountsStore } from '$stores/escrow/tokens-store';
	import { customProgramStore } from '$stores/escrow/custom-program-store';
	import { escrowStore } from '$stores/escrow/escrow-store';
	import { escrowsStore } from '$stores/escrow/escrows-store';
	import { userStore } from '$stores/escrow/user-store';
  import { getParsedTokenAccountsByOwner } from '../../helpers/escrow/getParsedTokenAccountsByOwner';
	import * as constants from '../../helpers/escrow/constants';

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
			constants.NON_CUSTODIAL_ESCROW_PROGRAM_ID.toBase58();
	$: hasWalletReadyForFetch =
		$walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting;

	$: if (hasWalletReadyForFetch && hasWorkspaceProgramReady) {
		// Q: How to handle if a connection happens on escrow/[pda] route?
		// Need to get the corresponding Escrow account and update escrowStore

		userStore.reset();
		// escrowStore.reset();
		escrowsStore.reset();

		// Refetch/update all the Stores
		// U: Need to set/update $userStore.wallet value
		$userStore.walletAddress = $walletStore.publicKey;
		// NOTE Cannot access the $page Store for the page.params.pda
		// escrowStore.getEscrowAccount()
		// Q: Can I fetch all escrow accounts and update escrowsStore Array?
    // A: Yep!
		escrowsStore.getEscrowAccounts(
			constants.NON_CUSTODIAL_ESCROW_PROGRAM_ID,
			$workspaceStore.connection
		);

    // I really need to getProgramAccounts() and set/update
    // my Stores state as best as possible.
    // NOTE I can't use the Store helpers (escrowStore.getEscrowAccount())
    // because I no longer have access to the PDA value! 
    // Same goes for the customProgramStore. If the store gets wiped/reset/lost,
    // then I need to perform a fresh getProgramAccounts().
    // U: Think I'm only missing customProgramStore, since escrowsStore
    // is already performing a getProgramAccounts() call.
    // A: Works! Could consider hard-coding the customProgram PDA
    // once deployed on mainnet.
    customProgramStore.getCustomProgramAccount()

		// Q: getTokenAccountsByOwner and update/set Store?
		// Challenge is that I don't know if the connected wallet is a buyer or seller
		// until they access a specific Escrow account
		// Q: Do I need a separate walletTokenListStore or something that grabs their tokens?
		// Or, should I only bother with this if they are initiating, i.e., sellerStore?
		// However, theoretically ALL connected users will need to access their tokens
		// if they want to either sell or buy, right? Maybe I can derive from walletStore?
		// A: Yes, this is a good spot to fetch existing tokens in connected wallet
		getParsedTokenAccountsByOwner(
			$workspaceStore.connection,
			$walletStore.publicKey as anchor.web3.PublicKey
		);

		// Get the user's SOL balance using balanceStore
		balanceStore.getUserSOLBalance(
			$walletStore.publicKey as anchor.web3.PublicKey,
			$workspaceStore.connection
		);
	}
</script>

<AnchorConnectionProvider {network} {idl} />
<slot />
