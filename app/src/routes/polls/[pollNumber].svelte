<script context="module">
	export async function load({ params }) {
		const pollNumberFromLoad = params.pollNumber;

		return { props: { pollNumberFromLoad } };
	}
</script>

<script lang="ts">
	import { pollsStore } from '$stores/polls/polls-store';
	import { pollStore } from '$stores/polls/poll-store';

	export let pollNumberFromLoad: string;

	// Q: How to match up types between pollNumber (BN) and pollNumberFromLoad?
	// A: It's a Type mismatch! The IDL Poll.pollNumber.words[0] is 'number'!
	// let poll = $pollsStore.find((p) => p.pollNumber.toBase58() === pollNumberFromLoad); // ERROR
	// let poll = $pollsStore.find((p) => p.pollNumber.toNumber() === pollNumberFromLoad); // ERROR
	let poll = $pollsStore.find((p) => {
		console.log(p.pollNumber); // BN {....}
		console.log(typeof p.pollNumber); // object
		console.log(typeof p.pollNumber.words[0]); // number
		console.log(typeof pollNumberFromLoad); // string
		return p.pollNumber.words[0] === parseInt(pollNumberFromLoad);
	});

	$: {
		console.log('FROM [pollNumber].svelte ======');
		console.log('$pollsStore: ', $pollsStore);
		console.log('$pollStore: ', $pollStore);
		console.log('poll: ', poll);
	}
</script>

<h1>pollNumberFromLoad: {pollNumberFromLoad}</h1>
<h3>poll:</h3>
<pre>{JSON.stringify(poll, null, 2)}</pre>
