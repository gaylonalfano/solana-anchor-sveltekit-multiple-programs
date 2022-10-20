import { writable, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { PollObject } from '../../models/polls-types';
import { POLL_SEED_PREFIX, POLL_ACCOUNT_SPACE } from '../../helpers/polls/constants';
import { PublicKey, type GetProgramAccountsFilter } from '@solana/web3.js';
import { pollsStore } from './polls-store';

// NOTE This store doesn't have access to the workspaceStore in its fullest
// with the correct Program and IDL, etc. Therefore, can't easily
// rely on the handy functionality for fetching and decoding...
// Q: Should I rebuild the Anchor Program here? Seems redundant...
// U: Not going to (for now), but here's how you could start:
// REF: https://coral-xyz.github.io/anchor/ts/classes/Program.html
// new Program<IDL>(idl: IDL, programId: Address, provider?: Provider, coder?: Coder<string, string>): Program<IDL>
// new AnchorProvider(connection: Connection, wallet: Wallet, opts: ConfirmOptions): AnchorProvider

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
    getPollWithWorkspace: async (profilePda?: anchor.web3.PublicKey) => {
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
    getPollAccount: async (
      programId: anchor.web3.PublicKey, 
      pollPda: anchor.web3.PublicKey,
      connection: anchor.web3.Connection, 
    ) => {
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

      // Find the matching pda and ONLY decode the match
      // const pollAccountEncoded = pollAccountsEncoded.find(value => value.pubkey === pollPda); // E: undefined
      const pollAccountEncoded = pollAccountsEncoded.find((value) => value.pubkey.toBase58() === pollPda.toBase58()); // WORKS! 
      console.log('pollAccountEncoded: ', pollAccountEncoded);
      const decodedAccountInfo = get(workspaceStore).program?.coder.accounts.decode(
        'Poll',
        pollAccountEncoded?.account.data as Buffer
      )


      pollStore.set({ poll: decodedAccountInfo, pda: pollAccountEncoded?.pubkey } as PollStore);

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

