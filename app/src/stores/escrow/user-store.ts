import { writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import * as constants from '../../helpers/escrow/constants';


export type UserStoreObject = {
  walletAddress: anchor.web3.PublicKey | null,
  outTokenMint: anchor.web3.PublicKey | null,
  outTokenATA: anchor.web3.PublicKey | null,
  outTokenRawBalance: number | null, // 30000000
  outTokenBalance: number | null,
  outTokenRawAmount: number | null, // 12000000
  outTokenAmount: number | null, // 1.2
  outTokenDecimals: number | null,
  inTokenMint: anchor.web3.PublicKey | null,
  inTokenATA: anchor.web3.PublicKey | null,
  inTokenRawBalance: number | null,
  inTokenBalance: number | null,
  inTokenRawAmount: number | null,
  inTokenAmount: number | null,
  inTokenDecimals: number | null,
}

// U: Creating a function to build the Store so I can add a reset() method
function createUserStore() {
  const { subscribe, set, update } = writable<UserStoreObject>(
    {
      walletAddress: null, // Phantom Dev
      outTokenMint: null, // Q: Default to SOL?
      outTokenATA: null,
      outTokenRawBalance: null,
      outTokenBalance: null,
      outTokenRawAmount: null,
      outTokenAmount: null,
      outTokenDecimals: null,
      inTokenMint: null,
      inTokenATA: null,
      inTokenRawBalance: null,
      inTokenBalance: null,
      inTokenRawAmount: null,
      inTokenAmount: null,
      inTokenDecimals: null,
    }
  );

  return {
    subscribe,
    set,
    update,
    reset: () => set({
      walletAddress: null, // Phantom Dev
      outTokenMint: null, // Q: Default to SOL?
      outTokenATA: null,
      outTokenRawBalance: null,
      outTokenBalance: null,
      outTokenRawAmount: null,
      outTokenAmount: null,
      outTokenDecimals: null,
      inTokenMint: null,
      inTokenATA: null,
      inTokenRawBalance: null,
      inTokenBalance: null,
      inTokenRawAmount: null,
      inTokenAmount: null,
      inTokenDecimals: null,
    })
  }
}


export const userStore = createUserStore();

