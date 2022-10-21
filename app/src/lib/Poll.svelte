<script lang="ts">
  import { goto } from '$app/navigation';
  import { pollStore } from '$stores/polls/poll-store';
  import { PublicKey } from '@solana/web3.js';
  import type { PollObject } from '../models/polls-types';

  // FIXME
  // Q: Do I need to have all variables come in?
  // U: When iterate over $pollsStore, I get the following typeof (below).
  // So, I can't seem to simply {...poll} the Poll Object. I may
  // need to do some sort of type transformation beforehand.
  // A: It's flexible! You can descructure the vars or whatever.
	// export let authority: string, // object
 //    pollNumber: number, // object
	// 	isActive: boolean, // boolean
	// 	optionADisplayLabel: string, // string
 //    optionBDisplayLabel: string, // string
 //    optionACount: number, // object
 //    optionBCount: number, // object
 //    voteCount: number, // object
 //    bump: number; // number

  // U: You can pass the Store as a prop
  // REF: https://stackoverflow.com/a/59352781
  // REF: https://svelte.dev/repl/05a7c00c0d574e9a89533c6f0ef9833e?version=3.16.4
  export let poll;
  export let pda: string;
  // Now create local vars from deconstructing the passed Store
  // NOTE The idea behind this is that you don't 'import' the Store.
  // When you import, then Store is like a singleton and you need to
  // determine WHERE to import i.e., WHICH components own the store vs.
  // simply consuming its data?
  let {
    authority,
    pollNumber,
    isActive,
    optionADisplayLabel,
    optionBDisplayLabel,
    optionACount,
    optionBCount,
    voteCount,
    bump
  } = poll;

  // Reset the types for Store structure
  let currentPoll = poll as PollObject;
  let currentPollPda = new PublicKey(pda);

  // Q: How to persist Store state? Should I immediately set() pollStore
  // inside this with these props?
  // U: Trying this approach using goto() since I want to use the dynamic
  // routing (/[pda]), but would like to set the pollStore. Had to change
  // <a> links to <button on:click> using this handler.
  async function navigateAndSetPollStore() {
    await goto(`polls/${pda}`);
    // Now go something with the data/db, etc. (e.g., set Store values):
    pollStore.set({ poll: currentPoll, pda: currentPollPda });
  }


</script>

<div class="card w-96 bg-neutral text-neutral-content">
  <div class="card-body items-center text-center">
    <!-- <a class="link link-secondary" href="polls/{pda}"> -->
    <!--   <h2 class="card-title">{optionADisplayLabel} vs. {optionBDisplayLabel}</h2> -->
    <!-- </a> -->
    <button class="link link-secondary" href="polls/{pda}" on:click={navigateAndSetPollStore}>
      <h2 class="card-title">{optionADisplayLabel} vs. {optionBDisplayLabel}</h2>
    </button>
    <p>Votooooor #:{pollNumber} has {voteCount} total votes!</p>
    <p>Address {pda}</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">{optionADisplayLabel}</button>
      <button class="btn btn-ghost">{optionBDisplayLabel}</button>
    </div>
  </div>
</div>
