import { writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import * as constants from '../../helpers/escrow/constants';

// NOTE This store is going to capture all of the setup/init details
// needed (creating tokens, ATAs, minting supply, etc.) so that I 
// can start testing/using with different wallets. This is for dev
// purposes only at this point!

export type SetupStoreObject = {
  sellerWallet: anchor.web3.PublicKey | null,
  sellerXTokenMint: anchor.web3.PublicKey | null,
  sellerXTokenATA: anchor.web3.PublicKey | null,
  sellerXTokenBalance: number | null,
  sellerYTokenMint: anchor.web3.PublicKey | null,
  sellerYTokenATA: anchor.web3.PublicKey | null,
  sellerYTokenBalance: number | null,
  buyerWallet: anchor.web3.PublicKey | null,
  buyerXTokenMint: anchor.web3.PublicKey | null,
  buyerXTokenATA: anchor.web3.PublicKey | null,
  buyerXTokenBalance: number | null,
  buyerYTokenMint: anchor.web3.PublicKey | null,
  buyerYTokenATA: anchor.web3.PublicKey | null,
  buyerYTokenBalance: number | null,
}

// U: Creating a function to build the Store so I can add a reset() method
function createSetupStore() {
  const { subscribe, set, update } = writable<SetupStoreObject>(
    {
      sellerWallet: constants.SELLER_WALLET_ADDRESS,
      sellerXTokenMint: null,
      sellerXTokenATA: null,
      sellerXTokenBalance: null,
      sellerYTokenMint: null,
      sellerYTokenATA: null,
      sellerYTokenBalance: null,
      buyerWallet: constants.BUYER_WALLET_ADDRESS,
      buyerXTokenMint: null,
      buyerXTokenATA: null,
      buyerXTokenBalance: null,
      buyerYTokenMint: null,
      buyerYTokenATA: null,
      buyerYTokenBalance: null,
    }
  );

  return {
    subscribe,
    set,
    update,
    reset: () => set({
      sellerWallet: constants.SELLER_WALLET_ADDRESS,
      sellerXTokenMint: null,
      sellerXTokenATA: null,
      sellerXTokenBalance: null,
      sellerYTokenMint: null,
      sellerYTokenATA: null,
      sellerYTokenBalance: null,
      buyerWallet: constants.BUYER_WALLET_ADDRESS,
      buyerXTokenMint: null,
      buyerXTokenATA: null,
      buyerXTokenBalance: null,
      buyerYTokenMint: null,
      buyerYTokenATA: null,
      buyerYTokenBalance: null,
    })
  }
}


export const setupStore = createSetupStore();
