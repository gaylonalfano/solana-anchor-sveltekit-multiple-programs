<script lang="ts">
	/* import { SignMessage, SendTransaction } from '$lib/index'; */

	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl } from '@solana/web3.js';
	import idl from '../../../target/idl/onchain_voting.json';
	import { onMount } from 'svelte';
	import { notificationStore } from '../stores/notification';
	import { Button } from '$lib/index';

	const network = clusterApiUrl('devnet'); // localhost or mainnet */
	// const network = 'http://localhost:8899';
</script>

<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			PDAs + Custom Instruction Data
		</h1>
		<div class="text-center">
			<div class="form-control">
				<label class="input-group input-group-vertical pb-1">
					<span>Color</span>
					<input type="text" placeholder="" class="input input-bordered" />
				</label>
				<button class="btn btn-accent">Create</button>
			</div>
			<div class="form-control">
				<label class="input-group input-group-vertical pb-1">
					<span>Color</span>
					<input type="text" placeholder="" class="input input-bordered" />
				</label>
				<label class="input-group input-group-vertical">
					<span>New Balance</span>
					<input type="text" placeholder="" class="input input-bordered" />
				</label>
				<button class="btn btn-secondary">Modify</button>
			</div>
		</div>
	</div>
</div>
