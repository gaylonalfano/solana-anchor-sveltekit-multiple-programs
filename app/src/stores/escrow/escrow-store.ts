import { writable, get } from "svelte/store";
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { EscrowObject, EscrowStoreObject } from '../../models/escrow-types';
import { ESCROW_SEED_PREFIX, ESCROW_ACCOUNT_SPACE } from '../../helpers/escrow/constants';
import type { GetProgramAccountsFilter } from '@solana/web3.js';

// NOTE Referencing previous Stores from Multiple Polls app
function createEscrowStore() {
  const { subscribe, set, update } = writable<EscrowStoreObject>({ escrow: null, pda: null })

  return {
    subscribe,
    set,
    update,
    getEscrowAccount: async (
      programId: anchor.web3.PublicKey,
      escrowPda: anchor.web3.PublicKey,
      connection: anchor.web3.Connection,
    ) => {
      // Create the filter
      // NOTE Can't filter on PDA since it's not stored in account data.
      // However, could consider pollNumber perhaps
      // NOTE Escrow struct has is_active and has_exchanged fields for possible filters
      const escrowsFilter: GetProgramAccountsFilter[] = [
        {
          dataSize: ESCROW_ACCOUNT_SPACE
        }
      ];

      // Use gPA() + filter to get Poll data
      const escrowAccountsEncoded = await connection.getProgramAccounts(
        programId,
        { filters: escrowsFilter }
      );
      console.log('escrowAccountsEncoded: ', escrowAccountsEncoded);

      // Find the matching pda and ONLY decode the match
      const escrowAccountEncoded = escrowAccountsEncoded.find((value) => value.pubkey.toBase58() === escrowPda.toBase58()); // WORKS! 
      console.log('escrowAccountEncoded: ', escrowAccountEncoded);
      const decodedAccountInfo = get(workspaceStore).program?.coder.accounts.decode(
        'Escrow',
        escrowAccountEncoded?.account.data as Buffer
      )

      escrowStore.set({ escrow: decodedAccountInfo, pda: escrowAccountEncoded?.pubkey } as EscrowStoreObject);
    },
  }
}

export const escrowStore = createEscrowStore();

