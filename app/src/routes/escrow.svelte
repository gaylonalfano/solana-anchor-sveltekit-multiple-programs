<script lang="ts">
	// REF: UI idea from: https://github.com/paul-schaaf/escrow-ui/blob/master/src/Alice.vue
	// REF: Good example of web3/spl-token use: https://github.com/paul-schaaf/escrow-ui/blob/master/src/util/initEscrow.ts
	import {
		clusterApiUrl,
		Connection,
		Keypair,
		PublicKey,
		SystemProgram,
		Transaction
	} from '@solana/web3.js';
	import * as anchor from '@project-serum/anchor';
	import {
		TOKEN_PROGRAM_ID,
		MINT_SIZE,
		createMint,
		createAssociatedTokenAccount,
		createInitializeMintInstruction,
		getMinimumBalanceForRentExemptMint,
		mintToChecked,
		getAccount,
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

	import { onMount } from 'svelte';
	import { notificationStore } from '../stores/notification';
	import { Button } from '$lib/index';
	import type NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
	import P1 from './p1.svelte';

	// const network = clusterApiUrl('devnet'); // localhost or mainnet */
	const network = 'http://localhost:8899';
	const config = 'confirmed';

	// FIXME Losing reactivity in UI. Not sure why. Just seems like after I sendTransaction(),
	// no other async/awaits really work unless I add to button onclick handler...
	// Q: Is it my connection's commitment level? Default is 'processed' I think,
	// but maybe I need to set to 'confirmed'?
	// A: NOPE. Commitment level didn't have any impact.
	// NOTE Need to type anchor.Wallet to get 'payer' property or errors
	// const seller = ($workspaceStore.provider as anchor.AnchorProvider).wallet as anchor.Wallet;
	// const buyer = anchor.web3.Keypair.generate();
	const buyer = new PublicKey('HzgMBJvpsKgTRe84q7BgdYbf3w4hBCWoy384rZBF9viy');
	let xMint: anchor.web3.PublicKey;
	let xMintAccountData;
	let yMint: anchor.web3.PublicKey;
	let yMintAccountData;
	let sellerXToken: anchor.web3.PublicKey; // Associated Token Accounts
	let sellerXBalance: number;
	let sellerYToken: anchor.web3.PublicKey;
	let sellerYBalance: number;
	let buyerXToken: anchor.web3.PublicKey;
	let buyerXBalance: number;
	let buyerYToken: anchor.web3.PublicKey;
	let buyerYBalance: number;
	// NOTE This is just saving the Pubkey, since program creates actual account
	let escrowedXToken: anchor.web3.Keypair;
	// NOTE This is a PDA that we'll get below
	let escrow: anchor.web3.PublicKey;

	// Q: What is workspaceStore.baseAccount? It changes on each refresh...
	// Q: How am I supposed to pass AnchorProvider with simple solana/spl-token methods?
	// Getting issues with Signer vs. Wallet...
	// A: You CAN'T because frontend never has access to Keypairs!
	// MUST to compose ix and txs manually following Cookbook

	let formState = {
		escrow: '',
		programId: '',
		seller: '',
		buyer: '',
		sellerXToken: '',
		buyerYToken: '',
		xAmountFromSeller: 0,
		yAmountFromBuyer: 0
	};

	// $: formState = {
	// 	escrowPublicKey: escrow?.toString(),
	// 	programId: $workspaceStore ? $workspaceStore.program?.programId.toString() : '',
	// 	sellerXTokenPublicKey: sellerXToken?.toString(),
	// 	buyerYTokenPublicKey: buyerYToken?.toString(),
	// 	xAmountFromSeller: 0,
	// 	yAmountFromBuyer: 0
	// };

	interface EscrowState {
		escrow: undefined | string;
		programId: undefined | string;
		seller: undefined | string;
		buyer: undefined | string;
		sellerXToken: undefined | string;
		buyerYToken: undefined | string;
		xAmountFromSeller: undefined | number;
		yAmountFromBuyer: undefined | number;
		escrowedXToken: undefined | string;
	}

	let escrowState: EscrowState;

	// escrowState = {
	// 	escrow: '',
	// 	programId: '',
	// 	seller: '',
	// 	buyer: '',
	// 	sellerXToken: '',
	// 	buyerYToken: '',
	// 	xAmountFromSeller: 0,
	// 	yAmountFromBuyer: 0,
	// 	escrowedXToken: ''
	// };

	// $: escrowState = {
	// 	escrowPublicKey: escrow?.toString(),
	// 	programId: $workspaceStore.program?.programId?.toString(),
	// 	sellerXTokenPublicKey: sellerXToken?.toString(),
	// 	buyerYTokenPublicKey: buyerYToken?.toString(),
	// 	xAmountFromSeller: formState.xAmountFromSeller,
	// 	yAmountFromBuyer: formState.yAmountFromBuyer
	// };

	$: {
		// console.log('baseAccount: ', $workspaceStore.baseAccount?.publicKey.toBase58());
		console.log('xMintAccountData: ', xMintAccountData);
		// console.log('provider.connection: ', $workspaceStore.provider?.connection);
		// console.log('connection: ', $workspaceStore.connection);
		console.log('walletStore.publicKey: ', $walletStore.publicKey?.toBase58());
		console.log('formState: ', formState);
	}

	async function createTokenX() {
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

		const mint = Keypair.generate();
		xMint = mint.publicKey;
		console.log(`xMint: ${xMint}`);

		// console.log('provider BEFORE create Token: ', $workspaceStore.provider);
		// console.log('connection BEFORE create Token: ', $workspaceStore.connection);
		const tx = new Transaction().add(
			// create mint account
			SystemProgram.createAccount({
				fromPubkey: $walletStore.publicKey as anchor.web3.PublicKey,
				newAccountPubkey: mint.publicKey,
				space: MINT_SIZE,
				lamports: await getMinimumBalanceForRentExemptMint($workspaceStore.connection),
				programId: TOKEN_PROGRAM_ID
			}),
			// init mint account
			createInitializeMintInstruction(
				xMint, // mint publicKey
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
		// NOTE You need to pass in BOTH keypairs of the signer, AND the keypairs
		// of the accounts you're creating.
		// console.log(`TxHash :: ${await $workspaceStore.connection.sendTransaction(tx, [mint])}`); // ERROR: signature verification failed (also deprecated?)
		// console.log(
		// 	`TxHash :: ${await $workspaceStore.provider?.connection.sendTransaction(tx, [mint])}`
		// ); // ERROR: signature verification failed (also deprecated?)

		const signature = await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
			signers: [mint]
		});
		console.log('signature:	', signature);
		const confirmedTx = await $workspaceStore.connection.confirmTransaction(signature, 'confirmed');
		console.log('confirmedTx: ', confirmedTx);

		// console.log(
		// 	`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
		// 		signers: [mint]
		// 	})}`
		// ); // WORKS! Need to use walletStore instead of workspaceStore!

		// FIXME
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
		const mint = Keypair.generate();
		yMint = mint.publicKey;
		console.log(`yMint: ${yMint}`);

		const tx = new Transaction().add(
			// create mint account
			SystemProgram.createAccount({
				fromPubkey: $walletStore.publicKey as anchor.web3.PublicKey,
				newAccountPubkey: mint.publicKey,
				space: MINT_SIZE,
				lamports: await getMinimumBalanceForRentExemptMint($workspaceStore.connection),
				programId: TOKEN_PROGRAM_ID
			}),
			// init mint account
			createInitializeMintInstruction(
				yMint, // mint publicKey
				8, // decimals
				$walletStore.publicKey as anchor.web3.PublicKey, // seller.publicKey, // mint authority
				$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // freeze authority
			)
		);

		console.log(
			`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
				signers: [mint]
			})}`
		); // WORKS! Need to use walletStore instead of workspaceStore!
	}

	async function createTokenXAndTokenY() {
		await createTokenX();
		await createTokenY();
	}

	// TODO Refactor
	async function getXMintAccount() {
		// NOTE Currently getMint() only works when I add to onclick event...
		xMintAccountData = await getMint($workspaceStore.connection, xMint);
		// xMintAccountData = await $workspaceStore.connection.getAccountInfo(xMint); // Promise
	}

	async function getYMintAccount() {
		yMintAccountData = await getMint($workspaceStore.connection, yMint);
	}

	async function getSellerXTokenAccountBalance() {
		const tokenAmount = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			sellerXToken
		);

		sellerXBalance = tokenAmount?.value.uiAmount as number;
	}

	async function getBuyerYTokenAccountBalance() {
		const tokenAmount = await $workspaceStore.provider?.connection.getTokenAccountBalance(
			buyerYToken
		);

		buyerYBalance = tokenAmount?.value.uiAmount as number;
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

		sellerXToken = await getAssociatedTokenAddress(
			xMint, // mint
			$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // owner
		);
		console.log(`sellerXToken: ${sellerXToken.toBase58()}`);

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				sellerXToken, // ata
				$walletStore.publicKey as anchor.web3.PublicKey, // seller.publicKey, // owner
				xMint // mint
			)
		);

		console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

		// Update UI
		formState.sellerXToken = sellerXToken.toBase58();
	}

	async function createSellerTokenYAssociatedTokenAccount() {
		sellerYToken = await getAssociatedTokenAddress(
			yMint, // mint
			$walletStore.publicKey as anchor.web3.PublicKey // seller.publicKey // owner
		);
		console.log(`sellerYToken: ${sellerYToken.toBase58()}`);

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				sellerYToken, // ata
				$walletStore.publicKey as anchor.web3.PublicKey, // seller.publicKey, // owner
				yMint // mint
			)
		);

		console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!
	}

	async function createBuyerTokenXAssociatedTokenAccount() {
		buyerXToken = await getAssociatedTokenAddress(
			xMint, // mint
			buyer //buyer.publicKey // owner
		);
		console.log(`buyerXToken: ${buyerXToken.toBase58()}`);

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				buyerXToken, // ata
				buyer, //  buyer.publicKey, // owner
				xMint // mint
			)
		);

		console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!
	}

	async function createBuyerTokenYAssociatedTokenAccount() {
		buyerYToken = await getAssociatedTokenAddress(
			yMint, // mint
			buyer // buyer.publicKey // owner
		);
		console.log(`buyerYToken: ${buyerYToken.toBase58()}`);

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				buyerYToken, // ata
				buyer, // buyer.publicKey, // owner
				yMint // mint
			)
		);

		console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

		// Update UI
		formState.buyerYToken = buyerYToken.toBase58();
	}

	async function createAllBuyerAndSellerAssociatedTokenAccounts() {
		// Q: Not sure this will be needed when I implement actual wallets...
		await createBuyerTokenXAssociatedTokenAccount();
		await createBuyerTokenYAssociatedTokenAccount();
		await createSellerTokenXAssociatedTokenAccount();
		await createSellerTokenYAssociatedTokenAccount();
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

		console.log('provider BEFORE Mint: ', $workspaceStore.provider);
		const tx = new Transaction().add(
			createMintToCheckedInstruction(
				xMint, // mint
				sellerXToken, // destination ata
				$walletStore.publicKey as anchor.web3.PublicKey, // mint authority
				1e8, // amount
				8 // decimals
			)
		);
		console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!
		console.log('provider AFTER Mint: ', $workspaceStore.provider);

		// FIXME
		// Q: Why don't any other async calls work after sending a transaction?
		// Doesn't work for fetching token account data, balances, etc.
		// Is it my workspaceStore connection? Only reason I consider that is because
		// I can't use it to sendTransaction() for some reason...
		console.log(
			`sellerXToken.balance: ${await $workspaceStore.connection
				.getTokenAccountBalance(sellerXToken)
				.then((r) => r.value.amount)}`
		);
	}

	async function mintTokenYAndTransferToBuyerTokenYAssociatedTokenAccount() {
		const tx = new Transaction().add(
			createMintToCheckedInstruction(
				yMint,
				buyerYToken,
				$walletStore.publicKey as anchor.web3.PublicKey,
				1e8,
				8
			)
		);
		console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

		// FIXME
		// Q: Why don't any other async calls work after sending a transaction?
		// Doesn't work for fetching token account data, balances, etc.
		// Is it my workspaceStore connection? Only reason I consider that is because
		// I can't use it to sendTransaction() for some reason...
		console.log(
			`buyerYToken.balance: ${await $workspaceStore.connection
				.getTokenAccountBalance(buyerYToken)
				.then((r) => r.value.amount)}`
		);
	}

	async function mintAllTokensAndTransferToAssociatedTokenAccounts() {
		await mintTokenXAndTransferToSellerTokenXAssociatedTokenAccount();
		await mintTokenYAndTransferToBuyerTokenYAssociatedTokenAccount();
	}

	async function handleInitializeEscrowAccount() {
		if (escrow) {
			notificationStore.add({
				type: 'error',
				message: 'Data account already exists!'
			});
			console.log('error', 'Data account already exists!');
			return;
		}

		const [escrowPDA, escrowBump] = await anchor.web3.PublicKey.findProgramAddress(
			[Buffer.from('escrow2'), ($walletStore.publicKey as anchor.web3.PublicKey).toBuffer()],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);
		escrow = escrowPDA;
		formState.escrowPublicKey = escrow.toString();
		console.log(`escrow: ${escrow}`);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			escrowPDA.toBase58()
		);

		const xAmount = new anchor.BN(formState.xAmountFromSeller);
		const yAmount = new anchor.BN(formState.yAmountFromBuyer); // number of token seller wants in exchange for xAmount
		// Check whether escrow account already has data
		let data;

		// 2. Try to retreive PDA account data if it exists
		console.log(`Checking if escrow account ${escrow} exists...`);
		try {
			// Check whether our PDA address has an escrow account
			data = await $workspaceStore.program?.account.escrow.fetch(escrow);
			console.log('Account already exists!');
		} catch (e) {
			console.log(`Account ${escrow} does NOT exist!`);
			console.log('Creating account...');

			escrowedXToken = anchor.web3.Keypair.generate();
			// TODO Update escrowState (or w/e to display to UI)

			const tx = await $workspaceStore.program?.methods
				.initialize(xAmount, yAmount)
				// NOTE We only provide the PublicKeys for all the accounts.
				// We do NOT have to deal with isSigner, isWritable, etc. like in RAW
				// since we already declared that in the program Context struct.
				// This means Anchor will look for all that info in our struct on ENTRY!
				// NOTE We also don't have to pass the System Program, Token Program, and
				// Associated Token Program, since Anchor resolves these automatically.
				// NOTE Values in accounts([]) are PublicKeys!
				.accounts({
					seller: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey,
					xMint: xMint,
					yMint: yMint,
					sellerXToken: sellerXToken,
					escrow: escrow, // created in program
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

			data = await $workspaceStore.program?.account.escrow.fetch(escrow);
		}

		const escrowedXTokenAccountBalance =
			await $workspaceStore.provider?.connection.getTokenAccountBalance(escrowedXToken.publicKey);
		console.log('INITIALIZE::escrowedXTokenAccountBalance: ', escrowedXTokenAccountBalance);

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

		// Update escrowState for UI
		escrowState = {
			escrow: escrow.toBase58(),
			programId: $workspaceStore.program?.programId.toBase58(),
			seller: $walletStore.publicKey?.toBase58(),
			buyer: buyer.toBase58(),
			sellerXToken: sellerXToken.toBase58(),
			buyerYToken: buyerYToken.toBase58(),
			xAmountFromSeller: xAmount.toNumber(),
			yAmountFromBuyer: yAmount.toNumber(),
			escrowedXToken: escrowedXToken.publicKey.toBase58()
		};
	}

	async function handleAcceptTrade() {
		const tx = await $workspaceStore.program?.methods
			.accept()
			.accounts({
				buyer: $walletStore.publicKey as PublicKey,
				escrow: escrow,
				escrowedXToken: escrowedXToken.publicKey,
				sellerYToken: sellerYToken,
				buyerXToken: buyerXToken,
				buyerYToken: buyerYToken,
				tokenProgram: TOKEN_PROGRAM_ID
			})
			.signers([]) // NOTE buyer is wallet, so don't need!
			.rpc({ skipPreflight: true });

		console.log('TxHash ::', tx);

		const escrowedXTokenAccountBalance =
			await $workspaceStore.provider?.connection.getTokenAccountBalance(escrowedXToken.publicKey);
		console.log('ACCEPT::escrowedXTokenAccountBalance: ', escrowedXTokenAccountBalance);
		// ACCEPT::escrowedXTokenAccountBalance:  {
		//   context: { apiVersion: '1.10.38', slot: 81 },
		//   value: { amount: '0', decimals: 8, uiAmount: 0, uiAmountString: '0' }
		// }

		// Update UI
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
			<li class="step" class:step-accent={xMint && yMint}>Create Tokens</li>
			<li
				class="step"
				class:step-accent={buyerXToken && buyerYToken && sellerXToken && sellerYToken}
			>
				Create ATAs
			</li>
			<li class="step" class:step-accent={sellerXBalance && buyerYBalance}>Mint Tokens</li>
			<li class="step">Create Escrow</li>
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
				{#if xMintAccountData}
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Address</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={xMintAccountData.address}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							value={xMintAccountData.mintAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Freeze Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={xMintAccountData.freezeAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Supply</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={xMintAccountData.supply}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Decimals</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={xMintAccountData.decimals}
						/>
					</label>
				{/if}
			</div>
			<div class="form-control">
				<button class="btn mt-1" on:click={getYMintAccount}>Get Y Mint</button>
				{#if yMintAccountData}
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Address</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={yMintAccountData.address}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							value={yMintAccountData.mintAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Freeze Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={yMintAccountData.freezeAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Supply</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={yMintAccountData.supply}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Decimals</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={yMintAccountData.decimals}
						/>
					</label>
				{/if}
			</div>
			<div class="form-control">
				<button class="btn  mt-1" on:click={getSellerXTokenAccountBalance}>Get Seller X</button>
				{#if sellerXBalance}
					<label class="input-group input-group-vertical pt-1">
						<span>Balance</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={sellerXBalance}
						/>
					</label>
				{/if}
			</div>
			<div class="form-control">
				<button class="btn mt-1" on:click={getBuyerYTokenAccountBalance}>Get Buyer Y</button>
				{#if buyerYBalance}
					<label class="input-group input-group-vertical pt-1">
						<span>Balance</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={buyerYBalance}
						/>
					</label>
				{/if}
			</div>
		</div>
		<div class="divider" />
		<div class="flex w-full justify-evenly">
			<div class="grid flex-grow card bg-base-300 rounded-box place-items-center">
				<div class="form-control">
					<div class="stat place-items-center">
						<div class="stat-title">Initialize</div>
					</div>
					<label class="input-group input-group-vertical pt-1">
						<span class="bg-info">Seller X Account</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							bind:value={formState.sellerXToken}
							disabled
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span class="bg-info">Buyer Y Account</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							bind:value={formState.buyerYToken}
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
					<button class="btn btn-accent mt-1" on:click={handleInitializeEscrowAccount}
						>Create Escrow</button
					>
				</div>
			</div>
			<div class="divider divider-horizontal" />
			<div class="grid flex-grow card bg-base-300 rounded-box place-items-center">
				<div class="form-control">
					{#if !escrowState}
						<div class="stat place-items-center">
							<div class="stat-title">Please initialize...</div>
						</div>
					{:else}
						<div class="stat place-items-center">
							<div class="stat-title">Escrow</div>
						</div>
						<label class="input-group input-group-vertical pt-1">
							<span>Escrow PDA</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={escrowState.escrow}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span>Program ID</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={escrowState.programId}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span>Seller X Account</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={escrowState.sellerXToken}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span>Buyer Y Account</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={escrowState.buyerYToken}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span>X Amount</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={escrowState.xAmountFromSeller}
								disabled
							/>
						</label>
						<label class="input-group input-group-vertical pt-1">
							<span>Y Amount</span>
							<input
								type="text"
								placeholder=""
								class="input input-bordered"
								bind:value={escrowState.yAmountFromBuyer}
								disabled
							/>
						</label>
						<button class="btn btn-accent mt-1" on:click={handleAcceptTrade}>Accept Escrow</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
