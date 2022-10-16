import { writable, get } from 'svelte/store';
import { PublicKey } from '@solana/web3.js';
import type anchor from '@project-serum/anchor';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { CustomProgramObject } from 'src/models/polls-types';
import { CUSTOM_PROGRAM_SEED_PREFIX } from '../../utils/constants';

// IMPORTANT - Read comments below. This is a good example of how a custom type
// can allow me to save/store the PDA to the Store (not to onchain account!).

// ======== WITH CUSTOM TYPE TO STORE PDA ========
type CustomProgramStore = {
  customProgram: CustomProgramObject | null,
  pda: anchor.web3.PublicKey | null,
}

function createCustomProgramStore() {
  // U: Coming back to this actually... my challenge is that I cannot easily
  // access the account's PDA. I'd like to store it as a prop in the Store, ideally.
  // So, Going to try this again and see if I can using a custom type...
  const { subscribe, set, update } = writable<CustomProgramStore>({ customProgram: null, pda: null });

  return {
    subscribe,
    set,
    update,
    getCustomProgramAccount: async (customProgramPda?: anchor.web3.PublicKey) => {
      // Q: How do I use async?
      // A: Fixed. Turns out fPA[0] was causing issues.
      // Q: How to check whether this store already has a pda?
      // if (get(customProgramStore).pda) ????
      let pda = customProgramPda ? customProgramPda : null;
      if (!pda) {
        // Need to find the PDA
        try {

          let [tempPda, _] = await PublicKey.findProgramAddress(
            [Buffer.from(CUSTOM_PROGRAM_SEED_PREFIX)],
            // Q: Why can't it find $workspaceStore?
            // A: May have to use get(workspaceStore).program ...
            // $workspaceStore.program?.programId as anchor.web3.PublicKey // E: Cannot find $workspaceStore
            get(workspaceStore).program?.programId as anchor.web3.PublicKey
          )

          pda = tempPda;
        } catch (e) {
          console.log(`error getting PDA: `, e);
        }
      }

      try {
        // Q: Why can't it find $workspaceStore?
        // A: May have to use get(workspaceStore).program ...
        // let customProgram = await $workspaceStore.program?.account.customProgram.fetch(pda); // E: Cannot find $workspaceStore
        // let customProgram = await get(workspaceStore).program?.account.customProgram.fetch(pda); // E: Param is type 'Address'
        // let customProgram = await get(workspaceStore).program?.account.customProgram.fetch(pda as anchor.Address); // E: null '_bn'
        let customProgram = await get(workspaceStore).program?.account.customProgram?.fetch(pda as anchor.web3.PublicKey) as CustomProgramObject; 

        // Q: Can I add a 'pda' or 'address' property to this Store?
        // NOTE This is using a custom TYPE with a 'pda' prop...
        // A: Yes! It works! The custom type seems to do the trick!
        set({ customProgram, pda });
      } catch (e) {
        console.log(`error getting account: `, e);
      }
    },
    reset: () => set({ customProgram: null, pda: null })
  }
}

export const customProgramStore = createCustomProgramStore();


// // ============= WITHOUT USING A CUSTOM TYPE TO STORE PDA =============
// // Q: Need to keep track of the PDA. Use a separate Store or add as property?
// // Need a customProgramPdaStore so if we need the PDA, it's accessible
// // U: Don't think I can simply add a 'publicKey' property to the Store.
// // Instead, I think I need to use a getPda() or maybe even separate Store...
// // A: Gonna just go with a separate Store but may add helper fn()
// export const customProgramPdaStore = writable<anchor.web3.PublicKey>();


// // type CustomProgramStore = {
// //   customProgram: anchor.IdlTypes<anchor.Idl>['CustomProgram'] | null;
// // }

// function createCustomProgramStore() {
//   // NOTE I kinda don't like using the custom type in addition to IdlTypes
//   // Have to access some inner property to get to the actual account data, etc.
//   // With a custom type
//   // const { subscribe, set, update } = writable<CustomProgramStore>({ customProgram: null });
//   // U: Coming back to this actually... my challenge is that I cannot easily
//   // access the account's PDA. I'd like to store it as a prop in the Store, ideally.
//   // So, Going to try this again and see if I can using a custom type...

//   // Using IdlTypes directly
//   const { subscribe, set, update } = writable<anchor.IdlTypes<anchor.Idl>["CustomProgram"]>();

//   return {
//     subscribe,
//     set,
//     update,
//     // Q: Can I add a static prop to the Store?
//     // A: Don't think so. Getting errors when trying to access. May be a matter
//     // or how I design my Store, but doesn't seem to work.
//     // pda: new PublicKey("2BScwdytqa6BnjW6SUqKt8uaKYn6M4gLbWBdn3JuJWjE"),
//     // getPda: async (): anchor.web3.PublicKey => {
//     //   if (customProgramPdaStore) return get(customProgramPdaStore);
//     //   
//     //   try {
//     //     let [pda, _] = await PublicKey.findProgramAddress(
//     //       [Buffer.from(CUSTOM_PROGRAM_SEED_PREFIX)],
//     //       // Q: Why can't it find $workspaceStore?
//     //       // A: May have to use get(workspaceStore).program ...
//     //       // $workspaceStore.program?.programId as anchor.web3.PublicKey // E: Cannot find $workspaceStore
//     //       get(workspaceStore).program?.programId as anchor.web3.PublicKey
//     //     )
//     //     // U: Need to update the PdaStore value
//     //     customProgramPdaStore.set(pda);
//     //     return get(customProgramPdaStore);
//     //   } catch (e) {
//     //     console.log(`error getting PDA: `, e);
//     //   }
//     // },
//     getCustomProgramAccount: async (customProgramPda?: anchor.web3.PublicKey) => {
//       // FIXME For some reason it won't derive the PDA if I don't pass it.
//       // Q: How do I use async?
//       // A: Fixed. Turns out fPA[0] was causing issues.
//       let pda = customProgramPda ? customProgramPda : null;
//       if (!pda) {
//         // Need to find the PDA
//         try {
//           // pda = await PublicKey.findProgramAddress(
//           //   [Buffer.from(CUSTOM_PROGRAM_SEED_PREFIX)],
//           //   // $workspaceStore.program?.programId as anchor.web3.PublicKey // E: Cannot find $workspaceStore
//           //   get(workspaceStore).program?.programId as anchor.web3.PublicKey
//           // )[0] as anchor.web3.PublicKey; // E: null

//           let [tempPda, _] = await PublicKey.findProgramAddress(
//             [Buffer.from(CUSTOM_PROGRAM_SEED_PREFIX)],
//             // Q: Why can't it find $workspaceStore?
//             // A: May have to use get(workspaceStore).program ...
//             // $workspaceStore.program?.programId as anchor.web3.PublicKey // E: Cannot find $workspaceStore
//             get(workspaceStore).program?.programId as anchor.web3.PublicKey
//           )

//           pda = tempPda;
//           // U: Need to update the PdaStore value
//           customProgramPdaStore.set(pda);
//           // Q: Can I add a 'pda' or 'address' property to this Store?
//           // update((self) => self.pda = pda as PublicKey); // E: null
//         } catch (e) {
//           console.log(`error getting PDA: `, e);
//         }
//       }

//       try {
//         // Q: Why can't it find $workspaceStore?
//         // A: May have to use get(workspaceStore).program ...
//         // let customProgram = await $workspaceStore.program?.account.customProgram.fetch(pda); // E: Cannot find $workspaceStore
//         // let customProgram = await get(workspaceStore).program?.account.customProgram.fetch(pda); // E: Param is type 'Address'
//         // let customProgram = await get(workspaceStore).program?.account.customProgram.fetch(pda as anchor.Address); // E: null '_bn'
//         let customProgram = await get(workspaceStore).program?.account.customProgram?.fetch(pda) as anchor.IdlTypes<anchor.Idl>["CustomProgram"]; 

//         set(customProgram);
//       } catch (e) {
//         console.log(`error getting account: `, e);
//       }
//     }
//   }
// }



