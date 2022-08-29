// https://www.youtube.com/watch?v=h3Qad6k0xFc&t=2s
// https://solanacookbook.com/guides/get-program-accounts.html#deep-dive
import { Connection, type GetProgramAccountsFilter } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
// NFTs Only using Metaplex

const WALLET = 'CQKsyMucjRz2NK1HUte2G8NKyWVoKbokpqTfGoyLxur9';

async function getAllSPLTokenProgramAccountsFromWallet() {
	const connection = new Connection('https://solana-api.projectserum.com');
	// 1. Create our filters as this can be very expensive to process without
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

	// 2. Get the token accounts based on filters
	const tokenAccounts = await connection.getParsedProgramAccounts(
		anchor.utils.token.TOKEN_PROGRAM_ID,
		{ filters }
	);

	// 3. Do what we want...
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

async function getAllNFTAccountsFromWallet() {
	const connection = new Connection('https://solana-api.projectserum.com');
	// 1. Create our filters as this can be very expensive to process without
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

	// 2. Get the token accounts based on filters
	const tokenAccounts = await connection.getParsedProgramAccounts(
		anchor.utils.token.TOKEN_PROGRAM_ID,
		{ filters }
	);

	// 3. Do what we want...
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

getAllSPLTokenProgramAccountsFromWallet();
