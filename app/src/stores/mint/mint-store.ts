// https://www.youtube.com/watch?v=h3Qad6k0xFc&t=2s
// https://solanacookbook.com/guides/get-program-accounts.html#deep-dive
import {
	Connection,
	clusterApiUrl,
	type GetProgramAccountsFilter,
	PublicKey
} from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
// NFTs only using Metaplex/js: https://www.youtube.com/watch?v=PEuNrKTTHJY
// ERROR Using metaplex-foundation/js breaks Vite
// import { Metaplex } from '@metaplex-foundation/js';

const WALLET = 'CQKsyMucjRz2NK1HUte2G8NKyWVoKbokpqTfGoyLxur9';

async function getAllSPLTokenProgramAccountsFromWallet() {
	// 1. Establish a connection
	const connection = new Connection(clusterApiUrl('mainnet-beta'));
	// 2. Create our filters as this can be very expensive to process without
	// NOTE We're going to pass this to the getParsedProgramAccounts() function
	// NOTE SPL Token Account Size in Bytes:
	// 0-31: mint: PublicKey
	// 32-63: owner: PublicKey
	// 64-71: amount: u64
	// etc...
	const filters: GetProgramAccountsFilter[] = [
		// Data Size filter:
		{
			dataSize: 165 // All Program accounts are size 165
		},
		// Memory Comparison filter
		{
			memcmp: {
				offset: 32, // Starting point out of 165 byte-long program account
				bytes: WALLET
			}
		}
	];

	// 3. Get the token accounts based on filters
	const tokenAccounts = await connection.getParsedProgramAccounts(
		anchor.utils.token.TOKEN_PROGRAM_ID,
		{ filters }
	);

	// 4. Do what we want...
	tokenAccounts.forEach((account, i) => {
		const parsedAccountInfo = account.account.data as anchor.web3.ParsedAccountData;
		// console.log(parsedAccountInfo);
		// Example:
		// {
		// 	program: 'spl-token',
		// 	parsed: {
		// 		info: {
		// 			isNative: false,
		// 			mint: '8jHmHcNwQXGf4BLsHegRiK9dqeEXWNyCz7dGwTep86sg',
		// 			owner: 'CQKsyMucjRz2NK1HUte2G8NKyWVoKbokpqTfGoyLxur9',
		// 			state: 'initialized',
		// 			tokenAmount: [Object]
		// 		},
		// 		type: 'account'
		// 	},
		// 	space: 165
		// }
		const mintAddress = parsedAccountInfo.parsed.info.mint;
		const tokenBalance = parsedAccountInfo.parsed.info.tokenAmount.uiAmount;

		console.log(`Token Account # ${i + 1}: ${account.pubkey.toString()}`);
		console.log(`---Token Mint ID: ${mintAddress}`);
		console.log(`---Token Balance: ${tokenBalance}`);
		// Token Account # 273: GfiJD5a43AcSeSW7CSzWw73AJLLAzwpAcfK9U9YWz7aj
		// ---Token Mint ID: 4h8DxhV6HHDoMCYq9hAsUJb9SRxuS3wAmwnezVPv3rw7
		// ---Token Balance: 0
		// Token Account # 274: HPDfJEEWmH6yCSmbUtd6AkmGpwBa4SGxFUbo1qqZXPC8
		// ---Token Mint ID: 2NyB8pBgKe7X4zNFL7MaTWM95KkFLd3rQbEpRSb4pV3m
		// ---Token Balance: 1
		// Token Account # 275: HzF18aLXoHHcKafrbgyTwGiJcFT3Pc87mgSyPPvkfRhw
		// ---Token Mint ID: 35PTcAHcQYrRS5QW8fgHx163rWV9ffXU9Y66Hio853P3
		// ---Token Balance: 1
	});
}

// async function getAllNFTAccountsFromWallet() {
// 	// https://www.npmjs.com/package/@metaplex-foundation/js
// 	// 1. Establish a connection
// 	const connection = new Connection(clusterApiUrl('mainnet-beta'));
// 	// 2. Create our Metaplex instance
// 	const metaplex = new Metaplex(connection);

// 	// 3. Configure a task: Task<T>
// 	// NOTE By creating tasks, you can keep track of its progress AND cancel it using AbortSignal
// 	// NOTE Check out all the methods on the Task<T> object for more details
// 	// const task = metaplex.nfts().findAllByOwner({ owner: metaplex.identity().publicKey });
// 	const task = metaplex.nfts().findAllByOwner({ owner: new anchor.web3.PublicKey(WALLET) });

// 	// 4. Run the task
// 	const nfts = await task.run();
// 	// console.log(nfts);

// 	// 5. Do what we want...
// 	nfts.forEach((nft) => {
// 		console.log(nft);
// 	});
// }

// Make our calls
// await getAllSPLTokenProgramAccountsFromWallet();
// await getAllNFTAccountsFromWallet();
