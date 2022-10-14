import { writable, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { PollObject } from '../../models/polls-types';
import { POLL_SEED_PREFIX } from '../../utils/constants';
import { PublicKey } from '@solana/web3.js';


type PollStore = {
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
    }
  }
}

export const pollStore = createPollStore();
