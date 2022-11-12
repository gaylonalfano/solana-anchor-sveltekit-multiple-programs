import { writable, get, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import { escrowStore } from '../escrow/escrow-store';
import type { Mint } from '@solana/spl-token';


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
export type TokenMintStoreObject = {
  address: anchor.web3.PublicKey | null,
  mint: Mint | null,

}
// U: Or, use the SPL Token's 'Mint' type
// REF Check out the spl-token library for details
// A: Using BOTH to store address separately and the mint info
export const xMintStore = writable<TokenMintStoreObject>(
  {
    address: null,
    mint: null
  }
);
export const yMintStore = writable<TokenMintStoreObject>(
  {
    address: null,
    mint: null,
  }
);

// U: Adding a swap UI with a select dropdown. Want to have a list
// of tokens in the connected walletStore. I'm adding a 
// getTokenAccountsByOwner() inside __layout, so I could update/set this
// store there on new wallet connections.
// Q: What's the Type for the SPL token account returned by getParsedTokenAccountsByOwner?
// REF: https://solana-labs.github.io/solana-web3.js/classes/Connection.html#getParsedTokenAccountsByOwner
// A: Promise<RpcResponseAndContext<{ account: AccountInfo<ParsedAccountData>; pubkey: PublicKey }[]>>
export const walletTokenAccountsStore = writable<
  {
    account: anchor.web3.AccountInfo<anchor.web3.ParsedAccountData>,
    pubkey: anchor.web3.PublicKey
  }[]
>()

// Q: Should this be DERIVED from single escrowStore?
// Or, do I need to derive from some other store?
// export const xTokenStore = derived<Writable<EscrowStoreObject>>(
//   escrowStore,
//   ($escrowStore) => {
//     // NOTE Must convert PublicKeys to strings to compare!
//     return $escrowStore;
//   }
// )



