import { writable, type Writable } from 'svelte/store';
// import * as anchor from '@project-serum/anchor';
import type anchor from '@project-serum/anchor';
// import idl from '../../../../target/idl/onchain_voting_multiple_polls.json';

export const profileStore: Writable<anchor.IdlTypes<anchor.Idl>['Profile']> = writable();
