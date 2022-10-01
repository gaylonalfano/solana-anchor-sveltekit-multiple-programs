import { writable, type Writable } from 'svelte/store';
// import * as anchor from '@project-serum/anchor';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
export const profileStore: Writable<anchor.IdlTypes<anchor.Idl>['Profile']> = writable();

// FIXME
// Q: How to keep the Profile updated based on user wallet?
// Q: How to leverage our workspaceStore?
// REF: https://github.com/solana-developers/workshop-dapps/blob/main/solana-twitter/app_v1/src/stores/useProfileStore.tsx
// REF: https://github.com/solana-developers/workshop-dapps/blob/main/solana-twitter/app_v1/src/utils/seed-util.ts
// REF: https://github.com/gaylonalfano/sveltekit-firebase-nft-calendar/blob/main/src/lib/stores/calendar-store.ts
// async function derivePda(seeds: Buffer[]) {
// 	return await anchor.web3.PublicKey.findProgramAddress(seeds, $workspaceStore.program?.programId);
// }

// Create a custom Store?
// function createProfileStore() {
// 	const { subscribe, set, update } = writable();

// 	return {
// 		subscribe,
// 		profile: null,
// 		getProfile: async (wallet: AnchorWallet | undefined) => {
// 			let profile = null;
// 			try {
// 				if (!wallet) throw ("Wallet not connected!");
// 				profile = await
// 			}
// 		}
// 	}
// 	const profileStore: Writable<anchor.IdlTypes<anchor.Idl>['Profile']> = writable();
// }
