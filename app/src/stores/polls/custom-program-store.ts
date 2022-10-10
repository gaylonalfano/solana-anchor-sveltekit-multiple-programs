import { writable, derived, get, type Writable } from 'svelte/store';
import { PublicKey } from '@solana/web3.js';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { WorkSpace } from '@svelte-on-solana/wallet-adapter-anchor';


// Q: Need to keep track of the PDA. Use a separate Store or add as property?
// Need a customProgramPdaStore so if we need the PDA, it's accessible
// U: Don't think I can simply add a 'publicKey' property to the Store.
// Instead, I think I need to use a getPda() or maybe even separate Store...
// A: Gonna just go with a separate Store but may add helper fn()
export const customProgramPdaStore = writable<anchor.web3.PublicKey>();

const CUSTOM_PROGRAM_SEED_PREFIX = 'custom-program';

// type CustomProgramStore = {
//   customProgram: anchor.IdlTypes<anchor.Idl>['CustomProgram'] | undefined;
// }

function createCustomProgramStore() {
  // NOTE I kinda don't like using the custom type in addition to IdlTypes
  // Have to access some inner property to get to the actual account data, etc.
  // With a custom type
  // const { subscribe, set, update } = writable<CustomProgramStore>({ customProgram: undefined });

  // Using IdlTypes directly
  const { subscribe, set, update } = writable<anchor.IdlTypes<anchor.Idl>["CustomProgram"]>();

  return {
    subscribe,
    set,
    update,
    // getPda: async (): anchor.web3.PublicKey => {
    //   if (customProgramPdaStore) return get(customProgramPdaStore);
    //   
    //   try {
    //     let [pda, _] = await PublicKey.findProgramAddress(
    //       [Buffer.from(CUSTOM_PROGRAM_SEED_PREFIX)],
    //       // Q: Why can't it find $workspaceStore?
    //       // A: May have to use get(workspaceStore).program ...
    //       // $workspaceStore.program?.programId as anchor.web3.PublicKey // E: Cannot find $workspaceStore
    //       get(workspaceStore).program?.programId as anchor.web3.PublicKey
    //     )
    //     // U: Need to update the PdaStore value
    //     customProgramPdaStore.set(pda);
    //     return get(customProgramPdaStore);
    //   } catch (e) {
    //     console.log(`error getting PDA: `, e);
    //   }
    // },
    getCustomProgramAccount: async (customProgramPda?: anchor.web3.PublicKey) => {
      // FIXME For some reason it won't derive the PDA if I don't pass it.
      // Q: How do I use async?
      // A: Fixed. Turns out fPA[0] was causing issues.
      let pda = customProgramPda ? customProgramPda : undefined;
      if (!pda) {
        // Need to find the PDA
        try {
          // pda = await PublicKey.findProgramAddress(
          //   [Buffer.from(CUSTOM_PROGRAM_SEED_PREFIX)],
          //   // $workspaceStore.program?.programId as anchor.web3.PublicKey // E: Cannot find $workspaceStore
          //   get(workspaceStore).program?.programId as anchor.web3.PublicKey
          // )[0] as anchor.web3.PublicKey; // E: undefined

          let [tempPda, _] = await PublicKey.findProgramAddress(
            [Buffer.from(CUSTOM_PROGRAM_SEED_PREFIX)],
            // Q: Why can't it find $workspaceStore?
            // A: May have to use get(workspaceStore).program ...
            // $workspaceStore.program?.programId as anchor.web3.PublicKey // E: Cannot find $workspaceStore
            get(workspaceStore).program?.programId as anchor.web3.PublicKey
          )

          pda = tempPda;
          // U: Need to update the PdaStore value
          customProgramPdaStore.set(pda);
        } catch (e) {
          console.log(`error getting PDA: `, e);
        }
      }

      try {
        // Q: Why can't it find $workspaceStore?
        // A: May have to use get(workspaceStore).program ...
        // let customProgram = await $workspaceStore.program?.account.customProgram.fetch(pda); // E: Cannot find $workspaceStore
        // let customProgram = await get(workspaceStore).program?.account.customProgram.fetch(pda); // E: Param is type 'Address'
        // let customProgram = await get(workspaceStore).program?.account.customProgram.fetch(pda as anchor.Address); // E: Undefined '_bn'
        let customProgram = await get(workspaceStore).program?.account.customProgram?.fetch(pda) as anchor.IdlTypes<anchor.Idl>["CustomProgram"]; 

        set(customProgram);
      } catch (e) {
        console.log(`error getting account: `, e);
      }
    }
  }
}

export const customProgramStore = createCustomProgramStore();
