<script lang="ts">
	/* import { SignMessage, SendTransaction } from '$lib/index'; */

	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl, PublicKey, type GetProgramAccountsFilter } from '@solana/web3.js';
	import idl from '../../../../target/idl/onchain_voting_multiple_polls.json';
	import { onMount } from 'svelte';
	import { notificationStore } from '$stores/notification';
	import { customProgramStore } from '$stores/polls/custom-program-store';
	import { profileStore } from '$stores/polls/profile-store';
	import { pollStore } from '$stores/polls/poll-store';
	import { pollsStore } from '$stores/polls/polls-store';
	import { Button } from '$lib/index';

	// const network = clusterApiUrl('devnet'); // localhost or mainnet */
	const network = 'http://localhost:8899';

	const CUSTOM_PROGRAM_SEED_PREFIX = 'custom-program';
	const PROFILE_SEED_PREFIX = 'profile';
	const POLL_SEED_PREFIX = 'poll';
	const VOTE_SEED_PREFIX = 'vote';

	// Global state
	// Q: Any way to access the PDA Address from Stores?
	// Or, do I need to maintain separate vars for PDA addresses?
	let customProgram: anchor.IdlTypes<anchor.Idl>['CustomProgram'];
	let customProgramPda: anchor.web3.PublicKey;

	let profile: anchor.IdlTypes<anchor.Idl>['Profile'];
	let profilePda: anchor.web3.PublicKey;
	let profileHandle: string = 'testHandle';
	let profileDisplayName: string = 'testDisplayName';

	// TODO Could consider adding a selectedPollStore
	let poll: anchor.IdlTypes<anchor.Idl>['Poll'];
	let pollPda: anchor.web3.PublicKey;
	let pollOptionADisplayName: string = 'Option A';
	let pollOptionBDisplayName: string = 'Option B';

	let vote: anchor.IdlTypes<anchor.Idl>['Vote'];
	let votePda: anchor.web3.PublicKey;

	// Q: How to update the profile (and its PDA) whenever wallet changes?
	// FIXME Infinite loop!
	// $: if ($profileStore && $walletStore.publicKey) {
	// 	PublicKey.findProgramAddress(
	// 		[
	// 			anchor.utils.bytes.utf8.encode(PROFILE_SEED_PREFIX),
	// 			($walletStore.publicKey as anchor.web3.PublicKey).toBuffer(), // authority
	// 			anchor.utils.bytes.utf8.encode($profileStore.profileNumber)
	// 		],
	// 		$workspaceStore.program?.programId as anchor.web3.PublicKey
	// 	).then((response) => {
	// 		profilePda = response[0];
	// 		console.log('UPDATED profilePda!', profilePda);
	// 	});
	// }

	$: {
		console.log('customProgram: ', customProgram);
		console.log('$customProgramStore: ', $customProgramStore);
		console.log('profilePda: ', profilePda?.toBase58());
		console.log('$profileStore: ', $profileStore);
		console.log('pollPda: ', pollPda);
		console.log('$pollStore: ', $pollStore);
		console.log('$pollsStore: ', $pollsStore);
	}

	/*
	 * Create a dApp level PDA data account
	 */
	async function handleCreateCustomProgram() {
		if ($customProgramStore) {
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
		const profileCount = ($customProgramStore.totalProfileCount.toNumber() + 1).toString();
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
				customProgram: customProgramPda, // FIXME Errors when swapping wallets! Need to store PDAs to Stores if possible
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// .signers([testUser1]) // Not needed with AnchorWallet
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms & update global state
		const currentProfile = await $workspaceStore.program?.account.profile.fetch(profilePda);
		profile = currentProfile as anchor.IdlTypes<anchor.Idl>['Profile'];
		// Q: update() or set() Store?
		profileStore.set(profile);
		const currentCustomProgram = await $workspaceStore.program?.account.customProgram.fetch(
			customProgramPda
		);
		customProgram = currentCustomProgram as anchor.IdlTypes<anchor.Idl>['CustomProgram'];
		// Q: update() or set() Store?
		customProgramStore.set(customProgram);
	}

	async function handleCreatePoll() {
		// FIXME If the same user goes between /polls or /polls/[pollNumber],
		// then all the local PDAs get cleared. Maybe consider storing the PDA
		// in the actual account? Or, perhaps attempt to derive if not available?
		// This is a common challenge for me...
		// Need to access current customProgram.totalPollCount
		const pollCount: string = ($customProgramStore.totalPollCount.toNumber() + 1).toString();
		console.log('pollCount: ', pollCount);

		// NOTE From Anchor PDA example: https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor
		// NOTE They find the PDA address INSIDE the it() test!
		const [pda, bump] = await PublicKey.findProgramAddress(
			[
				anchor.utils.bytes.utf8.encode(POLL_SEED_PREFIX),
				// Q: Need wallet publicKey? Won't this restrict to only that user
				// being able to write to PDA?
				// A: YES! The original crunchy-vs-smooth didn't use wallet pubkeys,
				// since that would create a unique PDA for the user (not users!).
				anchor.utils.bytes.utf8.encode(pollCount)
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);
		// Update global state
		pollPda = pda;

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			pollPda.toBase58()
		);

		// Following this example to call the methods:
		// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
		const tx = await $workspaceStore.program?.methods
			.createPoll(pollOptionADisplayName, pollOptionBDisplayName)
			.accounts({
				poll: pollPda,
				profile: profilePda,
				customProgram: customProgramPda,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// .signers([testUser1]) // AnchorWallet
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms & update global state
		const currentPoll = await $workspaceStore.program?.account.poll.fetch(pollPda);
		poll = currentPoll as anchor.IdlTypes<anchor.Idl>['Poll'];
		pollStore.set(poll);
		pollsStore.update((polls) => [...polls, poll]);

		const currentProfile = await $workspaceStore.program?.account.profile.fetch(profilePda);
		profile = currentProfile as anchor.IdlTypes<anchor.Idl>['Profile'];
		profileStore.set(profile);
		const currentCustomProgram = await $workspaceStore.program?.account.customProgram.fetch(
			customProgramPda
		);
		customProgram = currentCustomProgram as anchor.IdlTypes<anchor.Idl>['CustomProgram'];
		// Q: update() or set() Store?
		customProgramStore.set(customProgram);
	}

	// TODO
	// Try to fetch program accounts using getProgramAccounts()
	// REF: https://www.notion.so/Solana-Quick-Reference-c0704fee2afa4ee5827ded6937ef47df#680c6b9f0f074a37bfe02579309faad2
	async function getAllPollsProgramAccounts() {
		if (!$walletStore) throw Error('Wallet not connected!');
		if (!$workspaceStore) throw Error('Workspace not found!');

		// 1. Establish a connection
		const { connection } = $workspaceStore;

		// 2. Create our filters
		// NOTE We're going to pass this to the getParsedProgramAccounts() function
		const pollsFilter: GetProgramAccountsFilter[] = [
			// Q: Account size 165 or was that for SPLToken accounts only?
			// My hunch is that the sizes vary (Profile, Poll, Vote, etc.)
			// A: NO! Account size VARIES! E.g., Size matches the ACCOUNT_SPACE!
			// CustomProgram=65, Poll=154, Profile=145
			// FIXME Why don't Profiles and Polls filters work????
			// Q: Is it my memcmp.offset? I *believe* that offset is
			// the starting point in account.data to start comparing to
			// the 'bytes' string value byte-by-byte. So, in this case,
			// we're trying to match on 'authority' (i.e., wallet address)
			// U: The issue is that it's not parsing my account data. I read
			// that you need to deserialize based on how the program serialized
			// everything. This means that my Anchor program may require an Anchor
			// version of getParsedProgramAccounts() but still troubleshooting...
			{
				dataSize: 154 // VARIES by the Account::ACCOUNT_SPACE!
			},
			{
				memcmp: {
					offset: 121, // Starting point. 'authority' is close to end
					bytes: $walletStore.publicKey!.toBase58()
				}
			}
		];

		const profilesFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 145
			},
			{
				memcmp: {
					offset: 122, // Starting point. 145-1-32=122
					bytes: $walletStore.publicKey!.toBase58()
				}
			}
		];

		const customProgramFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 65
			},
			{
				memcmp: {
					offset: 32,
					bytes: $walletStore.publicKey!.toBase58()
				}
			}
		];

		// 3. Get the accounts based on filters
		const customProgramAccount = await connection.getParsedProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: customProgramFilter }
		);

		const profileAccounts = await connection.getParsedProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: profilesFilter }
		);

		const pollAccounts = await connection.getParsedProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: pollsFilter }
		);

		// NOTE No filter - get all accounts and check size
		const parsedProgramAccounts = await connection.getParsedProgramAccounts(
			$workspaceStore.program?.programId as PublicKey
		);

		const programAccounts = await connection.getProgramAccounts(
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		// 4. Do what we want... i.e.,
		console.log('=== CustomProgram ===');
		customProgramAccount.forEach((account, i) => {
			const parsedAccountInfo = account.account.data as anchor.web3.ParsedAccountData;
			console.log(parsedAccountInfo); // Uint8Array
			console.log(parsedAccountInfo.parsed); // undefined
		});

		// console.log('=== Profiles ===');
		// profileAccounts.forEach((account, i) => {
		// 	const parsedAccountInfo = account.account.data as anchor.web3.ParsedAccountData;
		// 	console.log(parsedAccountInfo);
		// });

		// console.log('=== Polls ===');
		// pollAccounts.forEach((account, i) => {
		// 	const parsedAccountInfo = account.account.data as anchor.web3.ParsedAccountData;
		// 	console.log(parsedAccountInfo);
		// });

		console.log('=== All PARSED ProgramAccounts ===');
		parsedProgramAccounts.forEach((account, i) => {
			console.log(`Account # ${i + 1}:`);
			console.log(`---Address: ${account.pubkey.toBase58()}`);
			console.log(`---Owner: ${account.account.owner.toBase58()}`);
			console.log(`---Data: ${account.account.data.toString()}`); // Garbled
			console.log(`---JSON: ${JSON.stringify(account.account.data.toString())}`); // Garbled
			console.log(account['account']['data']); // Uint8Array

			console.log('=======');

			// Let's see if typing as ParsedAccountData helps:
			const parsedAccountInfo = account.account.data as anchor.web3.ParsedAccountData;
			console.log(`ParsedAccountData # ${i + 1}:`);
			console.log(parsedAccountInfo); // Uint8Array
			console.log(`---parsedAccountInfo: ${parsedAccountInfo}`); // Garbled
			console.log(`---.parsed: ${parsedAccountInfo.parsed}`); // undefined
			console.log(`---.program: ${parsedAccountInfo.program}`); // undefined
			console.log(`---.program: ${parsedAccountInfo.space}`); // undefined
		});

		// console.log('=== All NON-PARSED ProgramAccounts ===');
		// programAccounts.forEach((account, i) => {
		// 	console.log(`Account # ${i + 1}:`);
		// 	// console.log(`---Address: ${account.pubkey.toBase58()}`);
		// 	console.log(account);
		// });
	}

	// Q: Can I use this to update/fetch my Stores?
	async function derivePda(seeds: Buffer[]) {
		// NOTE This is key! We can derive PDA WITHOUT hitting our program!
		// Then we can use this PDA address in our functions as a check to see
		// whether there is a ledger account at this PDA address.
		// Then, MOST IMPORTANTLY, we can fetch the account's data from the CLIENT
		// and use its data.
		// NOTE pubkey is actually provider.wallet.publicKey
		let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
			seeds,
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		return pda;
	}
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
				>Create Custom Program</Button
			>
			<pre>customProgramStore: {JSON.stringify($customProgramStore, null, 2)}</pre>
			<br />
			<Button disabled={!$walletStore.publicKey} on:click={handleCreateProfile}
				>Create Profile</Button
			>
			<pre>profileStore: {JSON.stringify($profileStore, null, 2)}</pre>
			<br />
			<div class="form-control">
				<label class="input-group input-group-vertical pt-1">
					<span>Option A Display</span>
					<input
						type="text"
						placeholder=""
						class="input input-bordered"
						bind:value={pollOptionADisplayName}
					/>
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span>Option B Display</span>
					<input
						type="text"
						placeholder=""
						class="input input-bordered"
						bind:value={pollOptionBDisplayName}
					/>
				</label>
			</div>
			<Button
				disabled={!$walletStore.publicKey && (!pollOptionADisplayName || !pollOptionBDisplayName)}
				on:click={handleCreatePoll}>Create Poll</Button
			>
			{#if $pollsStore}
				{#each $pollsStore as poll (poll.pollNumber)}
					<pre>{JSON.stringify(poll, null, 2)}</pre>
					<a class="link link-secondary" href="polls/{poll.pollNumber}">Poll {poll.pollNumber}</a>
				{/each}
			{/if}
			<br />
			<Button disabled={!$walletStore.publicKey} on:click={getAllPollsProgramAccounts}
				>Get Program Accounts</Button
			>
		</div>
	</div>
</div>
