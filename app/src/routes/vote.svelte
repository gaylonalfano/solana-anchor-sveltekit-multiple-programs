<script lang="ts">
	/* import { SignMessage, SendTransaction } from '$lib/index'; */

	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl } from '@solana/web3.js';
	import idl from '../../../target/idl/onchain_voting.json';
	import { onMount } from 'svelte';
	import { notificationStore } from '../stores/notification';
	import { Button } from '$lib/index';

	const network = clusterApiUrl('devnet'); // localhost or mainnet */
	// const network = 'http://localhost:8899';

	// Let's fetch the vote account data
	// const program = $workspaceStore.program as anchor.Program;
	// const provider = $workspaceStore.provider as anchor.AnchorProvider;
	type VoteAccount = {
		isActive: boolean;
		gmi: any; // BN2
		ngmi: any; // BN2
		bump: number;
	};

	// let voteAccount: TypeDef<IdlAccountDef, anchor.IdlTypes<anchor.Idl>>; // TS Error
	let voteAccount;

	// Q: Use lifecycle hook or perhaps SSR? Here or in __layout?
	// Q: How to pre-fetch existing onchain data?
	if ($workspaceStore) {
		onMount(handleGetAccountData);
	}

	$: {
		console.log('voteAccount: ', voteAccount);
	}

	// === Use Tests code instead of Helpers
	async function handleCreateDataAccount() {
		if (voteAccount) {
			notificationStore.add({
				type: 'error',
				message: 'Data account already exists!'
			});
			console.log('error', 'Data account already exists!');
			return;
		}

		const [voteAccountPDA, voteAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
			// Q: Would toBuffer() be better than encode()?
			// NOTE See solana-pdas example
			[
				anchor.utils.bytes.utf8.encode('vote-account')
				// Q: Need wallet publicKey? Won't this restrict to only that user
				// being able to write to PDA?
				// A: YES! The original crunchy-vs-smooth didn't use wallet pubkeys,
				// since that would create a unique PDA for the user (not users!).
				// provider.wallet.publicKey.toBuffer(),
			],
			// program.programId
			// $workspaceStore.program!.programId
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			voteAccountPDA.toBase58()
		);

		// Following this example to call the methods:
		// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
		const tx = await $workspaceStore.program?.methods
			.initialize()
			.accounts({
				// Q: I believe the order of accounts need to be consistent
				// Doesn't seem to make any difference so far...
				// A: In lib.rs > Initialize struct, if I put user before vote_account
				// it seems to work, even if order isn't consistent here in test.
				// NOTE It may not be the order, but something up with resetting
				// the test-validator before running the tests...
				voteAccount: voteAccountPDA,
				user: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey,
				// Q: Which programId to pass? Is it my program's or the systemProgram's?
				// NOTE I BELIEVE it should be the SystemProgram's based on this SO thread AND
				// the fact that when I use my program's ID, the error shows it should be 111111...
				// A: I don't think I need to provide the SystemProgramID,
				// since it's a PDA, AND since it doesn't seem needed at all (see below)
				// NOTE https://stackoverflow.com/questions/70675404/cross-program-invocation-with-unauthorized-signer-or-writable-account
				// Q: Do I even need to pass systemProgram? The Anchor PDA tutorial doesn't...
				// A: I didn't need it when just running 'anchor test' (w/o test-validator)
				// systemProgram: program.programId, // ERROR CPI
				systemProgram: anchor.web3.SystemProgram.programId // ERROR CPI
			})
			.rpc();
		console.log('TxHash ::', tx);

		// Add to notificationStore
		notificationStore.add({
			type: 'success',
			message: 'Transaction successful!',
			txid: tx
		});

		// 3. After the transaction returns, we can fetch the state of the vote account
		let currentVoteAccountState = await $workspaceStore.program?.account.voteState.fetch(
			voteAccountPDA
		);
		voteAccount = currentVoteAccountState;
	}

	async function handleGetAccountData() {
		const [voteAccountPDA, voteAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
			// Q: Would toBuffer() be better than encode()?
			// NOTE See solana-pdas example
			[
				anchor.utils.bytes.utf8.encode('vote-account')
				// Q: Need wallet publicKey? Won't this restrict to only that user
				// being able to write to PDA?
				// A: YES! The original crunchy-vs-smooth didn't use wallet pubkeys,
				// since that would create a unique PDA for the user (not users!).
				// provider.wallet.publicKey.toBuffer(),
			],
			// program.programId
			// $workspaceStore.program!.programId
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			voteAccountPDA.toBase58()
		);

		// 3. After the transaction returns, we can fetch the state of the vote account
		let currentVoteAccountState = await $workspaceStore.program?.account.voteState.fetch(
			voteAccountPDA
		);
		voteAccount = currentVoteAccountState;
	}

	// TODO Reuse this to submit a Vote. Need to see how this Enum looks in JS,
	// as I want to display the total voteAccount data in the UI
	async function handleVoteGmi() {
		const [voteAccountPDA, voteAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
			[anchor.utils.bytes.utf8.encode('vote-account')],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			voteAccountPDA.toBase58()
		);

		// Following this example to call the methods:
		// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
		const tx = await $workspaceStore.program?.methods
			.vote({ gmi: {} })
			.accounts({
				voteAccount: voteAccountPDA,
				user: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey
			})
			.rpc();
		console.log('TxHash ::', tx);

		// Add to notificationStore
		notificationStore.add({
			type: 'success',
			message: 'Transaction successful!',
			txid: tx
		});

		// 3. After the transaction returns, we can fetch the state of the vote account
		let currentVoteAccountState = await $workspaceStore.program?.account.voteState.fetch(
			voteAccountPDA
		);
		voteAccount = currentVoteAccountState;
	}

	async function handleVoteNgmi() {
		const [voteAccountPDA, voteAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
			[anchor.utils.bytes.utf8.encode('vote-account')],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			voteAccountPDA.toBase58()
		);

		// Following this example to call the methods:
		// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
		const tx = await $workspaceStore.program?.methods
			.vote({ ngmi: {} })
			.accounts({
				voteAccount: voteAccountPDA,
				user: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey
			})
			.rpc();
		console.log('TxHash ::', tx);

		// Add to notificationStore
		notificationStore.add({
			type: 'success',
			message: 'Transaction successful!',
			txid: tx
		});

		// 3. After the transaction returns, we can fetch the state of the vote account
		let currentVoteAccountState = await $workspaceStore.program?.account.voteState.fetch(
			voteAccountPDA
		);
		voteAccount = currentVoteAccountState;
	}

	// // === Helpers
	// async function derivePda(seed: string) {
	// 	// NOTE This is key! We can derive PDA WITHOUT hitting our program!
	// 	// Then we can use this PDA address in our functions as a check to see
	// 	// whether there is a ledger account at this PDA address.
	// 	// Then, MOST IMPORTANTLY, we can fetch the account's data from the CLIENT
	// 	// and use its data.
	// 	// NOTE pubkey is actually provider.wallet.publicKey
	// 	let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
	// 		[Buffer.from(seed)],
	// 		$workspaceStore.program?.programId as anchor.web3.PublicKey
	// 	);

	// 	return pda;
	// }

	// async function handleGetAccountData() {
	// 	// NOTE For testing purposes only. Taking input text and converting to correct types.
	// 	// NOTE Must convert string to type Publickey
	// 	let pda = await derivePda('vote-account');
	// 	let data = await $workspaceStore.program?.account?.voteAccount?.fetch(pda);
	// 	voteAccount = data;
	// 	return data;
	// }

	// async function createDataAccount(pda: anchor.web3.PublicKey) {
	// 	// Calls the program's on-chain initialize instruction function
	// 	// to create a vote account LOCATED at our generated PDA address!
	// 	await $workspaceStore.program?.methods
	// 		.initialize()
	// 		.accounts({
	// 			voteAccount: pda,
	// 			wallet: $walletStore.publicKey as anchor.web3.PublicKey // OR: $walletStore.publicKey
	// 			// NOTE Anchor automatically adds System Program (and other programs if required)
	// 		})
	// 		// NOTE FRONTEND: Don't need to pass signers() I guess....
	// 		// .signers([wallet]) // Q: Need this? A: NO!
	// 		.rpc();
	// }

	// async function handleCreateDataAccount() {
	// 	let pda = await derivePda('vote-account');

	// 	// If testing on localnet:
	// 	// if ($workspaceStore.network == 'http://localhost:8899') {
	// 	// 	// Airdrop some SOL to the wallet
	// 	// 	const airdropRequest = await $workspaceStore.connection.requestAirdrop(
	// 	// 		$walletStore.publicKey as anchor.web3.PublicKey,
	// 	// 		anchor.web3.LAMPORTS_PER_SOL * 2
	// 	// 	);
	// 	// 	await $workspaceStore.connection.confirmTransaction(airdropRequest);
	// 	// }

	// 	try {
	// 		// Q: How to pass a Keypair from walletStore? I have the signers([wallet]) for the ix
	// 		// REF: https://solana.stackexchange.com/questions/1984/anchor-signing-and-paying-for-transactions-to-interact-with-program
	// 		// REF: https://stackoverflow.com/questions/72549145/how-to-sign-and-call-anchor-solana-smart-contract-from-web-app
	// 		// REF: https://www.youtube.com/watch?v=vt8GUw_PDqM
	// 		// UPDATE: Looks like I can pass the $walletStore OR $workspaceStore.provider.wallet
	// 		// UPDATE: Looks like you DON'T pass signers([wallet]) call from frontend,
	// 		// since it fails if I pass it inside the program.methods.createLedger() call
	// 		await createDataAccount(pda); // WORKS
	// 		// await createDataAccount(color, pda, $workspaceStore.provider.wallet); // WORKS

	// 		const data = await $workspaceStore.program?.account?.voteAccount?.fetch(pda);
	// 		voteAccount = data;
	// 		console.log('voteAccount: ', voteAccount);
	// 	} catch (e) {
	// 		console.error('handleCreateDataAccount::Error: ', e);
	// 	}
	// }
</script>

<AnchorConnectionProvider {network} {idl} />
<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Vote
		</h1>
		<div class="text-center">
			<div class="card-body items-center text-center">
				<Button disabled={!$walletStore.publicKey} on:click={handleCreateDataAccount}>Init</Button>
				<Button disabled={!$walletStore.publicKey} on:click={handleGetAccountData}>Get</Button>
				<div class="card-actions">
					<Button disabled={!$walletStore.publicKey} on:click={handleVoteGmi}>GMI</Button>
					<Button disabled={!$walletStore.publicKey} on:click={handleVoteNgmi}>NGMI</Button>
				</div>
				{#if voteAccount}
					<div class="card-body justify-center">
						<div class="stats shadow">
							<div class="stat">
								<div class="stat-title">GMI</div>
								<div class="stat-value">{voteAccount.gmi.words[0]}</div>
							</div>
						</div>
						<div class="stats shadow">
							<div class="stat">
								<div class="stat-title">NGMI</div>
								<div class="stat-value">{voteAccount.ngmi.words[0]}</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
