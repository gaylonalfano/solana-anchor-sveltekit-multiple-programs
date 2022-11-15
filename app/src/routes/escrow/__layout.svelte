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
	import * as constants from '../../helpers/escrow/constants';

	// const network = clusterApiUrl('devnet'); // localhost or mainnet */
	const network = constants.NETWORK;

	// Create a helper to getTokenAccountsByOwner for connected walletStore
	// REF: https://solanacookbook.com/references/token.html#how-to-get-all-token-accounts-by-owner
	// REF: https://github.com/abbylow/raydium-test/blob/main/src/utils/index.ts
	async function getParsedTokenAccountsByOwner(
		connection: anchor.web3.Connection,
		owner: anchor.web3.PublicKey
	) {
		if (!get(walletStore)) throw Error('Wallet not connected!');
		if (!get(workspaceStore)) throw Error('Workspace not found!');
		console.log('getTokenAccountsByOwner INVOKED!');

		// Q: Use Parsed or normal getTokenAccountsByOwner?
		// A: Parsed seems to work just fine and it auto-decodes the data for me
		const response = await connection.getParsedTokenAccountsByOwner(owner, {
			programId: TOKEN_PROGRAM_ID
		});

		// REF: https://solana-labs.github.io/solana-web3.js/classes/Connection.html#getParsedTokenAccountsByOwner
		const accounts = [];

		for (const { account, pubkey } of response.value) {
			accounts.push({
				account,
				pubkey
			});
		}
		console.log('getParsedTokenAccountsByOwner::accounts: ', accounts);

		// Update Store
		walletTokenAccountsStore.set(accounts);
	}

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
		// Q: getTokenAccountsByOwner and update/set Store?
		// Challenge is that I don't know if the connected wallet is a buyer or seller
		// until they access a specific Escrow account
		// Q: Do I need a separate walletTokenListStore or something that grabs their tokens?
		// Or, should I only bother with this if they are initiating, i.e., sellerStore?
		// However, theoretically ALL connected users will need to access their tokens
		// if they want to either sell or buy, right? Maybe I can derive from walletStore?
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
