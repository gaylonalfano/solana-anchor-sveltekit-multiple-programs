import { writable, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import type { PollObject } from '../../models/polls-types';
import type { PollStore } from './poll-store'


// Q: Do I need this? Seems like would be better to just reuse the PollStore (single)
// type we created earler.
// U: Yep, going with just importing the PollStore type
// WITHOUT custom type
function createPollsStore() {
  const { subscribe, set, update } = writable<PollStore[]>([]);
  
  return {
    subscribe,
    set,
    update,
    // Q: Which addPoll method is better/accurate?
    // Leaning toward passing poll and pda as separate args
    addPoll: async (poll: PollObject, pda: anchor.web3.PublicKey) => {
      // Won't have the PDA but can still add IDL ["Poll"] object
      update((pollsStore: PollStore[]) => {
        return [
          ...pollsStore,
          {
            poll,
            pda
          }
        ] 
      });
    },
    addPollStore: async (pollStore: PollStore) => {
      update((pollsStore: PollStore[]) => {
        return [...pollsStore, pollStore]
      });
    },
    updatePoll: async (pda: anchor.web3.PublicKey, poll: PollObject) => {
      update((pollsStore: PollStore[]) => {
        const pollToUpdate: PollStore | undefined = pollsStore.find(p => p.pda === pda);
        if (pollToUpdate) {
          console.log('Poll found. Making updates.');
          pollToUpdate.poll = poll;
          return pollsStore;
        } else {
          console.log('Poll not found in store. No updates made.');
          return pollsStore;
        }
      })
    },
    deletePoll: (pda: anchor.web3.PublicKey) => {
      update((pollsStore: PollStore[]) => {
        return pollsStore.filter((pollStore: PollStore) => pollStore.pda !== pda);
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

