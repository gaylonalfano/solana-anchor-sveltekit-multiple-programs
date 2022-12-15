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
	import { setupDevelopment } from '../../helpers/escrow/setupDevelopment';
	import * as constants from '../../helpers/escrow/constants';
	import { get } from 'svelte/store';
	import { z } from 'zod';
	// import type { EscrowObject, EscrowStoreObject } from 'src/models/escrow-types';

	// TODOS:
	// - FIXME Add form validation and a <form> submit
  //   - Remove Zod object validation and instead add inside existing
  //     input handlers. I update a lot of userStore state inside these
  //     handlers to just toss out. 
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
		outTokenMint: 'SOL',
		outTokenATA: '',
		outTokenAmount: '',
		outTokenBalance: 0,
		inTokenMint: '',
		inTokenMintError: false,
		inTokenATA: '',
		inTokenAmount: '',
		inTokenBalance: 0
	};

	let formErrors: Record<string, any> = {
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

	$: hasWorkspaceProgramReady =
		$workspaceStore &&
		$workspaceStore.program &&
		$workspaceStore.program.programId.toBase58() ===
			constants.NON_CUSTODIAL_ESCROW_PROGRAM_ID.toBase58();
	$: hasWalletReadyForFetch =
		$walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting;

	// $: if ($walletTokenAccountsStore && $walletTokenAccountsStore.length > 0) {
	// 	reactiveTokenBalance = setUserStoreOutTokenMintDecimalsAtaBalanceRawBalance(selectedToken) as number;
	// }

	$: hasRequiredUserStoreValues =
		$userStore.outTokenMint !== null &&
		$userStore.outTokenATA !== null &&
		$userStore.outTokenDecimals !== null &&
		$userStore.outTokenAmount !== null &&
		$userStore.outTokenRawAmount !== null &&
		$userStore.inTokenMint !== null &&
		$userStore.inTokenAmount !== null;

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

			console.log(
				'Token stores after using get(): ',
				$wMintStore,
				$xMintStore,
				$yMintStore,
				$zMintStore
			);

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
		// console.log('wMintStore: ', $wMintStore);
		// console.log('xMintStore: ', $xMintStore);
		// console.log('yMintStore: ', $yMintStore);
		// console.log('zMintStore: ', $zMintStore);
		console.log('wMint: ', $wMintStore.address?.toBase58());
		console.log('xMint: ', $xMintStore.address?.toBase58());
		console.log('yMint: ', $yMintStore.address?.toBase58());
		console.log('zMint: ', $zMintStore.address?.toBase58());
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
		// console.log('setupStore: ', $setupStore);
		// console.log('customProgramStore: ', $customProgramStore);
		console.log('userStore.outTokenATA: ', $userStore.outTokenATA?.toBase58());
		console.log('escrowInputsAreValid: ', escrowInputsAreValid);
		// console.log('formState: ', formState);
		// console.log('formErrors: ', formErrors);
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
	function setUserStoreOutTokenMintDecimalsAtaBalanceRawBalance() {
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
		setUserStoreOutTokenMintDecimalsAtaBalanceRawBalance();
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

	// TODO Build a Zod Object Schema for the formData
	// TODO Add a check that outTokenBalance >= outTokenAmount
	const escrowSchema = z.object({
		outTokenMint: z
			.string({ required_error: 'outToken mint address required!' })
			.min(constants.PUBKEY_MIN_CHARS, {
				message: `Address must be greater than or equal to ${constants.PUBKEY_MIN_CHARS} characters.`
			})
			.max(constants.PUBKEY_MAX_CHARS, {
				message: `Address must be less than or equal to ${constants.PUBKEY_MAX_CHARS} characters.`
			})
			.trim(),
		outTokenAmount: z
			.string()
			.min(1, { message: 'Amount must be greater than 0.' })
			.max(10, { message: 'Amount must be less than 10.' })
			.trim(),
		inTokenMint: z
			.string({ required_error: 'inToken mint address required!' })
			.min(constants.PUBKEY_MIN_CHARS, {
				message: `Address must be greater than or equal to ${constants.PUBKEY_MIN_CHARS} characters.`
			})
			.max(constants.PUBKEY_MAX_CHARS, {
				message: `Address must be less than or equal to ${constants.PUBKEY_MAX_CHARS} characters.`
			})
			.trim(),

		inTokenAmount: z
			.string()
			.min(1, { message: 'Amount must be greater than 0.' })
			.max(10, { message: 'Amount must be less than 10.' })
			.trim()
	});

	function validateEscrowInputs(inputs: unknown): boolean {
		escrowInputsAreValid = true;

		// Reset any lingering error messages.
		formErrors = {
			outTokenMint: '',
			outTokenATA: '',
			outTokenAmount: '',
			outTokenBalance: '',
			inTokenMint: '',
			inTokenATA: '',
			inTokenAmount: '',
			inTokenBalance: ''
		};

		try {
			const result = escrowSchema.parse(inputs);
			console.log('result: ', result);

			// return escrowInputsAreValid;
		} catch (error: any) {
			escrowInputsAreValid = false;
			// Use Zod's error.flatten
			const { fieldErrors } = error.flatten();

			// Update our formErrors obj and stop execution
			console.log('fieldErrors: ', fieldErrors);
			for (const [key, value] of Object.entries(fieldErrors)) {
				formErrors[key] = (value as any[])[0] as string;
			}
			console.log('formErrors: ', formErrors);
		}

		return escrowInputsAreValid;

		// EASIEST validation!
		// // Validate outTokenMint
		// if (formState.outTokenMint.trim().length < 3) {
		// 	escrowInputsAreValid = false;
		//     formErrors.outTokenMint = 'outToken mint address required!';
		// } else {
		//     formErrors.outTokenMint = '';
		//   }

		// // Validate outTokenAmount
		//   if (formState.outTokenAmount.trim().length < 1) {
		//     escrowInputsAreValid = false;
		//     formErrors.outTokenAmount = 'Amount must be greater than 0.';
		//   } else {
		//     formErrors.outTokenAmount = '';
		//   }

		// // Validate inTokenMint
		//   if (formState.inTokenMint.trim().length < 1) {
		//     escrowInputsAreValid = false;
		//     formErrors.inTokenMint = 'inToken mint address required!';
		//   } else {
		//     formErrors.inTokenMint = '';
		//   }

		// // Validate the inTokenAmount
		//   if (formState.inTokenAmount.trim().length < 1) {
		//     escrowInputsAreValid = false;
		//     formErrors.inTokenAmount = 'Amount must be greater than 0.';
		//   } else {
		//     formErrors.inTokenAmount = '';
		//   }

		//   return escrowInputsAreValid;
	}

	async function handleInitializeEscrowAccount(e: SubmitEvent) {
		console.log(e);

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

		// U: Grab the formData by using the e.target
		const formData = new FormData(e.target as HTMLFormElement);

		const formDataExtracted = {};

		for (let field of formData) {
			const [key, value]: [string, any] = field;
			formDataExtracted[key] = value;
		}
		console.log(formDataExtracted);

		// Validate the form data
		validateEscrowInputs(formDataExtracted);

		if (!escrowInputsAreValid) {
			notificationStore.add({
				type: 'error',
				message: 'Escrow inputs are invalid!'
			});
			console.log('error', 'Escrow inputs are invalid!');
			return;
		}

    // FIXME 
		// U: Need to update $userStore values
		// NOTE Previously handled inside input handlers. Now moving
		// all inside this form element, so need to update userStore
    handleOutTokenAmountInput();
    handleInTokenMintAddressInput();
    handleInTokenAmountInput();
    

		// TODO Add validation for out/in token details and raw amounts
		// NOTE Currently storing all the details in sellerStore
		if (!hasRequiredUserStoreValues) {
			notificationStore.add({
				type: 'error',
				message: 'User store values are missing!'
			});
			console.log('error', 'User store values are missing!');
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

<div class="hero mx-auto p-4 w-full">
	<div class="hero-content flex flex-col w-full">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Escrow
		</h1>

		<div class="divider" />

		<form on:submit|preventDefault={handleInitializeEscrowAccount} class="w-full">
			<div class="grid flex-grow card bg-base-300 rounded-box place-items-center">
				{#if $walletTokenAccountsStore && $walletTokenAccountsStore.length > 0}
					<div class="form-control w-full max-w-xs pb-4">
						<label class="label">
							<span class="label-text" />
							<span class="label-text-alt"
								>Balance: {formState.outTokenMint === 'SOL'
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
								name="outTokenAmount"
							/>

							<div class="absolute inset-y-0 right-0 flex items-center">
								<label for="outTokenMint" class="sr-only">Token</label>
								<select
									bind:value={formState.outTokenMint}
									on:change={handleOnChange}
									class="select select-bordered py-0 pl-2 pr-7"
									id="outTokenMint"
									name="outTokenMint"
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
						{#if formErrors.outTokenAmount}
							<label for="outTokenAmount" class="label">
								<span class="label-text-alt text-error">{formErrors.outTokenAmount}</span>
							</label>
						{:else if formState.outTokenMint}
							<label for="outTokenMint" class="label pb-0">
								<span class="label-text-alt">{formState.outTokenMint}</span>
							</label>
						{/if}
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
						name="inTokenMint"
						type="text"
						placeholder="Mint address"
						class="input input-bordered w-full max-w-xs mb-2"
					/>
					<label for="inTokenMint" class="label">
						<span class="label-text-alt text-error">{formErrors.inTokenMint}</span>
					</label>
				</div>

				<div class="form-control w-full max-w-xs pb-4">
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<span class="text-gray-500 sm:text-sm">$</span>
						</div>
						<input
							bind:value={formState.inTokenAmount}
							name="inTokenAmount"
							type="text"
							placeholder="0.00"
							class="input input-bordered w-full max-w-xs pl-7 pr-12"
						/>
					</div>
					<label for="inTokenAmount" class="label">
						<span class="label-text-alt text-error">{formErrors.inTokenAmount}</span>
					</label>
				</div>

				<div class="form-control w-full max-w-xs pb-4">
					<button class="btn btn-accent mt-2 w-full max-w-xs" type="submit"
						>Initialize Escrow</button
					>
				</div>
			</div>
		</form>

		<div class="form-control w-full max-w-xs pb-4">
			<button class="btn btn-info mt-1" on:click={setupDevelopment}>Setup</button>
			<button class="btn btn-secondary mt-1" on:click={resetAllStores}>Reset</button>
		</div>

		<div class="divider" />

		<div class="text-center">
			{#if $escrowsStore.length > 0}
				{#each $escrowsStore as { escrow, pda } (pda)}
					<Escrow {escrow} pda={pda.toBase58()} />
					<!-- <a href="escrow/${pda}">Escrow: {pda}</a> -->
				{/each}
			{/if}
		</div>
	</div>
</div>
