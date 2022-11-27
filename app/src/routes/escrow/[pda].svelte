<script lang="ts">
	// REF: UI idea from: https://github.com/paul-schaaf/escrow-ui/blob/master/src/Alice.vue
	// REF: Good example of web3/spl-token use: https://github.com/paul-schaaf/escrow-ui/blob/master/src/util/initEscrow.ts
	import {
		Keypair,
		LAMPORTS_PER_SOL,
		PublicKey,
		SystemProgram,
		Transaction,
		type GetAccountInfoConfig
	} from '@solana/web3.js';
	import * as anchor from '@project-serum/anchor';
	import {
		TOKEN_PROGRAM_ID,
		MINT_SIZE,
		createInitializeMintInstruction,
		getMinimumBalanceForRentExemptMint,
		getMint,
		getAssociatedTokenAddress,
		createAssociatedTokenAccountInstruction,
		createMintToCheckedInstruction,
		type Mint,
		getAccount
	} from '@solana/spl-token';

	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	// NOTE Anchor.toml setting can copy IDL to specified dir. However, the 'idl' prop
	// on AnchorConnectionProvider wants a JSON instead.
	// import { IDL as idl } from '../idl/non_custodial_escrow';

	import { notificationStore } from '../../stores/notification';
	import { balanceStore } from '$stores/balance';
  import { sellerStore } from '$stores/escrow/seller-store';
  import { buyerStore } from '$stores/escrow/buyer-store';
	import { xMintStore, yMintStore, walletTokenAccountsStore } from '$stores/escrow/tokens-store';
  import { customProgramStore } from '$stores/escrow/custom-program-store';
  import { userStore } from '$stores/escrow/user-store';
	import {
		escrowStore,
		type EscrowObject,
		type EscrowStoreObject
	} from '$stores/escrow/escrow-store';
	import * as constants from '../../helpers/escrow/constants';
	import { get } from 'svelte/store';
	// import type { EscrowObject, EscrowStoreObject } from 'src/models/escrow-types';
</script>




<div class="flex w-full justify-evenly">
    <div class="grid flex-grow card bg-base-300 rounded-box place-items-center">
      <div class="form-control mb-4">
        <div class="stat place-items-center">
          <div class="stat-title">Escrow</div>
        </div>
        <label class="input-group input-group-vertical pt-1">
          <span>Escrow PDA</span>
          <input
            type="text"
            placeholder=""
            class="input input-bordered"
            bind:value={$escrowStore.pda}
            disabled
          />
        </label>
        <label class="input-group input-group-vertical pt-1">
          <span>Out Amount</span>
          <input
            type="text"
            placeholder=""
            class="input input-bordered"
            bind:value={$escrowStore.escrow.outAmount}
            disabled
          />
        </label>
        <label class="input-group input-group-vertical pt-1">
          <span>In Amount</span>
          <input
            type="text"
            placeholder=""
            class="input input-bordered"
            bind:value={$escrowStore.escrow.inAmount}
            disabled
          />
        </label>
        <label class="input-group input-group-vertical pt-1">
          <span>Escrowed Token Account</span>
          <input
            type="text"
            placeholder=""
            class="input input-bordered"
            bind:value={$escrowStore.escrow.escrowedOutTokenAccount}
            disabled
          />
        </label>
        <button class="btn btn-accent mt-1" on:click={handleAcceptTrade}>Accept Escrow</button>
        <button class="btn btn-error mt-1" on:click={handleCancelTrade}>Cancel Escrow</button>
      </div>
    </div>
</div>
