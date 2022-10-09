import { writable, get, type Writable } from 'svelte/store';
import { PublicKey } from '@solana/web3.js';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { WorkSpace } from '@svelte-on-solana/wallet-adapter-anchor';


// export const customProgramStore: Writable<anchor.IdlTypes<anchor.Idl>['CustomProgram']> =
// 	writable();

const CUSTOM_PROGRAM_SEED_PREFIX = 'custom-program';

type CustomProgramStore = {
  customProgram: anchor.IdlTypes<anchor.Idl>['CustomProgram'] | undefined;
}

function createCustomProgramStore() {
  const { subscribe, set, update } = writable<CustomProgramStore>({ customProgram: undefined });

  return {
    subscribe,
    set,
    update,
    getCustomProgramAccount: async (customProgramPda?: anchor.web3.PublicKey) => {
      let pda = customProgramPda ? customProgramPda : null;
      if (!pda) {
        // Need to find the PDA
        try {
          // Q: Why can't it find $workspaceStore?
          // A: May have to use get(workspaceStore).program ...
          pda = await PublicKey.findProgramAddress(
            [Buffer.from(CUSTOM_PROGRAM_SEED_PREFIX)],
            // $workspaceStore.program?.programId as anchor.web3.PublicKey // E: Cannot find $workspaceStore
            get(workspaceStore).program?.programId as anchor.web3.PublicKey
          )[0] as anchor.web3.PublicKey;
        } catch (e) {
          console.log(`error getting PDA: `, e);
        }
      }

      try {
        // Q: Why can't it find $workspaceStore?
        // A: May have to use get(workspaceStore).program ...
        // let customProgram = await $workspaceStore.program?.account.customProgram.fetch(pda); // E: Cannot find $workspaceStore
        // let customProgram = await get(workspaceStore).program?.account.customProgram.fetch(pda); // E: Param is type 'Address'
        let customProgram = await get(workspaceStore).program?.account.customProgram.fetch(pda as anchor.Address); // ?
        set( { customProgram });
      } catch (e) {
        console.log(`error getting account: `, e);
      }
    }
  }
}

export const customProgramStore = createCustomProgramStore();

