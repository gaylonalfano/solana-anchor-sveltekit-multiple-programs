<script lang="ts">
	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl, PublicKey, type GetProgramAccountsFilter } from '@solana/web3.js';
  import type { OnchainVotingMultiplePolls } from '../../idl/onchain_voting_multiple_polls';
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
    // U: Using a custom Store so had to update how I access customProgram data
		if ($customProgramStore.customProgram) {
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
		customProgramStore.set({ customProgram });

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
    // U: If I add <a> links then the state remains and isn't cleared. However, if I
    // change wallets, then the user state gets wiped.
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
		customProgramStore.set({ customProgram: customProgram });
	}

	// Try to fetch program accounts using getProgramAccounts()
	// REF: https://www.notion.so/Solana-Quick-Reference-c0704fee2afa4ee5827ded6937ef47df#680c6b9f0f074a37bfe02579309faad2
  // REF: https://solanacookbook.com/guides/get-program-accounts.html#filters
	async function getAllPollsProgramAccounts() {
		if (!$walletStore) throw Error('Wallet not connected!');
		if (!$workspaceStore) throw Error('Workspace not found!');


		// 1. Establish a connection
		const { connection } = $workspaceStore;

		// 2. Create our filters
		// NOTE We're going to pass this to the getParsedProgramAccounts() function
			// Q: Account size 165 or was that for SPLToken accounts only?
			// My hunch is that the sizes vary (Profile, Poll, Vote, etc.)
			// A: NO! Account size VARIES! E.g., Size matches the ACCOUNT_SPACE!
			// CustomProgram=65, Poll=154, Profile=145
			// FIXME Why don't Profiles and Polls filters work????
			// Q: Is it my memcmp.offset? I *believe* that offset is
			// the starting point in account.data to start comparing to
			// the 'bytes' string value byte-by-byte. So, in this case,
			// we're trying to match on 'authority' (i.e., wallet address)
      // U: I think I can get customProgramFilter to work bc its fields
      // are all ints mostly. Perhaps the String fields in Poll and Profile
      // structs makes it harder to pinpoint the offset?
      // IMPORTANT: String is Vec<u8> and each UTF-8 char can use up to 4 bytes each
      // And the first 4 bytes is a PREFIX that stores the String's total length (not max possible)!
      // You define the MAX size allocation for String in the struct, BUT that doesn't
      // mean you'll actually use up the entire space! THIS CAN AFFECT WHERE NEXT PROPERTY
      // IS LOCATED! So, this 4 byte prefix is crucial bc it needs to be accounted for!
      // REF: https://lorisleiva.com/create-a-solana-dapp-from-scratch/structuring-our-tweet-account
      // U: So, does (above) mean my MAX Poll size is 154, but because my two String
      // fields (option_a/b labels) will vary? NOTE: I allocated 40 bytes per label,
      // which means I could treat it like 10 * 4 = 40 bytes (10 chars max)
      // U: I moved 'authority' in CustomProgram struct to be the first field. Then,
      // Then I updated the filter memcmp offset: 8, since 0-7 is for DISCRIMINATOR!
      // and it worked! The challenge with Poll and Profile is due to the String fields!
      // U: I added 4 bytes for STRING_LENGTH_PREFIX, so 8 bytes total to Poll::ACCOUNT_SPACE (162)
      // U: I also shifted 'authority' to the first struct field, so can target offset easier
      // This way I odn't have to worry about varying length of display labels.
      // A: WORKS! Just a matter of pinpointing the offset value! Moving 'authority' to a 
      // predictable position worked! THIS MEANS THAT I could create account-type specific
      // queries, AND THEN use program.account.[accountType].fetch(pubkey)!
		const pollsFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 162 // VARIES by the Account::ACCOUNT_SPACE!
			},
			{
				memcmp: {
					offset: 8, // Starting point. 'authority'
					bytes: $walletStore.publicKey!.toBase58()
				}
			}
		];

		const profilesFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 153
			},
			{
				memcmp: {
					offset: 8, // Starting point for 'authority' 
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
					offset: 8, // 32 when 'authority' was just before bump
					bytes: $walletStore.publicKey!.toBase58()
				}
			}
		];

    //   const votesFilter: GetProgramAccountsFilter[] = [
		// 	{
		// 		dataSize: 65
		// 	},
		// 	{
		// 		memcmp: {
		// 			offset: 8, // 32 when 'authority' was just before bump
		// 			bytes: $walletStore.publicKey!.toBase58()
		// 		}
		// 	}
		// ];


		// 3. Get the accounts based on filters
		const customProgramAccount = await connection.getParsedProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: customProgramFilter }
		);
    console.log("customProgramAccount:");
    console.log(customProgramAccount);


		const profileAccounts = await connection.getParsedProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: profilesFilter }
		);

		const pollAccounts = await connection.getParsedProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: pollsFilter }
		);
    console.log("pollAccounts:");
    console.log(pollAccounts);

		// NOTE No filter - get all accounts and check size
		const parsedProgramAccounts = await connection.getParsedProgramAccounts(
			$workspaceStore.program?.programId as PublicKey
		);

		const programAccounts = await connection.getProgramAccounts(
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

    // Q: What does program.state return?
    // U: Nothing??? Need to look into this more.
    // const programState = await $workspaceStore.program?.state.fetch(); // undefined
    // console.log(programState);


		// 4. Do what we want... i.e.,
    // Q: Why is the AccountInfo data returning a Buffer? How do I parse the data?
    // U: Turns out you parse the account according to its struct. So, each program
    // will package it up differently. However, if the account is a data account,
    // then you may be able to read the data using the program.account.fetch() API.
    // U: By using getProgramAccounts() and then fetch(), you're essentially fetching TWICE.
    // Was suggested to gPA and then program.coder.accounts.decode(), but how?
		console.log('=== CustomProgram ===');
		customProgramAccount.forEach((account, i) => {
			const parsedAccountInfo = account.account.data as anchor.web3.ParsedAccountData;
      // const decodedAccountInfo = $workspaceStore.program!.coder.accounts.decode("customProgram", account.account.data as Buffer); // E: Unknown account: customProgram
			console.log(parsedAccountInfo); // Uint8Array
			// console.log(parsedAccountInfo.parsed); // undefined
		});

		console.log('=== Profiles ===');
    // Q: What does program.coder look like?
    // Q: Does my workspaceStore.program have the Idl of OnchainVotingMultiplePolls?
    // Q: Is there a Typing issue i.e., should it say BorshCoder or just Coder?
    console.log("program: ");
    console.log($workspaceStore.program!) // Program {coder, idl, programId, provider}
    console.log("program.coder: ");
    console.log($workspaceStore.program!.coder) // BorshCoder {instructions, accounts, events}
    console.log("program.coder.accounts: ");
    console.log($workspaceStore.program!.coder.accounts) // BorshAccountsCoder {accountLayouts, idl}
    // Q: How to use program.coder?
    // REF: program.coder.accounts.decode<anchor.IdlAccounts<DegenerateStar>["star"]>("star", data!);
    // A: program.coder.accounts.decode("Profile", account.account.data); No need for types since we have IDL!
    const decodedProfileAccounts = profileAccounts.map((account: anchor.IdlTypes<anchor.Idl>["Profile"], i: number) => {
      // $workspaceStore.program?.account.profile._coder.decode("Profile", account.account.data as Buffer); // E: _coder is private
      // return $workspaceStore.program!.coder.accounts.decode("profile", account.account.data); // E: Unknown account: profile
      // ============== TODO =========
      // TODO WORKS! RESEARCH THIS and make sure the Idl Type is still working, though it should
      // right, since I typed 'account' inside the map()?
      return $workspaceStore.program!.coder.accounts.decode("Profile", account.account.data); // WORKS! It's CAPITAL 'P'!
      // return $workspaceStore.program?.coder.accounts.decode<anchor.IdlTypes<anchor.Idl>["Profile"]>("profile", account.account.data as Buffer); // Error: Unknown account: profile
      // return $workspaceStore.program?.coder.profile.decode<anchor.IdlTypes<anchor.Idl>["Profile"]>("Profile", account.account.data); // E: 'profile' does not exist on type 'Coder'

      // return $workspaceStore.program?.coder<anchor.IdlAccounts<OnchainVotingMultiplePolls>["profile"]>
      //   .profile.decode("Profile", account.account.data); // E: 

      // return $workspaceStore.program?.coder.accounts
        // .decode<anchor.IdlAccounts<OnchainVotingMultiplePolls>["profile"]>("profile", account.account.data as Buffer); // Error: Unknown account: profile
        // .decode<anchor.IdlTypes<anchor.Idl>["Profile"]>("profile", account.account.data as Buffer); // Error: Unknown account: profile

      // return $workspaceStore.program?.coder.accounts.profile
      //   .decode(anchor.IdlTypes<anchor.Idl>["Profile"], account.account.data as Buffer); // E: 'profile' does not exist on type AccountsCoder<string>

      // console.log("profileAccount #: ", i);
      // console.log(account);

      // return $workspaceStore.program?.coder


      
    })

    console.log(decodedProfileAccounts);
    // profileAccounts.map((account) => {
    //   return $workspaceStore.program?.coder.accounts<"Profile">?.decode("profile", account.account.data);
    // })

		console.log('=== Polls ===');
		pollAccounts.forEach((account, i) => {
			const parsedAccountInfo = account.account.data as anchor.web3.ParsedAccountData;
			console.log(parsedAccountInfo);
		});

		// console.log('=== All PARSED ProgramAccounts ===');
		// parsedProgramAccounts.forEach((account, i) => {
		// 	console.log(`Account # ${i + 1}:`);
		// 	console.log(`---prototype: ${Object.getPrototypeOf(account)}`);
		// 	console.log(`---Address: ${account.pubkey.toBase58()}`);
		// 	console.log(`---Owner: ${account.account.owner.toBase58()}`);
		// 	console.log(`---Data: ${account.account.data.toString()}`); // Garbled
		// 	console.log(`---JSON: ${JSON.stringify(account.account.data.toString())}`); // Garbled
		// 	console.log(account['account']['data']); // Uint8Array

		// 	console.log('=======');

		// 	// Let's see if typing as ParsedAccountData helps:
		// 	const parsedAccountInfo = account.account.data as anchor.web3.ParsedAccountData;
		// 	console.log(`ParsedAccountData # ${i + 1}:`);
		// 	console.log(parsedAccountInfo); // Uint8Array
		// 	console.log(`---parsedAccountInfo: ${parsedAccountInfo}`); // Garbled
		// 	console.log(`---.parsed: ${parsedAccountInfo.parsed}`); // undefined
		// 	console.log(`---.program: ${parsedAccountInfo.program}`); // undefined
		// 	console.log(`---.program: ${parsedAccountInfo.space}`); // undefined
		// });


		console.log('=== All NON-PARSED ProgramAccounts ===');
		programAccounts.forEach(async (account, i) => {
      // Q: Why is the AccountInfo data returning a Buffer? How do I parse the data?
      // U: Turns out you parse the account according to its struct. So, each program
      // will package it up differently. However, if the account is a data account,
      // then you may be able to read the data using the program.account.fetch() API.
			console.log(`Account # ${i + 1}:`);
			// console.log(`---Address: ${account.pubkey.toBase58()}`);
			console.log(account);

      // Q: Do I even need to use this getProgramAccounts() approach if I have access
      // to the workspace/program and the fetch() API?
      // U: Works (kinda) if I know the account struct, but errors otherwise.
      // E.g., If I use program.account.customProgram it'll get the matching account data,
      // otherwise, it errors. 
      // Q: Wonder if my GetProgramAccountsFilter could filter by the different types by
      // using dataSize and memcmp properties?
      // const accountData = await $workspaceStore.program?.account.customProgram?.fetch(account.pubkey) // WORKS
      // console.log(accountData);
		});
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
