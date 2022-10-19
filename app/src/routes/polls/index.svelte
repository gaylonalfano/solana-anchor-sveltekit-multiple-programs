<script lang="ts">
	import * as anchor from '@project-serum/anchor';
	import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
	import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
	import { AnchorConnectionProvider } from '@svelte-on-solana/wallet-adapter-anchor';
	import { PublicKey, type GetProgramAccountsFilter } from '@solana/web3.js';
	import type { OnchainVotingMultiplePolls } from '../../idl/onchain_voting_multiple_polls';
	import idl from '../../../../target/idl/onchain_voting_multiple_polls.json';
	import { onMount, beforeUpdate, afterUpdate, tick } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { get } from 'svelte/store';
	import { notificationStore } from '$stores/notification';
	import { customProgramStore } from '$stores/polls/custom-program-store';
	import { profileStore } from '$stores/polls/profile-store';
	import { profilesStore } from '$stores/polls/profiles-store';
	import { pollStore } from '$stores/polls/poll-store';
	import { pollsStore } from '$stores/polls/polls-store';
	import { Button } from '$lib/index';
	// import Poll from '$lib/Poll.svelte';
	import * as constants from '../../helpers/polls/constants';
	import type {
		CustomProgramObject,
		ProfileObject,
		PollObject,
		VoteObject
	} from '../../models/polls-types';

	/*
    TODOs:
      - Create some sort of onMount or possibly load() that fetches
        program accounts and updates customProgramStore, pollsStore,
        and profileStore WHEN WALLET CHANGES!
        - Look into $: reactive statements
        - Or, perhaps create custom Stores for each and run each
          getXAccount() method e.g.:
            customProgramStore.getCustomProgramAccount()
            profileStore.getProfileAccount()
            pollsStore.getPollsAccounts()
      - Add notifications for errors (2nd attempts, no SOL, no Profile, etc)
      - Look into how to move getAllProgramAccounts() to separate file
  */

	const network = constants.NETWORK;

	// U: onMount runs BEFORE workspace is connected!
	// Q: How can I fire off a getAllPollsProgramAccounts()
	onMount(async () => {
		console.log('Component MOUNTED');
		// FIXME If I want to use this, then I need to fix the
		// method to set() to null if the account can't be found yet
		// await customProgramStore.getCustomProgramAccount();
	});

	beforeUpdate(() => console.log('Component BEFORE UPDATE.'));
	afterUpdate(() => console.log('Component AFTER UPDATE.\n =================='));

	// Global state
	// Q: Any way to access the PDA Address from Stores?
	// Or, do I need to maintain separate vars for PDA addresses?
	// U: Adding a customProgramPdaStore to keep state regardless of wallet
	// U: Gonna need more Stores in general I believe...
	// A: YES! Can save PDA to custom Store using custom types!
	let customProgram: CustomProgramObject;

	let profile: ProfileObject;
	let profileHandle: string = 'testHandle';
	let profileDisplayName: string = 'testDisplayName';

	let poll: PollObject;
	let pollOptionADisplayName: string = 'Option A';
	let pollOptionBDisplayName: string = 'Option B';

	let vote: VoteObject;
	let votePda: anchor.web3.PublicKey;

	// Q: How to update the profile (and its PDA) whenever wallet changes?
	// FIXME Infinite loop!
	// $: if ($profileStore && $walletStore.publicKey) {
	// 	PublicKey.findProgramAddress(
	// 		[
	// 			anchor.utils.bytes.utf8.encode(PROFILE_SEED_PREFIX),
	// 			($walletStore.publicKey as anchor.web3.PublicKey).toBuffer(), // authority
	// 			anchor.utils.bytes.utf8.encode($profileStore.profileNumber)
	// 		],
	// 		$workspaceStore.program?.programId as anchor.web3.PublicKey
	// 	).then((response) => {
	// 		profilePda = response[0];
	// 		console.log('UPDATED profilePda!', profilePda);
	// 	});
	// }

	// REF: Check out SolAndy's YT video on deserializing account data
	// Q: How to pre-fetch data? How to use getAllProgramAccounts()
	//    Need to wait for workspace and wallet Stores before invoking...
	// $: $walletStore.connected && $customProgramStore.getCustomProgramAccount();
	// Q: What about this from /basic example? Reactive declarations may help
	// NOTE The below syntax forces JS to intepret the statement as an expression,
	// destructuring the values.
	// REF: https://svelte-recipes.netlify.app/language/#variable-deconstruction
	// $: ({ publicKey, sendTransaction } = $walletStore);
	// REF: https://svelte-recipes.netlify.app/language/#defining-dependencies
  // U: Think I may need to reset my Stores before the fetch...
  // A: Yep, added a reset() just before updating my arrays Stores
  // Q: Watch the entire walletStore or just walletStore.publicKey or walletStore.connected?
  // U: publicKey or connected seem to invoke at the same time.
  // U: Looks like connected == true && connecting == false is the best... need to test
  // Otherwise, it gPA() gets invoked multiple times.
  // U: Actually: connected=true && connecting=false && disconnecting=false
	// $: $walletStore && getAllProgramAccounts(); // Too many triggers
	// $: $walletStore.publicKey && getAllProgramAccounts();
	// $: $walletStore.connected && getAllProgramAccounts(); // Runs SEVERAL times
	// $: $walletStore.connected && !$walletStore.connecting && getAllProgramAccounts(); // Runs TWICE (disconnect & connect)
	// $: $walletStore.connected 
 //    && !$walletStore.connecting 
 //    && !$walletStore.disconnecting 
 //    && getAllProgramAccounts(); // First call is EMTPY!
	// $: $walletStore.connected 
 //    && !$walletStore.connecting 
 //    && !$walletStore.disconnecting 
 //    && getAllProgramAccounts().then(response => console.log('gPA response:', response)); // First call is EMPTY!
  // U: Trying $: tick().then(() => ....)
  // REF: https://dev.to/isaachagoel/svelte-reactivity-gotchas-solutions-if-you-re-using-svelte-in-production-you-should-read-this-3oj3
  // $: tick().then(async () => {
  //   if($walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting) {
  //     await getAllProgramAccounts();
  //   }
  // }) // WORKS on refresh! Q: Need async/await? A: No. See below
  // $: tick().then(() => {
  //   if($walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting) {
  //     getAllProgramAccounts();
  //   }
  // }) // WORKS on refresh! async/await not needed it seems...
  // Q: tick() needed?
  // A: Don't think so as long as I add conditions!
  $: if($walletStore.connected && !$walletStore.connecting && !$walletStore.disconnecting) {
      getAllProgramAccounts();
    } // WORKS on refresh! tick() may not be needed after all when adding conditions!
  

	$: {
		// console.log('walletStore: ', $walletStore);
		// console.log('walletStore.PUBLICKEY: ', $walletStore.publicKey?.toBase58());
		// console.log('walletStore.CONNECTED: ', $walletStore.connected);
		// console.log('walletStore.CONNECTING: ', $walletStore.connecting);
		// console.log('walletStore.DISCONNECTING: ', $walletStore.disconnecting);
		// console.log('customProgram: ', customProgram);
		console.log('customProgramStore: ', $customProgramStore);
		// console.log('profilePda: ', profilePda?.toBase58());
		console.log('profileStore: ', $profileStore);
		// console.log('pollPda: ', pollPda);
		// console.log('pollStore: ', $pollStore);
		// console.log('pollsStore: ', $pollsStore);
		console.log('workspaceStore: ', $workspaceStore);
	}

	/*
	 * Create a dApp level PDA data account
	 */
	async function handleCreateCustomProgram() {
		if ($customProgramStore.customProgram) {
			notificationStore.add({
				type: 'error',
				message: 'Data account already exists!'
			});
			console.log('error', 'Data account already exists!');
			return;
		}

		const [pda, bump] = await PublicKey.findProgramAddress(
			[anchor.utils.bytes.utf8.encode(constants.CUSTOM_PROGRAM_SEED_PREFIX)],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			pda.toBase58()
		);

		const tx = await $workspaceStore.program?.methods
			.createCustomProgram()
			.accounts({
				customProgram: pda,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms and update our state/store
		const currentCustomProgram = (await $workspaceStore.program?.account.customProgram.fetch(
			pda
		)) as CustomProgramObject;
		// NOTE ONLY updating state AFTER tx is successful.
		// Q: Use set() or update()?
		// U: Both seem to do the job...
		// Q: Can I add a custom prop to my Store to save PDA?
		// $customProgramStore.pda = pda as PublicKey; // E: type 'never'??
		// U: Doesn't seem so... May need a custom type for the Store?
		// get(customProgramStore).pda = pda; // E: null property
		// Q: What about customProgramStoreWithPda?
		// A: Yes! Reworked it so now PDA is stored directly in Store.
		customProgramStore.set({ customProgram: currentCustomProgram, pda });
	}

	async function handleCreateProfile() {
		const profileCount = (
			$customProgramStore.customProgram?.totalProfileCount.toNumber() + 1
		).toString();
		console.log('profileCount: ', profileCount);

		// NOTE Error processing Instruction 0: Cross-program invocation
		// with unauthorized signer or writable account
		// REF: https://stackoverflow.com/questions/72849618/transaction-simulation-failed-error-processing-instruction-0-cross-program-inv
		// U: Check the seeds!
		const [pda, bump] = await PublicKey.findProgramAddress(
			// U: Removing profileCount from seeds so can't create multiple Profiles
			[
				anchor.utils.bytes.utf8.encode(constants.PROFILE_SEED_PREFIX),
				($walletStore.publicKey as anchor.web3.PublicKey).toBuffer() // authority
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			pda.toBase58()
		);

		const tx = await $workspaceStore.program?.methods
			.createProfile(profileHandle, profileDisplayName)
			.accounts({
				profile: pda,
				customProgram: $customProgramStore.pda as anchor.web3.PublicKey,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// .signers([testUser1]) // Not needed with AnchorWallet
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms & update global state
		const currentProfile = (await $workspaceStore.program?.account.profile.fetch(
			pda
		)) as ProfileObject;
		// NOTE Only after the tx is successful do we update our state
		// Q: update() or set() Store?
		profileStore.set({ profile: currentProfile, pda });
		profilesStore.addProfile(currentProfile, pda);

		const currentCustomProgram = (await $workspaceStore.program?.account.customProgram.fetch(
			$customProgramStore.pda as anchor.web3.PublicKey
		)) as CustomProgramObject;
		// Q: update() or set() Store?
		// A: I believe just set() since we overwrite the whole thing
		customProgramStore.set({ customProgram: currentCustomProgram, pda: $customProgramStore.pda });
	}

	async function handleCreatePoll() {
		// Q: If the same user goes between /polls or /polls/[pollNumber],
		// then all the local PDAs get cleared. Maybe consider storing the PDA
		// in the actual account? Or, perhaps attempt to derive if not available?
		// This is a common challenge for me...
		// U: If I add <a> links then the state remains and isn't cleared. However, if I
		// change wallets, then the user state gets wiped.
		// A: Ended up creating a separate PdaStore for this
		// U: Need to explore reactive statement (e.g. useEffect on wallet.publicKey change)
		const pollCount: string = (
			$customProgramStore.customProgram?.totalPollCount.toNumber() + 1
		).toString();
		console.log('pollCount: ', pollCount);

		// NOTE From Anchor PDA example: https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor
		// NOTE They find the PDA address INSIDE the it() test!
		const [pda, bump] = await PublicKey.findProgramAddress(
			[
				anchor.utils.bytes.utf8.encode(constants.POLL_SEED_PREFIX),
				// Q: Need wallet publicKey? Won't this restrict to only that user
				// being able to write to PDA?
				// A: YES! The original crunchy-vs-smooth didn't use wallet pubkeys,
				// since that would create a unique PDA for the user (not users!).
				anchor.utils.bytes.utf8.encode(pollCount)
			],
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		console.log(
			'PDA for program',
			$workspaceStore.program?.programId.toBase58(),
			'is generated :',
			pda.toBase58()
		);

		// Following this example to call the methods:
		// https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
		const tx = await $workspaceStore.program?.methods
			.createPoll(pollOptionADisplayName, pollOptionBDisplayName)
			.accounts({
				poll: pda,
				profile: $profileStore.pda as anchor.web3.PublicKey,
				customProgram: $customProgramStore.pda as anchor.web3.PublicKey,
				authority: $walletStore.publicKey as anchor.web3.PublicKey,
				systemProgram: anchor.web3.SystemProgram.programId
			})
			// .signers([testUser1]) // AnchorWallet
			.rpc();
		console.log('TxHash ::', tx);

		// Fetch data after tx confirms & update global state
		const currentPoll = (await $workspaceStore.program?.account.poll.fetch(pda)) as PollObject;
		pollStore.set({ poll: currentPoll, pda: pda });
		pollsStore.addPoll(currentPoll, pda);
		// pollsStore.addPollStore({ poll: currentPoll, pda: pda });

		const currentProfile = (await $workspaceStore.program?.account.profile.fetch(
			$profileStore.pda as anchor.web3.PublicKey
		)) as ProfileObject;
		profileStore.set({ profile: currentProfile, pda: $profileStore.pda });
		const currentCustomProgram = (await $workspaceStore.program?.account.customProgram.fetch(
			$customProgramStore.pda as anchor.web3.PublicKey
		)) as CustomProgramObject;
		// Q: update() or set() Store?
		customProgramStore.set({ customProgram: currentCustomProgram, pda: $customProgramStore.pda });
	}


  // Try to fetch program accounts using getProgramAccounts()
	// REF: https://www.notion.so/Solana-Quick-Reference-c0704fee2afa4ee5827ded6937ef47df#680c6b9f0f074a37bfe02579309faad2
	// REF: https://solanacookbook.com/guides/get-program-accounts.html#filters
	export async function getAllProgramAccounts() {
		if (!get(walletStore)) throw Error('Wallet not connected!');
		if (!get(workspaceStore)) throw Error('Workspace not found!');

    // NOTE After some testing, looks like the best condition to trigger this fn is:
    // walletStore.connected=true, connecting=false, disconnecting=false
    console.log("getAllProgramAccounts INVOKED!")

		// 1. Establish a connection
		const { connection } = $workspaceStore;

		// 2. Create our filters
		// NOTE We're going to pass this to the getParsedProgramAccounts() function
		// Q: Account size 165 or was that for SPLToken accounts only?
		// My hunch is that the sizes vary (Profile, Poll, Vote, etc.)
		// A: NO! Account size VARIES! E.g., Size matches the ACCOUNT_SPACE!
		// CustomProgram=65, Poll=154, Profile=145
		// FIXME Why don't Profiles and Polls filters work????
		// Q: Is it my memcmp.offset? I *believe* that offset is
		// the starting point in account.data to start comparing to
		// the 'bytes' string value byte-by-byte. So, in this case,
		// we're trying to match on 'authority' (i.e., wallet address)
		// U: I think I can get customProgramFilter to work bc its fields
		// are all ints mostly. Perhaps the String fields in Poll and Profile
		// structs makes it harder to pinpoint the offset?
		// IMPORTANT: String is Vec<u8> and each UTF-8 char can use up to 4 bytes each
		// And the first 4 bytes is a PREFIX that stores the String's total length (not max possible)!
		// You define the MAX size allocation for String in the struct, BUT that doesn't
		// mean you'll actually use up the entire space! THIS CAN AFFECT WHERE NEXT PROPERTY
		// IS LOCATED! So, this 4 byte prefix is crucial bc it needs to be accounted for!
		// REF: https://lorisleiva.com/create-a-solana-dapp-from-scratch/structuring-our-tweet-account
		// U: So, does (above) mean my MAX Poll size is 154, but because my two String
		// fields (option_a/b labels) will vary? NOTE: I allocated 40 bytes per label,
		// which means I could treat it like 10 * 4 = 40 bytes (10 chars max)
		// U: I moved 'authority' in CustomProgram struct to be the first field. Then,
		// Then I updated the filter memcmp offset: 8, since 0-7 is for DISCRIMINATOR!
		// and it worked! The challenge with Poll and Profile is due to the String fields!
		// U: I added 4 bytes for STRING_LENGTH_PREFIX, so 8 bytes total to Poll::ACCOUNT_SPACE (162)
		// U: I also shifted 'authority' to the first struct field, so can target offset easier
		// This way I odn't have to worry about varying length of display labels.
		// A: WORKS! Just a matter of pinpointing the offset value! Moving 'authority' to a
		// predictable position worked! THIS MEANS THAT I could create account-type specific
		// queries, AND THEN use program.account.[accountType].fetch(pubkey)!
		const pollsFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 162 // VARIES by the Account::ACCOUNT_SPACE!
			}
		];

		// Q: Should I filter by 'authority' here or just fetch all?
		// U: I chose to add additional filter since I'd have to loop over
		// all accounts, decode data, and then compare authority values
		// May have to rethink this after lots of accounts
		const pollsByAuthorityFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 162 // VARIES by the Account::ACCOUNT_SPACE!
			},
			{
				memcmp: {
					offset: 8, // Starting point. 'authority'
					bytes: $walletStore.publicKey!.toBase58()
				}
			}
		];

		const profilesFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 153
			}
		];

		const profilesByAuthorityFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 153
			},
			{
				memcmp: {
					offset: 8, // Starting point for 'authority'
					bytes: $walletStore.publicKey!.toBase58()
				}
			}
		];

		const customProgramFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 65
			},
			{
				memcmp: {
					offset: 8, // 32 when 'authority' was just before bump
					// Q: Shouldn't the authority be a CONST instead of wallet-based?
					// bytes: $walletStore.publicKey!.toBase58() 
					bytes: "2BScwdytqa6BnjW6SUqKt8uaKYn6M4gLbWBdn3JuJWjE"
				}
			}
		];

    const votesFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 115
			},
		];


		const votesByAuthorityFilter: GetProgramAccountsFilter[] = [
			{
				dataSize: 115
			},
			{
				memcmp: {
					offset: 8, // 32 when 'authority' was just before bump
					bytes: $walletStore.publicKey!.toBase58(),
				}
			},
		];

		// 3. Get the accounts based on filters
    // FIXME For some reason, whichever function runs next comes back empty!
    // You can swap the order and still comes back empty while the rest work.
    // Is my reactive able to be async to await these? Strange...
    // My function is async, but the reactive cannot await, so I feel like
    // the first function is getting skipped (not awaited).
    // Q: Do I need to use .then() inside the reactive statement?
    // U: Don't think so since this fn returns void...
    // U: I think I'm BLOCKING by doing multiple awaits. 
    // I believe I should maybe remove the 'await' and just get the Promises,
    // and then using 'await Promise.all(promises)' at the very end.
    // REF: https://www.learnwithjason.dev/blog/keep-async-await-from-blocking-execution
    // REF: https://www.notion.so/JavaScript-Quick-Reference-fa8a9e4d328d4a40aec6399a45422c53#eeb2c037a55c4f0e845389b1965a888d
    // === PROMISE.ALL()
		const customProgramAccountsPromise = connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: customProgramFilter }
		);
    console.log('1. customProgramAccountsPromise AFTER gPA()+filters', customProgramAccountsPromise);

		// Only filtering on dataSize to reduce requests
		const profileAccountsPromise = connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: profilesFilter }
		);
    console.log('2. profileAccounts AFTER gPA()+filters', profileAccountsPromise);

		const profileAccountsByAuthorityPromise = connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: profilesByAuthorityFilter }
		);
    console.log('3. profileAccountsByAuthority AFTER gPA()+filters', profileAccountsByAuthorityPromise);

		const pollAccountsPromise = connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: pollsFilter }
		);
    console.log('4. pollAccounts AFTER gPA()+filters', pollAccountsPromise);

		const pollAccountsByAuthorityPromise = connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: pollsByAuthorityFilter }
		);
    console.log('5. pollAccountsByAuthority AFTER gPA()+filters', pollAccountsByAuthorityPromise);

    const voteAccountsPromise = connection.getProgramAccounts(
      $workspaceStore.program?.programId as PublicKey,
      { filters: votesFilter }
    );
    console.log('6. voteAccounts AFTER gPA()+filters', voteAccountsPromise);

    const voteAccountsByAuthorityPromise = connection.getProgramAccounts(
      $workspaceStore.program?.programId as PublicKey,
      { filters: votesByAuthorityFilter }
    );
    console.log('7. voteAccountsByAuthority AFTER gPA()+filters', voteAccountsByAuthorityPromise);

    // NOTE Trying to use Promise.all() instead of blocking with multiple 'await' calls
    const accountsPromises = [
      customProgramAccountsPromise,
      profileAccountsPromise,
      profileAccountsByAuthorityPromise,
      pollAccountsPromise,
      pollAccountsByAuthorityPromise,
      voteAccountsPromise,
      voteAccountsByAuthorityPromise
    ];
    const filteredResults = await Promise.all(accountsPromises);
    console.log('filteredResults after Promise.all(): ', filteredResults);


    // === AWAIT
    const customProgramAccounts = await connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: customProgramFilter }
		);
    console.log('1. customProgramAccounts AFTER gPA()+filters', customProgramAccounts);

		// Only filtering on dataSize to reduce requests
		const profileAccounts = await connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: profilesFilter }
		);
    console.log('2. profileAccounts AFTER gPA()+filters', profileAccounts);

		const profileAccountsByAuthority = await connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: profilesByAuthorityFilter }
		);
    console.log('3. profileAccountsByAuthority AFTER gPA()+filters', profileAccountsByAuthority);

		const pollAccounts = await connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: pollsFilter }
		);
    console.log('4. pollAccounts AFTER gPA()+filters', pollAccounts);

		const pollAccountsByAuthority = await connection.getProgramAccounts(
			$workspaceStore.program?.programId as PublicKey,
			{ filters: pollsByAuthorityFilter }
		);
    console.log('5. pollAccountsByAuthority AFTER gPA()+filters', pollAccountsByAuthority);

    const voteAccounts = await connection.getProgramAccounts(
      $workspaceStore.program?.programId as PublicKey,
      { filters: votesFilter }
    );
    console.log('6. voteAccounts AFTER gPA()+filters', voteAccounts);

    const voteAccountsByAuthority = await connection.getProgramAccounts(
      $workspaceStore.program?.programId as PublicKey,
      { filters: votesByAuthorityFilter }
    );
    console.log('7. voteAccountsByAuthority AFTER gPA()+filters', voteAccountsByAuthority);

		// NOTE No filter - get all accounts and check size
		const programAccounts = await connection.getProgramAccounts(
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);
    console.log('8. ALL programAccounts: ', programAccounts);





		// const parsedProgramAccounts = await connection.getParsedProgramAccounts(
		// 	$workspaceStore.program?.programId as PublicKey
		// );


		// Q: What does program.state return?
		// U: Nothing??? Need to look into this more.
		// const programState = await $workspaceStore.program?.state.fetch(); // null
		// console.log(programState);

		// 4. Do what we want... i.e., Update our Stores state
		// Q: Why is the AccountInfo data returning a Buffer? How do I parse the data?
		// U: Turns out you parse the account according to its struct. So, each program
		// will package it up differently. However, if the account is a data account,
		// then you may be able to read the data using the program.account.fetch() API.
		// U: By using getProgramAccounts() and then fetch(), you're essentially fetching TWICE.
		// Was suggested to gPA and then program.coder.accounts.decode(), but how?
		// A: Need to manually decode using program.coder!
		// console.log('=== CustomProgram ===');
		// NOTE Each item in array is type: { account: AccountInfo<Buffer>, pubkey: PublicKey }
    // NOTE Must use map() NOT forEach()!
    customProgramStore.reset();
		const decodedCustomProgramAccounts = customProgramAccounts.map((value) => {
			// const parsedAccountInfo = value.account.data as anchor.web3.ParsedAccountData;
			// console.log(parsedAccountInfo); // Uint8Array
			// // console.log(parsedAccountInfo.parsed); // null

			// Manually decode and update Store
			const decodedAccountInfo = $workspaceStore.program!.coder.accounts.decode(
				'CustomProgram',
				value.account.data
			); // WORKS! It's CAPITAL 'P'!
			console.log('decodedAccountInfo: ', decodedAccountInfo);

			// Update Store state
      console.log("UPDATING customProgramStore from inside gPA()")
			customProgramStore.set({ customProgram: decodedAccountInfo, pda: value.pubkey }); // ?
			// customProgramStore.update((current) => {
   //      current.customProgram = decodedAccountInfo;
   //      current.pda = value.pubkey;
   //      return current;
   //    }) // WORKS!
		});

		// console.log('=== Profiles ===');
		// Q: What does program.coder look like?
		// Q: Does my workspaceStore.program have the Idl of OnchainVotingMultiplePolls?
		// Q: Is there a Typing issue i.e., should it say BorshCoder or just Coder?
		// A: See below:
		// console.log("program: ");
		// console.log($workspaceStore.program!) // Program {coder, idl, programId, provider}
		// console.log("program.coder: ");
		// console.log($workspaceStore.program!.coder) // BorshCoder {instructions, accounts, events}
		// console.log("program.coder.accounts: ");
		// console.log($workspaceStore.program!.coder.accounts) // BorshAccountsCoder {accountLayouts, idl}

		// Q: How to use program.coder?
		// REF: program.coder.accounts.decode<anchor.IdlAccounts<DegenerateStar>["star"]>("star", data!);
		// A: program.coder.accounts.decode("Profile", value.account.data); No need for types since we have IDL!
    // Q: Should I reset my Stores before the fetch? I think so, 
    // since my pollsStore, profilesStore arrays are duplicating.
    // U: Gonna try only resetting my arrays
    // A: Yep, seems to be working correctly now...
    profilesStore.reset();
		const decodedProfileAccounts = profileAccounts.map((value) => {
			const decodedAccountInfo = $workspaceStore.program!.coder.accounts.decode(
				'Profile',
				value.account.data
			); // WORKS! It's CAPITAL 'P'!

			// Update Store state
      console.log("UPDATING profilesStore from inside gPA()")
			profilesStore.addProfile(decodedAccountInfo, value.pubkey);
			// profilesStore.update((profiles) => [...profiles, decodedAccountInfo]);
		});

		const decodedProfileAccountsByAuthority = profileAccountsByAuthority.map((value) => {
			const decodedAccountInfo = $workspaceStore.program!.coder.accounts.decode(
				'Profile',
				value.account.data
			);
			// Update Store state
      console.log("UPDATING profileStore from inside gPA()")
			profileStore.set({ profile: decodedAccountInfo, pda: value.pubkey });

			// === Debugging below ===
			// $workspaceStore.program?.account.profile._coder.decode("Profile", account.account.data as Buffer); // E: _coder is private
			// return $workspaceStore.program!.coder.accounts.decode("profile", account.account.data); // E: Unknown account: profile

			// return $workspaceStore.program!.coder.accounts.decode("Profile", account.account.data); // WORKS! It's CAPITAL 'P'!
			// return $workspaceStore.program?.coder.accounts.decode<anchor.IdlTypes<anchor.Idl>["Profile"]>("profile", account.account.data as Buffer); // Error: Unknown account: profile
			// return $workspaceStore.program?.coder.profile.decode<anchor.IdlTypes<anchor.Idl>["Profile"]>("Profile", value.account.data); // E: 'profile' does not exist on type 'Coder'

			// return $workspaceStore.program?.coder<anchor.IdlAccounts<OnchainVotingMultiplePolls>["profile"]>
			//   .profile.decode("Profile", value.account.data); // E:

			// return $workspaceStore.program?.coder.accounts
			// .decode<anchor.IdlAccounts<OnchainVotingMultiplePolls>["profile"]>("profile", value.account.data as Buffer); // Error: Unknown account: profile
			// .decode<anchor.IdlTypes<anchor.Idl>["Profile"]>("profile", value.account.data as Buffer); // Error: Unknown account: profile

			// return $workspaceStore.program?.coder.accounts.profile
			//   .decode(anchor.IdlTypes<anchor.Idl>["Profile"], value.account.data as Buffer); // E: 'profile' does not exist on type AccountsCoder<string>

			// console.log("profileAccount #: ", i);
			// console.log(value);

			// return $workspaceStore.program?.coder
			// ==========================
		});

		// console.log('=== Polls ===');
		// NOTE Each item in array is type: { account: AccountInfo<Buffer>, pubkey: PublicKey }
    // Q: Should I reset my Stores before the fetch? I think so, 
    // since my pollsStore, profilesStore arrays are duplicating.
    // U: Gonna try only resetting my arrays
    // A: Yep, seems to be working correctly now...
    pollsStore.reset();
		const decodedPollAccounts = pollAccounts.map((value) => {
			// Manually decode the account data using coder
			const decodedAccountInfo = $workspaceStore.program!.coder.accounts.decode(
				'Poll',
				value.account.data
			);

			// Update Store
			pollsStore.addPoll(decodedAccountInfo, value.pubkey);
		});

    // NOTE I'm currently not updating the single pollStore from this
    // call, since it depends on the route/pda, etc.

		// console.log('=== All PARSED ProgramAccounts ===');
		// parsedProgramAccounts.forEach((value, i) => {
		// 	console.log(`Account # ${i + 1}:`);
		// 	console.log(`---prototype: ${Object.getPrototypeOf(value)}`);
		// 	console.log(`---Address: ${value.pubkey.toBase58()}`);
		// 	console.log(`---Owner: ${value.account.owner.toBase58()}`);
		// 	console.log(`---Data: ${value.account.data.toString()}`); // Garbled
		// 	console.log(`---JSON: ${JSON.stringify(value.account.data.toString())}`); // Garbled
		// 	console.log(value['account']['data']); // Uint8Array

		// 	console.log('=======');

		// 	// Let's see if typing as ParsedAccountData helps:
		// 	const parsedAccountInfo = value.account.data as anchor.web3.ParsedAccountData;
		// 	console.log(`ParsedAccountData # ${i + 1}:`);
		// 	console.log(parsedAccountInfo); // Uint8Array
		// 	console.log(`---parsedAccountInfo: ${parsedAccountInfo}`); // Garbled
		// 	console.log(`---.parsed: ${parsedAccountInfo.parsed}`); // null
		// 	console.log(`---.program: ${parsedAccountInfo.program}`); // null
		// 	console.log(`---.program: ${parsedAccountInfo.space}`); // null
		// });

		// console.log('=== All NON-PARSED ProgramAccounts ===');
		// programAccounts.forEach(async (value, i) => {
		//     // Q: Why is the AccountInfo data returning a Buffer? How do I parse the data?
		//     // U: Turns out you parse the account according to its struct. So, each program
		//     // will package it up differently. However, if the account is a data account,
		//     // then you may be able to read the data using the program.account.fetch() API.
		// 	console.log(`Account # ${i + 1}:`);
		// 	// console.log(`---Address: ${value.pubkey.toBase58()}`);
		// 	console.log(value);

		//     // Q: Do I even need to use this getProgramAccounts() approach if I have access
		//     // to the workspace/program and the fetch() API?
		//     // U: Works (kinda) if I know the account struct, but errors otherwise.
		//     // E.g., If I use program.account.customProgram it'll get the matching account data,
		//     // otherwise, it errors.
		//     // Q: Wonder if my GetProgramAccountsFilter could filter by the different types by
		//     // using dataSize and memcmp properties?
		//     // A: Yes! Once you know the right filter, then you can get the correct account
		//     // and then manually decode the returned data!
		//     // const accountData = await $workspaceStore.program?.account.customProgram?.fetch(value.pubkey) // WORKS
		//     // console.log(accountData);
		// });
	}

  async function loadAllProgramAccounts() {
    // TODO Refactor
    // ===UPDATE===
    // WAIT on this... let's get it working and then can refactor later

    // 1. Get the accounts from 'await Promise.all()'
    const accounts = await getAllProgramAccounts();

    // 2. Decode the data
    // 3. Update Stores

  }

	// Q: Can I use this to update/fetch my Stores?
	async function derivePda(seeds: Buffer[]) {
		// NOTE This is key! We can derive PDA WITHOUT hitting our program!
		// Then we can use this PDA address in our functions as a check to see
		// whether there is a ledger account at this PDA address.
		// Then, MOST IMPORTANTLY, we can fetch the account's data from the CLIENT
		// and use its data.
		// NOTE pubkey is actually provider.wallet.publicKey
		let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
			seeds,
			$workspaceStore.program?.programId as anchor.web3.PublicKey
		);

		return pda;
	}


	// Testing out my customProgramStore.getCustomProgramAccount()
	async function handleGetCustomProgram() {
		// Q: Do I need to derive PDA here or inside Store?
		// A: Inside Store! Makes it more flexible!
		// With PDA
		// await customProgramStore.getCustomProgramAccount(CUSTOM_PROGRAM_PDA);
		// Without PDA
		await customProgramStore.getCustomProgramAccount(); // null
	}
</script>

<AnchorConnectionProvider {network} {idl} />
<div class="md:hero mx-auto p-4">
	<div class="md:hero-content flex flex-col">
		<h1
			class="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]"
		>
			Polls
		</h1>
		<div class="card-body items-center text-center pt-0">
			<Button disabled={!$walletStore.publicKey} on:click={handleCreateCustomProgram}
				>Create Custom Program</Button
			>
			<pre>customProgramStore: {JSON.stringify($customProgramStore, null, 2)}</pre>
			<br />
			<Button disabled={!$walletStore.publicKey} on:click={handleCreateProfile}
				>Create Profile</Button
			>
			<pre>profileStore: {JSON.stringify($profileStore, null, 2)}</pre>
			<br />
			<div class="form-control">
				<label class="input-group input-group-vertical pt-1">
					<span>Option A Display</span>
					<input
						type="text"
						placeholder=""
						class="input input-bordered"
						bind:value={pollOptionADisplayName}
					/>
				</label>
				<label class="input-group input-group-vertical pt-1">
					<span>Option B Display</span>
					<input
						type="text"
						placeholder=""
						class="input input-bordered"
						bind:value={pollOptionBDisplayName}
					/>
				</label>
			</div>
			<Button
				disabled={!$walletStore.publicKey && (!pollOptionADisplayName || !pollOptionBDisplayName)}
				on:click={handleCreatePoll}>Create Poll</Button
			>
			{#if $pollsStore}
				{#each $pollsStore as { poll, pda } (pda)}
					<div class="card w-96 bg-neutral text-neutral-content">
						<div class="card-body items-center text-center">
							<a class="link link-secondary" href="polls/{pda}">
								<h2 class="card-title">
									{poll?.optionADisplayLabel} || {poll?.optionBDisplayLabel}
								</h2>
							</a>
							<p>Votooooor #:{poll?.pollNumber} has {poll?.voteCount} total votes!</p>
							<div class="card-actions justify-end">
								<button class="btn btn-primary">{poll?.optionADisplayLabel}</button>
								<button class="btn btn-ghost">{poll?.optionBDisplayLabel}</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
			<br />
			<Button disabled={!$walletStore.publicKey} on:click={getAllProgramAccounts}
				>Get Program Accounts</Button
			>
		</div>
	</div>
</div>
