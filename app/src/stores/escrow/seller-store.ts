import { writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import * as constants from '../../helpers/escrow/constants';


export type SellerStoreObject = {
  walletAddress: anchor.web3.PublicKey | null,
  xTokenATA: anchor.web3.PublicKey | null,
  xTokenBalance: number | null,
  yTokenATA: anchor.web3.PublicKey | null,
  yTokenBalance: number | null,
}

// U: Creating a function to build the Store so I can add a reset() method
function createSellerStore() {
  const { subscribe, set, update } = writable<SellerStoreObject>(
    {
      walletAddress: constants.SELLER_WALLET_ADDRESS, // Phantom Dev
      xTokenATA: null,
      xTokenBalance: null,
      yTokenATA: null,
      yTokenBalance: null,
    }
  );

  return {
    subscribe,
    set,
    update,
    reset: () => set({
      walletAddress: constants.SELLER_WALLET_ADDRESS, // Phantom Dev
      xTokenATA: null,
      xTokenBalance: null,
      yTokenATA: null,
      yTokenBalance: null,
    })
  }
}


export const sellerStore = createSellerStore();
