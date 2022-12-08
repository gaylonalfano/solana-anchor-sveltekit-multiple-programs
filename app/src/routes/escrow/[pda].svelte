<script lang="ts">
	// REF: UI idea from: https://github.com/paul-schaaf/escrow-ui/blob/master/src/Alice.vue
	// REF: Good example of web3/spl-token use: https://github.com/paul-schaaf/escrow-ui/blob/master/src/util/initEscrow.ts
	import type anchor from '@project-serum/anchor';
	import {
		createAssociatedTokenAccountInstruction,
		getAccount,
		getAssociatedTokenAddress,
		getOrCreateAssociatedTokenAccount,
		TOKEN_PROGRAM_ID
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
	import { getParsedTokenAccountsByOwner } from '../../helpers/escrow/getParsedTokenAccountsByOwner';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import { Transaction, PublicKey } from '@solana/web3.js';
	import { goto } from '$app/navigation';
	// import type { EscrowObject, EscrowStoreObject } from 'src/models/escrow-types';

	// TODOS:
  // - DONE Test when BOTH seller and buyer don't have an ATA
	// - DONE getOrCreateAssociatedTokenAccount() for SELLER inTokenATA!
	// - Create escrow-types.ts file to clean up
	// - DONE Update/set userStore values for ACCEPT
	// - DONE Update/set userStore values for CANCEL
	// - DONE Update escrowStore on wallet disconnect/connect
	// - DONE Update escrowStore on page refresh
	// - DONE escrowsStore state after cancel();
	// - DONE Disable accept/cancel buttons based on isEscrowAuthority
	// - DONE Handle the scenario when the ATA do not exist (need to create)
	//    - NOTE Look into getOrCreateAssociatedTokenAccount() as potential solution
	//    - REF: https://www.quicknode.com/guides/solana-development/how-to-transfer-spl-tokens-on-solana
	//    - U: Added tests using getOrCreateAssociatedTokenAccount().

	// Create some variables to react to Stores state
	$: hasEscrowsStoreValues = $escrowsStore.length > 0;
	$: hasEscrowStoreValues = $escrowStore.escrow !== null && $escrowStore.pda !== null;
	$: isEscrowAuthority =
		$walletStore.publicKey?.toBase58() === $escrowStore.escrow?.authority.toBase58();

	$: if (hasEscrowsStoreValues && !hasEscrowStoreValues) {
		console.log('No escrowStore values found! Trying to set...');
		try {
			let currentEscrowStoreObject = $escrowsStore.find(
				(value: EscrowStoreObject) => value.pda?.toBase58() === $page.params.pda
			) as EscrowStoreObject;

			// console.log('currentEscrowStoreObject: ', currentEscrowStoreObject);
			if (currentEscrowStoreObject) {
				console.log('Current Escrow found in escrowsStore. Setting escrowStore values.');
				escrowStore.set({
					escrow: currentEscrowStoreObject.escrow,
					pda: currentEscrowStoreObject.pda
				});
			} else {
				console.log('Current Escrow NOT found in escrowsStore. Trying to get...');
				// Q: Should I try a fresh escrowStore.getEscrowAccount()?
				// U: Trying for now... need to test
				escrowStore.getEscrowAccount(
					constants.NON_CUSTODIAL_ESCROW_PROGRAM_ID,
					new PublicKey($page.params.pda),
					$workspaceStore.connection
				);
			}
		} catch (e) {
			console.log('Escrow not found in escrowsStore. Single escrowStore not updated.');
			console.warn(e);
		}
	}

	$: {
		console.log('escrowStore: ', $escrowStore);
		console.log('userStore: ', $userStore);
		console.log('isEscrowAuthority: ', isEscrowAuthority);
	}

	async function navigateAndSetStoreState() {
		await goto(`/escrow`);
		// Now go something with the data/db, etc. (e.g., set Store values):
		// NOTE Using escrowsStore.deleteEscrow() doesn't seem to work.
		// Going to try to do a fresh fetch instead
		// U: Fresh fetch helps! This correctly navigates and then fetches
		// the latest escrow accounts state and updates escrowsStore array!
		escrowsStore.getEscrowAccounts(
			constants.NON_CUSTODIAL_ESCROW_PROGRAM_ID,
			$workspaceStore.connection
		);
		escrowStore.reset();
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
			// console.log('userStore.outTokenMint: ', $userStore.outTokenMint.toBase58());
			// console.log('userStore.inTokenMint: ', $userStore.inTokenMint.toBase58());

			// 2. Update the user's OUT TOKEN details
			// Q: How to get the BUYER ATA address with only a mint and wallet?
			// A: Filter/find on $walletTokenAccountsStore!
			let buyerOutTokenAccountInfo = $walletTokenAccountsStore.find((tokenAccount) => {
				return tokenAccount.account.data.parsed.info.mint === $userStore.outTokenMint?.toBase58();
			});

			if (buyerOutTokenAccountInfo) {
				console.log('buyerOutTokenAccountInfo FOUND!');

				$userStore.outTokenATA = buyerOutTokenAccountInfo.pubkey;

				$userStore.outTokenRawBalance = parseInt(
					buyerOutTokenAccountInfo.account.data.parsed.info.tokenAmount.amount
				); // "30000000"

				$userStore.outTokenBalance =
					buyerOutTokenAccountInfo.account.data.parsed.info.tokenAmount.uiAmount; // 3

				$userStore.outTokenDecimals =
					buyerOutTokenAccountInfo.account.data.parsed.info.tokenAmount.decimals;

				// Q: Can I just use BN.toNumber() method?
				// A: No! BN.toNumber() returns the RAW amounts! Need to account for decimals!
				if ($userStore.outTokenDecimals && $escrowStore.escrow.inAmount) {
					$userStore.outTokenAmount =
						$escrowStore.escrow.inAmount.toNumber() / 10 ** $userStore.outTokenDecimals; // E.g. 2.5 or 12.2
					console.log('userStore.outTokenAmount: ', $userStore.outTokenAmount);

					// Compute the raw amount now that we have amount & decimals
					// U: Actually, escrow.in/outAmount is already type BN, so can
					// simply use BN.toNumber()!
					$userStore.outTokenRawAmount = $escrowStore.escrow.outAmount.toNumber();
				}
			}

			// 3. Update the user's IN TOKEN details
			// Q: What if the buyer doesn't have an existing inTokenATA?
			// Eg. First time the buyer will have this token in their wallet.
			// NOTE For now I'm going to assume they have the ATA
			// A: Must create the ATA using getOrCreateAssociatedTokenAccount()!
			let buyerInTokenAccountInfo;

			buyerInTokenAccountInfo = $walletTokenAccountsStore.find((tokenAccount) => {
				return tokenAccount.account.data.parsed.info.mint === $userStore.inTokenMint?.toBase58();
			});

			if (buyerInTokenAccountInfo) {
				console.log('buyerInTokenAccountInfo FOUND!');

				$userStore.inTokenATA = buyerInTokenAccountInfo.pubkey;
				$userStore.inTokenRawBalance = parseInt(
					buyerInTokenAccountInfo.account.data.parsed.info.tokenAmount.amount
				); // "30000000"
				$userStore.inTokenBalance =
					buyerInTokenAccountInfo.account.data.parsed.info.tokenAmount.uiAmount; // 3

				$userStore.inTokenDecimals =
					buyerInTokenAccountInfo.account.data.parsed.info.tokenAmount.decimals;

				if ($userStore.inTokenDecimals && $escrowStore.escrow.outAmount) {
					$userStore.inTokenAmount =
						$escrowStore.escrow.outAmount.toNumber() / 10 ** $userStore.inTokenDecimals;
					console.log('userStore.inTokenAmount: ', $userStore.inTokenAmount);

					// Compute the raw amount now that we have amount & decimals
					// U: Actually, escrow.in/outAmount is already type BN, so can
					// simply use BN.toNumber()!
					$userStore.inTokenRawAmount = $escrowStore.escrow.inAmount.toNumber();
				}
			} else {
				// Need to create the ATA using getOrCreateAssociatedTokenAccount()
				let buyerInTokenAddress;

				try {
					// NOTE Cannot directly call getOrCreateAssociatedTokenAccount() since
					// we encounter Signer type issues for for payer property. Have to manually
					// build the intruction.
					buyerInTokenAddress = await getAssociatedTokenAddress(
						$userStore.inTokenMint,
						$walletStore.publicKey as anchor.web3.PublicKey
					);

					const tx = new Transaction().add(
						createAssociatedTokenAccountInstruction(
							$walletStore.publicKey as anchor.web3.PublicKey,
							buyerInTokenAddress as anchor.web3.PublicKey,
							$userStore.walletAddress,
							$userStore.inTokenMint
						)
					);

					const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
					console.log('signature: ', signature);

					const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
					const confirmedTx = await $workspaceStore.connection.confirmTransaction({
						blockhash: latestBlockhash.blockhash,
						lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
						signature: signature
					});

					console.log('confirmedTx: ', confirmedTx);
				} catch (error) {
					console.log(error);
				}

				// After we create the ATA, need to fetch the account and update userStore
				// Q: Use getAccount() or getTokenAccountBalance()?
				// A: Use getTokenAccountBalance() as it has decimals
				buyerInTokenAccountInfo = await $workspaceStore.connection.getTokenAccountBalance(
					buyerInTokenAddress as anchor.web3.PublicKey
				);

				console.log('buyerInTokenAccountInfo AFTER creating ATA: ', buyerInTokenAccountInfo);

				$userStore.inTokenATA = buyerInTokenAddress as anchor.web3.PublicKey;
				$userStore.inTokenRawBalance = parseInt(buyerInTokenAccountInfo.value.amount);
				$userStore.inTokenBalance = buyerInTokenAccountInfo.value.uiAmount;
				$userStore.inTokenDecimals = buyerInTokenAccountInfo.value.decimals;
				$userStore.inTokenAmount =
					$escrowStore.escrow.outAmount.toNumber() / 10 ** $userStore.inTokenDecimals;
				$userStore.inTokenRawAmount = $escrowStore.escrow.outAmount.toNumber();
			}

			console.log('ACCEPT::$userStore BEFORE sending tx: ', $userStore);

			let sellerInTokenAccountInfo;
			let sellerInTokenATA;

			// Q: How to get the SELLER ATA addresses?
			// A: Use getParsedTokenAccountsByOwner + filter on mint!
			// REF: https://solanacookbook.com/references/token.html#how-to-get-all-token-accounts-by-owner
			sellerInTokenAccountInfo = await $workspaceStore.connection.getParsedTokenAccountsByOwner(
				$escrowStore.escrow.authority,
				{
					mint: $escrowStore.escrow.inMint
				}
			);


			if (sellerInTokenAccountInfo.value.length > 0) {
        console.log('sellerInTokenAccount FOUND: ', sellerInTokenAccountInfo);
				// Q: This a good place to check if ATA exists?
				// Q: FIXME What if the buyer doesn't have an existing inTokenATA?
				// Eg. First time the buyer will have this token in their wallet.
				// A: Gotta create the ATA!
				// NOTE For now I'm going to assume they have the ATA
				sellerInTokenATA = sellerInTokenAccountInfo.value[0].pubkey;
				// Q: Do I need to double-check the token balances after the tx?
				// TODO Look into adding this to the tests
				// const sellerInTokenBalance = sellerInTokenAccountInfo.value[0].account.data.parsed.info.tokenAmount.uiAmount;
			} else {
				// Seller doesn't have an inTokenATA (no inMint in wallet)
				let sellerInTokenAddress;

				try {
					sellerInTokenAddress = await getAssociatedTokenAddress(
						$escrowStore.escrow.inMint,
						$escrowStore.escrow.authority
					);

					const tx = new Transaction().add(
						createAssociatedTokenAccountInstruction(
							$walletStore.publicKey as anchor.web3.PublicKey,
							sellerInTokenAddress,
							$escrowStore.escrow.authority,
							$escrowStore.escrow.inMint
						)
					);

					const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
					console.log('signature: ', signature);

					const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
					const confirmedTx = await $workspaceStore.connection.confirmTransaction({
						blockhash: latestBlockhash.blockhash,
						lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
						signature: signature
					});
          console.log('confirmedTx: ', confirmedTx);

				} catch (error) {
					console.log(error);
				}

        // Set sellerInTokenATA
        // NOTE No need to fetch data since we just need the ATA
        sellerInTokenAccountInfo = await $workspaceStore.connection.getTokenAccountBalance(
          sellerInTokenAddress as anchor.web3.PublicKey
        );

        sellerInTokenATA = sellerInTokenAddress;

			}

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
					sellerInTokenAccount: sellerInTokenATA as anchor.web3.PublicKey,
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
			// U: Use the helper getParsedTokenAccountsByOwner() instead
			await getParsedTokenAccountsByOwner(
				$workspaceStore.connection,
				$walletStore.publicKey as anchor.web3.PublicKey
			);

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

		// Check whether userStore.walletAddress (or walletStore.pubkey) matches
		// the escrowStore.authority address
		if (!isEscrowAuthority) {
			console.log('userStore.walletAddress does NOT match escrow.authority!');
			notificationStore.add({ type: 'error', message: 'Wallet is not escrow authority!' });
			console.log('error', `Wallet is not escrow authority!`);
			return;
		}

		if ($escrowStore.escrow === null) {
			notificationStore.add({
				type: 'error',
				message: 'Escrow account data is null!'
			});
			console.log('error', 'Escrow account data is null!');
			return;
		}

		try {
			// Update/confirm our userStore is updated
			$userStore.outTokenMint = $escrowStore.escrow.outMint as anchor.web3.PublicKey;

			// Q: FIXME What if the seller doesn't have an existing outTokenATA?
			// NOTE For now I'm going to assume they have the ATA
			let sellerOutTokenAccountInfo = $walletTokenAccountsStore.find((tokenAccount) => {
				return tokenAccount.account.data.parsed.info.mint === $userStore.outTokenMint?.toBase58();
			});

			if (sellerOutTokenAccountInfo) {
				console.log('sellerOutTokenAccountInfo FOUND!');
				$userStore.outTokenATA = sellerOutTokenAccountInfo.pubkey;
			}

			let tx: anchor.web3.TransactionSignature = '';

			try {
				tx = (await $workspaceStore.program?.methods
					.cancel()
					.accounts({
						seller: $walletStore.publicKey as anchor.web3.PublicKey, // userStore.walletAddress
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

				// Reroute back to the main page
				// NOTE After closing the account it's no longer available!
				// If we try to fetch the PDA, it will error: Account does not exist!
				// Let's reset our escrowStore for the UI.
				// IMPORTANT If we escrowStore.reset() here, then the reactives trigger
				// and find a match in escrowsStore array which hasn't updated yet!
				// Q: Should I consider using goto() to reroute and set
				// store state after resolving?
				// U: Yes, for now seems to help prevent a reactive trigger
				// U: Going to do a fresh fetch to update instead of trying to use deleteEscrow()
				await navigateAndSetStoreState();
				// U: Need to refetch token accounts for updated balances, etc.
				await getParsedTokenAccountsByOwner(
					$workspaceStore.connection,
					$walletStore.publicKey as anchor.web3.PublicKey
				);
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
		} catch (error) {}
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
				{#if $walletStore.publicKey && $escrowStore.escrow.isActive}
					{#if isEscrowAuthority}
						<button
							class="btn btn-error mt-1"
							on:click={handleCancelTrade}
							disabled={!isEscrowAuthority}>Cancel Escrow</button
						>
					{:else}
						<button
							class="btn btn-accent mt-1"
							on:click={handleAcceptTrade}
							disabled={isEscrowAuthority}>Accept Escrow</button
						>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}
<div class="flex items-center justify-center">
	<a role="button" class="btn " href="/escrow">Back</a>
</div>
