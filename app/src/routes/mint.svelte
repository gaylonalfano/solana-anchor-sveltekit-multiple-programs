<script lang="ts">
	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { onMount } from 'svelte';
	import { notificationStore } from '../stores/notification';
	import { Button } from '$lib/index';

	const testNftTitle = 'Frontend Title';
	const testNftSymbol = 'TEST';
	const testNftUri =
		'https://raw.githubusercontent.com/gaylonalfano/solana-anchor-metaplex-mint-sell-nfts/main/assets/example.json';

	const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
		'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
	);

	async function handleMintNft() {
		// 1. Derive the mint address of NFT and associated token account address
		// NOTE We just derive the account addresses on the Client-side, and then
		// let our program take care of creating the actual accounts
		const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
		const tokenAccountAddress = await anchor.utils.token.associatedAddress({
			mint: mintKeypair.publicKey,
			owner: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey // $walletStore.publicKey as anchor.web3.PublicKey
		});
		console.log(`New token (mint): ${mintKeypair.publicKey}`);
		// 2. Derive the metadata account and master edition metadata account addresses
		// NOTE I believe we're using PDAs for these accounts. Specifically,
		// we're using findProgramAddress and passing it some seeds.
		// IMPORTANT This is finding an address (PDA, I think) on Solana that can exist with these seeds,
		// and we're going to use it to create the address (of metadata account) that points to the mint
		// We're ONLY finding the ADDRESS! Our program will do the actual creating of the metadata account!
		// Q: Do I need to wrap the await inside parens? (await anchor...)
		// A: Don't believe so. Just an alternate syntax
		const metadataAccountAddress = (
			await anchor.web3.PublicKey.findProgramAddress(
				[
					Buffer.from('metadata'),
					TOKEN_METADATA_PROGRAM_ID.toBuffer(),
					mintKeypair.publicKey.toBuffer()
				],
				TOKEN_METADATA_PROGRAM_ID // Program that will own the PDA
			)
		)[0]; // Just want the address
		console.log(`Metadata Account Address (PDA) initialized: ${metadataAccountAddress}`);
		// let [metadataAccountAddress, metadataAccountBump] =
		//   await anchor.web3.PublicKey.findProgramAddress(
		//     [
		//       Buffer.from("metadata"),
		//       TOKEN_METADATA_PROGRAM_ID.toBuffer(),
		//       mintKeypair.publicKey.toBuffer(),
		//     ],
		//     TOKEN_METADATA_PROGRAM_ID // Program that will own the PDA
		//   );
		// console.log(
		//   `Metadata Account Address (PDA) initialized: ${metadataAccountAddress}`
		// );

		let masterEditionMetadataAccountAddress = (
			await anchor.web3.PublicKey.findProgramAddress(
				[
					Buffer.from('metadata'),
					TOKEN_METADATA_PROGRAM_ID.toBuffer(),
					mintKeypair.publicKey.toBuffer(),
					Buffer.from('edition')
				],
				TOKEN_METADATA_PROGRAM_ID
			)
		)[0]; // Just want the address
		console.log(
			`Master Edition Metadata Account Address (PDA) initialized: ${masterEditionMetadataAccountAddress}`
		);
		// Handy account info search. This errors because there is no
		// local version of MP Token Program in the local test validator
		// let metaplexTokenProgramAccountInfo =
		//   await provider.connection.getAccountInfo(TOKEN_METADATA_PROGRAM_ID);
		// console.log(
		//   `${TOKEN_METADATA_PROGRAM_ID.toString()} length: ${
		//     metaplexTokenProgramAccountInfo.data.length
		//   }`
		// );
		// let [
		//   masterEditionMetadataAccountAddress,
		//   masterEditionMetadataAccountBump,
		// ] = await anchor.web3.PublicKey.findProgramAddress(
		//   [
		//     Buffer.from("metadata"),
		//     TOKEN_METADATA_PROGRAM_ID.toBuffer(),
		//     mintKeypair.publicKey.toBuffer(),
		//     Buffer.from("master-edition"),
		//   ],
		//   TOKEN_METADATA_PROGRAM_ID // Program that will own the PDA
		// ); // Just want the address
		// console.log(
		//   `Master Edition Metadata Account Address (PDA) initialized: ${masterEditionMetadataAccountAddress}`
		// );

		// 2. Transact with the mint_nft() fn in our on-chain program
		// NOTE This sends and confirms the transaction in one go!
		// FIXME: Encountered two errors when running anchor test:
		// -- One about metadata not being added correctly or at all
		// -- Two was the familiar ix error: instruction modified the
		// UPDATE: Turns out was running older version of Solana program CLI!
		// program ID of an account. In the past, this was space/size related...
		// NOTE You DO NOT pass the Context as an arg! Anchor does this automatically!
		const tx = await $workspaceStore.program?.methods
			.mint(testNftTitle, testNftSymbol, testNftUri)
			// NOTE We only provide the PublicKeys for all the accounts.
			// We do NOT have to deal with isSigner, isWritable, etc. like in RAW
			// since we already declared that in the program MintNft Context struct.
			// This means Anchor will look for all that info in our MintNft struct
			// ON ENTRY!
			// NOTE We also don't have to pass the System Program, Token Program, and
			// Associated Token Program, since Anchor resolves these automatically. We
			// only have to pass in Token Metadata Program since it's 'UncheckedAccount'
			.accounts({
				masterEditionMetadata: masterEditionMetadataAccountAddress,
				metadata: metadataAccountAddress,
				mint: mintKeypair.publicKey,
				tokenAccount: tokenAccountAddress,
				mintAuthority: ($workspaceStore.provider as anchor.AnchorProvider).wallet.publicKey,
				tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID
				// Q: What about the others (tokenProgram, associatedTokenProgram, rent, etc.)?
				// A: It's because Anchor automatically resolves these.
				// A: We add tokenMetadataProgram because it's UNCHECKED!
				// Q: AFTER a successful mint, How does the Token/Mint's Mint Authority transfer
				// to the Master Edition Metadata Account? We specify mintAuthority: wallet.publicKey,
				// but in Solana Explorer, the Token's 'Mint Authority'= Master Edition Metadata Account
				// and 'Update Authority' = Wallet
			})
			// NOTE I was right that the mintKeypair and wallet are signers,
			// but you don't pass wallet as signer for Anchor. It already knows.
			.signers([mintKeypair])
			.rpc({ skipPreflight: true }); // Get better logs

		// 3. Add notification
		notificationStore.add({
			type: 'success',
			message: 'Transaction successful!',
			txid: tx
		});
	}
</script>

<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Mint
		</h1>
		<div class="text-center">
			<Button disabled={!$walletStore.publicKey} on:click={handleMintNft}>Mint</Button>
		</div>
	</div>
</div>
