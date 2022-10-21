import { derived, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import { pollStore } from './poll-store';
import { votesStore } from './votes-store';
import type { PollStore, PollObject, VoteObject } from '../../models/polls-types';
// import { VOTE_ACCOUNT_SPACE } from '../../helpers/polls/constants';

export const pollVotesStore = derived<
  [Writable<PollStore>, Writable<VoteObject[]>], VoteObject[]
>(
  [pollStore, votesStore],
  ([$pollStore, $votesStore]) => {
    // Return all the votes that match the Poll PDA
    // NOTE Must convert PublicKeys to strings to compare!
    return $votesStore.filter((v) => v.pollPubkey.toBase58() === $pollStore.pda?.toBase58());
  }
)


// TODO Add pollVotesStore to the markup inside [pda].svelte
// TODO Confirm why/how to loop through $votesStore... voteNumber
// isn't unique enough...

