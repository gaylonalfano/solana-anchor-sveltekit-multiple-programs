<script lang="ts">
	// REF: UI idea from: https://github.com/paul-schaaf/escrow-ui/blob/master/src/Alice.vue
	// REF: Good example of web3/spl-token use: https://github.com/paul-schaaf/escrow-ui/blob/master/src/util/initEscrow.ts
	import {
		Keypair,
		LAMPORTS_PER_SOL,
		PublicKey,
		SystemProgram,
		Transaction
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
		createMintToCheckedInstruction
	} from '@solana/spl-token';

	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	// NOTE Anchor.toml setting can copy IDL to specified dir. However, the 'idl' prop
	// on AnchorConnectionProvider wants a JSON instead.
	// import { IDL as idl } from '../idl/non_custodial_escrow';
	import idl from '../../../target/idl/non_custodial_escrow.json';

	import { notificationStore } from '../stores/notification';
	import { xMintStore, yMintStore } from '$stores/escrow/tokens-store';
	import { sellerStore } from '$stores/escrow/seller-store';
	import { buyerStore } from '$stores/escrow/buyer-store';
	import {
		escrowStore,
		type EscrowObject,
		type EscrowStoreObject
	} from '$stores/escrow/escrow-store';
	import * as constants from '../helpers/escrow/constants';
	// import type { EscrowObject, EscrowStoreObject } from 'src/models/escrow-types';

	// TODOS:
	// - Fetch all active Escrows involving wallet and display
	// - Add a Token select menu rather than hardcoding X/Y
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
	// - Add reactive statements for $walletStore.publicKey to fetch state
	// - Add Dapp_Program Account Struct that allows the same wallet to init multiple Escrow
	//   exchanges. Currently seeds will only allow 1 unique escrow. This is a bigger task!
	// - DONE Add ability to cancel Escrow by authority (wallet)
	// - Add helper resetStores() method for successful accept or cancel

	const network = constants.NETWORK;

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
	let xMintKeypair = Keypair.generate();
	let xMintPubkey = xMintKeypair.publicKey;

	let yMintKeypair = Keypair.generate();
	let yMintPubkey = yMintKeypair.publicKey;
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
		yAmountFromBuyer: 0
	};

	// $: hasCreatedTokens = if(yMint != null && xMint != null) return true;

	// $: if ($workspaceStore && $walletStore) {
	// 	// console.log('baseAccount: ', $workspaceStore.baseAccount?.publicKey.toBase58());
	// 	console.log('xMintAccountData: ', xMintAccountData);
	// 	// console.log('provider.connection: ', $workspaceStore.provider?.connection);
	// 	// console.log('connection: ', $workspaceStore.connection);
	// 	console.log('walletStore.publicKey: ', $walletStore.publicKey?.toBase58());
	// 	console.log('formState: ', formState);
	// }

	// Create some variables to react to Stores' state
	$: hasWorkspaceProgramReady =
		$workspaceStore &&
		$workspaceStore.program &&
		$workspaceStore.program.programId.toBase58() ===
			constants.NON_CUSTODIAL_ESCROW_PROGRAM_ID.toBase58();
	$: hasWalletReadyForFetch =
		$walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting;

	// TODO Uncomment and continuing. Debugging something else atm
	// $: if (hasWalletReadyForFetch && hasWorkspaceProgramReady) {
	// 	console.log('REFETCH!');
	// 	// NOTE Can't use getAllProgramAccounts() just yet until I generalize it
	// 	// U: Going to modify my xMintStore to use a custom type in order to
	// 	// save the mint address, so I can pass it to getMint(xMintStore.pubkey)
	// 	// to refetch if the UI state gets wiped.
	// 	// FIXME Trying to prevent creating multiple mint tokens on refresh...

	// 	try {
	// 		// Attempt to grab xMintStore, yMintStore values
	// 		// Attempt to getMint() using Store address
	// 		// Finally recreate the tokens!
	// 		// ======= do next =====
	// 		// TODO -  think I just need getMint(connection, address)
	// 		// Q: Do I need a CONST to store the addresses or just
	// 		// save in the xMintStore is enough?
	// 		// U: I'm thinking I need to create CONSTANTS to represent
	// 		// each token Keypair and then just use them inside the createToken()
	// 		// functions. Otherwise, it will generate again and again...
	// 		get(xMintStore);
	// 		get(yMintStore);

	// 		// TODO Don't forget about yMintStore!
	// 		if ($xMintStore.address !== null && $xMintStore.mint === null) {
	// 			// Store maintains mint address but need to get mint account info
	// 			// Q: Do I need to await or resolve Promise? How? tick()?
	// 			let xMintInfo: Mint;
	// 			getMint($workspaceStore.connection, $xMintStore.address).then((response) => {
	// 				xMintInfo = response;
	// 				console.log('xMintInfo: ', xMintInfo);
	// 				// $xMintStore.mint = xMintInfo;
	// 				xMintStore.set({ address: $xMintStore.address, mint: xMintInfo });
	// 			});
	// 			// console.log('Fetched xMintInfo: ', xMintInfo);
	// 			// $xMintStore.mint = xMintInfo;
	// 		} else if ($xMintStore.address === null && $xMintStore.mint === null) {
	// 			// Need to recreate the mint
	// 			console.log('X Mint not found. Need to create token.');
	// 		}
	// 	} catch (e) {
	// 		console.log('Mint Stores unavailable! Need to create token!');
	// 		console.log(e);
	// 	}
	// }

	$: {
		console.log('workspaceStore: ', $workspaceStore);
		console.log('walletStore: ', $walletStore);
		console.log('xMintStore: ', $xMintStore);
		console.log('yMintStore: ', $yMintStore);
		console.log('sellerStore: ', $sellerStore);
		console.log('buyerStore: ', $buyerStore);
		console.log('escrowStore: ', $escrowStore);
		console.log('formState: ', formState);
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
				$walletStore.publicKey as anchor.web3.PublicKey, // seller.publicKey, // mint authority
				$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // freeze authority
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

	async function createTokenXAndTokenY() {
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
		await createTokenX();
		await createTokenY();
	}

	// TODO Refactor
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
			$sellerStore.xTokenATA as anchor.web3.PublicKey
		);

		$sellerStore.xTokenBalance = tokenAmount?.value.uiAmount as number;
	}

	async function getBuyerYTokenAccountBalance() {
		const tokenAmount = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			$buyerStore.yTokenATA as anchor.web3.PublicKey
		);

		$buyerStore.yTokenBalance = tokenAmount?.value.uiAmount as number;
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
		$sellerStore.xTokenATA = sellerXToken;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$sellerStore.xTokenATA, // ata
				$sellerStore.walletAddress as anchor.web3.PublicKey, // seller.publicKey, // owner
				$xMintStore.address as anchor.web3.PublicKey // mint
			)
		);

		// TODO Save sendTransaction() to signature var
		console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

		// Update UI
		formState.sellerXToken = $sellerStore.xTokenATA.toBase58();
	}

	async function createSellerTokenYAssociatedTokenAccount() {
		const sellerYToken = await getAssociatedTokenAddress(
			$yMintStore.address as anchor.web3.PublicKey, // mint
			$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // owner
		);
		console.log(`sellerYToken: ${sellerYToken.toBase58()}`);
		$sellerStore.yTokenATA = sellerYToken;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$sellerStore.yTokenATA, // ata
				$sellerStore.walletAddress as anchor.web3.PublicKey, // seller.publicKey, // owner
				$yMintStore.address as anchor.web3.PublicKey // mint
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
			$buyerStore.walletAddress as anchor.web3.PublicKey //buyer.publicKey // owner
		);
		console.log(`buyerXToken: ${buyerXToken.toBase58()}`);
		$buyerStore.xTokenATA = buyerXToken;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$buyerStore.xTokenATA, // ata
				$buyerStore.walletAddress as anchor.web3.PublicKey, //  buyer.publicKey, // owner
				$xMintStore.address as anchor.web3.PublicKey // mint
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
			$buyerStore.walletAddress as anchor.web3.PublicKey // buyer.publicKey // owner
		);
		console.log(`buyerYToken: ${buyerYToken.toBase58()}`);
		$buyerStore.yTokenATA = buyerYToken;

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				$buyerStore.yTokenATA, // ata
				$buyerStore.walletAddress as anchor.web3.PublicKey, // buyer.publicKey, // owner
				$yMintStore.address as anchor.web3.PublicKey // mint
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

		// Update UI
		formState.buyerYToken = $buyerStore.yTokenATA.toBase58();
	}

	async function createAllBuyerAndSellerAssociatedTokenAccounts() {
		// Q: Not sure this will be needed when I implement actual wallets...
		// Q: Is there a sendAllTransactions() method?
		try {
			await createBuyerTokenXAssociatedTokenAccount();
			await createBuyerTokenYAssociatedTokenAccount();
			await createSellerTokenXAssociatedTokenAccount();
			await createSellerTokenYAssociatedTokenAccount();
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
				$xMintStore.address as anchor.web3.PublicKey, // mint
				$sellerStore.xTokenATA as anchor.web3.PublicKey, // destination ata
				$walletStore.publicKey as anchor.web3.PublicKey, // mint authority
				1e8, // amount // U: Could add this as arg if needed
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
				$yMintStore.address as anchor.web3.PublicKey, // mint
				$buyerStore.yTokenATA as anchor.web3.PublicKey, // destination ata
				$walletStore.publicKey as anchor.web3.PublicKey, // mint authority
				1e8, // amount
				8 // decimals 8
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

	async function mintAllTokensAndTransferToAssociatedTokenAccounts() {
		try {
			await mintTokenXAndTransferToSellerTokenXAssociatedTokenAccount();
			await mintTokenYAndTransferToBuyerTokenYAssociatedTokenAccount();
			await getSellerXTokenAccountBalance();
			await getBuyerYTokenAccountBalance();
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

	async function handleInitializeEscrowAccount() {
		if ($escrowStore.pda !== null) {
			notificationStore.add({
				type: 'error',
				message: 'Escrow account already exists!'
			});
			console.log('error', 'Escrow account already exists!');
			return;
		}

		const [escrowPDA, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
			[
				Buffer.from(constants.ESCROW_SEED_PREFIX),
				($walletStore.publicKey as anchor.web3.PublicKey).toBuffer()
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);
		console.log('escrow PDA: ', escrowPDA);

		const xAmount = new anchor.BN(formState.xAmountFromSeller);
		const yAmount = new anchor.BN(formState.yAmountFromBuyer); // number of token seller wants in exchange for xAmount
		// xAmountFromSeller = xAmount.toNumber();
		// yAmountFromBuyer = yAmount.toNumber();

		// Check whether escrow account already has data
		let data: EscrowObject;
		// NOTE We just need an address to store the escrowed X tokens
		// NOTE This also allows me to later create MULTIPLE escrow accounts
		// with different token pairs, etc.
		let escrowedXToken = anchor.web3.Keypair.generate();

		const tx = await $workspaceStore.program?.methods
			.initialize(xAmount, yAmount)
			// NOTE We only provide the PublicKeys for all the accounts.
			// We do NOT have to deal with isSigner, isWritable, etc. like in RAW
			// since we already declared that in the program Context struct.
			// This means Anchor will look for all that info in our struct on ENTRY!
			// NOTE We also don't have to pass the System Program, Token Program, and
			// Associated Token Program, since Anchor resolves these automatically.
			// NOTE Values in accounts([]) are PublicKeys!
			// U: Replacing local vars with Stores
			.accounts({
				seller: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey,
				xMint: $xMintStore.address as anchor.web3.PublicKey,
				yMint: $yMintStore.address as anchor.web3.PublicKey,
				sellerXToken: $sellerStore.xTokenATA as anchor.web3.PublicKey, // ATA
				escrow: escrowPDA, // created in program
				escrowedXToken: escrowedXToken.publicKey, // created in program
				// tokenProgram: TOKEN_PROGRAM_ID, // Q: Use 2022 version? A: TOKEN_PROGRAM_ID!
				// rent: SYSVAR_RENT_PUBKEY,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// Q: Which accounts are Signers?
			// A: Check IDL! Wallet and escrowedXToken!
			// Q: Why is escrowedXToken a Signer? It's just a type TokenAccount...
			.signers([escrowedXToken])
			.rpc();

		console.log('TxHash ::', tx);

		// After tx success, get updated account data and update Store state
		data = (await $workspaceStore.program?.account.escrow.fetch(escrowPDA)) as EscrowObject;
		// Q: Can I ...spread data of IDL 'Escrow' into ANOTHER custom type
		// that has additional fields? Like partially fill whatever fields match
		escrowStore.set({ escrow: data, pda: escrowPDA } as EscrowStoreObject);

		const escrowedXTokenAccountBalance =
			await $workspaceStore.provider?.connection.getTokenAccountBalance(
				$escrowStore.escrow?.escrowedXToken as anchor.web3.PublicKey
			);
		console.log('INITIALIZE::escrowedXTokenAccountBalance: ', escrowedXTokenAccountBalance);
		// escrowedXTokenBalance = escrowedXTokenAccountBalance?.value.uiAmount as number;

		// NOTE After running this and looking at solana logs, I can search the escrowedXToken
		//❯ solana-anchor-sveltekit-multiple-programs main [!] spl-token account-info --address H4v4RYzNqVPAV88Zus9j1GYYiUf64hsFFBScTYvmdYQh
		//
		//Address: H4v4RYzNqVPAV88Zus9j1GYYiUf64hsFFBScTYvmdYQh  (Aux*)
		//Balance: 0.0000004  // After transferring 40 for xAmountFromSeller
		//Mint: BxJkZJY5waBqE2CafUYSrTRne5UHkGBTzBcxzfZNXMde
		//Owner: ADncSp91geB71DgSVF6QjQKFQBAtVt4gH7B2mEZjspby // Escrow PDA
		//State: Initialized
		//Delegation: (not set)
		//Close authority: (not set)
		//
		//* Please run `spl-token gc` to clean up Aux accounts

		// Update/double-check Escrow State
		console.log('INITIALIZE::$escrowStore: ', $escrowStore);
	}

	async function handleAcceptTrade() {
		const tx = await $workspaceStore.program?.methods
			.accept()
			.accounts({
				buyer: $walletStore.publicKey as anchor.web3.PublicKey,
				escrow: $escrowStore.pda as anchor.web3.PublicKey,
				escrowedXToken: $escrowStore.escrow?.escrowedXToken as anchor.web3.PublicKey,
				sellerYToken: $sellerStore.yTokenATA as anchor.web3.PublicKey,
				buyerXToken: $buyerStore.xTokenATA as anchor.web3.PublicKey,
				buyerYToken: $buyerStore.yTokenATA as anchor.web3.PublicKey,
				tokenProgram: TOKEN_PROGRAM_ID
			})
			.signers([]) // NOTE buyer is wallet, so don't need!
			.rpc({ skipPreflight: true });

		console.log('TxHash ::', tx);

		const escrowedXTokenAccountBalance =
			await $workspaceStore.provider?.connection.getTokenAccountBalance(
				$escrowStore.escrow?.escrowedXToken
			);
		console.log('ACCEPT::escrowedXTokenAccountBalance: ', escrowedXTokenAccountBalance);
		// ACCEPT::escrowedXTokenAccountBalance:  {
		//   context: { apiVersion: '1.10.38', slot: 81 },
		//   value: { amount: '0', decimals: 8, uiAmount: 0, uiAmountString: '0' }
		// }

		// Fetch data after tx confirms & update global state
		// REF: Here's how I did it with Polls program:
		// const currentPoll = (await $workspaceStore.program?.account.poll.fetch(pda)) as PollObject;
		// pollsStore.addPoll(currentPoll, pda);
		// const currentProfile = (await $workspaceStore.program?.account.profile.fetch(
		// 	$profileStore.pda as anchor.web3.PublicKey
		// )) as ProfileObject;
		// profileStore.set({ profile: currentProfile, pda: $profileStore.pda });
		// Fetch data after tx confirms & update global state
		const currentEscrow = (await $workspaceStore.program?.account.escrow.fetch(
			$escrowStore.pda as anchor.web3.PublicKey
		)) as EscrowObject;
		escrowStore.set({
			escrow: currentEscrow,
			pda: $escrowStore.pda as anchor.web3.PublicKey
		} as EscrowStoreObject);
		console.log('ACCEPT::$escrowStore: ', $escrowStore);
		// Confirm that seller/buyer ATAs also updated correctly
		const currentSellerXBalance = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			$sellerStore.xTokenATA as anchor.web3.PublicKey
		);
		$sellerStore.xTokenBalance = currentSellerXBalance?.value.uiAmount as number;

		const currentSellerYBalance = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			$sellerStore.yTokenATA as anchor.web3.PublicKey
		);
		$sellerStore.yTokenBalance = currentSellerYBalance?.value.uiAmount as number;

		const currentBuyerXBalance = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			$buyerStore.xTokenATA as anchor.web3.PublicKey
		);
		$buyerStore.xTokenBalance = currentBuyerXBalance?.value.uiAmount as number;

		const currentBuyerYBalance = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			$buyerStore.yTokenATA as anchor.web3.PublicKey
		);
		$buyerStore.yTokenBalance = currentBuyerYBalance?.value.uiAmount as number;

		// Add to notificationStore
		notificationStore.add({
			type: 'success',
			message: 'Transaction successful!',
			txid: tx
		});
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
					seller: $walletStore.publicKey as PublicKey,
					escrow: $escrowStore.pda as anchor.web3.PublicKey,
					escrowedXToken: $escrowStore.escrow?.escrowedXToken as anchor.web3.PublicKey,
					sellerXToken: $sellerStore.xTokenATA as anchor.web3.PublicKey,
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

<AnchorConnectionProvider {network} {idl} />
<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Escrow
		</h1>
		<ul class="steps">
			<li class="step" class:step-accent={$xMintStore.address && $yMintStore.address}>
				Create Tokens
			</li>
			<li
				class="step"
				class:step-accent={$buyerStore.xTokenATA &&
					$buyerStore.yTokenATA &&
					$sellerStore.xTokenATA &&
					$sellerStore.yTokenATA}
			>
				Create ATAs
			</li>
			<li class="step" class:step-accent={$sellerStore.xTokenBalance && $buyerStore.yTokenBalance}>
				Mint Tokens
			</li>
			<li class="step" class:step-accent={$escrowStore.escrow !== null}>Create Escrow</li>
		</ul>
		<div class="grid grid-cols-4 gap-6 pt-2">
			<div class="form-control">
				<button class="btn btn-info" on:click={createTokenXAndTokenY}>Create Tokens</button>
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
			<div class="form-control">
				<button class="btn btn-info" on:click={handleInitializeEscrowAccount}>Create Escrow</button>
			</div>
			<div class="form-control">
				<button class="btn mt-1" on:click={getXMintAccount}>Get X Mint</button>
				{#if $xMintStore.address !== null && $xMintStore.mint !== null}
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Address</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$xMintStore.address}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$xMintStore.mint.mintAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Freeze Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$xMintStore.mint.freezeAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Supply</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$xMintStore.mint.supply}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Decimals</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$xMintStore.mint.decimals}
						/>
					</label>
				{/if}
			</div>
			<div class="form-control">
				<button class="btn mt-1" on:click={getYMintAccount}>Get Y Mint</button>
				{#if $yMintStore.mint}
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Address</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$yMintStore.address}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							value={$yMintStore.mint.mintAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Freeze Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$yMintStore.mint.freezeAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Supply</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$yMintStore.mint.supply}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Decimals</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$yMintStore.mint.decimals}
						/>
					</label>
				{/if}
			</div>
			<div class="form-control">
				<button class="btn  mt-1" on:click={getSellerXTokenAccountBalance}>Get Seller X</button>
				{#if $sellerStore.xTokenBalance}
					<label class="input-group input-group-vertical pt-1">
						<span>Balance</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$sellerStore.xTokenBalance}
						/>
					</label>
				{/if}
			</div>
			<div class="form-control">
				<button class="btn mt-1" on:click={getBuyerYTokenAccountBalance}>Get Buyer Y</button>
				{#if $buyerStore.yTokenBalance}
					<label class="input-group input-group-vertical pt-1">
						<span>Balance</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={$buyerStore.yTokenBalance}
						/>
					</label>
				{/if}
			</div>
		</div>
		<div class="divider" />
		<div class="flex w-full justify-evenly">
			{#if $escrowStore.escrow === null}
				<div class="grid flex-grow card bg-base-300 rounded-box place-items-center">
					<div class="form-control pb-4">
						<div class="stat place-items-center">
							<div class="stat-title">Initialize</div>
						</div>
						<label class="input-group input-group-vertical pt-1">
							<span class="bg-info">Seller X Account</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={$sellerStore.xTokenATA}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span class="bg-info">Buyer Y Account</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={$buyerStore.yTokenATA}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span class="bg-info">X Amount From Seller</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={formState.xAmountFromSeller}
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span class="bg-info">Y Amount From Buyer</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={formState.yAmountFromBuyer}
							/>
						</label>
						<button
							class="btn btn-accent mt-1"
							on:click={handleInitializeEscrowAccount}
							disabled={$escrowStore.escrow !== null}>Create Escrow</button
						>
					</div>
				</div>
			{:else}
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
							<span>Seller X Account</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={$sellerStore.xTokenATA}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span>Buyer Y Account</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={$buyerStore.yTokenATA}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span>X Amount</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={$escrowStore.escrow.xAmount}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span>Y Amount</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={$escrowStore.escrow.yAmount}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span>Escrowed X Account</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={$escrowStore.escrow.escrowedXToken}
								disabled
							/>
						</label>
						<button class="btn btn-accent mt-1" on:click={handleAcceptTrade}>Accept Escrow</button>
						<button class="btn btn-error mt-1" on:click={handleCancelTrade}>Cancel Escrow</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
