import { writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import * as constants from '../../helpers/escrow/constants';

// Q: Do I need to also save the mint address?
// I already have x/yMintStores...
// U: I think so... 
// NOTE The PublicKey for SOL is: So11111111111111111111111111111111111111111
// NOTE I BELIEVE there is NO ATA for SOL, so could use wallet Pubkey instead...
// U: Renaming from x/y to out/in. Going to leave x/yMintStores for developing,
// but store the token details on the buyer/sellerStores
// U: Can't remove x/yToken fields just yet as they're needed to mint and transfer
// the X & Y tokens for testing/dev.
export type SellerStoreObject = {
  walletAddress: anchor.web3.PublicKey | null,
  outTokenMint: anchor.web3.PublicKey | null,
  outTokenATA: anchor.web3.PublicKey | null,
  outTokenAmount: number | null,
  outTokenBalance: number | null,
  inTokenMint: anchor.web3.PublicKey | null,
  inTokenATA: anchor.web3.PublicKey | null,
  inTokenAmount: number | null,
  inTokenBalance: number | null,
  // NOTE Keeping x/y fields for now while developing
  xTokenMint: anchor.web3.PublicKey | null,
  xTokenATA: anchor.web3.PublicKey | null,
  xTokenBalance: number | null,
  yTokenMint: anchor.web3.PublicKey | null,
  yTokenATA: anchor.web3.PublicKey | null,
  yTokenBalance: number | null,
}

// U: Creating a function to build the Store so I can add a reset() method
function createSellerStore() {
  const { subscribe, set, update } = writable<SellerStoreObject>(
    {
      walletAddress: constants.SELLER_WALLET_ADDRESS, // Phantom Dev
      outTokenMint: null, // Q: Default to SOL?
      outTokenATA: null,
      outTokenAmount: null,
      outTokenBalance: null,
      inTokenMint: null,
      inTokenATA: null,
      inTokenAmount: null,
      inTokenBalance: null,
      xTokenMint: null,
      xTokenATA: null,
      xTokenBalance: null,
      yTokenMint: null,
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
      outTokenMint: null,
      outTokenATA: null,
      outTokenAmount: null,
      outTokenBalance: null,
      inTokenMint: null,
      inTokenATA: null,
      inTokenAmount: null,
      inTokenBalance: null,
      xTokenMint: null,
      xTokenATA: null,
      xTokenBalance: null,
      yTokenMint: null,
      yTokenATA: null,
      yTokenBalance: null,
    })
  }
}


export const sellerStore = createSellerStore();
