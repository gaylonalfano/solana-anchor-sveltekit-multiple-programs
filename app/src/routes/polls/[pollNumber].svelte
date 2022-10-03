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
	import type { PollObject } from '../../models/polls-types';
	import { page } from '$app/stores';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl, PublicKey } from '@solana/web3.js';
	import idl from '../../../../target/idl/onchain_voting_multiple_polls.json';
	import { onMount } from 'svelte';
	import { notificationStore } from '$stores/notification';
	import { customProgramStore } from '$stores/polls/custom-program-store';
	import { profileStore } from '$stores/polls/profile-store';
	import { pollStore } from '$stores/polls/poll-store';
	import { pollsStore } from '$stores/polls/polls-store';
	import { Button } from '$lib/index';

	const network = 'http://localhost:8899';

	// export let pollNumberFromLoad: string;

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

	onMount(() => {
		// Q: Can I create some custom Types that align with IDL?
		// A: Believe so! Check out PollObject type definition
		let poll = $pollsStore.find((p) => {
			return p.pollNumber.words[0] === parseInt($page.params.pollNumber);
		}) as PollObject; // NOTE MUST cast for Types!

		// Update pollStore
		pollStore.set(poll);
	});

	// // Q: Refactor with params?
	// // e.g., pollPubkey, voteOption?
	// // TODO Gonna have to grab the Profile and selected Poll once we start
	// // adding multiple polls, etc. May need to use route params or something
	// // U: Yep, added a subroute [pollNumber] and using 'page' Store for params
	// // TODO Could consider making a Poll component
	// async function handleCreateVoteForOptionA() {
	// 	// Need to access current poll.voteCount
	// 	// Q: Need profile and/or customProgram? Or, just pass as accounts?
	// 	// A: Eventually will need to increment/update values, but not yet!
	// 	let currentPoll = await $workspaceStore.program?.account.poll.fetch(pollPda);
	// 	poll = currentPoll as anchor.IdlTypes<anchor.Idl>['Poll'];
	// 	pollStore.set(poll);
	// 	const voteCount: string = ($pollStore.voteCount.toNumber() + 1).toString();
	// 	console.log('voteCount: ', voteCount);

	// 	const [pda, bump] = await PublicKey.findProgramAddress(
	// 		[
	// 			anchor.utils.bytes.utf8.encode(VOTE_SEED_PREFIX),
	// 			pollPda.toBuffer(), // Q: Can get I PDA from pollStore?
	// 			($walletStore.publicKey as anchor.web3.PublicKey).toBuffer()
	// 		],
	// 		$workspaceStore.program?.programId as anchor.web3.PublicKey
	// 	);
	// 	// Update global state for vote?

	// 	console.log(
	// 		'PDA for program',
	// 		$workspaceStore.program?.programId.toBase58(),
	// 		'is generated :',
	// 		pda.toBase58()
	// 	);

	// 	// Following this example to call the methods:
	// 	// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
	// 	const tx = await $workspaceStore.program?.methods
	// 		.createVote({ a: {} })
	// 		.accounts({
	// 			vote: pda,
	// 			poll: pollPda,
	// 			profile: profilePda,
	// 			customProgram: customProgramPda,
	// 			authority: $walletStore.publicKey as anchor.web3.PublicKey,
	// 			systemProgram: anchor.web3.SystemProgram.programId
	// 		})
	// 		// .signers([testUser2]) // AnchorWallet
	// 		.rpc();
	// 	console.log('TxHash ::', tx);

	// 	// Fetch data after tx confirms & update global state
	// 	const currentVote = await $workspaceStore.program?.account.vote.fetch(pda);
	// 	vote = currentVote as anchor.IdlTypes<anchor.Idl>['Vote'];
	// 	// Q: Need a voteStore? Eh....

	// 	currentPoll = await $workspaceStore.program?.account.poll.fetch(pollPda);
	// 	poll = currentPoll as anchor.IdlTypes<anchor.Idl>['Poll'];
	// 	pollStore.set(poll);

	// 	const currentProfile = await $workspaceStore.program?.account.profile.fetch(profilePda);
	// 	profile = currentProfile as anchor.IdlTypes<anchor.Idl>['Profile'];
	// 	profileStore.set(profile);

	// 	const currentCustomProgram = await $workspaceStore.program?.account.customProgram.fetch(
	// 		customProgramPda
	// 	);
	// 	customProgram = currentCustomProgram as anchor.IdlTypes<anchor.Idl>['CustomProgram'];
	// 	// Q: update() or set() Store?
	// 	customProgramStore.set(customProgram);
	// }

	// async function handleCreateVoteForOptionB() {
	// 	// Need to access current poll.voteCount
	// 	// Q: Need profile and/or customProgram? Or, just pass as accounts?
	// 	// A: Eventually will need to increment/update values, but not yet!
	// 	let currentPoll = await $workspaceStore.program?.account.poll.fetch(pollPda);
	// 	poll = currentPoll as anchor.IdlTypes<anchor.Idl>['Poll'];
	// 	pollStore.set(poll);
	// 	const voteCount: string = ($pollStore.voteCount.toNumber() + 1).toString();
	// 	console.log('voteCount: ', voteCount);

	// 	const [pda, bump] = await PublicKey.findProgramAddress(
	// 		[
	// 			anchor.utils.bytes.utf8.encode(VOTE_SEED_PREFIX),
	// 			pollPda.toBuffer(), // Q: Can get I PDA from pollStore?
	// 			($walletStore.publicKey as anchor.web3.PublicKey).toBuffer()
	// 		],
	// 		$workspaceStore.program?.programId as anchor.web3.PublicKey
	// 	);
	// 	// Update global state for vote?

	// 	console.log(
	// 		'PDA for program',
	// 		$workspaceStore.program?.programId.toBase58(),
	// 		'is generated :',
	// 		pda.toBase58()
	// 	);

	// 	// Following this example to call the methods:
	// 	// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
	// 	const tx = await $workspaceStore.program?.methods
	// 		.createVote({ b: {} })
	// 		.accounts({
	// 			vote: pda,
	// 			poll: pollPda,
	// 			profile: profilePda,
	// 			customProgram: customProgramPda,
	// 			authority: $walletStore.publicKey as anchor.web3.PublicKey,
	// 			systemProgram: anchor.web3.SystemProgram.programId
	// 		})
	// 		// .signers([testUser2]) // AnchorWallet
	// 		.rpc();
	// 	console.log('TxHash ::', tx);

	// 	// Fetch data after tx confirms & update global state
	// 	const currentVote = await $workspaceStore.program?.account.vote.fetch(pda);
	// 	vote = currentVote as anchor.IdlTypes<anchor.Idl>['Vote'];
	// 	// Q: Need a voteStore? Don't think so since I have pollStore...

	// 	currentPoll = await $workspaceStore.program?.account.poll.fetch(pollPda);
	// 	poll = currentPoll as anchor.IdlTypes<anchor.Idl>['Poll'];
	// 	pollStore.set(poll);

	// 	const currentProfile = await $workspaceStore.program?.account.profile.fetch(profilePda);
	// 	profile = currentProfile as anchor.IdlTypes<anchor.Idl>['Profile'];
	// 	profileStore.set(profile);

	// 	const currentCustomProgram = await $workspaceStore.program?.account.customProgram.fetch(
	// 		customProgramPda
	// 	);
	// 	customProgram = currentCustomProgram as anchor.IdlTypes<anchor.Idl>['CustomProgram'];
	// 	// Q: update() or set() Store?
	// 	customProgramStore.set(customProgram);
	// }

	// // Q: Can I use this to update/fetch my Stores?
	// async function derivePda(seeds: Buffer[]) {
	// 	// NOTE This is key! We can derive PDA WITHOUT hitting our program!
	// 	// Then we can use this PDA address in our functions as a check to see
	// 	// whether there is a ledger account at this PDA address.
	// 	// Then, MOST IMPORTANTLY, we can fetch the account's data from the CLIENT
	// 	// and use its data.
	// 	// NOTE pubkey is actually provider.wallet.publicKey
	// 	let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
	// 		seeds,
	// 		$workspaceStore.program?.programId as anchor.web3.PublicKey
	// 	);

	// 	return pda;
	// }

	$: {
		console.log('$pollsStore: ', $pollsStore);
		console.log('$pollStore: ', $pollStore);
	}

	// <AnchorConnectionProvider {idl} {network} />
	// <div class="stats shadow">
	// 	<div class="stat place-items-center">
	// 		<div class="stat-title">{poll.optionADisplayLabel}</div>
	// 		<div class="stat-value">{poll.optionACount.words[0]}</div>
	// 		<Button disabled={!$walletStore.publicKey} on:click={handleCreateVoteForOptionA}
	// 			>{$pollStore.optionADisplayLabel}</Button
	// 		>
	// 	</div>
	// 	<div class="stat place-items-center">
	// 		<div class="stat-title">{poll.optionBDisplayLabel}</div>
	// 		<div class="stat-value">{poll.optionBCount.words[0]}</div>
	// 		<Button disabled={!$walletStore.publicKey} on:click={handleCreateVoteForOptionB}
	// 			>{$pollStore.optionBDisplayLabel}</Button
	// 		>
	// 	</div>
	// </div>
</script>

<pre>{JSON.stringify($pollStore, null, 2)}</pre>
