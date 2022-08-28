<script lang="ts">
	/* import { SignMessage, SendTransaction } from '$lib/index'; */

	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl } from '@solana/web3.js';
	import idl from '../../../target/idl/pdas_instruction_data.json';
	import { onMount } from 'svelte';
	import { notificationStore } from '../stores/notification';
	import { Button } from '$lib/index';

	const network = clusterApiUrl('devnet'); // localhost or mainnet */

	let color = '';
	let newBalance = '';
	let seed = '';
	let operation: string;
	let operationValue: string;
	let fetchedLedgerAccount;

	async function generateKeypair() {
		// Ensure that new wallet keypair has enough SOL
		let keypair = anchor.web3.Keypair.generate();
		// WITHOUT Store
		// await provider.connection.requestAirdrop(keypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
		// WITH Store
		await $workspaceStore.provider?.connection.requestAirdrop(
			keypair.publicKey,
			2 * anchor.web3.LAMPORTS_PER_SOL
		);
		// Sleep for devnet
		await new Promise((resolve) => setTimeout(resolve, 3 * 1000));
		return keypair;
	}

	async function derivePda(color: string, pubkey: anchor.web3.PublicKey) {
		// NOTE This is key! We can derive PDA WITHOUT hitting our program!
		// Then we can use this PDA address in our functions as a check to see
		// whether there is a ledger account at this PDA address.
		// Then, MOST IMPORTANTLY, we can fetch the account's data from the CLIENT
		// and use its data.
		// NOTE pubkey is actually provider.wallet.publicKey
		let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
			[pubkey.toBuffer(), Buffer.from('_'), Buffer.from(color)],
			// WITH Store
			$workspaceStore.program?.programId as anchor.web3.PublicKey
			// WITHOUT Store
			// program.programId // The program that we want to OWN the PDA
		);

		return pda;
	}

	async function handleGetLedgerAccount(color: string, seed: string) {
		// NOTE For testing purposes only. Taking input text and converting to correct types.
		// NOTE Must convert string to type Publickey
		let pda = await derivePda(color, new anchor.web3.PublicKey(seed));
		let data = await $workspaceStore?.program?.account.ledger.fetch(pda);
		fetchedLedgerAccount = data;
		return data;
	}

	async function createLedgerAccount(
		color: string,
		pda: anchor.web3.PublicKey
		// wallet: anchor.web3.Keypair
	) {
		// Calls the program's on-chain create_ledger instruction function
		// to create a ledger account LOCATED at our generated PDA address!
		// NOTE This requires same args i.e., Context, color, system
		// NOTE We're technically creating a ledger account LOCATED at
		// this PDA address!
		await $workspaceStore?.program?.methods
			.createLedger(color)
			.accounts({
				ledgerAccount: pda,
				wallet: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey // OR: $walletStore.publicKey
				// NOTE Anchor automatically adds System Program (and other programs if required)
			})
			// NOTE FRONTEND: Don't need to pass signers() I guess....
			// .signers([wallet]) // Q: Need this? A: NO!
			.rpc();
	}

	async function handleCreateLedgerAccount() {
		let pda = await derivePda(
			color,
			($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey
		);

		// If testing on localnet:
		if ($workspaceStore.network == 'http://localhost:8899') {
			// Airdrop some SOL to the wallet
			const airdropRequest = await $workspaceStore.connection.requestAirdrop(
				$walletStore.publicKey as anchor.web3.PublicKey,
				anchor.web3.LAMPORTS_PER_SOL * 2
			);
			await $workspaceStore.connection.confirmTransaction(airdropRequest);
		}

		try {
			// Q: How to pass a Keypair from walletStore? I have the signers([wallet]) for the ix
			// REF: https://solana.stackexchange.com/questions/1984/anchor-signing-and-paying-for-transactions-to-interact-with-program
			// REF: https://stackoverflow.com/questions/72549145/how-to-sign-and-call-anchor-solana-smart-contract-from-web-app
			// REF: https://www.youtube.com/watch?v=vt8GUw_PDqM
			// UPDATE: Looks like I can pass the $walletStore OR $workspaceStore.provider.wallet
			// UPDATE: Looks like you DON'T pass signers([wallet]) call from frontend,
			// since it fails if I pass it inside the program.methods.createLedger() call
			await createLedgerAccount(
				color,
				pda
				// ($workspaceStore.provider as anchor.AnchorProvider).wallet
			); // WORKS
			// await createLedgerAccount(color, pda, $workspaceStore.provider.wallet); // WORKS

			const data = await $workspaceStore?.program?.account.ledger.fetch(pda);
			fetchedLedgerAccount = data;
		} catch (e) {
			console.error('handleCreateLedgerAccount::Error: ', e);
		}
	}

	async function modifyLedgerAccount(
		color: string,
		newBalance: number
		// wallet: anchor.web3.Keypair // Q: How to pass this with $walletStore????
	) {
		console.log('------------------------------------');
		// 1. Retrieve the PDA using helper
		// NOTE Don't pass pda address. Just pass color
		let data; // Is type Ledger

		let pda = await derivePda(
			color,
			($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey
		);

		// 2. Try to retreive PDA account data if it exists
		console.log(`Checking if account ${pda} exists for color: ${color}...`);
		try {
			// NOTE We're technically seeing if our PDA address has a
			// ledger account at its location (address)
			data = await $workspaceStore.program?.account.ledger.fetch(pda);
			fetchedLedgerAccount = data;
			console.log(`Account already exists!`);
		} catch (e) {
			// console.log(e);
			console.log(`Account ${pda} does NOT exist!`);
			console.log('Creating account...');
			// 1. Create account using helper that calls program instruction
			/* await createLedgerAccount(color, pda, wallet); */
			await createLedgerAccount(
				color,
				pda
				// Q: wallet arg needed on frontend? Testing yes, but on frontend??
				// ($workspaceStore.provider as anchor.AnchorProvider).wallet
			);
			// 2. Retrieve account data
			data = await $workspaceStore?.program?.account.ledger.fetch(pda);
			fetchedLedgerAccount = data;
		}

		console.log(`SUCCESS! Wallet: ${$walletStore.publicKey} -- PDA: ${pda} `);
		console.log('Our PDA has a ledger account with data:\n');
		console.log(`    Color: ${data?.color}   Balance: ${data?.balance}`);
		console.log(`Modifying balance of ${data?.color} from ${data?.balance} to ${newBalance}`);

		// 3. Make our modifications to the account using on-chain program function
		// NOTE This is another program function instruction
		// Q: Going to TEST whether other wallets can modify if they have the PDA...
		// A: NOPE! Error: Signature verification failed
		await $workspaceStore.program?.methods
			.modifyLedger(newBalance)
			.accounts({
				ledgerAccount: pda,
				wallet: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey
				// ledgerAccount: pdaFromOtherWallet, // CANNOT modify using a different wallet!
				// wallet: new anchor.web3.PublicKey(otherWalletInfo.wallet), // CANNOT modify using a different wallet!
			})
			// .signers([wallet]) // NOT needed on FRONTEND I THINK...
			.rpc();

		// 4. Retrieve the updated data one last time
		data = await $workspaceStore.program?.account.ledger.fetch(pda);
		// data = await $workspaceStore.program?.account.ledger.fetch(pdaFromOtherWallet); // CANNOT modify using a different wallet!
		fetchedLedgerAccount = data;
		console.log(`UPDATED! Wallet: ${$walletStore.publicKey} -- PDA: ${pda} `);
		console.log('Our PDA has a ledger account with data:\n');
		console.log(`    Color: ${data?.color}   Balance: ${data?.balance}`);
		console.log('Successfully modified ledger account!');
	}

	async function handleModifyLedgerAccount() {
		try {
			// Q: How should I pass in type number? Use new BN() or new Number()?
			// A: Works using BN() and/or Number()!
			await modifyLedgerAccount(
				color,
				new anchor.BN(newBalance)
				// Q: wallet arg necessary in frontend?
				// ($workspaceStore.provider as anchor.AnchorProvider).wallet
			);
		} catch (e) {
			console.error(e);
		}
	}

	async function modifyLedgerAccountWithInstructionData(
		color: string,
		operation: number,
		operation_value: number
		// wallet: anchor.web3.Keypair
	) {
		console.log('------------------------------------');
		// 1. Retrieve the PDA using helper
		// NOTE Don't pass pda address. Just pass color
		let data; // Is type Ledger

		let pda = await derivePda(
			color,
			($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey
		);

		// 2. Try to retreive PDA account data if it exists
		console.log(`Checking if account ${pda} exists for color: ${color}...`);
		try {
			// NOTE We're technically seeing if our PDA address has a
			// ledger account at its location (address)
			data = await $workspaceStore.program?.account.ledger.fetch(pda);
			fetchedLedgerAccount = data;
			console.log(`Account already exists!`);
		} catch (e) {
			// console.log(e);
			console.log(`Account ${pda} does NOT exist!`);
			console.log('Creating account...');
			// 1. Create account using helper that calls program instruction
			/* await createLedgerAccount(color, pda, wallet); */
			await createLedgerAccount(
				color,
				pda
				// Q: wallet arg needed on frontend? Testing yes, but on frontend??
				// ($workspaceStore.provider as anchor.AnchorProvider).wallet
			);
			// 2. Retrieve account data
			data = await $workspaceStore?.program?.account.ledger.fetch(pda);
			fetchedLedgerAccount = data;
		}

		console.log(`SUCCESS! Wallet: ${$walletStore.publicKey} -- PDA: ${pda} `);
		console.log('Our PDA has a ledger account with data:\n');
		console.log(`    Color: ${data?.color}   Balance: ${data?.balance}`);

		// 3. Make our modifications to the account using on-chain program function
		// NOTE This is another program function instruction
		// console.log(
		// 	`We're going to ${await getStringForInstruction(
		// 		operation,
		// 		operation_value
		// 		// operationValue
		// 	)}`
		// );

		await $workspaceStore.program?.methods
			// Q: Is Buffer the right type for this when using Anchor?
			// REF: Check out the tic-tac-toe tests for the Tile (they pass object directly!)
			// A: NO! Passes without using the Buffer! Looks like Anchor's generated IDL does
			// the job for us!
			.modifyLedgerWithInstructionData({
				operation: operation,
				operationValue: operation_value
			}) // MUST match the IDL type for LedgerInstructions
			.accounts({
				ledgerAccount: pda,
				wallet: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey
			})
			// .signers([wallet]) // NOT needed on FRONTEND I THINK...
			.rpc();

		// 4. Retrieve the updated data one last time
		data = await $workspaceStore?.program?.account.ledger.fetch(pda);
		fetchedLedgerAccount = data;
		console.log(`UPDATED! Wallet: ${$walletStore.publicKey} -- PDA: ${pda} `);
		console.log('Our PDA has a ledger account with data:\n');
		console.log(`    Color: ${data?.color}   Balance: ${data?.balance}`);
		console.log('Successfully modified ledger account!');
	}

	async function handleModifyLedgerAccountWithInstructionData() {
		try {
			// Q: How should I pass in type number? Use new BN() or new Number()?
			// A: Works using BN() and/or Number()!
			await modifyLedgerAccountWithInstructionData(
				color,
				new anchor.BN(operation),
				new anchor.BN(operationValue)
				// Q: wallet arg necessary in frontend?
				// $workspaceStore.provider?.wallet
			);
		} catch (e) {
			console.error(e);
		}
	}

	// $: {
	// 	console.log('operation: ', operation);
	// }
</script>

<AnchorConnectionProvider {network} {idl} />
<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			PDAs + Custom Instruction Data
		</h1>
			<div class="grid grid-cols-4 gap-6 pt-2">
				<div class="form-control">
					<label class="input-group input-group-vertical pb-1">
						<span>Color</span>
						<input type="text" placeholder="" class="input input-bordered" bind:value={color} />
					</label>
					<button class="btn btn-accent" on:click={handleCreateLedgerAccount}>Create</button>
				</div>
				<div class="form-control">
					<label class="input-group input-group-vertical pb-1">
						<span>Color</span>
						<input type="text" placeholder="" class="input input-bordered" bind:value={color} />
					</label>
					<label class="input-group input-group-vertical pb-1">
						<span>Seed</span>
						<input type="text" placeholder="" class="input input-bordered" bind:value={seed} />
					</label>
					<button class="btn btn-info" on:click={() => handleGetLedgerAccount(color, seed)}
					>Get</button
				>
				</div>
				<div class="form-control">
					<label class="input-group input-group-vertical pb-1">
						<span>Color</span>
						<input type="text" placeholder="" class="input input-bordered" bind:value={color} />
					</label>
					<label class="input-group input-group-vertical pb-1">
						<span>New Balance</span>
						<input type="text" placeholder="" class="input input-bordered" bind:value={newBalance} />
					</label>
					<button class="btn btn-secondary" on:click={handleModifyLedgerAccount}>Modify</button>
				</div>
				<div class="form-control">
					<label class="input-group input-group-vertical pb-1">
						<span>Color</span>
						<input type="text" class="input input-bordered" bind:value={color} />
					</label>
					<label class="input-group input-group-vertical pb-1">
						<span>Operation</span>
						<select bind:value={operation} class="select select-bordered">
							<option value="1" selected>+</option>
							<option value="2">-</option>
							<option value="3">*</option>
							<option value="4">Reset</option>
						</select>
					</label>
					<label class="input-group input-group-vertical pb-1">
						<span>Operation Value</span>
						<input type="text" class="input input-bordered" bind:value={operationValue} />
					</label>
					<button class="btn btn-primary" on:click={handleModifyLedgerAccountWithInstructionData}
					>Modify w/Ix</button
				>
				</div>
		</div>
		{#if fetchedLedgerAccount}
			<div class="stats shadow">
				<div class="stat place-items-center">
					<div class="stat-title">Color</div>
					<div class="stat-value">{fetchedLedgerAccount.color}</div>
				</div>
				<div class="stat place-items-center">
					<div class="stat-title">Balance</div>
					<div class="stat-value">{fetchedLedgerAccount.balance}</div>
				</div>
			</div>
		{/if}
	</div>
</div>
