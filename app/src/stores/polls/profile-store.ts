import { writable, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';

export const profileStore: Writable<anchor.IdlTypes<anchor.Idl>['Profile']> = writable();
