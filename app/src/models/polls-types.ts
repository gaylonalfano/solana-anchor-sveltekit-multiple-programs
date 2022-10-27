import type anchor from '@project-serum/anchor';

// NOTE Think this works... Just need to import type { XObject } from ...
export type CustomProgramObject = anchor.IdlTypes<anchor.Idl>['CustomProgram'];
export type ProfileObject = anchor.IdlTypes<anchor.Idl>['Profile'];
export type ProfileStoreObject = {
  profile: ProfileObject | null,
  pda: anchor.web3.PublicKey | null,
}
export type PollObject = anchor.IdlTypes<anchor.Idl>['Poll'];
export type PollStoreObject = {
  poll: PollObject | null,
  pda: anchor.web3.PublicKey | null,
}
export type VoteObject = anchor.IdlTypes<anchor.Idl>['Vote'];
