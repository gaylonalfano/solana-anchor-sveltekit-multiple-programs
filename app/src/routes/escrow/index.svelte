<script lang="ts">
	// REF: UI idea from: https://github.com/paul-schaaf/escrow-ui/blob/master/src/Alice.vue
	// REF: Good example of web3/spl-token use: https://github.com/paul-schaaf/escrow-ui/blob/master/src/util/initEscrow.ts
	import {
		Keypair,
		LAMPORTS_PER_SOL,
		PublicKey,
		SystemProgram,
		Transaction,
		type GetAccountInfoConfig
	} from '@solana/web3.js';
	import * as anchor from '@project-serum/anchor';
	import {
		TOKEN_PROGRAM_ID,
		MINT_SIZE,
		createInitializeMintInstruction,
		getMinimumBalanceForRentExemptMint,
		getMint,
		getAssociatedTokenAddress,
		createAssociatedTokenAccountInstruction,
		createMintToCheckedInstruction,
		type Mint,
		getAccount
	} from '@solana/spl-token';

	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	// NOTE Anchor.toml setting can copy IDL to specified dir. However, the 'idl' prop
	// on AnchorConnectionProvider wants a JSON instead.
	// import { IDL as idl } from '../idl/non_custodial_escrow';

	import { notificationStore } from '../../stores/notification';
	import { balanceStore } from '$stores/balance';
	import { setupStore } from '$stores/escrow/setup-store';
	import { sellerStore } from '$stores/escrow/seller-store';
	import { buyerStore } from '$stores/escrow/buyer-store';
	import {
		wMintStore,
		xMintStore,
		yMintStore,
		zMintStore,
		walletTokenAccountsStore
	} from '$stores/escrow/tokens-store';
	import { customProgramStore } from '$stores/escrow/custom-program-store';
	import { userStore } from '$stores/escrow/user-store';
	import {
		escrowStore,
		type EscrowObject,
		type EscrowStoreObject
	} from '$stores/escrow/escrow-store';
	import { escrowsStore } from '$stores/escrow/escrows-store';
	import Escrow from '$lib/Escrow.svelte';
	import { getParsedTokenAccountsByOwner } from '../../helpers/escrow/getParsedTokenAccountsByOwner';
	import * as constants from '../../helpers/escrow/constants';
	import { get } from 'svelte/store';
	// import type { EscrowObject, EscrowStoreObject } from 'src/models/escrow-types';

	// TODOS:
	// - Add support for SOL-SPL escrow swaps (*see lib.rs)
	// - DONE Add tests for if buyer/seller don't have the ATA for their inTokenATA
	// - Add tests for confirming token balances are accurately credited/debited
	// - DONE Fetch all active Escrows involving wallet and display
	//    - First, simply display active Escrows on page load
	// - WIP Add a Token select menu rather than hardcoding X/Y
	//    - DONE Build getTokenAccountsByOwner for select: https://github.com/abbylow/raydium-test/blob/main/src/utils/index.ts
	//    - Update x/yMintStores OR update buyer/SellerStores to store
	//      token info and balance based on selected token mint address
	//      - U: Ended up leaving x/yMintStores alone. Updated buyer/sellerStores instead
	//    - DONE Limit mint address input to 32-44 chars long (base58 pubkeys)
	//    - DONE Fix BN/decimal issue. May need to create helper fn to calculate
	//      the outTokenAmount / parsed.info.tokenAmount.amount (or sth)
	//    - Limit amount to be <= outTokenBalance
	//    - DONE Add validation inside create escrow handler for raw amounts
	// - DONE Clean up UI now that customProgram is available
	// - DONE Create custom Store for escrow
	//    - Implement the store into the code to replace local vars
	//    - U: May need expand custom EscrowStoreObject to include
	//      fields NOT saved on-chain ie:
	//      programId, xAmountFromSeller, yAmountFromBuyer,escrowedXBalance
	//    - U: Updated Escrow account struct to have xMint, xAmount and buyer fields
	// - DONE Create custom Store for Buyer? Seller?
	// - DONE Create custom Store X and Y Mints
	// - DONE Declare return types for async functions (Promise<web3.Transaction>, etc.)
	//    - U: Not needed! Just need to save await sendTransaction() to local var
	// - DONE Add reactive statements for $walletStore.publicKey to fetch state
	// - DONE Add Dapp_Program Account Struct that allows the same wallet to init multiple Escrow
	//   exchanges. Currently seeds will only allow 1 unique escrow. This is a bigger task!
	// - DONE Add ability to cancel Escrow by authority (wallet)
	// - DONE Add helper resetStores() method for successful accept or cancel
	// - DONE Rename Escrow struct fields to out/in instead of x/y
	// - DONE customProgramStore getting wiped/reset after cancel()
	//    - Perform a quick check on customProgramStore inside the cancel() and accept()
	//      If it's not there, then try to fetch the latest.
	// - DONE formState.outTokenBalance needs to update after inititialize

	// Q: Losing reactivity in UI. Not sure why. Just seems like after I sendTransaction(),
	// no other async/awaits really work unless I add to button onclick handler...
	// U: Is it my connection's commitment level? Default is 'processed' I think,
	// but maybe I need to set to 'confirmed'?
	// U: NOPE. Commitment level didn't have any impact.
	// A: Need to use Stores to maintain reactivity!
	// NOTE Need to type anchor.Wallet to get 'payer' property or errors
	// const seller = ($workspaceStore.provider as anchor.AnchorProvider).wallet as anchor.Wallet;
	// const buyer = anchor.web3.Keypair.generate();
	const buyer = constants.BUYER_WALLET_ADDRESS;
	// U: Going to store token Keypairs OUTSIDE of createToken() methods.
	// The idea is to stop recreating tokens on refreshes, etc.
	let wMintKeypair = Keypair.generate();
	let wMintPubkey = wMintKeypair.publicKey;

	let xMintKeypair = Keypair.generate();
	let xMintPubkey = xMintKeypair.publicKey;

	let yMintKeypair = Keypair.generate();
	let yMintPubkey = yMintKeypair.publicKey;

	let zMintKeypair = Keypair.generate();
	let zMintPubkey = zMintKeypair.publicKey;

	// Q: Is there an SPL 'Account' type to use for TS?
	// A: Yes, it's 'Mint'
	// U: Replacing local vars with buyer/sellerStores

	// Q: What is workspaceStore.baseAccount? It changes on each refresh...
	// Q: How am I supposed to pass AnchorProvider with simple solana/spl-token methods?
	// Getting issues with Signer vs. Wallet...
	// A: You CAN'T because frontend never has access to Keypairs!
	// MUST compose ix and txs MANUALLY following Cookbook

	// Q: How should I create reactive state?
	// A: Create Stores!
	// U: Going with some local variables and an updateEscrowState() helper
	// Q: Now that I have created escrowStore, could implementing it be enough?
	// Would I even need the global escrowState, updateEscrowState(), etc.?
	// Perhaps may need some derived Store that combines all? Need to test...
	// A: Implementing escrowStore is enough! Can purge/remove lots of original vars
	// U: Adding SwapUI. Could capture all the swapUI data inside this formState obj.
	// U: Adding select menu for token options in wallet, so adding some vars to bind
	// let selectedToken: string; // Going to be the mint address for now
	// let selectedTokenBalance = 0;
	// let reactiveTokenBalance = 0;

	let formState = {
		escrow: '',
		programId: '',
		escrowIsActive: '',
		escrowHasExchanged: '',
		seller: '',
		buyer: '',
		sellerXToken: '',
		buyerYToken: '',
		xAmountFromSeller: 0,
		yAmountFromBuyer: 0,
		// NOTE Adding out/inToken fields (see seller/buyerStores)
		outTokenMint: 'SOL',
		outTokenATA: '',
		outTokenAmount: '',
		outTokenBalance: 0,
		inTokenMint: '',
		inTokenATA: '',
		inTokenAmount: '',
		inTokenBalance: 0
	};

	let formErrors = {
		outTokenMint: '',
		outTokenATA: '',
		outTokenAmount: '',
		outTokenBalance: '',
		inTokenMint: '',
		inTokenATA: '',
		inTokenAmount: '',
		inTokenBalance: ''
	};

	let escrowInputsAreValid = false;

	// $: hasCreatedTokens = if(yMint != null && xMint != null) return true;

	$: hasWorkspaceProgramReady =
		$workspaceStore &&
		$workspaceStore.program &&
		$workspaceStore.program.programId.toBase58() ===
			constants.NON_CUSTODIAL_ESCROW_PROGRAM_ID.toBase58();
	$: hasWalletReadyForFetch =
		$walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting;

	// $: if ($walletTokenAccountsStore && $walletTokenAccountsStore.length > 0) {
	// 	reactiveTokenBalance = setSelectedTokenMintAtaBalanceDecimals(selectedToken) as number;
	// }

	$: hasRequiredEscrowInputs =
		$userStore.outTokenMint !== null &&
		$userStore.outTokenATA !== null &&
		$userStore.outTokenDecimals !== null &&
		$userStore.outTokenAmount !== null &&
		$userStore.outTokenRawAmount !== null &&
		$userStore.inTokenMint !== null &&
		$userStore.inTokenAmount !== null;

	// TODO hasValidEscrowInputs

	$: if (hasWalletReadyForFetch && hasWorkspaceProgramReady) {
		console.log('REFETCH!');
		// NOTE Can't use getAllProgramAccounts() just yet until I generalize it
		// U: Going to modify my xMintStore to use a custom type in order to
		// save the mint address, so I can pass it to getMint(xMintStore.pubkey)
		// to refetch if the UI state gets wiped.
		// FIXME Trying to prevent creating multiple mint tokens on refresh...

		try {
			// Attempt to grab xMintStore, yMintStore values
			// Attempt to getMint() using Store address
			// Finally recreate the tokens!
			// Q: Do I need a CONST to store the addresses or just
			// save in the xMintStore is enough?
			// U: I'm thinking I need to create CONSTANTS to represent
			// each token Keypair and then just use them inside the createToken()
			// functions. Otherwise, it will generate again and again...
			// A: Just used Stores instead for now.
			get(wMintStore);
			get(xMintStore);
			get(yMintStore);
			get(zMintStore);

			// TODO Don't forget about yMintStore, w, z!
			if ($xMintStore.address !== null && $xMintStore.mint === null) {
				// Store maintains mint address but need to get mint account info
				// Q: Do I need to await or resolve Promise? How? tick()?
				let xMintInfo: Mint;
				getMint($workspaceStore.connection, $xMintStore.address).then((response) => {
					xMintInfo = response;
					console.log('xMintInfo: ', xMintInfo);
					// $xMintStore.mint = xMintInfo;
					xMintStore.set({ address: $xMintStore.address, mint: xMintInfo });
				});
				// console.log('Fetched xMintInfo: ', xMintInfo);
				// $xMintStore.mint = xMintInfo;
			} else if ($xMintStore.address === null && $xMintStore.mint === null) {
				// Need to recreate the mint
				console.log('X Mint not found. Need to create token.');
			}
		} catch (e) {
			console.log('Mint Stores unavailable! Need to create token!');
			console.log(e);
		}
	}

	$: {
		// console.log('workspaceStore: ', $workspaceStore);
		// console.log('walletStore: ', $walletStore);
		console.log('wMintStore: ', $wMintStore);
		console.log('xMintStore: ', $xMintStore);
		console.log('yMintStore: ', $yMintStore);
		console.log('zMintStore: ', $zMintStore);
		// console.log('walletTokenAccountsStore: ', $walletTokenAccountsStore);
		// console.log('balanceStore: ', $balanceStore);
		// console.log('selectedToken: ', selectedToken);
		// console.log('selectedTokenBalance: ', selectedTokenBalance);
		// console.log('reactiveTokenBalance: ', reactiveTokenBalance);
		// console.log('sellerStore: ', $sellerStore);
		//   console.log('sellerStore.inTokenATA: ', $sellerStore.inTokenATA?.toBase58())
		//   console.log('sellerStore.inTokenMint: ', $sellerStore.inTokenMint?.toBase58())
		//   console.log('sellerStore.outTokenATA: ', $sellerStore.outTokenATA?.toBase58())
		//   console.log('sellerStore.outTokenMint: ', $sellerStore.outTokenMint?.toBase58())
		// console.log('buyerStore: ', $buyerStore);
		// console.log('escrowStore: ', $escrowStore);
		// console.log('escrowsStore: ', $escrowsStore);
		// console.log('formState: ', formState);
		// console.log('hasRequiredEscrowInputs: ', hasRequiredEscrowInputs);
		// console.log('userStore: ', $userStore);
		console.log('setupStore: ', $setupStore);
		// console.log('customProgramStore: ', $customProgramStore);
		// console.log('userStore.outTokenATA: ', $userStore.outTokenATA?.toBase58());
	}

	// Q: How could I use X/Y tokens from wallets or mint addresses?
	// Currently I hardcode my X & Y Mints, but I want a UI that grabs tokens
	// from connected wallet, and I want the Seller to be able to select and/or
	// paste Mint address of the Y token they want. This means that I need to be
	// setting/updating the x/yMintStores onChange. However, I also have a Store
	// for keeping track of tokens in the wallet. I'd need its data to update/set
	// my x/yMintStores...
	// A: For SOL use getBalance(), for all other SPL tokens use getParsedTokenAccountsByOwner()
	// U: For now, I've added new out/inToken fields to the seller/buyerStores so
	// I can start initializing Escrows with other tokens (not just X/Y only)
	// U: Move the variables into formState object instead
	// U: Think I need to create an outTokenMintStore etc. so I can keep track of
	// the selected token and reactively do the compute based on user's outTokenAmount
	// U: Scratch that. Just going to expand sellerStore for now.
	function setSelectedTokenMintAtaBalanceDecimals() {
		// NOTE Check if the selectedToken === 'SOL' so return the SOL
		// balance from balanceStore instead.
		console.log('formState.outTokenMint: ', formState.outTokenMint);
		if (formState.outTokenMint === 'SOL') {
			formState.outTokenBalance = $balanceStore.balance;
			// U: Need to update sellerStore values as well to init escrow
			$userStore.outTokenMint = constants.SOL_PUBLIC_KEY;
			$userStore.outTokenDecimals = constants.SOL_DECIMALS;
			// Q: Should I set outTokenATA to wallet address for SOL? Or leave null?
			// TODO Still need to update my init escrow to allow SOL
			$userStore.outTokenATA = $walletStore.publicKey;
			$userStore.outTokenBalance = $balanceStore.balance;
			$userStore.outTokenRawBalance = $balanceStore.balance * 10 ** constants.SOL_DECIMALS;
		}

		let matchingToken = $walletTokenAccountsStore.find((tokenAccount) => {
			return tokenAccount.account.data.parsed.info.mint === formState.outTokenMint;
		});
		console.log('matchingToken: ', matchingToken);

		if (matchingToken) {
			formState.outTokenBalance = matchingToken.account.data.parsed.info.tokenAmount.uiAmount;
			console.log('outTokenBalance: ', formState.outTokenBalance);
			// U: Need to update sellerStore values as well to init escrow
			$userStore.outTokenMint = new anchor.web3.PublicKey(
				matchingToken.account.data.parsed.info.mint
			);
			$userStore.outTokenATA = matchingToken.pubkey;
			$userStore.outTokenRawBalance = parseInt(
				matchingToken.account.data.parsed.info.tokenAmount.amount
			); // 30000000
			$userStore.outTokenBalance = matchingToken.account.data.parsed.info.tokenAmount.uiAmount; // 3
			$userStore.outTokenDecimals = matchingToken.account.data.parsed.info.tokenAmount.decimals;
		}
	}

	function handleOnChange() {
		// Clear the formState.outTokenAmount input
		formState.outTokenAmount = '';
		$userStore.outTokenAmount = null;
		$userStore.outTokenRawAmount = null;
		// Get the selected token's details and balance and update UI
		setSelectedTokenMintAtaBalanceDecimals();
	}

	function handleOutTokenAmountInput() {
		// Clear any existing input
		$userStore.outTokenAmount = null;
		$userStore.outTokenRawAmount = null;

		try {
			// Handle the outTokenAmount
			if (
				formState.outTokenAmount &&
				$userStore.outTokenRawBalance &&
				$userStore.outTokenDecimals
			) {
				// NOTE 10 ** 8 => 100000000
				let rawTokenAmount =
					parseFloat(formState.outTokenAmount) * 10 ** $userStore.outTokenDecimals;

				// TODO Add some validation to outTokenAmount
				// NOTE outTokenRawBalance - rawOutTokenAmount >= 0
				if (rawTokenAmount > $userStore.outTokenRawBalance) {
					console.log('rawTokenAmount > balance!');
					return;
				}

				// Update userStore values
				$userStore.outTokenRawAmount = rawTokenAmount;
				$userStore.outTokenAmount = parseFloat(formState.outTokenAmount);
			} else if (formState.outTokenAmount && formState.outTokenMint) {
				// ======== DO THIS =======
				// FIXME Sometimes I refresh and enter new values but nothing
				// updates inside userStore.outTokenAmount
				console.log('OutTokenAmountInput::formState.outTokenAmount && formState.outTokenMint');
				// Q: Need to find inside walletTokenAccountsStore and update userStore.outTokenAmount
				// and outTokenRawAmount?
			}
		} catch (e) {
			console.log(e);
		}
	}

	async function handleInTokenMintAddressInput() {
		// Clear any existing input
		$userStore.inTokenMint = null;
		$userStore.inTokenATA = null;
		$userStore.inTokenDecimals = null;

		try {
			// TODO Add validation and toggle for UI
			if (
				formState.inTokenMint.length > constants.PUBKEY_MAX_CHARS ||
				formState.inTokenMint.length < constants.PUBKEY_MIN_CHARS
			) {
				console.log(`inTokenMint has invalid length of ${formState.inTokenMint.length} chars!`);
				return;
			}
			// Update state
			$userStore.inTokenMint = new anchor.web3.PublicKey(formState.inTokenMint);
			// Q: Do I need to see if wallet already has inTokenMint? And then update
			// inTokenATA, inTokenBalance?
			// U: I don't think it's worth it since this Store doesn't persists anyway,
			// and we'll have to do a fresh fetch on the mint address to accept from
			// the buyer's side.
			// U: Well, I need the mint's decimals to compute raw amount, so may be
			// worth a pass through $walletTokenAccountsStore first before doing a
			// fresh getMint() fetch...
			let matchingToken = $walletTokenAccountsStore.find((tokenAccount) => {
				return tokenAccount.account.data.parsed.info.mint === formState.inTokenMint;
			});
			console.log('matchingToken.pubkey: ', matchingToken?.pubkey.toBase58());

			if (matchingToken !== undefined) {
				// User already has the token in wallet
				// Set sellerStore.inToken values so we can later convert to raw amount
				$userStore.inTokenATA = matchingToken.pubkey;
				$userStore.inTokenDecimals = matchingToken.account.data.parsed.info.tokenAmount.decimals;
			} else {
				// Clear the inTokenATA if present
				$userStore.inTokenATA = null;
				// Use getMint() to capture token details so we can convert amount for BN/init
				console.log('inTokenMint not found in wallet. Fetching mint details...');
				const inTokenMintData = await getMint($workspaceStore.connection, $userStore.inTokenMint);
				console.log('inTokenMintData: ', inTokenMintData);

				// Update Store decimals so I can compute the raw amount based on inTokenAmount (later)
				$userStore.inTokenDecimals = inTokenMintData.decimals;

				// Q: What if seller doesn't have inTokenATA? Need to create it here or where?
				// NOTE May need to look into getOrCreateAssociatedTokenAccount()
			}
		} catch (e) {
			console.log(e);
		}
	}

	function handleInTokenAmountInput() {
		// Clear any existing input
		$userStore.inTokenAmount = null;

		try {
			if (formState.inTokenAmount.trim().length > 0) {
				// TODO Ensure it's a valid number with set precision
				// Q: Do I need to know the decimals for the inTokenMint in order
				// to compute the rawAmount? Currently I'll just pass a decimal from the
				// initialization side (seller), but when accepting need to make sure the
				// amounts align. I won't be able to know all the details until I have
				// the mint, decimals, and amounts.
				// U: I actually may need to getMint(inTokenMint) or something bc I think
				// I need to pass a RAW amount (no decimals!) for BN. However, the user
				// enters a decimal. Therefore, may need to do a getMint() to get Mint
				// decimals, so I can convert to RAW again... Sigh.
				// U: IMPORTANT: After testing more, I MUST pass a BN(integer) value as the
				// inTokenAmount. This means I need to convert to a raw amount, which means
				// I need the inTokenMint's decimals, which means I need to getMint().
				// It probably makes sense to getMint() in the handleInTokenMintAddressInput(),
				// so it's not trying to fetch on each keystroke, then I can use its decimals
				// value to compute the raw amount.
				// A: Yes! I need inTokenDecimals to compute raw amount. Added a getMint()
				// inside the handleInTokenMintAddressInput() function.
				let inTokenAmount = parseFloat(formState.inTokenAmount);
				$userStore.inTokenAmount = inTokenAmount;
			}
		} catch (e) {
			console.log(e);
		}
	}

	function calculateTokenAmountConversion(transferAmount: string, tokenInfo: Record<string, any>) {
		// NOTE Need a BN.toNumber() for out/in amounts to init Escrow.
		// However, want to allow decimals for user input. BN doesn't support decimals,
		// so need to manually compute/convert - Eg ".3" of "100000000" balance -> "30000000"
		// NOTE 10 ** 8 => 100000000
		// tokenInfo Object has following shape after getTokenAccountsByOwner:
		// {
		//    amount: string, // "100000000"
		//    decimals: number, // 8
		//    uiAmount: number, // 1
		//    uiAmountString: string, // "1"
		// }
		// 1. Take string decimal or int input to get big number
		let transferAmountOfTokenInfoAmount: number =
			parseFloat(transferAmount) * parseInt(tokenInfo.amount);
		console.log(transferAmountOfTokenInfoAmount);
		// 2. Create new BN
		let transferAmountAsBN = new anchor.BN(transferAmountOfTokenInfoAmount);
		console.log('transferAmountAsBN: ', transferAmountAsBN);
	}

	async function createTokenX() {
		// Q 11/1: Explicitly return Promise<Transaction>?
		// REF: https://youtu.be/zai8CX6OwTg?t=573
		// A: Don't think so, but need to sendTransaction() BEFORE
		// I can use getMint() and finally update state (Store)

		// IMPORTANT: Using built-in createMint() will fail bc Anchor Signer clashes. Have to build manually!
		// Q: How do I pass an Anchor Signer to pay for tx?
		// Q: How could I turn createMint() into a tx to then pass to AnchorProvider.sendAndConfirm()?
		// A: Check out Cookbook using new Transaction.add(). Could then use provider to send???
		// REF Cookbook: https://solanacookbook.com/references/token.html#how-to-create-a-new-token
		// A: You have to build it manually! Follow Cookbook example and read Discord:
		// REF: https://discord.com/channels/889577356681945098/889702325231427584/979766795730821200
		// NOTE The built-in works for testing bc we use Anchor directly, but NOT in frontend!
		// xMint = await createMint(
		// 	$workspaceStore.connection,
		// 	seller.payer, // payer (type Signer) - ERROR undefined!
		// 	seller.publicKey, // mintAuthority
		// 	seller.publicKey, // freezeAuthority?
		// 	8 // decimals location of the decimal place
		// );
		// console.log(`xMint: ${xMint.toBase58()}`);

		// U: Moving these local vars to globals so I can save in Stores
		// and prevent having to create tokens on each refresh...
		// const mint = Keypair.generate();
		// xMint = mint.publicKey;
		// console.log(`xMint: ${xMint}`);

		// console.log('provider BEFORE create Token: ', $workspaceStore.provider);
		// console.log('connection BEFORE create Token: ', $workspaceStore.connection);
		const tx = new Transaction().add(
			// create mint account
			SystemProgram.createAccount({
				fromPubkey: $walletStore.publicKey as anchor.web3.PublicKey,
				newAccountPubkey: xMintPubkey,
				space: MINT_SIZE,
				lamports: await getMinimumBalanceForRentExemptMint($workspaceStore.connection),
				programId: TOKEN_PROGRAM_ID
			}),
			// init mint account
			createInitializeMintInstruction(
				xMintPubkey, // mint publicKey
				8, // decimals
				$walletStore.publicKey as anchor.web3.PublicKey, // mint authority
				$walletStore.publicKey as anchor.web3.PublicKey // freeze authority
			)
		);

		// console.log('provider AFTER create Token: ', $workspaceStore.provider);
		// console.log('connection AFTER create Token: ', $workspaceStore.connection);
		// Q: Why doesn't workspaceStore.connection.sendTransaction() work?
		// It may be missing the Wallet. When using wallet-adapter, the wallet is a Default
		// Signer, but you don't have access to it. So, maybe the workspaceStore won't work
		// because it doesn't have access to the Wallet? Need to test...
		// A: Yep! Missing the Wallet!
		// NOTE You need to pass in BOTH keypairs of the signer, AND the keypairs
		// of the accounts you're creating.
		// console.log(`TxHash :: ${await $workspaceStore.connection.sendTransaction(tx, [mint])}`); // ERROR: signature verification failed (also deprecated?)
		// console.log(
		// 	`TxHash :: ${await $workspaceStore.provider?.connection.sendTransaction(tx, [mint])}`
		// ); // ERROR: signature verification failed (also deprecated?)

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
			signers: [xMintKeypair]
		});
		console.log('signature:	', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		// U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
		// REF: https://stackoverflow.com/a/72333685
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);

		const xMintAccountData = await getMint($workspaceStore.connection, xMintPubkey);
		console.log('xMintAccountData: ', xMintAccountData);
		xMintStore.set({ address: xMintPubkey, mint: xMintAccountData });

		// console.log(
		// 	`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
		// 		signers: [mint]
		// 	})}`
		// ); // WORKS! Need to use walletStore instead of workspaceStore!

		// UPDATE 11/1: Works! I can await getMint() AFTER I first sendTransaction()
		// and then save the state (Store).
		// UPDATE 9/14: Still not sure. However, for TokenAccountNotFoundError,
		// it may not be needed, or perhaps need to try and fetch after creating ATAs.
		// REF: https://solana.stackexchange.com/questions/1202/spl-token-solana-create-token-account-with-wallet-adapter-react-js
		// Q: Why can't I get the token mint inside this function? Think it's async error...
		// Q: Is it because the above console.log() isn't async, and that's why it
		// it returns TokenAccountNotFoundError?
		// Q: Do I need to do wait for sendTransaction() to complete or something?
		// Below errors for some reason but works if I place inside separate function. Weird.
		// ERROR: TokenAccountNotFoundError
		// NOTE Doesn't error but data isn't Mint data...
		// xMintAccountData = await $workspaceStore.connection.getAccountInfo(xMint, 'confirmed');
		// const currentXMintAccountDataGetAccountInfo = await new Connection(
		// 	'http://localhost:8899',
		// 	'confirmed'
		// ).getAccountInfo(xMint);
		// const currentXMintAccountData = await getMint($workspaceStore.connection, xMint); // error
		// const currentXMintAccountData = await getMint($workspaceStore.connection, xMint).then(
		// 	(res) => res.address
		// ); // Uncaught (in promise) TokenAccountNotFoundError
		// Q: Do I need to simply reassign back to xMintAccountData to get reactivity?
		// let currentXMintAccountDataGetAccountInfo: anchor.web3.AccountInfo<Buffer> | null =
		// 	await $workspaceStore.connection.getAccountInfo(xMint);
		// let currentXMintAccountDataGetAccountInfo = await $workspaceStore.provider?.connection
		// 	.getAccountInfo(xMint)
		// 	.then((res) => res?.data);
		// let currentXMintAccountDataGetParsedAccountInfo =
		// 	await $workspaceStore.connection.getParsedAccountInfo(xMint);
		// let currentXMintAccountDataGetAccount = await getAccount($workspaceStore.connection, xMint); // Error TokenAccountNotFoundError
		// let currentXMintAccountDataGetMint = await getMint($workspaceStore.connection, xMint); // TokenAccountNotFoundError
		// let currentXMintAccountDataGetMint = await getMint(connection, xMint).then(
		// 	(value) => (xMintAccountData = value)
		// );
		// Q: Is there a getMintInfo() to try? Grasping here......
		// A: NOPE. Perhaps in an older version there was.
		// Q: Try building a fresh Connection? NOPE...
		// Q: Try making it an IIFE? NOPE...
		// (async () => {
		// 	let connection = new Connection('http://localhost:8899', 'confirmed');
		// 	let currentXMintAccountDataGetMint = await getMint(connection, mint.publicKey);
		// 	// let currentXMintAccountDataGetMint = await getMintInfo($workspaceStore.connection, xMint);
		// xMintAccountData = currentXMintAccountDataGetAccountInfo;
		// console.log(xMintAccountData); // null
		// })();
		// ==== UPDATE 9/14 ===== Maybe on to something...
		// Q: Do you FIRST have to create the ATA for the Token BEFORE you
		// can get the Mint account info?
		// NOTE I noticed that createTokenX() still doesn't let me find the
		// account using spl-token account-info <ID>. However, when running
		// my Anchor tests, I'm able to find the Mint, BUT this happens AFTER
		// the ATAs are created... So, I should try creating the ATA first and
		// then try to getMint() possibly?
		// A: After createTokenX() and then createSellerTokenXAssociatedTokenAccount(),
		// I STILL cannot find xMint, but I CAN find sellerXToken ATA...
		// Q: Does this mean I need to actually mint some supply in order to
		// finally find Token X Mint info using spl-token account-info <ID>?
		// A: NOPE... still not able to find the Mint account after creating ATAs
		// and even minting new supply to the ATAs. It's like I'm on the wrong network...
		// IMPORTANT: Even creating a token with the CLI, you can't find the account-info
		// right afterwards! (spl-token create-token => spl-token account-info <ID>)
		// Q: Is my Provider or Connection wrong? Why can I find the ATA, but I
		// cannot find the actual Mint using spl-token account-info <ID>?
	}

	async function createTokenY() {
		// U: Moving these local vars to globals so I can save in Stores
		// and prevent having to create tokens on each refresh...
		// const mint = Keypair.generate();
		// yMint = mint.publicKey;
		// console.log(`yMint: ${yMint}`);

		const tx = new Transaction().add(
			// create mint account
			SystemProgram.createAccount({
				fromPubkey: $walletStore.publicKey as anchor.web3.PublicKey,
				newAccountPubkey: yMintPubkey,
				space: MINT_SIZE,
				lamports: await getMinimumBalanceForRentExemptMint($workspaceStore.connection),
				programId: TOKEN_PROGRAM_ID
			}),
			// init mint account
			createInitializeMintInstruction(
				yMintPubkey, // mint publicKey
				8, // decimals
				$walletStore.publicKey as anchor.web3.PublicKey, // seller.publicKey, // mint authority
				$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // freeze authority
			)
		);

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
			signers: [yMintKeypair]
		});
		console.log('signature:	', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);

		const yMintAccountData = await getMint($workspaceStore.connection, yMintPubkey);
		yMintStore.set({ address: yMintPubkey, mint: yMintAccountData });

		// console.log(
		// 	`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
		// 		signers: [mint]
		// 	})}`
		// ); // WORKS! Need to use walletStore instead of workspaceStore!
	}

	async function createTokenW() {
		const tx = new Transaction().add(
			// create mint account
			SystemProgram.createAccount({
				fromPubkey: $walletStore.publicKey as anchor.web3.PublicKey,
				newAccountPubkey: wMintPubkey,
				space: MINT_SIZE,
				lamports: await getMinimumBalanceForRentExemptMint($workspaceStore.connection),
				programId: TOKEN_PROGRAM_ID
			}),
			// init mint account
			createInitializeMintInstruction(
				wMintPubkey, // mint publicKey
				8, // decimals
				$walletStore.publicKey as anchor.web3.PublicKey, // seller.publicKey, // mint authority
				$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // freeze authority
			)
		);

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
			signers: [wMintKeypair]
		});
		console.log('signature:	', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);

		const wMintAccountData = await getMint($workspaceStore.connection, wMintPubkey);
		wMintStore.set({ address: wMintPubkey, mint: wMintAccountData });

		// console.log(
		// 	`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
		// 		signers: [mint]
		// 	})}`
		// ); // WORKS! Need to use walletStore instead of workspaceStore!
	}

	async function createTokenZ() {
		const tx = new Transaction().add(
			// create mint account
			SystemProgram.createAccount({
				fromPubkey: $walletStore.publicKey as anchor.web3.PublicKey,
				newAccountPubkey: zMintPubkey,
				space: MINT_SIZE,
				lamports: await getMinimumBalanceForRentExemptMint($workspaceStore.connection),
				programId: TOKEN_PROGRAM_ID
			}),
			// init mint account
			createInitializeMintInstruction(
				zMintPubkey, // mint publicKey
				8, // decimals
				$walletStore.publicKey as anchor.web3.PublicKey, // seller.publicKey, // mint authority
				$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // freeze authority
			)
		);

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
			signers: [zMintKeypair]
		});
		console.log('signature:	', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);

		const zMintAccountData = await getMint($workspaceStore.connection, zMintPubkey);
		zMintStore.set({ address: zMintPubkey, mint: zMintAccountData });

		// console.log(
		// 	`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
		// 		signers: [mint]
		// 	})}`
		// ); // WORKS! Need to use walletStore instead of workspaceStore!
	}

	async function createAllTokens() {
		// NOTE For testing ONLY. Let's airdrop both wallets some SOL
		await $workspaceStore.connection.confirmTransaction(
			await $workspaceStore.connection.requestAirdrop(
				$walletStore.publicKey as PublicKey, // seller
				LAMPORTS_PER_SOL
			)
		);
		await $workspaceStore.connection.confirmTransaction(
			await $workspaceStore.connection.requestAirdrop(buyer, LAMPORTS_PER_SOL)
		);

		// Create our Tokens
		await createTokenW();
		await createTokenX();
		await createTokenY();
		await createTokenZ();
	}

	// TODO Refactor
	async function getWMintAccount() {
		const wMintAccountData = await getMint(
			$workspaceStore.connection,
			$wMintStore.address as anchor.web3.PublicKey
		);
		wMintStore.set({ address: wMintAccountData.address, mint: wMintAccountData });
	}

	async function getXMintAccount() {
		// NOTE Currently getMint() only works when I add to onclick event...
		const xMintAccountData = await getMint(
			$workspaceStore.connection,
			$xMintStore.address as anchor.web3.PublicKey
		);
		// xMintAccountData = await $workspaceStore.connection.getAccountInfo(xMint); // Promise
		// U: Trying out my Writable<Mint> Store
		// U: Changed it to Writable<TokenMintStoreObject> to store address separately
		xMintStore.set({ address: xMintAccountData.address, mint: xMintAccountData });
	}

	async function getYMintAccount() {
		const yMintAccountData = await getMint(
			$workspaceStore.connection,
			$yMintStore.address as anchor.web3.PublicKey
		);
		yMintStore.set({ address: yMintAccountData.address, mint: yMintAccountData });
	}

	async function getSellerXTokenAccountBalance() {
		const tokenAmount = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			$setupStore.sellerXTokenATA as anchor.web3.PublicKey
		);

		$setupStore.sellerXTokenBalance = tokenAmount?.value.uiAmount as number;
	}

	async function getSellerZTokenAccountBalance() {
		const tokenAmount = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			$setupStore.sellerZTokenATA as anchor.web3.PublicKey
		);

		$setupStore.sellerZTokenBalance = tokenAmount?.value.uiAmount as number;
	}

	async function getBuyerYTokenAccountBalance() {
		const tokenAmount = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			$setupStore.buyerYTokenATA as anchor.web3.PublicKey
		);

		$setupStore.buyerYTokenBalance = tokenAmount?.value.uiAmount as number;
	}

	async function getBuyerWTokenAccountBalance() {
		const tokenAmount = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			$setupStore.buyerWTokenATA as anchor.web3.PublicKey
		);

		$setupStore.buyerWTokenBalance = tokenAmount?.value.uiAmount as number;
	}


	async function getZMintAccount() {
		const zMintAccountData = await getMint(
			$workspaceStore.connection,
			$zMintStore.address as anchor.web3.PublicKey
		);
		zMintStore.set({ address: zMintAccountData.address, mint: zMintAccountData });
	}

	async function createSellerTokenXAssociatedTokenAccount() {
		// NOTE Again, can't use the handy built-in methods using spl-token w/ Anchor.
		// Instead, need to build the tx manually and send with walletStore and connection
		// sellerXToken = await createAssociatedTokenAccount(
		// 	$workspaceStore.connection, // connection
		// 	seller.payer, // payer keypair,
		// 	xMint, // mint pubkey
		// 	seller.publicKey // owner pubkey
		// );
		// console.log(`sellerXToken: ${sellerXToken}`);

		const sellerXToken = await getAssociatedTokenAddress(
			$xMintStore.address as anchor.web3.PublicKey, // mint
			$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // owner
		);
		console.log(`sellerXToken: ${sellerXToken.toBase58()}`);
		$setupStore.sellerXTokenATA = sellerXToken;
		$setupStore.sellerXTokenMint = $xMintStore.address;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$setupStore.sellerXTokenATA, // ata
				$setupStore.sellerWallet as anchor.web3.PublicKey, // seller.publicKey, // owner
				$setupStore.sellerXTokenMint as anchor.web3.PublicKey // mint
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
	}

	async function createSellerTokenYAssociatedTokenAccount() {
		const sellerYToken = await getAssociatedTokenAddress(
			$yMintStore.address as anchor.web3.PublicKey, // mint
			$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // owner
		);
		console.log(`sellerYToken: ${sellerYToken.toBase58()}`);
		$setupStore.sellerYTokenATA = sellerYToken;
		$setupStore.sellerYTokenMint = $yMintStore.address;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$setupStore.sellerYTokenATA, // ata
				$setupStore.sellerWallet as anchor.web3.PublicKey, // seller.publicKey, // owner
				$setupStore.sellerYTokenMint as anchor.web3.PublicKey // mint
			)
		);

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
		console.log('signature:	', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		// U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
		// REF: https://stackoverflow.com/a/72333685
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);
	}

	async function createBuyerTokenXAssociatedTokenAccount() {
		const buyerXToken = await getAssociatedTokenAddress(
			$xMintStore.address as anchor.web3.PublicKey, // mint
			// Q: Use global or buyerStore.walletAddress?
			// A: NOTE I have default walletAddress set to BUYER_WALLET_ADDRESS in Store!
			// U: Replacing with setupStore values
			$setupStore.buyerWallet as anchor.web3.PublicKey //buyer.publicKey // owner
		);
		console.log(`buyerXToken: ${buyerXToken.toBase58()}`);
		$setupStore.buyerXTokenATA = buyerXToken;
		$setupStore.buyerXTokenMint = $xMintStore.address;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$setupStore.buyerXTokenATA, // ata
				$setupStore.buyerWallet as anchor.web3.PublicKey, //  buyer.publicKey, // owner
				$setupStore.buyerXTokenMint as anchor.web3.PublicKey // mint
			)
		);

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
		console.log('signature:	', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		// U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
		// REF: https://stackoverflow.com/a/72333685
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);
	}

	async function createBuyerTokenYAssociatedTokenAccount() {
		const buyerYToken = await getAssociatedTokenAddress(
			$yMintStore.address as anchor.web3.PublicKey, // mint
			// Q: Use global or buyerStore.walletAddress?
			// A: NOTE I have default walletAddress set to BUYER_WALLET_ADDRESS in Store!
			// U: Replacing with setupStore values
			$setupStore.buyerWallet as anchor.web3.PublicKey // buyer.publicKey // owner
		);
		console.log(`buyerYToken: ${buyerYToken.toBase58()}`);
		$setupStore.buyerYTokenATA = buyerYToken;
		$setupStore.buyerYTokenMint = $yMintStore.address;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$setupStore.buyerYTokenATA, // ata
				$setupStore.buyerWallet as anchor.web3.PublicKey, // buyer.publicKey, // owner
				$setupStore.buyerYTokenMint as anchor.web3.PublicKey // mint
			)
		);

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
		console.log('signature:	', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		// U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
		// REF: https://stackoverflow.com/a/72333685
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);
	}

	// TODO - Finish the setup for buyerW and sellerZ ATAs
	// U: Added W and Z Mints to simulate a user not having an ATA
	async function createBuyerTokenWAssociatedTokenAccount() {
		const buyerWToken = await getAssociatedTokenAddress(
			$wMintStore.address as anchor.web3.PublicKey, // mint
			$setupStore.buyerWallet as anchor.web3.PublicKey // buyer.publicKey // owner
		);
		console.log(`buyerWToken: ${buyerWToken.toBase58()}`);
		$setupStore.buyerWTokenATA = buyerWToken;
		$setupStore.buyerWTokenMint = $wMintStore.address;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$setupStore.buyerWTokenATA, // ata
				$setupStore.buyerWallet as anchor.web3.PublicKey, // buyer.publicKey, // owner
				$setupStore.buyerWTokenMint as anchor.web3.PublicKey // mint
			)
		);

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
		console.log('signature:	', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		// U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
		// REF: https://stackoverflow.com/a/72333685
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);
	}

	async function createSellerTokenZAssociatedTokenAccount() {
		const sellerZToken = await getAssociatedTokenAddress(
			$zMintStore.address as anchor.web3.PublicKey, // mint
			$setupStore.sellerWallet as anchor.web3.PublicKey // buyer.publicKey // owner
		);
		console.log(`sellerZToken: ${sellerZToken.toBase58()}`);
		$setupStore.sellerZTokenATA = sellerZToken;
		$setupStore.sellerZTokenMint = $zMintStore.address;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$setupStore.sellerZTokenATA, // ata
				$setupStore.sellerWallet as anchor.web3.PublicKey,
				$setupStore.sellerZTokenMint as anchor.web3.PublicKey // mint
			)
		);

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
		console.log('signature:	', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		// U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
		// REF: https://stackoverflow.com/a/72333685
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);
	}

	async function createAllBuyerAndSellerAssociatedTokenAccounts() {
		// Q: Not sure this will be needed when I implement actual wallets...
		// Q: Is there a sendAllTransactions() method?
		try {
			await createBuyerTokenXAssociatedTokenAccount();
			await createBuyerTokenYAssociatedTokenAccount();
			await createBuyerTokenWAssociatedTokenAccount();

			await createSellerTokenXAssociatedTokenAccount();
			await createSellerTokenYAssociatedTokenAccount();
			await createSellerTokenZAssociatedTokenAccount();
		} catch (error) {
			console.log(error);
		}
	}

	async function mintTokenXAndTransferToSellerTokenXAssociatedTokenAccount() {
		// NOTE Again, can't use the handy built-in methods using spl-token w/ Anchor.
		// Instead, need to build the tx manually and send with walletStore and connection
		// await mintToChecked(
		// 	$workspaceStore.connection, //connection,
		// 	// Q: How do I get type anchor.web3.Signer?
		// 	// NOTE payer is Keypair, but need type Signer
		// 	// REF https://stackoverflow.com/questions/70206015/solana-web3-js-getting-web3-signer-from-wallet
		// 	// A: Still don't know, BUT type Keypair seems to work...
		//  // A: CAN'T from frontend! Must compose raw TransactionInstructions
		//  // and use $walletStore.sendTransaction()!
		// 	seller.payer, // payer, // NOTE need anchor.web3.Signer
		// 	xMint, // mint,
		// 	sellerXToken, // destination ata,
		// 	seller.publicKey, // mint authority,
		// 	1e8, // amount,
		// 	8 // decimals
		// 	// [signer1, signer2...], // only multisig account will use
		// );

		const tx = new Transaction().add(
			createMintToCheckedInstruction(
				$setupStore.sellerXTokenMint as anchor.web3.PublicKey, // mint
				$setupStore.sellerXTokenATA as anchor.web3.PublicKey, // destination ata
				$walletStore.publicKey as anchor.web3.PublicKey, // mint authority
				3e8, // amount // U: Could add this as arg if needed
				$xMintStore.mint?.decimals as number // decimals 8 // U: Could maybe reference $xMintStore.mint.decimals
			)
		);
		// console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

		// FIXME Look into createMintToCheckedInstruction() more I guess...
		// Q: Why don't any other async calls work after sending a transaction?
		// Doesn't work for fetching token account data, balances, etc.
		// Is it my workspaceStore connection? Only reason I consider that is because
		// I can't use it to sendTransaction() for some reason...
		// console.log(
		// 	`sellerXToken.balance: ${await $workspaceStore.connection
		// 		.getTokenAccountBalance(sellerXToken)
		// 		.then((r) => r.value.amount)}`
		// ); // U: Always returns 0!

		// U: Gonna see if saving the signature etc. helps...
		// SOLVED! By awaiting the sendTransaction() and storing in a variable,
		// this seems to have fixed the issue!
		// Q: Do I need to getBalance() or something and update sellerStore?
		// A: NOPE! Just saving the signature (above) seems to resolve!
		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
		console.log('signature: ', signature);
		// NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
		// Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
		// U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
		// REF: https://stackoverflow.com/a/72333685
		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);

		// Get updated xMint data and update xMintStore for Supply UI
		// NOTE Using helper to fetch and update Store
		await getXMintAccount();
	}

	async function mintTokenYAndTransferToBuyerTokenYAssociatedTokenAccount() {
		const tx = new Transaction().add(
			createMintToCheckedInstruction(
				$setupStore.buyerYTokenMint as anchor.web3.PublicKey, // mint
				$setupStore.buyerYTokenATA as anchor.web3.PublicKey, // destination ata
				$walletStore.publicKey as anchor.web3.PublicKey, // mint authority
				3e8, // amount
				$yMintStore.mint?.decimals as number // decimals 8 // U: Could maybe reference $yMintStore.mint.decimals
			)
		);
		// console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

		// Q: Why don't any other async calls work after sending a transaction?
		// Doesn't work for fetching token account data, balances, etc.
		// Is it my workspaceStore connection? Only reason I consider that is because
		// I can't use it to sendTransaction() for some reason...
		// console.log(
		// 	`buyerYToken.balance: ${await $workspaceStore.connection
		// 		.getTokenAccountBalance(buyerYToken)
		// 		.then((r) => r.value.amount)}`
		// );
		// U: Gonna see if saving the signature etc. helps...
		// SOLVED! By awaiting the sendTransaction() and storing in a variable,
		// this seems to have fixed the issue!
		// Q: Do I need to getBalance() or something and update sellerStore?
		// A: NOPE! Just saving the signature (above) seems to resolve!
		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
		console.log('signature: ', signature);

		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);

		// Get updated mint account data and update Store for Supply UI
		// NOTE Using helper to fetch and update Store
		await getYMintAccount();
	}

	// U: Need to mint supply to sellerZ and buyerW
	async function mintTokenZAndTransferToSellerTokenZAssociatedTokenAccount() {
		const tx = new Transaction().add(
			createMintToCheckedInstruction(
				$setupStore.sellerZTokenMint as anchor.web3.PublicKey, // mint
				$setupStore.sellerZTokenATA as anchor.web3.PublicKey, // destination ata
				$walletStore.publicKey as anchor.web3.PublicKey, // mint authority
				3e8, // amount
				$zMintStore.mint?.decimals as number // decimals 8 // U: Could maybe reference $yMintStore.mint.decimals
			)
		);
		// console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
		console.log('signature: ', signature);

		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);

		// Get updated mint account data and update Store for Supply UI
		// NOTE Using helper to fetch and update Store
		await getZMintAccount();
	}

	async function mintTokenWAndTransferToBuyerTokenWAssociatedTokenAccount() {
		const tx = new Transaction().add(
			createMintToCheckedInstruction(
				$setupStore.buyerWTokenMint as anchor.web3.PublicKey, // mint
				$setupStore.buyerWTokenATA as anchor.web3.PublicKey, // destination ata
				$walletStore.publicKey as anchor.web3.PublicKey, // mint authority
				3e8, // amount
				$wMintStore.mint?.decimals as number // decimals 8 // U: Could maybe reference $yMintStore.mint.decimals
			)
		);
		// console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection);
		console.log('signature: ', signature);

		const latestBlockhash = await $workspaceStore.connection.getLatestBlockhash();
		const confirmedTx = await $workspaceStore.connection.confirmTransaction({
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature: signature
		});
		console.log('confirmedTx: ', confirmedTx);

		// Get updated mint account data and update Store for Supply UI
		// NOTE Using helper to fetch and update Store
		await getWMintAccount();
	}

	async function mintAllTokensAndTransferToAssociatedTokenAccounts() {
		// TODO Refactor possibly using Promise.all()
		try {
			await mintTokenXAndTransferToSellerTokenXAssociatedTokenAccount();
			await mintTokenZAndTransferToSellerTokenZAssociatedTokenAccount();
			await mintTokenYAndTransferToBuyerTokenYAssociatedTokenAccount();
			await mintTokenWAndTransferToBuyerTokenWAssociatedTokenAccount();

			await getSellerXTokenAccountBalance();
      await getSellerZTokenAccountBalance();
			await getBuyerYTokenAccountBalance();
      await getBuyerWTokenAccountBalance();
		} catch (error) {
			console.log(error);
		}
		// FIXME buyerYToken Balance ALWAYS 0! I have to separately
		// click a getBuyerYTokenAccountBalance button.
		// U: I can also get balance w/: spl-token balance --address <buyerYToken>
		// Q: What about calling directly in here?
		// A: Nope.
		// Q: Would Promise.all() be more efficient in this case?
		// U: Doesn't seem to make a difference.
		// SOLVED! By awaiting the sendTransaction() and storing in a signature variable,
		// try {
		// 	await mintTokenXAndTransferToSellerTokenXAssociatedTokenAccount();
		// 	await mintTokenYAndTransferToBuyerTokenYAssociatedTokenAccount();
		// 	const sellerXTokenBalancePromise =
		// 		$workspaceStore.provider?.connection.getTokenAccountBalance(sellerXToken);
		// 	const buyerYTokenBalancePromise =
		// 		$workspaceStore.provider?.connection.getTokenAccountBalance(buyerYToken);
		// 	const tokenBalances = await Promise.all([
		// 		sellerXTokenBalancePromise,
		// 		buyerYTokenBalancePromise
		// 	]);
		// 	console.log(tokenBalances);
		// } catch (error) {
		// 	console.log(error);
		// }
	}

	async function handleCreateCustomProgramAccount() {
		if ($customProgramStore.pda !== null) {
			notificationStore.add({ type: 'error', message: `Data account already exists!` });
			console.log('error', 'Create custom program failed!');
			return;
		}

		let tx: anchor.web3.TransactionSignature = '';

		try {
			const [pda, bump] = await PublicKey.findProgramAddress(
				[Buffer.from(constants.CUSTOM_PROGRAM_SEED_PREFIX)],
				$workspaceStore.program?.programId as anchor.web3.PublicKey
			);

			tx = (await $workspaceStore.program?.methods
				.createCustomProgram()
				.accounts({
					customProgram: pda,
					authority: constants.SELLER_WALLET_ADDRESS,
					systemProgram: anchor.web3.SystemProgram.programId
				})
				.signers([])
				.rpc()) as string;

			console.log('TxHash ::', tx);

			// Update state
			customProgramStore.getCustomProgramAccount(pda);

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


  // U: Create one BIG setup() that does it all
  async function setupForClientTesting() {
    try {
      await handleCreateCustomProgramAccount();
      await createAllTokens();
      await createAllBuyerAndSellerAssociatedTokenAccounts();
      await mintAllTokensAndTransferToAssociatedTokenAccounts();
      
    } catch (error) {
      console.log(error);
    }
  }


	async function handleInitializeEscrowAccount() {
		// U: Reset any existing escrowStore just in case
		escrowStore.reset();

		if ($escrowStore.pda !== null) {
			notificationStore.add({
				type: 'error',
				message: 'Escrow account already exists!'
			});
			console.log('error', 'Escrow account already exists!');
			return;
		}

		// TODO Add validation for out/in token details and raw amounts
		// NOTE Currently storing all the details in sellerStore
		if (!hasRequiredEscrowInputs) {
			notificationStore.add({
				type: 'error',
				message: 'Escrow inputs are invalid!'
			});
			console.log('error', 'Escrow inputs are invalid!');
			return;
		}

		if ($userStore.inTokenAmount && $userStore.inTokenDecimals) {
			let inTokenRawAmount = $userStore.inTokenAmount * 10 ** $userStore.inTokenDecimals;
			console.log('inTokenRawAmount: ', inTokenRawAmount);
			$userStore.inTokenRawAmount = inTokenRawAmount;
		}

		// Get the customProgram.totalEscrowCount to use as a seed
		// Q: How to pass a type u64 into seeds array? Uint8Array
		// A: Convert to string and use anchor.utils.bytes.utf8.encode()
		const escrowNumber: string = (
			$customProgramStore.customProgram?.totalEscrowCount.toNumber() + 1
		).toString();
		console.log('INITIALIZE::escrowNumber: ', escrowNumber);

		const [escrowPda, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
			[
				Buffer.from(constants.ESCROW_SEED_PREFIX),
				($walletStore.publicKey as anchor.web3.PublicKey).toBuffer(),
				// U: Need to add the escrowNumber as a seed!
				anchor.utils.bytes.utf8.encode(escrowNumber)
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);
		console.log('escrow Pda: ', escrowPda);

		// U: Added swapUI fields to formState
		// U: If you're displaying decimals, then BN is NOT the solution!
		// NOTE BN doesn't support decimals!
		// const outAmount = parseFloat(formState.outTokenAmount); // ERROR BN
		// const inAmount = parseFloat(formState.inTokenAmount); // ERROR
		// const outAmount = parseInt(formState.outTokenAmount); // ERROR w/ BN
		// const inAmount = parseInt(formState.inTokenAmount); // ERROR w/ BN
		// TODO Add support for decimal user inputs
		// Q: Need some reactive var?
		// const outAmount = new anchor.BN(formState.outTokenAmount); // Errors if passed directly!
		// const inAmount = new anchor.BN(formState.inTokenAmount); // Must convert BN.toNumber()!
		// // NOTE Must convert BN to number! And don't use decimals!
		// outAmount.toNumber();
		// inAmount.toNumber();

		// U: Okay, I am now converting the amounts and storing inside sellerStore
		// Need to figure out how to pass these values into my createEscrow() instruction
		// NOTE I have the outTokenAmount as a number and outTokenRawAmount based on decimals
		// However, I only have inTokenAmount as a number with possible decimals
		// Q: Can I just pass numbers or BN needed?
		// A: Nope! Must use BN!
		// NOTE I can pass a BN direc†ly to program method, BUT it removes the
		// DECIMAL value! E.g., 2.4 => 2. So, need to somehow get/pass RAW amounts
		// A: Fixed! Must pass in RAW amounts and it seems to be working!
		const outAmount = new anchor.BN($userStore.outTokenRawAmount as number);
		const inAmount = new anchor.BN($userStore.inTokenRawAmount as number);

		// Check whether escrow account already has data
		let data: EscrowObject;
		// NOTE We just need an address to store the escrowed X tokens
		// NOTE This also allows me to later create MULTIPLE escrow accounts
		// with different token pairs, etc.
		let escrowedOutTokenAccount = anchor.web3.Keypair.generate();

		// U: Check if formState.outTokenMint === 'SOL' and grab the actual PublicKey
		if (formState.outTokenMint === 'SOL') {
			formState.outTokenMint = constants.SOL_PUBLIC_KEY.toBase58();
		}

		const tx = await $workspaceStore.program?.methods
			.initialize(outAmount, inAmount)
			// NOTE We only provide the PublicKeys for all the accounts.
			// We do NOT have to deal with isSigner, isWritable, etc. like in RAW
			// since we already declared that in the program Context struct.
			// This means Anchor will look for all that info in our struct on ENTRY!
			// NOTE We also don't have to pass the System Program, Token Program, and
			// Associated Token Program, since Anchor resolves these automatically.
			// NOTE Values in accounts([]) are PublicKeys!
			// U: Replacing local vars with Stores
			// Q: How could I use X/Y tokens from wallets or mint addresses?
			// Currently I hardcode my X & Y Mints, but I want a UI that grabs tokens
			// from connected wallet, and I want the Seller to be able to select and/or
			// paste Mint address of the Y token they want. This means that I need to be
			// setting/updating the x/yMintStores onChange. However, I also have a Store
			// for keeping track of tokens in the wallet. I'd need its data to update/set
			// my x/yMintStores...
			.accounts({
				seller: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey,
				customProgram: $customProgramStore.pda as anchor.web3.PublicKey,
				outMint: new PublicKey(formState.outTokenMint),
				inMint: new PublicKey(formState.inTokenMint),
				sellerOutTokenAccount: $userStore.outTokenATA as anchor.web3.PublicKey, // ATA
				escrow: escrowPda, // created in program
				escrowedOutTokenAccount: escrowedOutTokenAccount.publicKey, // created in program
				// tokenProgram: TOKEN_PROGRAM_ID, // Q: Use 2022 version? A: TOKEN_PROGRAM_ID!
				// rent: SYSVAR_RENT_PUBKEY,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// Q: Which accounts are Signers?
			// A: Check IDL! Wallet and escrowedOutTokenAccount!
			// Q: Why is escrowedOutTokenAccount a Signer? It's just a type TokenAccount...
			.signers([escrowedOutTokenAccount])
			.rpc();

		console.log('TxHash ::', tx);

		// After tx success, get updated account data and update Store state
		data = (await $workspaceStore.program?.account.escrow.fetch(escrowPda)) as EscrowObject;
		// Q: Can I ...spread data of IDL 'Escrow' into ANOTHER custom type
		// that has additional fields? Like partially fill whatever fields match
		escrowStore.set({ escrow: data, pda: escrowPda } as EscrowStoreObject);
		// U: Update the escrowsStore array
		escrowsStore.addEscrow(data, escrowPda);

		const escrowedOutTokenAccountBalance =
			await $workspaceStore.provider?.connection.getTokenAccountBalance(
				$escrowStore.escrow?.escrowedOutTokenAccount as anchor.web3.PublicKey
			);
		console.log('INITIALIZE::escrowedOutTokenAccountBalance: ', escrowedOutTokenAccountBalance);
		// escrowedOutTokenAccountBalance = escrowedOutTokenAccountBalance?.value.uiAmount as number;

		// NOTE After running this and looking at solana logs, I can search the escrowedOutTokenAccount
		//❯ solana-anchor-sveltekit-multiple-programs main [!] spl-token account-info --address H4v4RYzNqVPAV88Zus9j1GYYiUf64hsFFBScTYvmdYQh
		//
		//Address: H4v4RYzNqVPAV88Zus9j1GYYiUf64hsFFBScTYvmdYQh  (Aux*)
		//Balance: 0.0000004  // After transferring 40 for xAmountFromSeller
		//Mint: BxJkZJY5waBqE2CafUYSrTRne5UHkGBTzBcxzfZNXMde
		//Owner: ADncSp91geB71DgSVF6QjQKFQBAtVt4gH7B2mEZjspby // Escrow Pda
		//State: Initialized
		//Delegation: (not set)
		//Close authority: (not set)
		//
		//* Please run `spl-token gc` to clean up Aux accounts

		// Update/double-check Escrow State
		console.log('INITIALIZE::$escrowStore: ', $escrowStore);

		// Get updated account data
		customProgramStore.getCustomProgramAccount($customProgramStore.pda as anchor.web3.PublicKey);

		// U: Reset the escrowStore so that multiple escrows can be created
		escrowStore.reset();

		// U: Reset formState inputs
		formState.outTokenAmount = '';
		formState.inTokenMint = '';
		formState.inTokenAmount = '';
		// Q: How/where to update the formState.outTokenBalance?
		// Can I set outTokenMint to 'SOL' and it grabs balanceStore.balance?
		// A: Nope! Need to probably refetch token accounts by owner again
		// to update walletTokenAccountsStore values
		formState.outTokenMint = 'SOL';
		await getParsedTokenAccountsByOwner(
			$workspaceStore.connection,
			$walletStore.publicKey as anchor.web3.PublicKey
		);
	}

	function resetAllStores() {
		// Reset all Stores for fresh UI update after accept/cancel
		// NOTE I'm not resetting the Tokens for testing purposes.
		// Normally they'd get reset too since the user will be able to
		// select a token in their wallet.
		// U: I tried the above but got an error when trying to create
		// the ATAs again for seller/buyer. Think I need to completely
		// wipe/reset all the stores and recreate Tokens.
		// U: Yep, wipe it all and it restarts the whole process.
		xMintStore.set({ address: null, mint: null });
		yMintStore.set({ address: null, mint: null });
		sellerStore.reset();
		buyerStore.reset();
		userStore.reset();
		escrowStore.reset();
		escrowsStore.reset();
	}
</script>

<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Escrow
		</h1>
		<ul class="steps">
			<li class="step" class:step-accent={$customProgramStore.customProgram !== null}>
				Create Custom Program
			</li>
			<li class="step" class:step-accent={$xMintStore.address && $yMintStore.address}>
				Create Tokens
			</li>
			<li
				class="step"
				class:step-accent={$setupStore.buyerXTokenATA &&
					$setupStore.buyerYTokenATA &&
					$setupStore.sellerXTokenATA &&
					$setupStore.sellerYTokenATA}
			>
				Create ATAs
			</li>
			<li
				class="step"
				class:step-accent={$setupStore.sellerXTokenBalance && $setupStore.buyerYTokenBalance}
			>
				Mint Tokens
			</li>
		</ul>
		<div class="grid grid-cols-4 gap-6 pt-2">
			<div class="form-control">
				<button class="btn btn-info" on:click={handleCreateCustomProgramAccount}
					>Create Custom Program</button
				>
			</div>
			<div class="form-control">
				<button class="btn btn-info" on:click={createAllTokens}>Create Tokens</button>
			</div>
			<div class="form-control">
				<button class="btn btn-info" on:click={createAllBuyerAndSellerAssociatedTokenAccounts}
					>Create ATAs</button
				>
			</div>
			<div class="form-control">
				<button class="btn btn-info" on:click={mintAllTokensAndTransferToAssociatedTokenAccounts}
					>Mint Tokens</button
				>
			</div>
		</div>

		<div class="divider" />

		<div class="flex w-full justify-evenly">
			<div class="grid flex-grow card bg-base-300 rounded-box place-items-center">
				{#if $walletTokenAccountsStore && $walletTokenAccountsStore.length > 0}
					<div class="form-control w-full max-w-xs ">
						<label class="label">
							<span class="label-text">Input</span>
							<span class="label-text-alt"
								>FormState: {formState.outTokenMint === 'SOL'
									? $balanceStore.balance
									: formState.outTokenBalance}</span
							>
						</label>
						<div class="relative">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<span class="text-gray-500 sm:text-sm">$</span>
							</div>
							<input
								bind:value={formState.outTokenAmount}
								type="text"
								placeholder="0.00"
								class="input input-bordered w-full max-w-xs pl-7 pr-12"
								on:input={handleOutTokenAmountInput}
							/>
							<div class="absolute inset-y-0 right-0 flex items-center">
								<label for="token" class="sr-only">Token</label>
								<select
									bind:value={formState.outTokenMint}
									on:change={handleOnChange}
									class="select select-bordered py-0 pl-2 pr-7"
									id="token"
									name="token"
								>
									<option value="SOL" selected={formState.outTokenMint === 'SOL'}>SOL</option>
									{#each $walletTokenAccountsStore as tokenAccount}
										<option
											value={tokenAccount.account.data.parsed.info.mint}
											selected={formState.outTokenMint ==
												tokenAccount.account.data.parsed.info.mint}
										>
											{tokenAccount.account.data.parsed.info.mint.slice(0, 4)}
										</option>
									{/each}
								</select>
							</div>
						</div>
						<label class="label pb-0">
							<span class="label-text-alt">{formState.outTokenMint}</span>
						</label>
					</div>
				{/if}

				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6 m-2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
					/>
				</svg>

				<div class="form-control w-full max-w-xs pb-4">
					<input
						bind:value={formState.inTokenMint}
						on:input={handleInTokenMintAddressInput}
						type="text"
						placeholder="Mint address"
						class="input input-bordered w-full max-w-xs mb-2"
					/>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<span class="text-gray-500 sm:text-sm">$</span>
						</div>
						<input
							bind:value={formState.inTokenAmount}
							on:input={handleInTokenAmountInput}
							type="text"
							placeholder="0.00"
							class="input input-bordered w-full max-w-xs pl-7 pr-12"
						/>
					</div>

					<button
						class="btn btn-accent mt-2 w-full max-w-xs"
						on:click={handleInitializeEscrowAccount}>Initialize Escrow</button
					>
				</div>
			</div>
		</div>

		<div class="divider" />
		{#if $escrowsStore.length > 0}
			{#each $escrowsStore as { escrow, pda } (pda)}
				<Escrow {escrow} pda={pda.toBase58()} />
				<!-- <a href="escrow/${pda}">Escrow: {pda}</a> -->
			{/each}
		{/if}

		<button class="btn btn-info mt-1" on:click={setupForClientTesting}>Setup</button>
		<button class="btn btn-secondary mt-1" on:click={resetAllStores}>Reset</button>
	</div>

	<br />
	<pre>wMintStore: {JSON.stringify(
			$wMintStore,
			(k, v) => (typeof v === 'bigint' ? v.toString() : v),
			2
		)}
  </pre>

	<pre>xMintStore: {JSON.stringify(
			$xMintStore,
			(k, v) => (typeof v === 'bigint' ? v.toString() : v),
			2
		)}
  </pre>

	<br />
	<pre>yMintStore: {JSON.stringify(
			$yMintStore,
			(k, v) => (typeof v === 'bigint' ? v.toString() : v),
			2
		)}
  </pre>

  <br/>
	<pre>zMintStore: {JSON.stringify(
			$zMintStore,
			(k, v) => (typeof v === 'bigint' ? v.toString() : v),
			2
		)}
  </pre>
</div>
