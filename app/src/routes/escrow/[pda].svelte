<script lang="ts">
	// REF: UI idea from: https://github.com/paul-schaaf/escrow-ui/blob/master/src/Alice.vue
	// REF: Good example of web3/spl-token use: https://github.com/paul-schaaf/escrow-ui/blob/master/src/util/initEscrow.ts
	import type anchor from '@project-serum/anchor';
	import {
		TOKEN_PROGRAM_ID,
	} from '@solana/spl-token';

	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	// NOTE Anchor.toml setting can copy IDL to specified dir. However, the 'idl' prop
	// on AnchorConnectionProvider wants a JSON instead.
	// import { IDL as idl } from '../idl/non_custodial_escrow';

	import { notificationStore } from '../../stores/notification';
	import { balanceStore } from '$stores/balance';
	import { walletTokenAccountsStore } from '$stores/escrow/tokens-store';
	import { customProgramStore } from '$stores/escrow/custom-program-store';
	import { userStore } from '$stores/escrow/user-store';
	import {
		escrowStore,
		type EscrowObject,
		type EscrowStoreObject
	} from '$stores/escrow/escrow-store';
  import { escrowsStore } from '$stores/escrow/escrows-store';
	import * as constants from '../../helpers/escrow/constants';
	import { get } from 'svelte/store';
	// import type { EscrowObject, EscrowStoreObject } from 'src/models/escrow-types';


  // TODOS:
  // - Create a __layout.svelte for [pda] routes
  // - Create escrow-types.ts file to clean up
  // - FIXME userStore.inTokenAmount/outTokenAmounts are type BN! Need number!
  // - Add/update the single escrowStore using $page.params.pda
  //   - Could refetch using helper escrowStore.getEscrowAccount()

  $: {
    console.log('escrowStore: ', $escrowStore);
    console.log('userStore: ', $userStore);
  }


	async function handleAcceptTrade() {
		if ($escrowStore.escrow === null) {
			notificationStore.add({
				type: 'error',
				message: 'Escrow account data is null!'
			});
			console.log('error', 'Escrow account data is null!');
			return;
		}

		try {
			// U: Trying to see if a single userStore would suffice from both sides
			// and/or both instructions (create, accept)
			// NOTE Assuming $escrowStore has been pre-populated based on fetching
			// the $escrowStore.pda (probably via the route), then let's try to update
			// the userStore (from BUYER's perspective).
			// walletAddress: null, // Phantom Dev
			// outTokenMint: null, // Q: Default to SOL?
			// outTokenATA: null,
			// outTokenRawBalance: null,
			// outTokenBalance: null,
			// outTokenRawAmount: null,
			// outTokenAmount: null,
			// outTokenDecimals: null,
			// inTokenMint: null,
			// inTokenATA: null,
			// inTokenRawBalance: null,
			// inTokenBalance: null,
			// inTokenRawAmount: null,
			// inTokenAmount: null,
			// inTokenDecimals: null,

			// 1. First set userStore values that exist in escrowStore:
			$userStore.walletAddress = $walletStore.publicKey as anchor.web3.PublicKey;
			$userStore.outTokenMint = $escrowStore.escrow.inMint as anchor.web3.PublicKey;
			$userStore.inTokenMint = $escrowStore.escrow.outMint as anchor.web3.PublicKey;
      console.log('userStore.outTokenMint: ', $userStore.outTokenMint.toBase58());
      console.log('userStore.inTokenMint: ', $userStore.inTokenMint.toBase58());
      // Q: Does escrow.outMint === escrowedTokenAccount.mint? They should be the same
      console.log('escrowedOutToken.mint: ', $escrowStore.escrow.escrowedOutTokenAccount.mint.toBase58());

			// 2. Update the user's OUT TOKEN details
			// Q: How to get the BUYER ATA address with only a mint and wallet?
			// A: Filter/find on $walletTokenAccountsStore!
			let buyerOutTokenAccountInfo = $walletTokenAccountsStore.find((tokenAccount) => {
				return tokenAccount.account.data.parsed.info.mint === $userStore.outTokenMint;
			});

			if (buyerOutTokenAccountInfo) {
        console.log('buyerOutTokenAccountInfo FOUND!')

				$userStore.outTokenATA = buyerOutTokenAccountInfo.pubkey;
				$userStore.outTokenRawBalance = parseInt(
					buyerOutTokenAccountInfo.account.data.parsed.info.tokenAmount.amount
				); // "30000000"
				$userStore.outTokenBalance =
					buyerOutTokenAccountInfo.account.data.parsed.info.tokenAmount.uiAmount; // 3
				$userStore.outTokenDecimals =
					buyerOutTokenAccountInfo.account.data.parsed.info.tokenAmount.decimals;
        $userStore.outTokenAmount = buyerOutTokenAccountInfo.account.data.parsed.info.tokenAmount.


        // Q: Can I just use BN.toNumber() method?
        // A: No! BN.toNumber() returns the RAW amounts! Need to account for decimals!
        $userStore.outTokenAmount = $escrowStore.escrow.inAmount.toNumber() / (10 ** $userStore.outTokenDecimals); // E.g. 2.5 or 12.2
        console.log('userStore.outTokenAmount: ', $userStore.outTokenAmount);


				// Compute the raw amount now that we have amount & decimals
        // U: Actually, escrow.in/outAmount is already type BN, so can
        // simply use BN.toNumber()!
				$userStore.outTokenRawAmount = $escrowStore.escrow.outAmount.toNumber();
			}

			// 3. Update the user's IN TOKEN details
			// Q: FIXME What if the buyer doesn't have an existing inTokenATA?
			// Eg. First time the buyer will have this token in their wallet.
			// NOTE For now I'm going to assume they have the ATA
			let buyerInTokenAccountInfo = $walletTokenAccountsStore.find((tokenAccount) => {
				return tokenAccount.account.data.parsed.info.mint === $userStore.inTokenMint;
			});

			if (buyerInTokenAccountInfo) {
        console.log('buyerInTokenAccountInfo FOUND!')

				$userStore.inTokenATA = buyerInTokenAccountInfo.pubkey;
				$userStore.inTokenRawBalance = parseInt(
					buyerInTokenAccountInfo.account.data.parsed.info.tokenAmount.amount
				); // "30000000"
				$userStore.inTokenBalance =
					buyerInTokenAccountInfo.account.data.parsed.info.tokenAmount.uiAmount; // 3
        // TODO Compute the IN RAW BALANCE
				$userStore.inTokenDecimals =
					buyerInTokenAccountInfo.account.data.parsed.info.tokenAmount.decimals;

        $userStore.inTokenAmount = $escrowStore.escrow.outAmount.toNumber() / (10 ** $userStore.inTokenDecimals);
        console.log('userStore.inTokenAmount: ', $userStore.inTokenAmount); 

				// Compute the raw amount now that we have amount & decimals
        // U: Actually, escrow.in/outAmount is already type BN, so can
        // simply use BN.toNumber()!
				$userStore.inTokenRawAmount = $escrowStore.escrow.inAmount.toNumber();
			}

			console.log('ACCEPT::$userStore BEFORE sending tx: ', $userStore);

			// Q: How to get the SELLER ATA addresses?
			// A: Use getParsedTokenAccountsByOwner + filter on mint!
			// REF: https://solanacookbook.com/references/token.html#how-to-get-all-token-accounts-by-owner
			let sellerInTokenAccountInfo = await $workspaceStore.connection.getParsedTokenAccountsByOwner(
				$escrowStore.escrow.authority,
				{
					mint: $escrowStore.escrow.inMint
				}
			);

			// Q: This a good place to check if ATA exists?
			// Q: FIXME What if the buyer doesn't have an existing inTokenATA?
			// Eg. First time the buyer will have this token in their wallet.
			// NOTE For now I'm going to assume they have the ATA
			const sellerInTokenATA = sellerInTokenAccountInfo.value[0].pubkey;
			// Q: Do I need to double-check the token balances after the tx?
			// TODO Look into adding this to the tests
			// const sellerInTokenBalance = sellerInTokenAccountInfo.value[0].account.data.parsed.info.tokenAmount.uiAmount;

			const tx = await $workspaceStore.program?.methods
				.accept()
				.accounts({
					buyer: $walletStore.publicKey as anchor.web3.PublicKey,
					escrow: $escrowStore.pda as anchor.web3.PublicKey,
					escrowedOutTokenAccount: $escrowStore.escrow
						?.escrowedOutTokenAccount as anchor.web3.PublicKey,
					// Q: How would I get the seller's inTokenATA with only a userStore?
					// The buyer's info would be in the userStore
					// A: Use getParsedTokenAccountsByOwner! (see above)
					sellerInTokenAccount: sellerInTokenATA,
					buyerInTokenAccount: $userStore.inTokenATA as anchor.web3.PublicKey,
					buyerOutTokenAccount: $userStore.outTokenATA as anchor.web3.PublicKey,
					tokenProgram: TOKEN_PROGRAM_ID
				})
				.signers([]) // NOTE buyer is wallet, so don't need!
				.rpc({ skipPreflight: true });

			console.log('TxHash ::', tx);

			const escrowedOutTokenAccountBalance =
				await $workspaceStore.provider?.connection.getTokenAccountBalance(
					$escrowStore.escrow?.escrowedOutTokenAccount as anchor.web3.PublicKey
				);
			console.log('ACCEPT::escrowedOutTokenAccountBalance: ', escrowedOutTokenAccountBalance);
			// ACCEPT::escrowedOutTokenAccountBalance:  {
			//   context: { apiVersion: '1.10.38', slot: 81 },
			//   value: { amount: '0', decimals: 8, uiAmount: 0, uiAmountString: '0' }
			// }

			// Fetch data after tx confirms & update global state
			const currentEscrow = (await $workspaceStore.program?.account.escrow.fetch(
				$escrowStore.pda as anchor.web3.PublicKey
			)) as EscrowObject;

			escrowStore.set({
				escrow: currentEscrow,
				pda: $escrowStore.pda as anchor.web3.PublicKey
			} as EscrowStoreObject);
			console.log('ACCEPT::$escrowStore: ', $escrowStore);

      // Update the escrowsStore
      escrowsStore.updateEscrow($escrowStore.pda as anchor.web3.PublicKey, $escrowStore.escrow);

			// Confirm that seller/buyer ATAs also updated correctly
			// TODO Need to also account for SOL token exchanges (not just SPL)
			// const currentSellerOutTokenBalance =
			// 	await $workspaceStore.provider?.connection.getTokenAccountBalance(
			// 		$sellerStore.outTokenATA as anchor.web3.PublicKey
			// 	);
			// $sellerStore.outTokenBalance = currentSellerOutTokenBalance?.value.uiAmount as number;

			// const currentSellerInTokenBalance =
			// 	await $workspaceStore.provider?.connection.getTokenAccountBalance(
			// 		$sellerStore.inTokenATA as anchor.web3.PublicKey
			// 	);
			// $sellerStore.inTokenBalance = currentSellerInTokenBalance?.value.uiAmount as number;

			const currentBuyerInTokenBalance =
				await $workspaceStore.provider?.connection.getTokenAccountBalance(
					$userStore.inTokenATA as anchor.web3.PublicKey
				);
			$userStore.inTokenBalance = currentBuyerInTokenBalance?.value.uiAmount as number;

			const currentBuyerOutTokenBalance =
				await $workspaceStore.provider?.connection.getTokenAccountBalance(
					$userStore.outTokenATA as anchor.web3.PublicKey
				);
			$userStore.outTokenBalance = currentBuyerOutTokenBalance?.value.uiAmount as number;

			// Add to notificationStore
			notificationStore.add({
				type: 'success',
				message: 'Transaction successful!',
				txid: tx
			});
		} catch (error) {
      console.log(error);
    }
	}

	async function handleCancelTrade() {
		// U: Copying some of the code from SendTransaction.svelte to add
		// better notifications.
		if (!$walletStore.publicKey) {
			notificationStore.add({ type: 'error', message: `Wallet not connected!` });
			console.log('error', `Send Transaction: Wallet not connected!`);
			return;
		}

		let tx: anchor.web3.TransactionSignature = '';

		try {
			tx = (await $workspaceStore.program?.methods
				.cancel()
				.accounts({
					seller: $walletStore.publicKey as anchor.web3.PublicKey,
					escrow: $escrowStore.pda as anchor.web3.PublicKey,
					escrowedOutTokenAccount: $escrowStore.escrow
						?.escrowedOutTokenAccount as anchor.web3.PublicKey,
					sellerOutTokenAccount: $userStore.outTokenATA as anchor.web3.PublicKey,
					tokenProgram: TOKEN_PROGRAM_ID
				})
				.signers([]) // NOTE seller is wallet, so don't need!
				.rpc({ skipPreflight: true })) as string;

			console.log('TxHash ::', tx);

			// NOTE After closing the account it's no longer available!
			// If we try to fetch the PDA, it will error: Account does not exist!
			// Let's reset our escrowStore for the UI.
			escrowStore.reset();
			console.log('CANCEL::$escrowStore: ', $escrowStore);

			// Add to notificationStore
			notificationStore.add({
				type: 'success',
				message: 'Transaction successful!',
				txid: tx
			});
		} catch (error: any) {
			// Add to notificationStore
			notificationStore.add({
				type: 'error',
				message: 'Transaction failed!',
				description: error?.message,
				txid: tx
			});
			console.log('error', `Transaction failed! ${error?.message}`, tx);
		}
	}
</script>

{#if $escrowStore.escrow !== null}
	<div class="flex w-full justify-evenly">
		<div class="grid flex-grow card bg-base-300 rounded-box place-items-center">
			<div class="form-control mb-4">
				<div class="stat place-items-center">
					<div class="stat-title">Escrow</div>
				</div>
				<label class="input-group input-group-vertical pt-1">
					<span>Escrow PDA</span>
					<input
						type="text"
						placeholder=""
						class="input input-bordered"
						bind:value={$escrowStore.pda}
						disabled
					/>
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span>Out Amount</span>
					<input
						type="text"
						placeholder=""
						class="input input-bordered"
						bind:value={$escrowStore.escrow.outAmount}
						disabled
					/>
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span>In Amount</span>
					<input
						type="text"
						placeholder=""
						class="input input-bordered"
						bind:value={$escrowStore.escrow.inAmount}
						disabled
					/>
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span>Escrowed Token Account</span>
					<input
						type="text"
						placeholder=""
						class="input input-bordered"
						bind:value={$escrowStore.escrow.escrowedOutTokenAccount}
						disabled
					/>
				</label>
				<button class="btn btn-accent mt-1" on:click={handleAcceptTrade}>Accept Escrow</button>
				<button class="btn btn-error mt-1" on:click={handleCancelTrade}>Cancel Escrow</button>
			</div>
		</div>
	</div>
{/if}
<div class="flex items-center justify-center">
	<a role="button" class="btn " href="/escrow">Back</a>
</div>
