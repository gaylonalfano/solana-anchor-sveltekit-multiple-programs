<script context="module">
	// UPDATE: Originally tried to do some data fetching but not applicable
	// in this case. Leaving for reference.
	// TL;DR: Can access the 'page' Store directly for route params.
	// export async function load({ params }) {
	// 	const pollNumberFromLoad = params.pollNumber;

	// 	return { props: { pollNumberFromLoad } };
	// }
</script>

<script lang="ts">
	import * as anchor from '@project-serum/anchor';
	import { page } from '$app/stores';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { notificationStore } from '$stores/notification';
	import { customProgramStore } from '$stores/polls/custom-program-store';
	import { profileStore } from '$stores/polls/profile-store';
	import { pollStore, type PollStoreObject } from '$stores/polls/poll-store';
	import { pollsStore } from '$stores/polls/polls-store';
	import { votesStore } from '$stores/polls/votes-store';
	import { pollVotesStore } from '$stores/polls/poll-votes-store';
	import type {
		VoteObject,
		PollObject,
		ProfileObject,
		CustomProgramObject
	} from '../../models/polls-types';
	import { Button } from '$lib/index';
	import * as constants from '../../helpers/polls/constants';

	// Q: How to match up types between pollNumber (BN) and pollNumberFromLoad?
	// A: It's a Type mismatch! The IDL Poll.pollNumber.words[0] is 'number'!
	// let poll = $pollsStore.find((p) => p.pollNumber.toBase58() === pollNumberFromLoad); // ERROR
	// let poll = $pollsStore.find((p) => p.pollNumber.toNumber() === pollNumberFromLoad); // ERROR
	// let poll = $pollsStore.find((p) => {
	// 	console.log(p.pollNumber); // BN {....}
	// 	console.log(typeof p.pollNumber); // object
	// 	console.log(typeof p.pollNumber.words[0]); // number
	// 	console.log(typeof pollNumberFromLoad); // string
	// 	// return p.pollNumber.words[0] === parseInt(pollNumberFromLoad);
	// 	return p.pollNumber.words[0] === parseInt($page.params.pollNumber);
	// }) as anchor.IdlTypes<anchor.Idl>['Poll']; // NOTE MUST cast for Types!

	// Q: Why losing Store state on page refresh? These conditional reactives
	// combined with tick() helps, but feels fragile. Could consider adding a
	// polls/__layout.svelte that does this or something. Or, maybe there's a
	// Svelte solution specifically for this scenario.
	// U: I think it may have something to do with __layout.svelte first setting
	// workspaceStore to the main multiple_PROGRAMS program, instead of this
	// multiple_POLLS program. This means it initially uses the wrong programId
	// for the fetches. Need to monitor workspaceStore.program changes to confirm.
	// U: After some testing, it takes a few cycles before the workspaceStore is
	// properly updated with the correct program and other details. I can reduce the
	// number of wasted fetches (without using tick().then()) by adding this condition.
	// FIXED: Extra hasWorkspaceProgramReady condition is working! Not using tick().then()!
	// Also, noticed from logs that fetches return asynchronously with profileStore last/slowest...
	// TODO Consider making a polls/__layout.svelte component to set workspaceStore
	// A: Done. Check out polls/__layout.svelte

	let profileVoteOptionDisplay = '';

	// Create some variables to react to Stores state
	$: hasPollsStoreValues = $pollsStore.length > 0;
	$: hasPollStoreValues = $pollStore.poll !== null && $pollStore.pda !== null;
	$: hasVotesStoreValues = $votesStore.length > 0;
	$: hasProfileStoreValues = $profileStore.profile !== null && $profileStore.pda !== null;
	$: hasCustomProgramStoreValues =
		$customProgramStore.customProgram !== null && $customProgramStore.pda !== null;

	// Q: tick() needed if I add the conditional check?
	// U: Seems needed as it doesn't error. However, tick() fires a lot
	// and may not be most effective. Could consider cleaning up or splitting
	// into multiple reactives per condition.
	// NOTE On reload, this triggers 4 times for pollStore.getPollAccount
	// NOTE async/await has no improvement/effect!
	// Q: What about separating into separate statements?
	// A: NOPE! Still triggers pollStore.getPollAccount() 4 times.
	// Q: Can I use this outside of tick()?
	// A: Not really bc getting uncaught error with gPA inside pollStore.getPollAccount()
	// but the pollStore does get updated...
	// U: I believe tick() is firing a couple times BEFORE the walletStore is ready for fetch
	// Check out the hasWalletReadyForFetch in the logs.
	// U: Yep! Using my reactive helpers results in only 2 invokes of pollStore.getPollAccount()!

	// U: Trying $: reactives WITHOUT tick().then() now that I've added some helper
	// reactives and Store helper methods (getPollAccount(), getProfileAccount()).
	// In many ways, this is achieving the same thing as my polls/index.svelte has
	// with the getAllProgramAccounts() function...
	// $: if (hasWorkspaceProgramReady && hasWalletReadyForFetch) {
	// 	// Attempt to get stores (if exists)
	// 	console.log('Wallet reconnected. Getting stores if available...');
	// 	get(customProgramStore);
	// 	get(pollStore);
	// 	get(pollsStore);
	// 	get(votesStore);
	// 	get(pollVotesStore);
	// 	get(profileStore);
	// }

	// $: if (hasWorkspaceProgramReady && hasWalletReadyForFetch && !hasCustomProgramStoreValues) {
	// 	console.log('$customProgramStore values are null. Refetching...');
	// 	customProgramStore.getCustomProgramAccount();
	// }

	// $: if (hasWorkspaceProgramReady && hasWalletReadyForFetch && !hasProfileStoreValues) {
	// 	console.log('$profileStore values are null. Refetching...');
	// 	profileStore.getProfileAccount(
	// 		$walletStore.publicKey as anchor.web3.PublicKey,
	// 		// $workspaceStore.program?.programId as anchor.web3.PublicKey,
	// 		constants.ONCHAIN_VOTING_MULTIPLE_POLLS_PROGRAM_ID,
	// 		$workspaceStore.connection
	// 	);
	// }

	// $: if (hasWorkspaceProgramReady && hasWalletReadyForFetch && !hasPollsStoreValues) {
	// 	console.log('$pollsStore values are null. Refetching...');
	// 	// Refetch pollsStore (probably lost on disconnect, refresh, etc)
	// 	pollsStore.getPollAccounts(
	// 		// $workspaceStore.program?.programId as anchor.web3.PublicKey,
	// 		constants.ONCHAIN_VOTING_MULTIPLE_POLLS_PROGRAM_ID,
	// 		$workspaceStore.connection
	// 	);
	// }

	// $: if (hasWorkspaceProgramReady && hasWalletReadyForFetch && !hasVotesStoreValues) {
	// 	// Check whether votesStore has values, otherwise need to refetch
	// 	// so that derived store pollVotesStore can update
	// 	// TODO Could consider adding a getVoteAccountsByPoll() helper
	// 	votesStore.getVoteAccounts(
	// 		// $workspaceStore.program?.programId as anchor.web3.PublicKey,
	// 		constants.ONCHAIN_VOTING_MULTIPLE_POLLS_PROGRAM_ID,
	// 		$workspaceStore.connection
	// 	);
	// }

	// $: if (hasWorkspaceProgramReady && hasWalletReadyForFetch && !hasPollStoreValues) {
	// 	console.log('$pollStore values are null. Refetching...');
	// 	// Refetch pollStore
	// 	pollStore.getPollAccount(
	// 		// $workspaceStore.program?.programId as anchor.web3.PublicKey,
	// 		constants.ONCHAIN_VOTING_MULTIPLE_POLLS_PROGRAM_ID,
	// 		new PublicKey($page.params.pda),
	// 		$workspaceStore.connection
	// 	);
	// }

	// U: Set the single pollStore on page load.
	// NOTE The polls/__layout is fetching all the program accounts
	// and decoding, updating Stores, etc. However, cannot access the
	// $page Store to compare page.params.pda, since page Store is
	// unavailable from __layout. Therefore, setting pollStore here.
	// U: However, need to remember that normally (without refresh),
	// the pollStore is passed as a prop inside Poll.svelte component!
	// So, this really needs to only update/set whenever a full refresh
	// or wallet connect occurs...
	// Q: How to wait until the __layout fetch is complete?
	// A: Make a reactive that only attempts once pollsStore is updated.
	// NOTE Don't use get(store) as it's not reactive! Use $store instead!
	// get() will access the store at that time of execution ONLY. So, if
	// the store later updates, it won't react!
	$: if (hasPollsStoreValues && !hasPollStoreValues) {
		console.log('No pollStore values found! Trying to set...');
		try {
			let currentPollStoreObject = $pollsStore.find(
				(value: PollStoreObject) => value.pda?.toBase58() === $page.params.pda
			) as PollStoreObject;
			// console.log('currentPollStoreObject: ', currentPollStoreObject);
			if (currentPollStoreObject) {
				console.log('Current Poll found in pollsStore. Setting pollStore values.');
				pollStore.set({
					poll: currentPollStoreObject.poll,
					pda: currentPollStoreObject.pda
				});
			}

			// Q: Confirm that derived pollVotesStore updates as well?
			// U: Seems to work as long as pollStore is found/has values
		} catch (e) {
			console.log('Poll not found in pollsStore. Single pollStore not updated.');
			console.warn(e);
		}
	}

	$: profileHasVoted = $pollVotesStore.some(
		(v) => v.profilePubkey.toBase58() === $profileStore.pda?.toBase58()
	);

	$: {
		//   console.log('$workspaceStore: ', $workspaceStore);
		// console.log('$customProgramStore: ', $customProgramStore);
		// console.log('$profileStore: ', $profileStore);
		// console.log('$profileStore.pda: ', $profileStore.pda?.toBase58());
		// console.log('$pollsStore: ', $pollsStore);
		// console.log('$pollsStore.length: ', $pollsStore.length);
		// console.log('$pollStore: ', $pollStore);
		console.log('pollVotesStore: ', $pollVotesStore);
		// console.log('hasPollStoreValues: ', hasPollStoreValues);
		// console.log('hasPollsStoreValues: ', hasPollsStoreValues);
	}

	async function handleCreateVoteForOptionA() {
		// Q: Refactor with params?
		// e.g., pollPubkey, voteOption?
		// Need to access current poll.voteCount
		// TODO Gonna have to grab the Profile and selected Poll once we start
		// adding multiple polls, etc. May need to use route params or something
		// U: Yep, added a subroute [pollNumber] and using 'page' Store for params
		// TODO Could consider making a Poll component
		// Need to look into storing PDA on the Store object Set.add()? Set.has(pda)?
		// Otherwise, the constant findProgramAddress() seems redundant, but I need
		// the PDA to createVote(), since I need the Poll account address.
		// Would be handy to add the account addresses to the Stores for quicker
		// access. THINK THIS THROUGH...
		// Q: If I have $pollStore, then don't need to fetch again, right?
		// Or, would several simultaneous votes mess up the state somehow?
		// This may cause some issues if voteCount has duplicates/conflicts...
		// Definitely need to make sure that pollsStore is updating and each,
		// Poll is updated as well... May need a handy PdaStore for quick fetch()
		// Need to access current poll.voteCount
		// U: Created/updated my Stores to save the PDA! Now they use custom types
		// that look like { account, pda }. This should help BUT need to test out
		// when a new wallet connects to update the Stores...
		// Q: Need profile and/or customProgram? Or, just pass as accounts?
		// A: Eventually will need to increment/update values, but not yet!
		// U: No longer need to do a fetch since we have pollStore
		//   let pollPda = await derivePda([Buffer.from(constants.POLL_SEED_PREFIX), Buffer.from($pollStore.pollNumber)]);
		//   console.log("pollPda: ", pollPda);

		// let poll = await $workspaceStore.program?.account.poll.fetch(pollPda) as anchor.IdlTypes<anchor.Idl>["Poll"];
		// pollStore.set(poll);

		const voteCount: string = ($pollStore.poll?.voteCount.toNumber() + 1).toString();

		const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
			[
				anchor.utils.bytes.utf8.encode(constants.VOTE_SEED_PREFIX),
				$pollStore.pda?.toBuffer() as Buffer, // Q: Can get I PDA from pollStore? A: Yes!
				($walletStore.publicKey as anchor.web3.PublicKey).toBuffer()
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);
		// Q: Update global state for vote?
		// A: No. Wait until tx is successful and then update state

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			pda.toBase58()
		);

		// Following this example to call the methods:
		// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
		const tx = await $workspaceStore.program?.methods
			.createVote({ a: {} })
			.accounts({
				vote: pda,
				poll: $pollStore.pda as anchor.web3.PublicKey,
				profile: $profileStore.pda as anchor.web3.PublicKey,
				customProgram: $customProgramStore.pda as anchor.web3.PublicKey,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// .signers([testUser2]) // AnchorWallet
			.rpc();
		console.log('TxHash ::', tx);
		notificationStore.add({
			type: 'success',
			message: 'Vote submitted!',
			txid: tx
		});

		// Fetch data after tx confirms & update global state
		const currentVote = (await $workspaceStore.program?.account.vote.fetch(pda)) as VoteObject;
		// Q: Need a voteStore? Eh....
		// A: Yes. I've created a votesStore (writable) and pollVotesStore (derived)
		// NOTE I could've added a 'votes' property to pollStore and may revert if needed
		votesStore.addVote(currentVote);
		const currentPoll = (await $workspaceStore.program?.account.poll.fetch(
			$pollStore.pda as anchor.web3.PublicKey
		)) as PollObject;
		// Q: By setting pollStore will pollsStore update automatically?
		// A: No. I don't believe pollsStore updates when a new vote occurs using pollStore.set()
		// Q: Should I use pollStore.update()?
		// A: Doesn't seem to help.
		// Doing two commands seems error prone. Wonder if pollStore.update() could do the trick?
		// pollStore.set({ poll: currentPoll, pda: $pollStore.pda }); // pollsStore DOESN'T update
		// pollStore.update((self) => {
		//   self.poll = currentPoll;
		//   self.pda = $pollStore.pda;
		//   return self;
		// }); // pollsStore DOESN'T update
		// Q: Need to first pollStore.set() then pollsStore.updatePoll()?
		// A: Yes, looks like I need to also update pollsStore or it can't see
		// individual Poll updates.
		pollStore.set({ poll: currentPoll, pda: $pollStore.pda });
		pollsStore.updatePoll($pollStore.pda as anchor.web3.PublicKey, currentPoll);

		const currentProfile = (await $workspaceStore.program?.account.profile.fetch(
			$profileStore.pda as anchor.web3.PublicKey
		)) as ProfileObject;
		profileStore.set({ profile: currentProfile, pda: $profileStore.pda });

		const currentCustomProgram = (await $workspaceStore.program?.account.customProgram.fetch(
			$customProgramStore.pda as anchor.web3.PublicKey
		)) as CustomProgramObject;
		// Q: update() or set() Store?
		customProgramStore.set({ customProgram: currentCustomProgram, pda: $customProgramStore.pda });
	}

	async function handleCreateVoteForOptionB() {
		// Need to access current poll.voteCount
		// Q: Need profile and/or customProgram? Or, just pass as accounts?
		// A: Eventually will need to increment/update values, but not yet!
		// U: No longer need to do a fetch since we have pollStore
		// let currentPoll = await $workspaceStore.program?.account.poll.fetch(pollPda);
		// poll = currentPoll as anchor.IdlTypes<anchor.Idl>['Poll'];
		// pollStore.set(poll);

		const voteCount: string = ($pollStore.poll?.voteCount.toNumber() + 1).toString();

		const [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
			[
				anchor.utils.bytes.utf8.encode(constants.VOTE_SEED_PREFIX),
				$pollStore.pda?.toBuffer() as Buffer, // Q: Can get I PDA from pollStore? A: Yes!
				($walletStore.publicKey as anchor.web3.PublicKey).toBuffer()
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);
		// Q: Update global state for vote?
		// A: No! Wait until tx is successful

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			pda.toBase58()
		);

		// Following this example to call the methods:
		// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
		const tx = await $workspaceStore.program?.methods
			.createVote({ b: {} })
			.accounts({
				vote: pda,
				poll: $pollStore.pda as anchor.web3.PublicKey,
				profile: $profileStore.pda as anchor.web3.PublicKey,
				customProgram: $customProgramStore.pda as anchor.web3.PublicKey,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// .signers([testUser2]) // AnchorWallet
			.rpc();
		console.log('TxHash ::', tx);
		notificationStore.add({
			type: 'success',
			message: 'Vote submitted!',
			txid: tx
		});

		// Fetch data after tx confirms & update global state
		const currentVote = (await $workspaceStore.program?.account.vote.fetch(pda)) as VoteObject;
		// Q: Need a voteStore? Don't think so since I have pollStore...
		// A: Yes. I've created a votesStore (writable) and pollVotesStore (derived)
		// NOTE I could've added a 'votes' property to pollStore and may revert if needed
		votesStore.addVote(currentVote);

		const currentPoll = (await $workspaceStore.program?.account.poll.fetch(
			$pollStore.pda as anchor.web3.PublicKey
		)) as PollObject;
		// Q: By setting pollStore will pollsStore update automatically?
		// A: No. I don't believe pollsStore updates when a new vote occurs using pollStore.set()
		// Q: Should I use pollStore.update()?
		// A: Doesn't seem to help.
		// Doing two commands seems error prone. Wonder if pollStore.update() could do the trick?
		console.log('BEFORE setting pollStore. pollsStore update?'); // U: Logs but voteCount inside pollsStore doesn't update
		// pollStore.set({ poll: currentPoll, pda: $pollStore.pda }); // pollsStore DOESN'T update
		// pollStore.update((self) => {
		//   self.poll = currentPoll;
		//   self.pda = $pollStore.pda;
		//   return self;
		// }); // pollsStore DOESN'T update
		// Q: Need to first pollStore.set() then pollsStore.updatePoll()?
		// A: Yes, looks like I need to also update pollsStore or it can't see
		// individual Poll updates.
		pollStore.set({ poll: currentPoll, pda: $pollStore.pda });
		pollsStore.updatePoll($pollStore.pda as anchor.web3.PublicKey, currentPoll);
		console.log('AFTER setting pollStore. pollsStore update?');

		const currentProfile = (await $workspaceStore.program?.account.profile.fetch(
			$profileStore.pda as anchor.web3.PublicKey
		)) as ProfileObject;
		profileStore.set({ profile: currentProfile, pda: $profileStore.pda as anchor.web3.PublicKey });

		const currentCustomProgram = (await $workspaceStore.program?.account.customProgram.fetch(
			$customProgramStore.pda as anchor.web3.PublicKey
		)) as CustomProgramObject;
		// Q: update() or set() Store?
		// U: Going with set() for now unless I learn otherwise
		// Kinda need to replace the original data
		customProgramStore.set({
			customProgram: currentCustomProgram,
			pda: $customProgramStore.pda as anchor.web3.PublicKey
		});
	}
</script>

<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		{#if $pollStore}
			<div class="stats shadow">
				<div class="stat place-items-center">
					<div class="stat-title">{$pollStore.poll?.optionADisplayLabel}</div>
					<div class="stat-value">{$pollStore.poll?.optionACount}</div>
					{#if !profileHasVoted}
						<Button disabled={!$walletStore.publicKey} on:click={handleCreateVoteForOptionA}
							>Vote</Button
						>
					{/if}
				</div>
				<div class="stat place-items-center border-none">
					<div class="stat-title">{$pollStore.poll?.optionBDisplayLabel}</div>
					<div class="stat-value">{$pollStore.poll?.optionBCount}</div>
					{#if !profileHasVoted}
						<Button disabled={!$walletStore.publicKey} on:click={handleCreateVoteForOptionB}
							>Vote</Button
						>
					{/if}
				</div>
			</div>
			<div class="flex items-center justify-center">
				<a role="button" class="btn " href="/polls">Back</a>
			</div>
			{#if $pollVotesStore.length > 0}
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th />
								<th>Wallet</th>
								<th>Selection</th>
							</tr>
						</thead>
						{#each $pollVotesStore as vote (vote.voteNumber)}
							<!-- head -->
							<tbody>
								<!-- row 1 -->
								<tr>
									<th>{vote.voteNumber}</th>
									<td>{vote.authority}</td>
									<td
										>{Object.keys(vote.voteOption)[0] === 'a'
											? $pollStore.poll?.optionADisplayLabel
											: $pollStore.poll?.optionBDisplayLabel}</td
									>
								</tr>
							</tbody>
						{/each}
					</table>
				</div>
				<!-- <Button disabled={!$walletStore.publicKey} on:click={() => profileHasVoted($pollVotesStore)}>Profile voted?</Button> -->
				<h4 class="bg-secondary text-accent">Profile has voted: {profileHasVoted}</h4>
			{/if}
		{/if}
	</div>
</div>
<pre>{JSON.stringify($profileStore, null, 2)}</pre>
<pre>{JSON.stringify($pollStore, null, 2)}</pre>
