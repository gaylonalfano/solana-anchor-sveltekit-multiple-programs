import { writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import * as constants from '../../helpers/escrow/constants';


// Q: Do I need to also save the mint address?
// I already have x/yMintStores...
type BuyerStoreObject = {
  walletAddress: anchor.web3.PublicKey | null,
  xTokenATA: anchor.web3.PublicKey | null,
  xTokenBalance: number | null,
  yTokenATA: anchor.web3.PublicKey | null,
  yTokenBalance: number | null,
}

export const buyerStore = writable<BuyerStoreObject>(
  {
    walletAddress: constants.BUYER_WALLET_ADDRESS, // Solflare Dev
    xTokenATA: null,
    xTokenBalance: null,
    yTokenATA: null,
    yTokenBalance: null,
  }
);
