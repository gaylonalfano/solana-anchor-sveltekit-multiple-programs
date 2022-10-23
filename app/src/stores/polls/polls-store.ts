import { writable, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { PollObject } from '../../models/polls-types';
import type { PollStoreObject } from './poll-store'
import type { GetProgramAccountsFilter } from '@solana/web3.js';
import { POLL_ACCOUNT_SPACE } from '../../helpers/polls/constants';


// Q: Do I need a custom type for this store (e.g. PollsStore)? 
// Seems like would be better to just reuse the PollStore (single) type we created in poll-store.ts
// U: Nope, going with just importing the PollStore type
function createPollsStore() {
  const { subscribe, set, update } = writable<PollStoreObject[]>([]);

  return {
    subscribe,
    set,
    update,
    getPollAccounts: async (programId: anchor.web3.PublicKey, connection: anchor.web3.Connection) => {
      // Create the filter
      // NOTE Can't filter on PDA, but could consider pollNumber perhaps
      const pollsFilter: GetProgramAccountsFilter[] = [
        {
          dataSize: POLL_ACCOUNT_SPACE
        }
      ];

      // Use gPA() + filter to get Poll data
      const pollAccountsEncoded = await connection.getProgramAccounts(
        programId,
        { filters: pollsFilter }
      );
      console.log('pollAccountsEncoded: ', pollAccountsEncoded);

      // Only update Store if gPA() is successful fetching data
      if (pollAccountsEncoded) {
        // Data fetch worked so time to reset, decode, and then update
        pollsStore.reset();

        // Decode data buffer
        pollAccountsEncoded.forEach((value) => {
          // Manually decode account data using coder
          // Q: Can we access workspaceStore? Was undefined on refresh...
          // U: Think so in some cases with get()...
          // A: Yes! Working with get()
          const decodedAccountInfo = get(workspaceStore).program!.coder.accounts.decode(
            'Poll',
            value.account.data
          ) as PollObject;

          // Q: Can this actually work? Is there a 'this' to use?
          // Don't think I'll be able to use it like this since won't be defined...
          // A: WORKS! Neat! Need to reset() first though or will add dups
          pollsStore.addPoll(decodedAccountInfo, value.pubkey);
        });
      }
    },
    // Q: Which addPoll method is better/accurate?
    // Leaning toward passing poll and pda as separate args
    addPoll: async (poll: PollObject, pda: anchor.web3.PublicKey) => {
      // Won't have the PDA but can still add IDL ["Poll"] object
      update((self: PollStoreObject[]) => {
        return [
          ...self,
          {
            poll,
            pda,
            // TODO Add 'votes'
          }
        ]
      });
    },
    addPollStore: async (pollStore: PollStoreObject) => {
      update((self: PollStoreObject[]) => {
        return [...self, pollStore]
      });
    },
    updatePoll: async (pda: anchor.web3.PublicKey, poll: PollObject) => {
      update((self: PollStoreObject[]) => {
        console.log('Updating poll in pollsStore...');
        console.log(self)
        // NOTE Must compare PublicKeys as strings!
        const pollToUpdate: PollStoreObject | undefined = self.find(p => p.pda?.toBase58() === pda.toBase58());
        console.log('pollToUpdate: ', pollToUpdate);
        if (pollToUpdate) {
          console.log('Poll found. Making updates.');
          pollToUpdate.poll = poll;
          return self;
        } else {
          console.log('Poll not found in store. No updates made.');
          return self;
        }
      })
    },
    deletePoll: (pda: anchor.web3.PublicKey) => {
      update((self: PollStoreObject[]) => {
        return self.filter((pollStore: PollStoreObject) => pollStore.pda !== pda);
      })
    },
    reset: () => set([])
  }
}

export const pollsStore = createPollsStore();


// ===== FAILED experiment =====
// // WITH custom type
// // type PollsStore = {
// //   polls: PollStore[] | null;
// // }
// // 
// // U: Quitting this attempt. Getting too many TS errors...
// function createPollsStore() {
//   const { subscribe, set, update } = writable<PollsStore>();
//   
//   return {
//     subscribe,
//     set,
//     update,
//     // Q: Which addPoll method is better/accurate?
//     // Leaning toward passing poll and pda as separate args
//     addPoll: async (poll: PollObject, pda: anchor.web3.PublicKey) => {
//       update((pollsStore: PollsStore) => {
//         return [...pollsStore.polls, { poll, pda }]
//         // ERRORS......
//         // return [
//         //   ...pollsStore.polls,
//         //   {
//         //     poll,
//         //     pda
//         //   }
//         // ] 
//       });
//     },
//     addPollStore: async (pollStore: PollStore) => {
//       update((pollsStore: PollStore[]) => {
//         return [...pollsStore, pollStore]
//       });
//     },
//     deletePoll: (pda: anchor.web3.PublicKey) => {
//       update((pollsStore: PollStore[]) => {
//         return pollsStore.filter((pollStore: PollStore) => pollStore.pda !== pda);
//       })
//     },
//     reset: () => set([])
//   }
// }

// export const pollsStore: Writable<anchor.IdlTypes<anchor.Idl>['Poll'][]> = writable([]);

