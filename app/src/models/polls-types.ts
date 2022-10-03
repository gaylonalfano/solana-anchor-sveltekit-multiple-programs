import type anchor from '@project-serum/anchor';

// NOTE Think this works... Just need to import type { XObject } from ...
export type CustomProgramObject = anchor.IdlTypes<anchor.Idl>['CustomProgram'];
export type ProfileObject = anchor.IdlTypes<anchor.Idl>['Profile'];
export type PollObject = anchor.IdlTypes<anchor.Idl>['Poll'];
export type VoteObject = anchor.IdlTypes<anchor.Idl>['Vote'];
