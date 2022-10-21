import { writable, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { VoteObject } from '../../models/polls-types';
import type { GetProgramAccountsFilter } from '@solana/web3.js';
import { VOTE_ACCOUNT_SPACE } from '../../helpers/polls/constants';


function createVotesStore() {
  const { subscribe, set, update } = writable<VoteObject[]>([]);

  return {
    subscribe,
    set,
    update,
    getVoteAccounts: async (programId: anchor.web3.PublicKey, connection: anchor.web3.Connection) => {
      // Create the filter
      const votesFilter: GetProgramAccountsFilter[] = [
        {
          dataSize: 115
        },
      ];

      // Use gPA() + filter to get Vote data
      const voteAccountsEncoded = await connection.getProgramAccounts(
        programId,
        { filters: votesFilter }
      );
      console.log('voteAccountsEncoded: ', voteAccountsEncoded);

      // Only update Store if gPA() is successful fetching data
      if (voteAccountsEncoded) {
        // Data fetch worked so time to reset, decode, and then update
        votesStore.reset();

        // Decode data buffer
        voteAccountsEncoded.forEach((value) => {
          // Manually decode account data using coder
          // Q: Can we access workspaceStore? Was undefined on refresh...
          // U: Think so in some cases with get()...
          // A: Yes! Working with get()
          const decodedAccountInfo = get(workspaceStore).program!.coder.accounts.decode(
            'Vote',
            value.account.data
          ) as VoteObject;

          // Q: Can this actually work? Is there a 'this' to use?
          // Don't think I'll be able to use it like this since won't be defined...
          // A: WORKS! Neat! Need to reset() first though or will add dups
          votesStore.addVote(decodedAccountInfo);
        });
      }
    },
    addVote: async (vote: VoteObject) => {
      update((votesStore: VoteObject[]) => {
        return [
          ...votesStore,
          vote
        ]
      });
    },
    reset: () => set([])
  }
}

export const votesStore = createVotesStore();
