import { writable, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';

export const pollsStore: Writable<anchor.IdlTypes<anchor.Idl>['Poll'][]> = writable([]);
