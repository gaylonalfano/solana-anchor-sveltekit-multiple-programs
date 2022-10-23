import { writable, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { PollObject, VoteObject } from '../../models/polls-types';
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

// Q: Thinking of adding votes property to this Store to track votes
// Or, do I create a separate votesStore? When I have to do a fresh gPA()
// fetch + filters + decode, I'll have to seperate anyway due to different
// accounts. Hmmm... leaning toward separating them and then perhaps adding
// a derived([pollStore, votesStore]) setup. Need to experiment, but I think
// adding a 'votes' property could also work, but perhaps a bit harder.
// U: Trying votes-store.ts and poll-votes-store.ts first...
// U: Derived pollVotesStore is okay but encounters issues when disconnecting
// or on page refreshes. Going to add the 'votes' property to poll-store and test
// A: Eh, adding 'votes' directly as prop is also complicated. Thinking of going
// back to the derived store pollVotesStore instead and just refetch votesStore
// if necessary to update pollVotesStore

export type PollStoreObject = {
  poll: PollObject | null,
  pda: anchor.web3.PublicKey | null,
  // votes: VoteObject[],
}

function createPollStore() {
  const { subscribe, set, update } = writable<PollStoreObject>({ poll: null, pda: null });

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
      // console.log('pollAccountEncoded: ', pollAccountEncoded);
      const decodedAccountInfo = get(workspaceStore).program?.coder.accounts.decode(
        'Poll',
        pollAccountEncoded?.account.data as Buffer
      )

      pollStore.set({ poll: decodedAccountInfo, pda: pollAccountEncoded?.pubkey } as PollStoreObject);
    },
    // U: Attempted adding 'votes' as a property to pollStore. Gets a little complicated,
    // since I am dealing with two different account types. Thinking the derived store
    // approach (pollVotesStore) may be easier...
    // getPollVoteAccounts: async (
    //   pollPda: anchor.web3.PublicKey,
    //   programId: anchor.web3.PublicKey,
    //   connection: anchor.web3.Connection
    // ) => {
    //     // Q: Should I try getting from votesStore if available? Or would it be stale?
    //     const votesByPollFilter: GetProgramAccountsFilter[] = [
    //       {
    //         dataSize: VOTE_ACCOUNT_SPACE
    //       },
    //       {
    //         memcmp: {
    //           // NOTE Matching on pollPubkey.toBase58()
    //           // 8 + authority(32) + profile(32) + poll(32)
    //           offset: 72,
    //           bytes: pollPda.toBase58()
    //         }
    //       }
    //     ];

    //     // Use gPA() + filter
    //     const voteAccountsEncoded = await connection.getProgramAccounts(
    //       programId,
    //       { filters: votesByPollFilter }
    //     );
    //     console.log('voteAccountsEncoded: ', voteAccountsEncoded);

    //     // Only update Store if gPA() is successful
    //     if(voteAccountsEncoded) {
    //       // Loop through encoded values, decode account data, addVote()
    //       // Q: Create a custom addVote() or simply set(votes)?
    //       // Think a custom addVote() may be the way so it can update() instead of set()
    //       voteAccountsEncoded.forEach((value) => {
    //         const decodedAccountInfo = get(workspaceStore).program?.coder.accounts.decode(
    //           'Vote',
    //           value.account.data as Buffer
    //         );
    //         
    //         // Add to 'votes' property
    //         pollStore.addVote(decodedAccountInfo);
    //       });
    //     }
    // },
    // addVote: async (vote: VoteObject) => {
    //   update((self: PollStoreObject) => {
    //     return {
    //       poll: self.poll,
    //       pda: self.pda,
    //       votes: [
    //         ...self.votes,
    //         vote
    //       ]
    //     }

    //   });
    // },
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

