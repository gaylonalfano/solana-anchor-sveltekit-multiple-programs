import { writable, get, type Writable, derived } from 'svelte/store';
// import * as anchor from '@project-serum/anchor';
import type anchor from '@project-serum/anchor';
import { LAMPORTS_PER_SOL, PublicKey, type Connection } from '@solana/web3.js';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import { customProgramStore } from '$stores/polls/custom-program-store';
import type { WorkSpace } from '@svelte-on-solana/wallet-adapter-anchor';

export const profileStore: Writable<anchor.IdlTypes<anchor.Idl>['Profile']> = writable();
// const PROFILE_SEED_PREFIX = 'profile';

// Q: Could I use a derived(workspaceStore, ...) for the profileStore?
// Hmm, this would make profileStore READ ONLY, so that may not work,
// but I like the idea of getting/setting the Profile whenever the wallet changes
// FIXME This is a bitch lol.... Ideally I could just use my workspaceStore
// and walletStore somehow. The issue is that I need access to the AnchorWallet
// and the AnchorProvider and IDL, etc. The Twitter React example rebuilds the Anchor Configs
// but wondering if I can use Svelte Stores in a creative way???

// type ProfileStore = {
// 	profile: anchor.IdlTypes<anchor.Idl>['Profile'] | undefined;
// };

// function createProfileStore() {
// 	const { subscribe, set } = writable<ProfileStore>({ profile: undefined });

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
