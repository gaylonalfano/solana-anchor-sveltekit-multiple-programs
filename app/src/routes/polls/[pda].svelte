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
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl, PublicKey } from '@solana/web3.js';
	import idl from '../../../../target/idl/onchain_voting_multiple_polls.json';
	import { onMount, beforeUpdate, afterUpdate, tick } from 'svelte';
  import { get } from 'svelte/store';
	import { notificationStore } from '$stores/notification';
	import { customProgramStore } from '$stores/polls/custom-program-store';
	import { profileStore } from '$stores/polls/profile-store';
	import { pollStore, type PollStore } from '$stores/polls/poll-store';
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
	import { each } from 'svelte/internal';

	const network = constants.NETWORK;

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

	$: {
  //   console.log('$workspaceStore: ', $workspaceStore);
  //   console.log('$profileStore: ', $profileStore);
		// console.log('$pollsStore: ', $pollsStore);
    // console.log('$pollsStore.length: ', $pollsStore.length);
		// console.log('$pollStore: ', $pollStore);
    console.log('pollVotesStore: ', $pollVotesStore);
    console.log('hasWalletReadyForFetch: ', hasWalletReadyForFetch);
    console.log('hasPollStoreValues: ', hasPollStoreValues);
    console.log('hasPollsStoreValues: ', hasPollsStoreValues);
	}


  // Create some variables to react to Stores state
  $: hasWalletReadyForFetch = $walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting
  $: hasPollStoreValues = $pollStore.pda !== null && $pollStore.poll !== null;
  $: hasPollsStoreValues = $pollsStore.length > 0;

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
  $: tick().then(() => {
    if(hasWalletReadyForFetch) {
      // Attempt to get stores (if exists)
      get(pollStore);
      console.log('$pollStore from TICK: ', $pollStore)
      console.log($pollStore.pda === null); // true
      console.log($pollStore.poll === null); // true
      get(pollsStore);
      console.log('$pollsStore from TICK: ', $pollsStore)
    }

    // console.log(typeof $pollStore); // object
    // console.log($pollStore == undefined); // false
    // console.log($pollStore === undefined); // false
    if(hasWalletReadyForFetch && !hasPollStoreValues) {
      console.log('$pollStore values are null. Refetching...')
      // Refetch pollStore
      pollStore.getPollAccount(
        $workspaceStore.program?.programId as anchor.web3.PublicKey,
        new PublicKey($page.params.pda),
        $workspaceStore.connection
      )
    }

    // TODO Consider the case when pollsStore is available (but not pollStore)

  }) // WORKS on refresh! async/await not needed it seems...

  beforeUpdate(() => console.log('Component BEFORE UPDATE.'));
	afterUpdate(() => console.log('Component AFTER UPDATE.\n =================='));


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

		const [pda, bump] = await PublicKey.findProgramAddress(
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

    // TODO Consider adding try/catch around transaction to add notifications
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

		// Fetch data after tx confirms & update global state
		const currentVote = (await $workspaceStore.program?.account.vote.fetch(pda)) as VoteObject;
		// Q: Need a voteStore? Eh....

		const currentPoll = (await $workspaceStore.program?.account.poll.fetch(
			$pollStore.pda as anchor.web3.PublicKey
		)) as PollObject;
		pollStore.set({ poll: currentPoll, pda: $pollStore.pda });

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

		const [pda, bump] = await PublicKey.findProgramAddress(
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

		// Fetch data after tx confirms & update global state
		const currentVote = (await $workspaceStore.program?.account.vote.fetch(pda)) as VoteObject;
		// Q: Need a voteStore? Don't think so since I have pollStore...

		const currentPoll = (await $workspaceStore.program?.account.poll.fetch(
			$pollStore.pda as anchor.web3.PublicKey
		)) as PollObject;
		pollStore.set({ poll: currentPoll, pda: $pollStore.pda as anchor.web3.PublicKey });

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

<AnchorConnectionProvider {idl} {network} />
{#if $pollStore}
  <div class="stats shadow">
    <div class="stat place-items-center">
      <div class="stat-title">{$pollStore.poll?.optionADisplayLabel}</div>
      <div class="stat-value">{$pollStore.poll?.optionACount}</div>
      <Button disabled={!$walletStore.publicKey} on:click={handleCreateVoteForOptionA}
        >{$pollStore.poll?.optionADisplayLabel}</Button
      >
    </div>
    <div class="stat place-items-center">
      <div class="stat-title">{$pollStore.poll?.optionBDisplayLabel}</div>
      <div class="stat-value">{$pollStore.poll?.optionBCount}</div>
      <Button disabled={!$walletStore.publicKey} on:click={handleCreateVoteForOptionB}
        >{$pollStore.poll?.optionBDisplayLabel}</Button
      >
    </div>
  </div>
  <pre>{JSON.stringify($pollStore, null, 2)}</pre>
  {#if $votesStore}
    {#each $votesStore as vote (vote.voteNumber)}
      <h5>wallet: {vote.authority}</h5>
      <p>number: {vote.voteNumber}</p>
      <p>selection: {vote.voteOption}</p>
    {/each}

  {/if}
{/if}
