import { writable, get } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { ProfileObject } from 'src/models/polls-types';
import { PROFILE_SEED_PREFIX, POLL_ACCOUNT_SPACE, PROFILE_ACCOUNT_SPACE } from '../../helpers/polls/constants';
import { PublicKey, type GetProgramAccountsFilter } from '@solana/web3.js';

// =========== WITH CUSTOM TYPE TO STORE PDA ============
export type ProfileStoreObject = {
  profile: ProfileObject | null,
  pda: anchor.web3.PublicKey | null,
}

function createProfileStore() {
  const { subscribe, set, update } = writable<ProfileStoreObject>({ profile: null, pda: null })

  return {
    subscribe,
    set,
    update,
    getProfileAccount: async (
      authority: anchor.web3.PublicKey,
      programId: anchor.web3.PublicKey, 
      connection: anchor.web3.Connection, 
    ) => {
      // Need to assert that each arg has values
      console.log('authority: ', authority.toBase58());
      console.log('programId: ', programId.toBase58());
      console.log('connection: ', connection);
      
      // Create the filter
      // NOTE Can't filter on PDA, but could consider pollNumber perhaps
      const profilesByAuthorityFilter: GetProgramAccountsFilter[] = [
        {
          dataSize: PROFILE_ACCOUNT_SPACE
        },
        {
          memcmp: {
            offset: 8, // Starting point for 'authority'
            bytes: authority.toBase58()
          }
        }
      ];

      // Use gPA() + filter to get data
      const profileAccountsByAuthorityEncoded = await connection.getProgramAccounts(
        programId,
        { filters: profilesByAuthorityFilter }
      );
      // console.log('profileAccountsByAuthorityEncoded: ', profileAccountsByAuthorityEncoded);

      if(profileAccountsByAuthorityEncoded) {
        // Find the matching pda and ONLY decode the match
        const decodedAccountInfo = get(workspaceStore).program?.coder.accounts.decode(
            'Profile',
            profileAccountsByAuthorityEncoded[0].account.data as Buffer
        );

        profileStore.set({
          profile: decodedAccountInfo, 
          pda: profileAccountsByAuthorityEncoded[0].pubkey 
        });
      }
    },
    getProfileAccountWithWorkspace: async (profilePda?: anchor.web3.PublicKey) => {
      let pda = profilePda ? profilePda : null;
      if (!pda) {
        // Need to find the PDA
        try {
          let [tempPda, _] = await PublicKey.findProgramAddress(
            [
              Buffer.from(PROFILE_SEED_PREFIX),
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
        let profile = await get(workspaceStore).program?.account.profile.fetch(pda as anchor.web3.PublicKey) as ProfileObject;

        set({ profile, pda })
      } catch (e) {
        console.log(`Error getting account: `, e);
      }
    },
    // TODO Add a standard getProfileAccount that uses gPA() + filter
    reset: () => set({ profile: null, pda: null })
  }
}

export const profileStore = createProfileStore();


// =========== WITHOUT USING A CUSTOM TYPE TO STORE PDA =========
//export const profileStore: Writable<anchor.IdlTypes<anchor.Idl>['Profile']> = writable();

// const PROFILE_SEED_PREFIX = 'profile';

// Q: Could I use a derived(workspaceStore, ...) for the profileStore?
// Hmm, this would make profileStore READ ONLY, so that may not work,
// but I like the idea of getting/setting the Profile whenever the wallet changes
// FIXME This is a bitch lol.... Ideally I could just use my workspaceStore
// and walletStore somehow. The issue is that I need access to the AnchorWallet
// and the AnchorProvider and IDL, etc. The Twitter React example rebuilds the Anchor Configs
// but wondering if I can use Svelte Stores in a creative way???

// type ProfileStore = {
// 	profile: anchor.IdlTypes<anchor.Idl>['Profile'] | null;
// };

// function createProfileStore() {
// 	const { subscribe, set } = writable<ProfileStore>({ profile: null });

// 	return {
// 		subscribe,
// 		// Q: Use PublicKey + Connection, or try to use AnchorWallet?
// 		// A: Need access to Anchor Provider, Program, and
// 		getProfile: async (wallet: PublicKey, workspace: WorkSpace, profilePda: PublicKey) => {
// 			let profile: anchor.IdlTypes<anchor.Idl>['Profile'];
// 			try {
// 				if (!workspace) throw 'Workspace not detected!';
// 				if (!wallet) throw 'Wallet not detected!';
// 				// Q: How to make a callable fetch()? Is it a Typing thing?
// 				// FIXME
// 				profile = await workspace.program?.account.fetch(profilePda);
// 				set({ profile });
// 			} catch (e) {
// 				console.log('Error getting Profile', e);
// 			}
// 		}
// 	};
// }

// export const profileStore = createProfileStore();

// === profilePdaStore
// Q: What if I create some sort of profilePdaStore that is a DERIVED Store
// of walletStore, workspaceStore, and profileStore?
// export const profilePdaStore = derived(
// 	[walletStore, workspaceStore, profileStore],
// 	([$walletStore, $workspaceStore, $profileStore]) => {
// 		// Grab the PDA
// 		const [pda, _]: Promise<[anchor.web3.PublicKey, number]> = PublicKey.findProgramAddress(
// 			[
// 				Buffer.from(PROFILE_SEED_PREFIX),
// 				($walletStore.publicKey as anchor.web3.PublicKey).toBuffer(),
// 				anchor.utils.bytes.utf8.encode($profileStore.profileCount)
// 			],
// 			$workspaceStore.program?.programId as anchor.web3.PublicKey
// 		).then((response) => response);

// 		return pda;
// 	}
// );

// ========== Custom Stores to consider ==========
// Q: How to keep the Profile updated based on user wallet?
// Q: How to leverage our workspaceStore?
// REF: https://github.com/solana-developers/workshop-dapps/blob/main/solana-twitter/app_v1/src/stores/useProfileStore.tsx
// REF: https://github.com/solana-developers/workshop-dapps/blob/main/solana-twitter/app_v1/src/utils/seed-util.ts
// REF: https://github.com/gaylonalfano/sveltekit-firebase-nft-calendar/blob/main/src/lib/stores/calendar-store.ts
// async function derivePda(seeds: Buffer[]) {
// 	return await anchor.web3.PublicKey.findProgramAddress(seeds, $workspaceStore.program?.programId);
// }

// IMPORTANT: I need a dynamic/reactive way to update my state when a new wallet
// connects. I need to be able to get the PDA and update the Store with the correct data.
// One idea is to create a customStore of sorts with a async program.account.fetch() call.
// REF: balanceStore approach:
// import { writable } from 'svelte/store';
// import { LAMPORTS_PER_SOL, type PublicKey, type Connection } from '@solana/web3.js';

// type BalanceStore = {
// 	balance: number;
// };

// function declareBalanceStore() {
// 	const { subscribe, set } = writable<BalanceStore>({ balance: 0 });

// 	return {
// 		subscribe,
// 		getUserSOLBalance: async (publicKey: PublicKey, connection: Connection) => {
// 			let balance = 0;
// 			try {
// 				balance = await connection.getBalance(publicKey, 'confirmed');
// 				balance = balance / LAMPORTS_PER_SOL;
// 				set({ balance });
// 			} catch (e) {
// 				console.log(`error getting balance: `, e);
// 			}
// 		}
// 	};
// }

// export const balanceStore = declareBalanceStore();

// NOTE Max introduced the concept of CUSTOM STORES exporting an object that
// has a Store.subscribe property, along with other helper functions:
// NOTE You must FIRST create a default Store (const cart = writable([]))
//
// const cart = writable([]);
// const customCart = {
//	subscribe: cart.subscribe,
//	addItem: (item) => {
//		cart.update(items => {
//			return [...items, item];
//		});
//	},
//	removeItem: (id) => {
//		cart.update(items => {
//			return items.filter(item => item.id !== id);
//		});
//	}
// }
//
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
