import { writable, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { EscrowStoreObject, EscrowObject } from './escrow-store'
import type { GetProgramAccountsFilter } from '@solana/web3.js';
import { ESCROW_ACCOUNT_SPACE } from '../../helpers/escrow/constants';


function createEscrowsStore() {
  const { subscribe, set, update } = writable<EscrowStoreObject[]>([]);

  return {
    subscribe,
    set,
    update,
    getEscrowAccounts: async (programId: anchor.web3.PublicKey, connection: anchor.web3.Connection) => {
      // Create the filter
      // NOTE Can't filter on PDA, but could consider pollNumber perhaps
      const escrowsFilter: GetProgramAccountsFilter[] = [
        {
          dataSize: ESCROW_ACCOUNT_SPACE
        }
      ];

      // Use gPA() + filter to get Escrow data
      const escrowAccountsEncoded = await connection.getProgramAccounts(
        programId,
        { filters: escrowsFilter }
      );
      console.log('escrowAccountsEncoded: ', escrowAccountsEncoded);

      // Only update Store if gPA() is successful fetching data
      if (escrowAccountsEncoded) {
        // Data fetch worked so time to reset, decode, and then update
        escrowsStore.reset();

        // Decode data buffer
        escrowAccountsEncoded.forEach((value) => {
          // Manually decode account data using coder
          // Q: Can we access workspaceStore? Was undefined on refresh...
          // U: Think so in some cases with get()...
          // A: Yes! Working with get()
          const decodedAccountInfo = get(workspaceStore).program!.coder.accounts.decode(
            'Escrow',
            value.account.data
          ) as EscrowObject;

          // Q: Can this actually work? Is there a 'this' to use?
          // Don't think I'll be able to use it like this since won't be defined...
          // A: WORKS! Neat! Need to reset() first though or will add dups
          escrowsStore.addEscrow(decodedAccountInfo, value.pubkey);
        });
      }
    },
    addEscrow: async (escrow: EscrowObject, pda: anchor.web3.PublicKey) => {
      // Won't have the PDA but can still add IDL ["Escrow"] object
      update((self: EscrowStoreObject[]) => {
        return [
          ...self,
          {
            escrow,
            pda,
          }
        ]
      });
    },
    updateEscrow: async (pda: anchor.web3.PublicKey, escrow: EscrowObject) => {
      update((self: EscrowStoreObject[]) => {
        // NOTE Must compare PublicKeys as strings!
        const escrowToUpdate: EscrowStoreObject | undefined = self.find(e => e.pda?.toBase58() === pda.toBase58());
        console.log('escrowToUpdate: ', escrowToUpdate);
        if (escrowToUpdate) {
          console.log('Escrow found. Making updates.');
          escrowToUpdate.escrow = escrow;
          return self;
        } else {
          console.log('Escrow not found in store. No updates made.');
          return self;
        }
      })
    },
    deleteEscrow: (pda: anchor.web3.PublicKey) => {
      update((self: EscrowStoreObject[]) => {
        return self.filter((escrowStore: EscrowStoreObject) => escrowStore.pda !== pda);
      })
    },
    reset: () => set([])
  }
}

export const escrowsStore = createEscrowsStore();

