<script lang="ts">
	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { PublicKey, type GetProgramAccountsFilter } from '@solana/web3.js';
	import type { OnchainVotingMultiplePolls } from '../../idl/onchain_voting_multiple_polls';
	import idl from '../../../../target/idl/onchain_voting_multiple_polls.json';
	import { onMount, beforeUpdate, afterUpdate, tick } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { notificationStore } from '$stores/notification';
	import {
		customProgramStore,
		profileStore,
		profilesStore,
		pollStore,
		pollsStore,
		votesStore
	} from '$stores/polls/index';
	import { Button } from '$lib/index';
	import Poll from '$lib/Poll.svelte';
	import * as constants from '../../helpers/polls/constants';
	import { getAllProgramAccounts } from '../../helpers/polls/getAllProgramAccounts';
	import type {
		CustomProgramObject,
		ProfileObject,
		PollObject,
		VoteObject
	} from '../../models/polls-types';

	/*
    TODOs:
      - DONE Create some sort of onMount or possibly load() that fetches
        program accounts and updates customProgramStore, pollsStore,
        and profileStore WHEN WALLET CHANGES!
        - Look into $: reactive statements
        - Or, perhaps create custom Stores for each and run each
          getXAccount() method e.g.:
            customProgramStore.getCustomProgramAccount()
            profileStore.getProfileAccount()
            pollsStore.getPollsAccounts()
      - DONE Move the re-fetch logic to polls/__layout.svelte component
        for consistency between polls and polls/[pda] routes
      - DONE Look into how to move getAllProgramAccounts() to separate file
        - A: getAllProgramAccountsMapsPromises
      - DONE How to pass or set() the pollStore on route change? This would save
        having to refetch the data or filter through pollsStore in /[pda].svelte
        Could consider adding a Poll component that takes props? Look into goto()
        REF: https://stackoverflow.com/questions/60424634/how-to-persist-svelte-store-state-across-route-change
        - DONE Seems like I could simply pass the Store as a prop to Poll component.
      - DONE Clear input fields after entry
      - DONE Add 'Back' button navigation
      - DONE Add stores/polls/index.ts file for easier imports
      - Add UI that shows Profile has already voted
      - Add UI that shows Profile created Poll
      - Add UI that lists votes by profile + vote choice
      - Profile page?
      - Prevent Polls with same choices just reversed being created
        - Q: Create BOTH variations inside create_poll()?
      - DONE Prevent Polls with lowercase or UPPERCASE being created
      - DONE Create a modal for create profile to allow custom handles
      - Add notifications for errors (2nd attempts, no SOL, no Profile, etc)
  */

	// U: onMount runs BEFORE workspace is connected!
	// Q: How can I fire off a getAllPollsProgramAccounts()
	onMount(async () => {
		console.log('Component MOUNTED');
		// FIXME If I want to use this, then I need to fix the
		// method to set() to null if the account can't be found yet
		// await customProgramStore.getCustomProgramAccount();
	});

	beforeUpdate(() => console.log('Component BEFORE UPDATE.'));
	afterUpdate(() => console.log('Component AFTER UPDATE.\n =================='));

	// Global state
	// Q: Any way to access the PDA Address from Stores?
	// Or, do I need to maintain separate vars for PDA addresses?
	// U: Adding a customProgramPdaStore to keep state regardless of wallet
	// U: Gonna need more Stores in general I believe...
	// A: YES! Can save PDA to custom Store using custom types!
	let customProgram: CustomProgramObject;

	let profile: ProfileObject;
	let profileHandle = '';
	let profileDisplayName = '';

	let poll: PollObject;
	let pollOptionADisplayName = '';
	let pollOptionBDisplayName = '';

	let vote: VoteObject;
	let votePda: anchor.web3.PublicKey;

	let showModal = false;

	// Create some variables to react to Stores' state
	// $: hasWorkspaceProgramReady =
	// 	$workspaceStore &&
	// 	$workspaceStore.program &&
	// 	$workspaceStore.program.programId.toBase58() ===
	// 		constants.ONCHAIN_VOTING_MULTIPLE_POLLS_PROGRAM_ID.toBase58();
	// $: hasWalletReadyForFetch =
	// 	$walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting;
	// $: hasPollsStoreValues = $pollsStore.length > 0;
	// $: hasPollStoreValues = $pollStore.pda !== null && $pollStore.poll !== null;

	// REF: Check out SolAndy's YT video on deserializing account data
	// Q: How to pre-fetch data? How to use getAllProgramAccounts()
	//    Need to wait for workspace and wallet Stores before invoking...
	// $: $walletStore.connected && $customProgramStore.getCustomProgramAccount();
	// Q: What about this from /basic example? Reactive declarations may help
	// NOTE The below syntax forces JS to intepret the statement as an expression,
	// destructuring the values.
	// REF: https://svelte-recipes.netlify.app/language/#variable-deconstruction
	// $: ({ publicKey, sendTransaction } = $walletStore);
	// REF: https://svelte-recipes.netlify.app/language/#defining-dependencies
	// U: Think I may need to reset my Stores before the fetch...
	// A: Yep, added a reset() just before updating my arrays Stores
	// Q: Watch the entire walletStore or just walletStore.publicKey or walletStore.connected?
	// U: publicKey or connected seem to invoke at the same time.
	// U: Looks like connected == true && connecting == false is the best... need to test
	// Otherwise, it gPA() gets invoked multiple times.
	// U: Actually: connected=true && connecting=false && disconnecting=false
	// $: $walletStore && getAllProgramAccounts(); // Too many triggers
	// $: $walletStore.publicKey && getAllProgramAccounts();
	// $: $walletStore.connected && getAllProgramAccounts(); // Runs SEVERAL times
	// $: $walletStore.connected && !$walletStore.connecting && getAllProgramAccounts(); // Runs TWICE (disconnect & connect)
	// $: $walletStore.connected
	//    && !$walletStore.connecting
	//    && !$walletStore.disconnecting
	//    && getAllProgramAccounts(); // First call is EMTPY!
	// $: $walletStore.connected
	//    && !$walletStore.connecting
	//    && !$walletStore.disconnecting
	//    && getAllProgramAccounts().then(response => console.log('gPA response:', response)); // First call is EMPTY!
	// U: Trying $: tick().then(() => ....)
	// REF: https://dev.to/isaachagoel/svelte-reactivity-gotchas-solutions-if-you-re-using-svelte-in-production-you-should-read-this-3oj3
	// $: tick().then(async () => {
	//   if($walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting) {
	//     await getAllProgramAccounts();
	//   }
	// }) // WORKS on refresh! Q: Need async/await? A: No. See below
	// $: tick().then(() => {
	//   if($walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting) {
	//     getAllProgramAccounts();
	//   }
	// }) // WORKS on refresh! async/await not needed it seems...
	// Q: tick() needed?
	// A: Don't think so as long as I add conditions!
	// Q: Why does this fire when navigating 'back' from /polls/[pda]? Guess it could re-fetch
	// and update but seems like a lot of fetches...
	// A: This triggers even we have pollsStore data. Not always necessary I think...
	// U: Actually, when navigating 'back', I do need to refresh this data since, if I don't,
	// then pollsStore won't reflect latest state/votes, etc. The extra fetches may be needed...
	// Q: If a new Vote occurs and updates the Poll, does this also update pollsStore? Or, is
	// that too nested/removed so Svelte cannot subscribe?
	// $: if(haswalletreadyforfetch) {
	//     getallprogramaccounts();
	//   //   getallprogramaccountsmapspromises(
	//   //   constants.onchain_voting_multiple_polls_program_id,
	//   //   $workspacestore.connection,
	//   //   $walletstore.publickey as anchor.web3.publickey
	//   // );
	//   } // works on refresh! tick() may not be needed after all when adding conditions!

	// $: if (hasWalletReadyForFetch && hasWorkspaceProgramReady) {
	// 	getAllProgramAccountsMapsPromises(
	// 		constants.ONCHAIN_VOTING_MULTIPLE_POLLS_PROGRAM_ID,
	// 		$workspaceStore.connection,
	// 		$walletStore.publicKey as anchor.web3.PublicKey
	// 	);
	// }

	// $: if(hasWalletReadyForFetch && !hasPollsStoreValues) {
	//     getAllProgramAccounts();
	//   } // BETTER on refresh! tick() may not be needed after all when adding conditions!
	// U: TODO May use stale pollsStore data though... need to test.

	// Clear/reset single pollStore if user clicks 'back' from [pda] route
	// Q: How to know when they hit 'back' button from [pda]? Sveltekit has before/afterNavigate()
	// Also have beforeunload
	// REF: https://stackoverflow.com/questions/63161871/svelte-how-to-trap-browser-back-button-or-unload
	// REF: https://kit.svelte.dev/docs/modules#$app-navigation-afternavigate
	// $: if(hasPollStoreValues && [otherConditionOrAlwaysResets]) {
	//   pollStore.reset();
	// }

	$: if (pollOptionADisplayName && pollOptionBDisplayName) {
		console.log('Existing Poll?: ');
		console.log(hasExistingPollOptions(pollOptionADisplayName, pollOptionBDisplayName));
	}

	$: hasDuplicatePollOptions = hasExistingPollOptions(
		pollOptionADisplayName,
		pollOptionBDisplayName
	);

	$: {
		// console.log('walletStore: ', $walletStore);
		// console.log('walletStore.PUBLICKEY: ', $walletStore.publicKey?.toBase58());
		// console.log('walletStore.CONNECTED: ', $walletStore.connected);
		// console.log('walletStore.CONNECTING: ', $walletStore.connecting);
		// console.log('walletStore.DISCONNECTING: ', $walletStore.disconnecting);
		// console.log('customProgram: ', customProgram);
		// console.log('customProgramStore: ', $customProgramStore);
		// console.log('profilePda: ', profilePda?.toBase58());
		// console.log('profileStore: ', $profileStore);
		// console.log('pollPda: ', pollPda);
		// console.log('pollStore: ', $pollStore);
		// console.log('pollsStore: ', $pollsStore);
		// console.log('votesStore: ', $votesStore);
		// console.log('workspaceStore: ', $workspaceStore);
		// console.log('hasWalletReadyForFetch: ', hasWalletReadyForFetch);
		// console.log('hasWorkspaceProgramReady: ', hasWalletReadyForFetch);
		// console.log('hasPollsStoreValues: ', hasPollsStoreValues);
		// console.log('hasPollStoreValues: ', hasPollStoreValues);
		console.log('hasDuplicatePollOptions: ', hasDuplicatePollOptions);
	}

	/*
	 * Create a dApp level PDA data account
	 */
	async function handleCreateCustomProgram() {
		if ($customProgramStore.customProgram) {
			notificationStore.add({
				type: 'error',
				message: 'Data account already exists!'
			});
			console.log('error', 'Data account already exists!');
			return;
		}

		const [pda, bump] = await PublicKey.findProgramAddress(
			[anchor.utils.bytes.utf8.encode(constants.CUSTOM_PROGRAM_SEED_PREFIX)],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			pda.toBase58()
		);

		const tx = await $workspaceStore.program?.methods
			.createCustomProgram()
			.accounts({
				customProgram: pda,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms and update our state/store
		const currentCustomProgram = (await $workspaceStore.program?.account.customProgram.fetch(
			pda
		)) as CustomProgramObject;
		// NOTE ONLY updating state AFTER tx is successful.
		// Q: Use set() or update()?
		// U: Both seem to do the job...
		// Q: Can I add a custom prop to my Store to save PDA?
		// $customProgramStore.pda = pda as PublicKey; // E: type 'never'??
		// U: Doesn't seem so... May need a custom type for the Store?
		// get(customProgramStore).pda = pda; // E: null property
		// Q: What about customProgramStoreWithPda?
		// A: Yes! Reworked it so now PDA is stored directly in Store.
		customProgramStore.set({ customProgram: currentCustomProgram, pda });
	}

	async function handleCreateProfile() {
		const profileCount = (
			$customProgramStore.customProgram?.totalProfileCount.toNumber() + 1
		).toString();
		console.log('profileCount: ', profileCount);

		// NOTE Error processing Instruction 0: Cross-program invocation
		// with unauthorized signer or writable account
		// REF: https://stackoverflow.com/questions/72849618/transaction-simulation-failed-error-processing-instruction-0-cross-program-inv
		// U: Check the seeds!
		const [pda, bump] = await PublicKey.findProgramAddress(
			// U: Removing profileCount from seeds so can't create multiple Profiles
			[
				anchor.utils.bytes.utf8.encode(constants.PROFILE_SEED_PREFIX),
				($walletStore.publicKey as anchor.web3.PublicKey).toBuffer() // authority
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			pda.toBase58()
		);

		const tx = await $workspaceStore.program?.methods
			.createProfile(`@${profileHandle.trim()}`, profileDisplayName.trim())
			.accounts({
				profile: pda,
				customProgram: $customProgramStore.pda as anchor.web3.PublicKey,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// .signers([testUser1]) // Not needed with AnchorWallet
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms & update global state
		const currentProfile = (await $workspaceStore.program?.account.profile.fetch(
			pda
		)) as ProfileObject;
		// NOTE Only after the tx is successful do we update our state
		// Q: update() or set() Store?
		profileStore.set({ profile: currentProfile, pda });
		profilesStore.addProfile(currentProfile, pda);

		const currentCustomProgram = (await $workspaceStore.program?.account.customProgram.fetch(
			$customProgramStore.pda as anchor.web3.PublicKey
		)) as CustomProgramObject;
		// Q: update() or set() Store?
		// A: I believe just set() since we overwrite the whole thing
		customProgramStore.set({ customProgram: currentCustomProgram, pda: $customProgramStore.pda });

		// Clear inputs
		profileHandle = '';
		profileDisplayName = '';

		// Close Modal
		showModal = false;
	}

	async function handleCreatePoll() {
		// TODO Check whether there's an existing Poll
		if (hasExistingPollOptions(pollOptionADisplayName, pollOptionBDisplayName)) {
			// notificationStore.add
			console.log('DUPLICATE POLL FOUND!');
		}

		// Q: If the same user goes between /polls or /polls/[pollNumber],
		// then all the local PDAs get cleared. Maybe consider storing the PDA
		// in the actual account? Or, perhaps attempt to derive if not available?
		// This is a common challenge for me...
		// U: If I add <a> links then the state remains and isn't cleared. However, if I
		// change wallets, then the user state gets wiped.
		// A: Ended up creating a separate PdaStore for this
		// U: Need to explore reactive statement (e.g. useEffect on wallet.publicKey change)
		const pollCount: string = (
			$customProgramStore.customProgram?.totalPollCount.toNumber() + 1
		).toString();
		console.log('pollCount: ', pollCount);

		// NOTE From Anchor PDA example: https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor
		// NOTE They find the PDA address INSIDE the it() test!
		const [pda, bump] = await PublicKey.findProgramAddress(
			[
				anchor.utils.bytes.utf8.encode(constants.POLL_SEED_PREFIX),
				// Q: Need wallet publicKey? Won't this restrict to only that user
				// being able to write to PDA?
				// A: YES! The original crunchy-vs-smooth didn't use wallet pubkeys,
				// since that would create a unique PDA for the user (not users!).
				anchor.utils.bytes.utf8.encode(pollCount)
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			pda.toBase58()
		);

		// Following this example to call the methods:
		// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
		const tx = await $workspaceStore.program?.methods
			.createPoll(
				pollOptionADisplayName.trim().toUpperCase(),
				pollOptionBDisplayName.trim().toUpperCase()
			)
			.accounts({
				poll: pda,
				profile: $profileStore.pda as anchor.web3.PublicKey,
				customProgram: $customProgramStore.pda as anchor.web3.PublicKey,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// .signers([testUser1]) // AnchorWallet
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms & update global state
		const currentPoll = (await $workspaceStore.program?.account.poll.fetch(pda)) as PollObject;
		pollsStore.addPoll(currentPoll, pda);

		const currentProfile = (await $workspaceStore.program?.account.profile.fetch(
			$profileStore.pda as anchor.web3.PublicKey
		)) as ProfileObject;
		profileStore.set({ profile: currentProfile, pda: $profileStore.pda });
		const currentCustomProgram = (await $workspaceStore.program?.account.customProgram.fetch(
			$customProgramStore.pda as anchor.web3.PublicKey
		)) as CustomProgramObject;
		// Q: update() or set() Store?
		// A: set() since we're overriding the data
		customProgramStore.set({ customProgram: currentCustomProgram, pda: $customProgramStore.pda });

		// Clear inputs
		pollOptionADisplayName = '';
		pollOptionBDisplayName = '';
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

	// Testing out my customProgramStore.getCustomProgramAccount()
	async function handleGetCustomProgram() {
		// Q: Do I need to derive PDA here or inside Store?
		// A: Inside Store! Makes it more flexible!
		// With PDA
		// await customProgramStore.getCustomProgramAccount(CUSTOM_PROGRAM_PDA);
		// Without PDA
		await customProgramStore.getCustomProgramAccount(); // null
	}

	// Q: How to persist Store state/data across route changes?
	// Without a Poll component, whenever I click a <a> link, pollStore
	// isn't set. Or, whenever I hit 'back', my Stores reset.
	// U: Look into Svelte's goto():
	// REF: https://stackoverflow.com/questions/60424634/how-to-persist-svelte-store-state-across-route-change
	async function navigateAndSaveStores(href: string) {
		await goto(href);
		// Save something, do something with db, etc.
		// E.g., href=/polls/[pda]
		// TODO
		const matchingPoll = $pollsStore.find((p) => p.pda?.toBase58() === href.slice());
		pollStore.set;
	}

	// Prevent duplicate Polls getting created (A v B, B v A)
	// U: Adding params so I can use inside reactive statement
	function hasExistingPollOptions(optionA: string, optionB: string): boolean {
		// Q: Should I try using a Set with its add(), has(), .size?
		// REF: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#implementing_basic_set_operations
		// function isSuperset(set, subset) {
		// 	for (const elem of subset) {
		// 		if (!set.has(elem)) {
		// 			return false;
		// 		}
		// 	}
		// 	return true;
		// }
		// U: Can also consider creating two Sets and then finding intersection
		// const intersection = new Set([...mySet1].filter((x) => mySet2.has(x)));

		// const enteredOptionsSet = new Set([optionA.trim().toUpperCase(), optionB.trim().toUpperCase()]);
		const enteredOptionsSet = new Set();
		enteredOptionsSet.add(optionA.trim().toUpperCase());
		enteredOptionsSet.add(optionB.trim().toUpperCase());

		let uniqueOptions = 2;
		for (const elem of $pollsStore) {
			// U: Can't just decrement uniqueOptions since you can enter 'dog' 'dog' and matches still is 0.
			// Need to consider deleting matched items from enteredOptionsSet instead.
			// A: Actually, this isn't totally wrong. Don't want a 'dog' v 'dog' Poll anyway.
			// Both approaches seem to work.
			let pollOptionA = elem.poll?.optionADisplayLabel.trim().toUpperCase();
			let pollOptionB = elem.poll?.optionBDisplayLabel.trim().toUpperCase();

			if (enteredOptionsSet.has(pollOptionA)) {
				// enteredOptionsSet.delete(pollOptionA);
				uniqueOptions--;
			}
			if (enteredOptionsSet.has(pollOptionB)) {
				// enteredOptionsSet.delete(pollOptionB);
				uniqueOptions--;
			}
			// console.log('uniqueOptions: ', uniqueOptions);

			if (uniqueOptions === 0) {
				// Both labels were found in a single Poll
				return true;
			}
			// Reset uniqueOptions/Set back to 2
			// enteredOptionsSet.add(optionA);
			// enteredOptionsSet.add(optionB);
			uniqueOptions = 2;
		}
		// No match was found after looping through all Poll accounts
		return false;
	}
</script>

<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Polls
		</h1>
		<div class="card-body items-center text-center pt-0">
			{#if !$customProgramStore}
				<Button disabled={!$walletStore.publicKey} on:click={handleCreateCustomProgram}
					>Create Custom Program</Button
				>
			{/if}
			<br />
			{#if !$profileStore}
				<Button disabled={!$walletStore.publicKey} on:click={() => (showModal = true)}
					>Create Profile</Button
				>
			{/if}
			<div class="form-control">
				<label class="input-group input-group-vertical pt-1">
					<span class:bg-error={hasDuplicatePollOptions}>Option A Display</span>
					<input
						type="text"
						placeholder="E.g., Dog"
						class="input input-bordered"
						bind:value={pollOptionADisplayName}
					/>
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span class:bg-error={hasDuplicatePollOptions}>Option B Display</span>
					<input
						type="text"
						placeholder="E.g., Cat"
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
				{#each $pollsStore as { poll, pda } (pda)}
					<Poll {poll} pda={pda.toBase58()} />
				{/each}
			{/if}
		</div>
		<!-- Modal: Put this part before </body> tag -->
		<!-- NOTE DaisyUI's 'modal-open' modifier class -->
		<div class="modal bg-neutral" class:modal-open={showModal}>
			<div class="modal-box relative">
				<h3 class="font-bold text-lg mb-2">Create Profile</h3>
				<button
					class="btn btn-sm btn-circle absolute right-2 top-2 bg-error"
					on:click={() => (showModal = false)}>x</button
				>
				<div class="form-control">
					<label class="input-group input-group-vertical">
						<span>Handle</span>
						<input
							type="text"
							placeholder="E.g., @yourhandle"
							class="input input-bordered"
							bind:value={profileHandle}
						/>
					</label>
					<label class="input-group input-group-vertical pt-2 pb-2">
						<span>Display Name</span>
						<input
							type="text"
							placeholder="E.g., TheVotooor"
							class="input input-bordered"
							bind:value={profileDisplayName}
						/>
					</label>
				</div>
				<div class="items-center text-center">
					<Button disabled={!$walletStore.publicKey} on:click={handleCreateProfile}
						>Create Profile</Button
					>
				</div>
			</div>
		</div>
		<pre>customProgramStore: {JSON.stringify($customProgramStore, null, 2)}</pre>
		<pre>profileStore: {JSON.stringify($profileStore, null, 2)}</pre>
	</div>
</div>
