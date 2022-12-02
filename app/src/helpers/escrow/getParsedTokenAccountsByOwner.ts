	import type * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
	import { get } from 'svelte/store';
	import { walletTokenAccountsStore } from '$stores/escrow/tokens-store';
	import * as constants from '../../helpers/escrow/constants';


	// Create a helper to getTokenAccountsByOwner for connected walletStore
	// REF: https://solanacookbook.com/references/token.html#how-to-get-all-token-accounts-by-owner
	// REF: https://github.com/abbylow/raydium-test/blob/main/src/utils/index.ts
	// U: TODO Need possibly move this inside index.svelte as well, or directly on
	// the Store as a helper. Doesn't update if already connected but then minted tokens
  // U: Saving into separate helper file
	export async function getParsedTokenAccountsByOwner(
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
		// NOTE This is the connected user's wallet SPL tokens
		walletTokenAccountsStore.set(accounts);
	}
