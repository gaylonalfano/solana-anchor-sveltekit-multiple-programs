import { writable, get, derived } from "svelte/store";
import type { Writable } from "svelte/store";
import type anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import { xMintStore, yMintStore, type TokenMintStoreObject } from "./tokens-store";
import { buyerStore, type BuyerStoreObject } from "./buyer-store";
import { sellerStore, type SellerStoreObject } from "./seller-store";
// import type { EscrowObject, EscrowStoreObject } from '../../models/escrow-types';
import { ESCROW_SEED_PREFIX, ESCROW_ACCOUNT_SPACE } from '../../helpers/escrow/constants';
import type { GetProgramAccountsFilter } from '@solana/web3.js';


export type EscrowObject = anchor.IdlTypes<anchor.Idl>['Escrow'];
export type EscrowStoreObject = {
  escrow: EscrowObject | null,
  pda: anchor.web3.PublicKey | null,
}
// U: After implementing just the pda + Escrow IDL type, it's not
// enough for the entire UI. Initially, I created escrowState local Obj,
// but it's a mix between this Store and it to maintain the UI.
// Thinking about expanding this custom EscrowStoreObject to capture
// all that we need so I can simplify. Another option is to re-write
// the on-chain escrow struct, but that doesn't seem best.
// Q: Any way to inherit or use partial types from Escrow IDL type?
// REF: https://www.typescriptlang.org/cheatsheets
// NOTE Type Indexing:
// type Response = { data: { ... } }
// type Data = Response["data"] // { ... }
// NOTE Mapped Types:
// type Artist = { name: string, bio: string }
// type Subscriber<Type> = {
//    [Property in keyof Type]:
//      (newValue: Type[Property]) => void
// }
// type ArtistSub = Subscriber<Artist> // { name: (nv: string) => void, bio: (nv: string) => void }

export type EscrowStateDerivedStoreObject = {
  pda: anchor.web3.PublicKey | null,
  authority: anchor.web3.PublicKey | null,
  bump: number | null,
  escrowedXTokenAddress: anchor.web3.PublicKey | null,
  escrowedXTokenBalance: number | null,
  xMintPubkey: anchor.web3.PublicKey | null,
  xAmountFromSeller: number | null,
  yMintPubkey: anchor.web3.PublicKey | null,
  yAmountFromBuyer: number | null,
  sellerWallet: anchor.web3.PublicKey | null,
  sellerXTokenATA: anchor.web3.PublicKey | null,
  buyerWallet: anchor.web3.PublicKey | null,
  buyerYTokenATA: anchor.web3.PublicKey | null,
  isActive: boolean | null,
  hasExchanged: boolean | null, // If is_active == false && has_exchanged == false => CANCELLED
}

// REF Here's my struct:
// #[account]
// pub struct Escrow {
//     authority: Pubkey, // The seller (initiator of exchange)
//     bump: u8,
//     escrowed_x_token: Pubkey, // Token Account Address
//     y_mint: Pubkey, // Mint Address
//     y_amount: u64, // Amount seller is wanting in exchange of x_amount of x_token
//     is_active: bool,
//     has_exchanged: bool, // If is_active == false && has_exchanged == false => CANCELLED
// }

// impl Escrow {
//     pub const ACCOUNT_SPACE: usize = 8 + 1 + 32 + 32 + 32 + 8 + 1 + 1;
//     pub const SEED_PREFIX: &'static str = "escrow";
// }


// Reference only:
// export type PollObject = anchor.IdlTypes<anchor.Idl>['Poll'];
// export type PollStoreObject = {
//   poll: PollObject | null,
//   pda: anchor.web3.PublicKey | null,
// }
// export type VoteObject = anchor.IdlTypes<anchor.Idl>['Vote'];





// REF Here's my struct:
// #[account]
// pub struct Escrow {
//     authority: Pubkey, // The seller (initiator of exchange)
//     bump: u8,
//     escrowed_x_token: Pubkey, // Token Account Address
//     y_mint: Pubkey, // Mint Address
//     y_amount: u64, // Amount seller is wanting in exchange of x_amount of x_token
//     is_active: bool,
//     has_exchanged: bool, // If is_active == false && has_exchanged == false => CANCELLED
// }

// impl Escrow {
//     pub const ACCOUNT_SPACE: usize = 8 + 1 + 32 + 32 + 32 + 8 + 1 + 1;
//     pub const SEED_PREFIX: &'static str = "escrow";
// }


// NOTE Referencing previous Stores from Multiple Polls app
function createEscrowStore() {
  const { subscribe, set, update } = writable<EscrowStoreObject>();

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


// TODO =========
// Q: Would a Derived Store be better to encapsulate everything about the Escrow State?
// NOTE I'd like to be able to create MULTIPLE escrows with their own PDA route (similar to /polls/[pda])
// So, I could later query the exchange details such as xAmount, buyer, seller, yAmount, etc.
// Most of this is in Escrow account, but may need to add x_amount field.
// Q: Would it be worth creating an Exchange account struct that stores all of the final
// details of the swap? It would have a escrow: Pubkey field that points to the Escrow
// account PDA...
export const escrowStateDerivedStore = derived<
  [
    Writable<TokenMintStoreObject>, // X
    Writable<TokenMintStoreObject>, // Y
    Writable<SellerStoreObject>,
    Writable<BuyerStoreObject>,
    Writable<EscrowStoreObject>
  ],
  EscrowStateDerivedStoreObject
>(
  [xMintStore, yMintStore, sellerStore, buyerStore, escrowStore],
  ([$xMintStore, $yMintStore, $sellerStore, $buyerStore, $escrowStore]) => {
    // Return a new object that encapulates everything about the escrow state
    return {
      pda: $escrowStore.pda,
      authority: $escrowStore.escrow?.authority,
      bump: $escrowStore.escrow?.bump,
      escrowedXTokenAddress: $escrowStore.escrow?.escrowedXToken,
      escrowedXTokenBalance: 0, // Q: Saved where? This is a getTokenBalance() call...
      xMintPubkey: $xMintStore.address,
      xAmountFromSeller: 0, // Q: Saved where? Thinking of updating Escrow struct to add x_amount field...
      yMintPubkey: $yMintStore.address,
      yAmountFromBuyer: $escrowStore.escrow?.yAmount,
      sellerWallet: $escrowStore.escrow?.authority,
      sellerXTokenATA: $sellerStore.xTokenATA,
      buyerWallet: $buyerStore.walletAddress,
      buyerYTokenATA: $buyerStore.yTokenATA,
      isActive: $escrowStore.escrow?.isActive,
      hasExchanged: $escrowStore.escrow?.hasExchanged,
    }
  }
)
