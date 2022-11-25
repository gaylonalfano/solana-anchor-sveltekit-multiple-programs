import { writable, get } from 'svelte/store';
import { PublicKey } from '@solana/web3.js';
import type anchor from '@project-serum/anchor';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { CustomProgramObject } from 'src/models/polls-types';
import { NON_CUSTODIAL_ESCROW_PROGRAM_ID, CUSTOM_PROGRAM_SEED_PREFIX } from '../../helpers/escrow/constants';

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
      // A: Fixed. Turns out findProgramAccounts[0] was causing issues.
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
            // get(workspaceStore).program?.programId as anchor.web3.PublicKey
            NON_CUSTODIAL_ESCROW_PROGRAM_ID
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

