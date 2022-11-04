import { writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import * as constants from '../../helpers/escrow/constants';


type SellerStoreObject = {
  walletAddress: anchor.web3.PublicKey | null,
  xTokenATA: anchor.web3.PublicKey | null,
  xTokenBalance: number | null,
  yTokenATA: anchor.web3.PublicKey | null,
  yTokenBalance: number | null,
}

export const sellerStore = writable<SellerStoreObject>(
  {
    walletAddress: constants.SELLER_WALLET_ADDRESS, // Phantom Dev
    xTokenATA: null,
    xTokenBalance: null,
    yTokenATA: null,
    yTokenBalance: null,
  }
);
