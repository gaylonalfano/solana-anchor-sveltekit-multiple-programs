<script context="module">
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

	// import type anchor from '@project-serum/anchor';

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

	// Q: Can I create some custom Types that align with IDL?
	// A: Believe so! Check out PollObject type definition
	let poll = $pollsStore.find((p) => {
		// console.log(p.pollNumber); // BN {....}
		// console.log(typeof p.pollNumber); // object
		// console.log(typeof p.pollNumber.words[0]); // number
		// console.log(typeof pollNumberFromLoad); // string
		// return p.pollNumber.words[0] === parseInt(pollNumberFromLoad);
		return p.pollNumber.words[0] === parseInt($page.params.pollNumber);
	}) as PollObject; // NOTE MUST cast for Types!

	// Update pollStore
	pollStore.set(poll);

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

	$: {
		console.log('FROM [pollNumber].svelte ======');
		console.log('$pollsStore: ', $pollsStore);
		console.log('$pollStore: ', $pollStore);
		console.log('poll: ', poll);
	}
</script>

<h3>poll:</h3>
<pre>{JSON.stringify(poll, null, 2)}</pre>
