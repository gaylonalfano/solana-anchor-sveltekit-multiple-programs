<script lang="ts">
	import * as anchor from '@project-serum/anchor';
	import {
		TOKEN_PROGRAM_ID,
		createMint,
		createAssociatedTokenAccount,
		mintToChecked,
		getAccount
	} from '@solana/spl-token';

	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl } from '@solana/web3.js';
	// NOTE Anchor.toml setting can copy IDL to specified dir. However, the 'idl' prop
	// on AnchorConnectionProvider wants a JSON instead.
	// import { IDL as idl } from '../idl/non_custodial_escrow';
	import idl from '../../../target/idl/non_custodial_escrow.json';

	import { onMount } from 'svelte';
	import { notificationStore } from '../stores/notification';
	import { Button } from '$lib/index';

	// const network = clusterApiUrl('devnet'); // localhost or mainnet */
	const network = 'http://localhost:8899';

	// NOTE Need to type anchor.Wallet to get 'payer' property or errors
	let seller = ($workspaceStore.provider as anchor.AnchorProvider).wallet as anchor.Wallet;
	let buyer = anchor.web3.Keypair.generate();
	let x_mint;
	let y_mint;
	let seller_x_token; // Associated Token Accounts
	let seller_y_token;
	let buyer_x_token;
	let buyer_y_token;
	// NOTE This is just saving the Pubkey, since program creates actual account
	let escrowed_x_token = anchor.web3.Keypair.generate();
	console.log(`escrowed_x_token: ${escrowed_x_token.publicKey}`);
	// NOTE This is a PDA that we'll get below
	let escrow: anchor.web3.PublicKey;

	async function handleCreateTokenX() {
		x_mint = await createMint(
			($workspaceStore.provider as anchor.AnchorProvider).connection, // connection
			seller.payer, // payer
			seller.publicKey, // mintAuthority
			seller.publicKey, // freezeAuthority?
			8 // decimals location of the decimal place
		);
		console.log(`x_mint: ${x_mint.toBase58()}`);
	}

	/* async function handleCreateEscrowAccount() { */
	/* 	if (escrow) { */
	/* 		notificationStore.add({ */
	/* 			type: 'error', */
	/* 			message: 'Data account already exists!' */
	/* 		}); */
	/* 		console.log('error', 'Data account already exists!'); */
	/* 		return; */
	/* 	} */

	/* 	const [escrowPDA, escrowBump] = await anchor.web3.PublicKey.findProgramAddress( */
	/* 		[Buffer.from('escrow2'), seller.publicKey.toBuffer()], */
	/* 		$workspaceStore.program?.programId as anchor.web3.PublicKey */
	/* 	); */
	/* 	escrow = escrowPDA; */
	/* 	console.log(`escrow: ${escrow}`); */

	/* 	console.log( */
	/* 		'PDA for program', */
	/* 		$workspaceStore.program?.programId.toBase58(), */
	/* 		'is generated :', */
	/* 		escrowPDA.toBase58() */
	/* 	); */

	/* 	// Create some associated token accounts for x and y tokens for buyer and seller */
	/* 	// Call our on-chain program's initialize() method and set escrow properties values */
	/* 	console.log('STARTED: Initialize escrow test...'); */
	/* 	// NOTE Results in 0.0000004 in escrowed_x_token balance */
	/* 	const x_amount = new anchor.BN(40); */
	/* 	const y_amount = new anchor.BN(40); // number of token seller wants in exchange for x_amount */
	/* 	// Check whether escrow account already has data */
	/* 	let data; */

	/* 	// 2. Try to retreive PDA account data if it exists */
	/* 	console.log(`Checking if escrow account ${escrow} exists...`); */
	/* 	try { */
	/* 		// Check whether our PDA address has an escrow account */
	/* 		data = await $workspaceStore.program?.account.escrow.fetch(escrow); */
	/* 		console.log('Account already exists!'); */
	/* 	} catch (e) { */
	/* 		console.log(`Account ${escrow} does NOT exist!`); */
	/* 		console.log('Creating account...'); */
	/* 		const tx = await $workspaceStore.program?.methods */
	/* 			.initialize(x_amount, y_amount) */
	/* 			// NOTE We only provide the PublicKeys for all the accounts. */
	/* 			// We do NOT have to deal with isSigner, isWritable, etc. like in RAW */
	/* 			// since we already declared that in the program Context struct. */
	/* 			// This means Anchor will look for all that info in our struct on ENTRY! */
	/* 			// NOTE We also don't have to pass the System Program, Token Program, and */
	/* 			// Associated Token Program, since Anchor resolves these automatically. */
	/* 			// NOTE Values in accounts([]) are PublicKeys! */
	/* 			.accounts({ */
	/* 				seller: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey, */
	/* 				xMint: x_mint, */
	/* 				yMint: y_mint, */
	/* 				sellerXToken: seller_x_token, */
	/* 				escrow: escrow, // created in program */
	/* 				escrowedXToken: escrowed_x_token.publicKey, // created in program */
	/* 				// tokenProgram: TOKEN_PROGRAM_ID, // Q: Use 2022 version? A: TOKEN_PROGRAM_ID! */
	/* 				// rent: SYSVAR_RENT_PUBKEY, */
	/* 				systemProgram: anchor.web3.SystemProgram.programId */
	/* 			}) */
	/* 			// Q: Which accounts are Signers? */
	/* 			// A: Check IDL! Wallet and escrowed_x_token! */
	/* 			// Q: Why is escrowed_x_token a Signer? It's just a type TokenAccount... */
	/* 			.signers([escrowed_x_token]) */
	/* 			.rpc({ skipPreflight: true }); */

	/* 		console.log('TxHash ::', tx); */

	/* 		data = await program.account.escrow.fetch(escrow); */
	/* 	} */

	/* 	const escrowedXTokenAccountBalance = await provider.connection.getTokenAccountBalance( */
	/* 		escrowed_x_token.publicKey */
	/* 	); */
	/* 	console.log('INITIALIZE::escrowedXTokenAccountBalance: ', escrowedXTokenAccountBalance); */

	/* 	// Add to notificationStore */
	/* 	notificationStore.add({ */
	/* 		type: 'success', */
	/* 		message: 'Transaction successful!', */
	/* 		txid: tx */
	/* 	}); */

	/* 	// 3. After the transaction returns, we can fetch the state of the vote account */
	/* 	let currentVoteAccountState = await $workspaceStore.program?.account.voteState.fetch( */
	/* 		voteAccountPDA */
	/* 	); */
	/* 	voteAccount = currentVoteAccountState; */
	/* } */
</script>

<AnchorConnectionProvider {network} {idl} />
<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Escrow
		</h1>
		<div class="grid grid-cols-2 gap-6 pt-2">
			<div class="form-control">
				<button class="btn btn-accent">Create Token X</button>
				<label class="input-group input-group-vertical pt-1">
					<span>Mint Address</span>
					<input type="text" placeholder="" class="input input-bordered" disabled />
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span>Mint Authority</span>
					<input type="text" placeholder="" class="input input-bordered" disabled />
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span>Freeze Authority</span>
					<input type="text" placeholder="" class="input input-bordered" disabled />
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span>Decimals</span>
					<input type="text" placeholder="" class="input input-bordered" disabled />
				</label>
			</div>
			<div class="form-control">
				<button class="btn btn-info">Create Token Y</button>
				<label class="input-group input-group-vertical pt-1">
					<span>Color</span>
					<input type="text" placeholder="" class="input input-bordered" />
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span>Seed</span>
					<input type="text" placeholder="" class="input input-bordered" />
				</label>
			</div>
		</div>
	</div>
</div>
