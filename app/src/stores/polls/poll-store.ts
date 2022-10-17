import { writable, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { PollObject } from '../../models/polls-types';
import { POLL_SEED_PREFIX } from '../../helpers/polls/constants';
import { PublicKey } from '@solana/web3.js';


export type PollStore = {
  poll: PollObject | null,
  pda: anchor.web3.PublicKey | null,
}

function createPollStore() {
  const { subscribe, set, update } = writable<PollStore>({ poll: null, pda: null });

  return {
    subscribe,
    set,
    update,
    getPollAccount: async (profilePda?: anchor.web3.PublicKey) => {
      let pda = profilePda ? profilePda : null;
      if (!pda) {
        // Need to find the PDA
        try {
          let [tempPda, _] = await PublicKey.findProgramAddress(
            [
              Buffer.from(POLL_SEED_PREFIX),
              get(walletStore).publicKey?.toBuffer() as Buffer,
            ],
            get(workspaceStore).program?.programId as anchor.web3.PublicKey
          )

          pda = tempPda;
        } catch (e) {
          console.log(`error getting PDA: `, e);
        }
      }

      try {
        let poll = await get(workspaceStore).program?.account.program.fetch(pda as anchor.web3.PublicKey) as PollObject;

        set({ poll, pda })
      } catch (e) {
        console.log(`Error getting account: `, e);
      }
    },
    reset: () => set({ poll: null, pda: null })
  }
}

export const pollStore = createPollStore();







// REF: =================
// NOTE Here's a helper function to create a custom Store
// function createTodosStore() {
// 	const { subscribe, set, update } = writable<Record<string, any>[]>([]);

// 	return {
// 		subscribe,
// 		addTodo: (task: string) => {
// 			update((items: Record<string, any>[]) => {
// 				return [...items, { task, isCompleted: false, id: Date.now() }];
// 			});
// 		},
// 		deleteTodo: (id: Date) => {
// 			update((items: Record<string, any>[]) => {
// 				return items.filter((item) => item.id !== id);
// 			});
// 		},
// 		toggleCompleted: (id: Date) => {
// 			update((items: Record<string, any>[]) => {
// 				// Find the index of the item
// 				let index = -1;
// 				for (let i = 0; i < items.length; i++) {
// 					if (items[i].id === id) {
// 						index = i;
// 						break;
// 					}
// 				}

// 				if (index !== -1) {
// 					// Item is found
// 					items[index].isCompleted != items[index].isCompleted;
// 				}

// 				return items;
// 			});
// 		},
// 		reset: () => set([])
// 	};
// }

