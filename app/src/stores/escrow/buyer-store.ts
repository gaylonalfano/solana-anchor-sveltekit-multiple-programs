import { writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import * as constants from '../../helpers/escrow/constants';


// Q: Do I need to also save the mint address?
// I already have x/yMintStores...
// U: I think so... 
// NOTE The PublicKey for SOL is: So11111111111111111111111111111111111111111
// NOTE I BELIEVE there is NO ATA for SOL, so could use wallet Pubkey instead...
export type BuyerStoreObject = {
  walletAddress: anchor.web3.PublicKey | null,
  xTokenMint: anchor.web3.PublicKey | null,
  xTokenATA: anchor.web3.PublicKey | null,
  xTokenBalance: number | null,
  yTokenMint: anchor.web3.PublicKey | null,
  yTokenATA: anchor.web3.PublicKey | null,
  yTokenBalance: number | null,
}

// U: Creating a function to build the Store so I can add a reset() method
function createBuyerStore() {
  const { subscribe, set, update } = writable<BuyerStoreObject>(
    {
      walletAddress: constants.BUYER_WALLET_ADDRESS, // Solflare Dev
      xTokenMint: null, // Q: Default to SOL?
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
      walletAddress: constants.BUYER_WALLET_ADDRESS, // Solflare Dev
      xTokenMint: null,
      xTokenATA: null,
      xTokenBalance: null,
      yTokenMint: null,
      yTokenATA: null,
      yTokenBalance: null,
    })
  }
}


export const buyerStore = createBuyerStore();

// export const buyerStore = writable<BuyerStoreObject>(
//   {
//     walletAddress: constants.BUYER_WALLET_ADDRESS, // Solflare Dev
//     xTokenATA: null,
//     xTokenBalance: null,
//     yTokenATA: null,
//     yTokenBalance: null,
//   }
// );

