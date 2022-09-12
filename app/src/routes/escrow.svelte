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
		createAssociatedTokenAccountInstruction
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

	// NOTE Need to type anchor.Wallet to get 'payer' property or errors
	const seller = ($workspaceStore.provider as anchor.AnchorProvider).wallet as anchor.Wallet;
	const buyer = anchor.web3.Keypair.generate();
	let xMint: anchor.web3.PublicKey;
	let xMintAccount;
	let yMint: anchor.web3.PublicKey;
	let yMintAccount;
	let sellerXToken: anchor.web3.PublicKey; // Associated Token Accounts
	let sellerYToken;
	let buyerXToken;
	let buyerYToken;
	// NOTE This is just saving the Pubkey, since program creates actual account
	const escrowedXToken = anchor.web3.Keypair.generate();
	console.log(`escrowedXToken: ${escrowedXToken.publicKey}`);
	// NOTE This is a PDA that we'll get below
	let escrow: anchor.web3.PublicKey;

	// Q: What is workspaceStore.baseAccount? It changes on each refresh...
	// Q: How am I supposed to pass AnchorProvider with simple solana/spl-token methods?
	// Getting issues with Signer vs. Wallet...
	$: {
		console.log('seller.publicKey: ', seller.publicKey.toBase58());
		// console.log('baseAccount: ', $workspaceStore.baseAccount?.publicKey.toBase58());
	}

	async function handleCreateTokenX() {
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
				seller.publicKey, // mint authority
				seller.publicKey // freeze authority
			)
		);

		// console.log(`TxHash :: ${await $workspaceStore.connection.sendTransaction(tx, [mint])}`); // ERROR: signature verification failed
		console.log(
			`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
				signers: [mint]
			})}`
		); // WORKS! Need to use walletStore instead of workspaceStore!

		// FIXME
		// Q: Why can't I get the token mint inside this function? Think it's async error...
		// Below errors for some reason but works if I place inside separate function. Weird.
		// ERROR: TokenAccountNotFoundError
		// xMintAccount = await getMint($workspaceStore.connection, xMint); // error
		// NOTE Doesn't error but doesn't really have data either...
		// xMintAccount = await $workspaceStore.connection.getAccountInfo(xMint);
		// console.log(xMintAccount);
	}

	async function handleCreateTokenY() {
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
				seller.publicKey, // mint authority
				seller.publicKey // freeze authority
			)
		);

		console.log(
			`TxHash :: ${await $walletStore.sendTransaction(tx, $workspaceStore.connection, {
				signers: [mint]
			})}`
		); // WORKS! Need to use walletStore instead of workspaceStore!
	}

	// TODO Refactor
	async function getXMintAccount() {
		xMintAccount = await getMint($workspaceStore.connection, xMint);
	}

	async function getYMintAccount() {
		yMintAccount = await getMint($workspaceStore.connection, yMint);
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
			seller.publicKey // owner
		);
		console.log(`sellerXToken: ${sellerXToken.toBase58()}`);

		const tx = new Transaction().add(
			createAssociatedTokenAccountInstruction(
				$walletStore.publicKey as anchor.web3.PublicKey, // payer
				sellerXToken, // ata
				seller.publicKey, // owner
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

	async function mintTokenXAndTransferToSellerTokenXAssociatedTokenAccount() {
		// test
		await mintToChecked(
			$workspaceStore.connection, //connection,
			// Q: How do I get type anchor.web3.Signer?
			// NOTE payer is Keypair, but need type Signer
			// REF https://stackoverflow.com/questions/70206015/solana-web3-js-getting-web3-signer-from-wallet
			// A: Still don't know, BUT type Keypair seems to work...
			seller.payer, // payer, // NOTE need anchor.web3.Signer
			xMint, // mint,
			sellerXToken, // destination ata,
			seller.publicKey, // mint authority,
			1e8, // amount,
			8 // decimals
			// [signer1, signer2...], // only multisig account will use
		);
		console.log(
			`sellerXToken: ${await $workspaceStore.connection
				.getTokenAccountBalance(sellerXToken)
				.then((r) => r.value.amount)}`
		);
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
			[Buffer.from('escrow2'), seller.publicKey.toBuffer()],
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
		<div class="grid grid-cols-4 gap-6 pt-2">
			<div class="form-control">
				<button class="btn btn-accent" on:click={handleCreateTokenX}>Create Token X</button>
				<button class="btn btn-info mt-1" on:click={getXMintAccount}>Get X Mint</button>
				{#if xMintAccount}
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Address</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={xMintAccount.address}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							value={xMintAccount.mintAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Freeze Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={xMintAccount.freezeAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Supply</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={xMintAccount.supply}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Decimals</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={xMintAccount.decimals}
						/>
					</label>
				{/if}
			</div>
			<div class="form-control">
				<button class="btn btn-accent" on:click={handleCreateTokenY}>Create Token Y</button>
				<button class="btn btn-info mt-1" on:click={getYMintAccount}>Get Y Mint</button>
				{#if yMintAccount}
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Address</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={yMintAccount.address}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Mint Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							value={yMintAccount.mintAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Freeze Authority</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={yMintAccount.freezeAuthority}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Supply</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={yMintAccount.supply}
						/>
					</label>
					<label class="input-group input-group-vertical pt-1">
						<span>Decimals</span>
						<input
							type="text"
							placeholder=""
							class="input input-bordered"
							disabled
							bind:value={yMintAccount.decimals}
						/>
					</label>
				{/if}
			</div>
			<div class="form-control">
				<button class="btn btn-accent" on:click={createSellerTokenXAssociatedTokenAccount}
					>Create Seller Token X</button
				>
			</div>
			<div class="form-control">
				<button class="btn btn-warning" on:click={createBuyerTokenYAssociatedTokenAccount}
					>Create Buyer Token Y</button
				>
			</div>
		</div>
	</div>
</div>
