import type anchor from '@project-serum/anchor';

// NOTE Think this works... Just need to import type { XObject } from ...
export type EscrowObject = anchor.IdlTypes<anchor.Idl>['Escrow'];
export type EscrowStoreObject = {
  escrow: EscrowObject | null,
  pda: anchor.web3.PublicKey | null,
}

// Reference only:
// export type PollObject = anchor.IdlTypes<anchor.Idl>['Poll'];
// export type PollStoreObject = {
//   poll: PollObject | null,
//   pda: anchor.web3.PublicKey | null,
// }
// export type VoteObject = anchor.IdlTypes<anchor.Idl>['Vote'];

