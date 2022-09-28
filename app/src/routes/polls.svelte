<script lang="ts">
	/* import { SignMessage, SendTransaction } from '$lib/index'; */

	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl, PublicKey } from '@solana/web3.js';
	import idl from '../../../target/idl/onchain_voting_multiple_polls.json';
	import { onMount } from 'svelte';
	import { notificationStore } from '../stores/notification';
	import { customProgramStore } from '../stores/polls/custom-program-store';
	import { Button } from '$lib/index';

	// const network = clusterApiUrl('devnet'); // localhost or mainnet */
	const network = 'http://localhost:8899';

	const CUSTOM_PROGRAM_SEED_PREFIX = 'custom-program';
	const PROFILE_SEED_PREFIX = 'profile';
	const POLL_SEED_PREFIX = 'poll';
	const VOTE_SEED_PREFIX = 'vote';

	// Global state
	let customProgram: anchor.IdlTypes<anchor.Idl>['CustomProgram'];
	let customProgramPda: anchor.web3.PublicKey;

	let profile: anchor.IdlTypes<anchor.Idl>['Profile'];
	let profilePda: anchor.web3.PublicKey;
	let profileHandle: string = 'testHandle';
	let profileDisplayName: string = 'testDisplayName';

	let poll: anchor.IdlTypes<anchor.Idl>['Poll'];
	let pollPda: anchor.web3.PublicKey;
	let pollOptionADisplayName: string = 'Option A';
	let pollOptionBDisplayName: string = 'Option B';

	let vote: anchor.IdlTypes<anchor.Idl>['Vote'];
	let votePda: anchor.web3.PublicKey;

	$: {
		console.log('customProgram: ', customProgram);
		console.log('$customProgramStore: ', $customProgramStore);
		/* console.log('allProgramAccounts: ', allProgramAccounts); */
	}

	/*
	 * Create a dApp level PDA data account
	 */
	async function handleCreateCustomProgram() {
		if (customProgram) {
			notificationStore.add({
				type: 'error',
				message: 'Data account already exists!'
			});
			console.log('error', 'Data account already exists!');
			return;
		}

		const [pda, bump] = await PublicKey.findProgramAddress(
			[anchor.utils.bytes.utf8.encode(CUSTOM_PROGRAM_SEED_PREFIX)],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		// Update global state
		customProgramPda = pda;

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			customProgramPda.toBase58()
		);

		const tx = await $workspaceStore.program?.methods
			.createCustomProgram()
			.accounts({
				customProgram: customProgramPda,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms and update our account
		const currentCustomProgram = await $workspaceStore.program?.account.customProgram.fetch(
			customProgramPda
		);
		customProgram = currentCustomProgram as anchor.IdlTypes<anchor.Idl>['CustomProgram'];
		customProgramStore.set(customProgram);

		// Verify the account has set up correctly
		// expect(customProgram.totalProfileCount.toNumber()).to.equal(0);
		// expect(customProgram.totalPollCount.toNumber()).to.equal(0);
		// expect(customProgram.totalVoteCount.toNumber()).to.equal(0);
		// expect(customProgram.authority.toString()).to.equal(
		//   provider.wallet.publicKey.toString()
		// );
	}

	async function handleCreateProfile() {
		const profileCount = (customProgram.totalProfileCount.toNumber() + 1).toString();
		console.log('profileCount: ', profileCount);

		// NOTE Error processing Instruction 0: Cross-program invocation
		// with unauthorized signer or writable account
		// REF: https://stackoverflow.com/questions/72849618/transaction-simulation-failed-error-processing-instruction-0-cross-program-inv
		// U: Check the seeds!
		const [pda, bump] = await PublicKey.findProgramAddress(
			[
				anchor.utils.bytes.utf8.encode(PROFILE_SEED_PREFIX),
				($walletStore.publicKey as anchor.web3.PublicKey).toBuffer(), // authority
				anchor.utils.bytes.utf8.encode(profileCount)
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);
		// Update global state
		profilePda = pda;

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			profilePda.toBase58()
		);

		const tx = await $workspaceStore.program?.methods
			.createProfile(profileHandle, profileDisplayName)
			.accounts({
				profile: profilePda,
				customProgram: customProgramPda,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// .signers([testUser1]) // Not needed with AnchorWallet
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms & update global state
		const currentProfile = await $workspaceStore.program?.account.profile.fetch(profilePda);
		profile = currentProfile as anchor.IdlTypes<anchor.Idl>['Profile'];
		const currentCustomProgram = await $workspaceStore.program?.account.customProgram.fetch(
			customProgramPda
		);
		customProgram = currentCustomProgram as anchor.IdlTypes<anchor.Idl>['CustomProgram'];

		// Verify the account has set up correctly
		// expect(currentProfile.handle).to.equal(testUser1Handle);
		// expect(currentProfile.displayName).to.equal(testUser1DisplayName);
		// expect(currentProfile.authority.toString()).to.equal(testUser1.publicKey.toString());
		// expect(currentProfile.pollCount.toNumber()).to.equal(0);
		// expect(currentProfile.voteCount.toNumber()).to.equal(0);
		// expect(customProgram.totalProfileCount.toNumber()).to.equal(1);
	}

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
	//
	//			{#if customProgram}
	//				<div class="stats shadow">
	//					<div class="stat place-items-center">
	//						<div class="stat-title">GMI</div>
	//						<div class="stat-value">{voteAccount.gmi.words[0]}</div>
	//						<Button disabled={!$walletStore.publicKey} on:click={handleVoteGmi}>GMI</Button>
	//					</div>
	//					<div class="stat place-items-center">
	//						<div class="stat-title">NGMI</div>
	//						<div class="stat-value">{voteAccount.ngmi.words[0]}</div>
	//						<Button disabled={!$walletStore.publicKey} on:click={handleVoteNgmi}>NGMI</Button>
	//					</div>
	//				</div>
	//			{/if}
</script>

<AnchorConnectionProvider {network} {idl} />
<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Polls
		</h1>
		<div class="card-body items-center text-center pt-0">
			<Button disabled={!$walletStore.publicKey} on:click={handleCreateCustomProgram}
				>Init Custom Program</Button
			>
			<pre>customProgram: {JSON.stringify(customProgram, null, 2)}</pre>
			<br />
			<pre>customProgramStore: {JSON.stringify(customProgram, null, 2)}</pre>
		</div>
	</div>
</div>
