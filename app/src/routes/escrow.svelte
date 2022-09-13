<script lang="ts">
	import { clusterApiUrl, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
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

	// const network = clusterApiUrl('devnet'); // localhost or mainnet */
	const network = 'http://localhost:8899';

	// FIXME Need to only render UI AFTER AnchorProvider is loaded. Getting errors
	// on /escrow page reload since provider can't be found.
	// NOTE Need to type anchor.Wallet to get 'payer' property or errors
	// FIXME Losing reactivity in UI. Not sure why. Just seems like after I sendTransaction(),
	// no other async/awaits really work unless I add to button onclick handler...
	// const seller = ($workspaceStore.provider as anchor.AnchorProvider).wallet as anchor.Wallet;
	const buyer = anchor.web3.Keypair.generate();
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
	// A: You CAN'T! Have to compose ix and txs manually following Cookbook
	$: {
		// console.log('baseAccount: ', $workspaceStore.baseAccount?.publicKey.toBase58());
		console.log('xMintAccountData: ', xMintAccountData);
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

		// console.log(`TxHash :: ${await $workspaceStore.connection.sendTransaction(tx, [mint])}`); // ERROR: signature verification failed
		// console.log(
		// 	`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
		// 		signers: [mint]
		// 	})}`
		// ); // WORKS! Need to use walletStore instead of workspaceStore!

		await $walletStore.sendTransaction(tx, $workspaceStore.connection, { signers: [mint] });
		console.log('Okay, sent tx... next trying to get updated data...');

		// FIXME
		// Q: Why can't I get the token mint inside this function? Think it's async error...
		// Q: Is it because the above console.log() isn't async, and that's why it
		// it returns TokenAccountNotFoundError?
		// Q: Do I need to do wait for sendTransaction() to complete or something?
		// Below errors for some reason but works if I place inside separate function. Weird.
		// ERROR: TokenAccountNotFoundError
		// NOTE Doesn't error but data isn't Mint data...
		// xMintAccountData = await $workspaceStore.connection.getAccountInfo(xMint);
		// const currentXMintAccountData = await getMint($workspaceStore.connection, xMint); // error
		// const currentXMintAccountData = await getMint($workspaceStore.connection, xMint).then(
		// 	(res) => res.address
		// ); // Uncaught (in promise) TokenAccountNotFoundError
		// Q: Do I need to simply reassign back to xMintAccountData to get reactivity?
		let currentXMintAccountDataGetAccountInfo: anchor.web3.AccountInfo<Buffer> | null =
			await $workspaceStore.connection.getAccountInfo(xMint);
		let currentXMintAccountDataGetParsedAccountInfo =
			await $workspaceStore.connection.getParsedAccountInfo(xMint);
		// let currentXMintAccountDataGetAccount = await getAccount($workspaceStore.connection, xMint); // Error TokenAccountNotFoundError
		// let currentXMintAccountDataGetMint = await getMint($workspaceStore.connection, xMint).then(
		// let currentXMintAccountDataGetMint = await getMint(connection, xMint).then(
		// 	(value) => (xMintAccountData = value)
		// );
		xMintAccountData = currentXMintAccountDataGetParsedAccountInfo;
		console.log(xMintAccountData); // null
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
			buyer.publicKey // owner
		);
		console.log(`buyerXToken: ${buyerXToken.toBase58()}`);

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				buyerXToken, // ata
				buyer.publicKey, // owner
				xMint // mint
			)
		);

		console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!
	}

	async function createBuyerTokenYAssociatedTokenAccount() {
		buyerYToken = await getAssociatedTokenAddress(
			yMint, // mint
			buyer.publicKey // owner
		);
		console.log(`buyerYToken: ${buyerYToken.toBase58()}`);

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				buyerYToken, // ata
				buyer.publicKey, // owner
				yMint // mint
			)
		);

		console.log(`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!
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

	async function handleCreateEscrowAccount() {
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
		console.log(`escrow: ${escrow}`);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			escrowPDA.toBase58()
		);

		// Create some associated token accounts for x and y tokens for buyer and seller
		// Call our on-chain program's initialize() method and set escrow properties values
		console.log('STARTED: Initialize escrow test...');
		// NOTE Results in 0.0000004 in escrowedXToken balance
		const x_amount = new anchor.BN(40);
		const y_amount = new anchor.BN(40); // number of token seller wants in exchange for x_amount
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

			const tx = await $workspaceStore.program?.methods
				.initialize(x_amount, y_amount)
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
				.rpc({ skipPreflight: true });

			console.log('TxHash ::', tx);

			data = await $workspaceStore.program?.account.escrow.fetch(escrow);
		}

		const escrowedXTokenAccountBalance =
			await $workspaceStore.provider?.connection.getTokenAccountBalance(escrowedXToken.publicKey);
		console.log('INITIALIZE::escrowedXTokenAccountBalance: ', escrowedXTokenAccountBalance);
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
				<button class="btn btn-info" on:click={handleCreateEscrowAccount}>Create Escrow</button>
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
			</div>
		</div>
	</div>
</div>
