import { writable, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';

export const customProgramStore: Writable<anchor.IdlTypes<anchor.Idl>['CustomProgram']> =
	writable();
