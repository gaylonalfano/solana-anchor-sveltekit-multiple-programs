import { writable, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import { escrowStore } from '../escrow/escrow-store';
import type { EscrowStoreObject, EscrowObject } from '../../models/escrow-types';
import type { PublicKey } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  type Mint
} from '@solana/spl-token';


// TODO Create a Store for each Token Mint involved with the Escrow
// E.g. Mint Address, Seller X ATA, Buyer Y ATA

// Q: Is there an SPL type to use for TS?
// A: Yes, it's called 'Mint' with the following:
// export interface Mint {
//     /** Address of the mint */
//     address: PublicKey;
//     /**
//      * Optional authority used to mint new tokens. The mint authority may only be provided during mint creation.
//      * If no mint authority is present then the mint has a fixed supply and no further tokens may be minted.
//      */
//     mintAuthority: PublicKey | null;
//     /** Total supply of tokens */
//     supply: bigint;
//     /** Number of base 10 digits to the right of the decimal place */
//     decimals: number;
//     /** Is this mint initialized */
//     isInitialized: boolean;
//     /** Optional authority to freeze token accounts */
//     freezeAuthority: PublicKey | null;
//     /** Additional data for extension */
//     tlvData: Buffer;
// }

// U: Going with a basic Writable Store for now
// U: My custom Type that captures:
type TokenMintStoreObject = {
  tokenName: string | null,
  mintAddress: PublicKey | null,
  space: number | null,
  decimals: number | null,
  mintAuthority: PublicKey | null,
  freezeAuthority: PublicKey | null,
  sellerATA: PublicKey | null,
  buyerATA: PublicKey | null,
}
// U: Or, use the SPL Token's 'Mint' type
// REF Check out the spl-token library for details
export const xTokenStore = writable<TokenMintStoreObject>();
export const xMintStore = writable<Mint>();

export const yTokenStore = writable<TokenMintStoreObject>();
export const yMintStore = writable<Mint>();

// Q: Should this be DERIVED from single escrowStore?
// Or, do I need to derive from some other store?
// export const xTokenStore = derived<Writable<EscrowStoreObject>>(
//   escrowStore,
//   ($escrowStore) => {
//     // NOTE Must convert PublicKeys to strings to compare!
//     return $escrowStore;
//   }
// )



