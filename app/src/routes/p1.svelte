<script lang="ts">
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { clusterApiUrl } from '@solana/web3.js';
	import idl from '../../../target/idl/program_1.json';

	const network = clusterApiUrl('devnet'); // localhost or mainnet */
	// const network = 'http://localhost:8899';

	$: {
		console.log($workspaceStore?.program);
	}
</script>

<AnchorConnectionProvider {network} {idl} />
<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Program 1
		</h1>
		<div class="text-center">
			<h3>Workspace Program (w/IDL)</h3>
			{$workspaceStore?.program?.idl.name}
		</div>
	</div>
</div>
