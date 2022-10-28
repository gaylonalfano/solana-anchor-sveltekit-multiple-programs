import type * as anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import type { GetProgramAccountsFilter } from '@solana/web3.js';
import type { OnchainVotingMultiplePolls } from '../../idl/onchain_voting_multiple_polls';
import idl from '../../../../target/idl/onchain_voting_multiple_polls.json';
import { get } from 'svelte/store';
import { page } from '$app/stores';
import { notificationStore } from '$stores/notification';
import {
  customProgramStore,
  profilesStore,
  profileStore,
  pollsStore,
  pollStore,
  pollVotesStore,
  votesStore
} from '$stores/polls';
import * as constants from './constants';
import type {
  CustomProgramObject,
  ProfileObject,
  ProfileStoreObject,
  PollObject,
  PollStoreObject,
  VoteObject
} from '../../models/polls-types';


export function decodeAllProgramAccounts(
  encodedAccountsMap: Map<string, Record<string, any>[]>
) {
  console.log("decodeAllProgramAccounts INVOKED!");
  // 1. Reset Stores
  // Q: Do I need to even reset? Need to test...
  // U: Could consider storing all Stores into an Array or Object,
  // so that when we decode, we can set correct Store data
  // A: Yes! Must reset when doing this full re-fetch
  console.log("Resetting Store values...")
  customProgramStore.reset();
  profilesStore.reset();
  profileStore.reset();
  pollsStore.reset();
  pollStore.reset();
  votesStore.reset();


  // 2. Loop through encoded Map and decode account data
  for (let [key, value] of encodedAccountsMap.entries()) {
    console.log(`Decoding ${key} account data...`)
    // Q: Can I use workspace.program.decode? 
    // A: Yes!
    // NOTE Without Anchor workspace using borsh schema:
    // E.g. borsh.struct([borsh.bool('isActive'), borsh.str('name'), ...])
    // Loop through array 'value' and decode
    value.forEach((v) => {
      const decodedAccountInfo = get(workspaceStore).program!.coder.accounts.decode(
        key, // E.g., CustomProgram, Profile, etc.
        v.account.data
      );
      // console.log(`${key}::decodedAccountInfo: `);
      // console.log(decodedAccountInfo);

      // Update Store (Arrays only) state.
      // NOTE Need to later filter the arrays for single Stores (profileStore, etc.)
      // Q: Create a helper object/array to save Stores? Or, just add
      // some conditional logic if key === CustomProgram then customProgramStore.set()...
      // A: Going with simple if/else logic for now
      if (key === "CustomProgram") {
        customProgramStore.set({ customProgram: decodedAccountInfo, pda: v.pubkey })
      } else if (key === "Profile") {
        profilesStore.addProfile(decodedAccountInfo, v.pubkey);
      } else if (key === "Poll") {
        pollsStore.addPoll(decodedAccountInfo, v.pubkey)
      } else if (key === "Vote") {
        votesStore.addVote(decodedAccountInfo)
      }

    });
  }
  console.log("Array Stores updated. Updating single Stores if present...")


  // 3. Array Stores updated. Time to update single Stores (if available)
  // NOTE Single stores may not be present (i.e., wallet doesn't have Profile, not on Poll page)
  try {
    let currentProfileStoreObject = get(profilesStore).find(
      (value) => value.profile?.authority?.toBase58() === get(walletStore).publicKey?.toBase58()
    ) as ProfileStoreObject;
    // console.log('currentProfileStoreObject: ', currentProfileStoreObject);
    if (currentProfileStoreObject) {
      profileStore.set({
        profile: currentProfileStoreObject.profile,
        pda: currentProfileStoreObject.pda
      })
    }

  } catch (e) {
    console.log("Profile not found in profilesStore. Single profileStore not updated.")
    console.warn(e);
  }

  // Q: Find and set the single pollStore?
  // U: If I only call this from __layout, then page won't be available. 
  // pollsStore is available, but can't find single Poll based on page.params.pda
  // U: May need to address this inside [pda].svelte onMount() or something instead...

  console.log("Decoding complete. Stores update complete.");

}



// Try to fetch program accounts using getProgramAccounts()
// REF: https://www.notion.so/Solana-Quick-Reference-c0704fee2afa4ee5827ded6937ef47df#680c6b9f0f074a37bfe02579309faad2
// REF: https://solanacookbook.com/guides/get-program-accounts.html#filters
export async function getAllProgramAccounts(
  programId: anchor.web3.PublicKey,
  connection: anchor.web3.Connection,
  authority: anchor.web3.PublicKey,
) {
  if (!get(walletStore)) throw Error('Wallet not connected!');
  if (!get(workspaceStore)) throw Error('Workspace not found!');

  // NOTE After some testing, looks like the best condition to trigger this fn is:
  // walletStore.connected=true, connecting=false, disconnecting=false
  console.log("getAllProgramAccountsMapsPromises INVOKED!")

  // 1. Establish a connection
  // const { connection } = $workspaceStore;

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
      dataSize: constants.POLL_ACCOUNT_SPACE // VARIES by the Account::ACCOUNT_SPACE!
    }
  ];

  // Q: Should I filter by 'authority' here or just fetch all?
  // U: I chose to add additional filter since I'd have to loop over
  // all accounts, decode data, and then compare authority values
  // May have to rethink this after lots of accounts
  const pollsByAuthorityFilter: GetProgramAccountsFilter[] = [
    {
      dataSize: constants.POLL_ACCOUNT_SPACE // VARIES by the Account::ACCOUNT_SPACE!
    },
    {
      memcmp: {
        offset: 8, // Starting point. 'authority'
        bytes: authority.toBase58()
      }
    }
  ];

  const profilesFilter: GetProgramAccountsFilter[] = [
    {
      dataSize: constants.PROFILE_ACCOUNT_SPACE
    }
  ];

  const profilesByAuthorityFilter: GetProgramAccountsFilter[] = [
    {
      dataSize: constants.PROFILE_ACCOUNT_SPACE
    },
    {
      memcmp: {
        offset: 8, // Starting point for 'authority'
        bytes: authority.toBase58()
      }
    }
  ];

  const customProgramFilter: GetProgramAccountsFilter[] = [
    {
      dataSize: constants.CUSTOM_PROGRAM_ACCOUNT_SPACE
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
      dataSize: constants.VOTE_ACCOUNT_SPACE
    },
  ];


  const votesByAuthorityFilter: GetProgramAccountsFilter[] = [
    {
      dataSize: constants.VOTE_ACCOUNT_SPACE
    },
    {
      memcmp: {
        offset: 8, // 32 when 'authority' was just before bump
        bytes: authority.toBase58(),
      }
    },
  ];

  // Q: Create an Object or something to hold all these filters
  // U: Decided to set() these to Map keys
  // const filters: Array<GetProgramAccountsFilter[]> = [
  //   customProgramFilter,
  //   profilesFilter,
  //   profilesByAuthorityFilter,
  //   pollsFilter,
  //   pollsByAuthorityFilter,
  //   votesFilter,
  //   votesByAuthorityFilter,
  // ];
  // filters.forEach((f) => console.log("filter: ", f));

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
  // const customProgramAccountsPromise = connection.getProgramAccounts(
  //   programId,
  //   { filters: customProgramFilter }
  // );
  // console.log('1. customProgramAccountsPromise AFTER gPA()+filters', customProgramAccountsPromise);

  // // Only filtering on dataSize to reduce requests
  // const profileAccountsPromise = connection.getProgramAccounts(
  //   programId,
  //   { filters: profilesFilter }
  // );
  // console.log('2. profileAccounts AFTER gPA()+filters', profileAccountsPromise);

  // const profileAccountsByAuthorityPromise = connection.getProgramAccounts(
  //   programId,
  //   { filters: profilesByAuthorityFilter }
  // );
  // console.log('3. profileAccountsByAuthority AFTER gPA()+filters', profileAccountsByAuthorityPromise);

  // const pollAccountsPromise = connection.getProgramAccounts(
  //   programId,
  //   { filters: pollsFilter }
  // );
  // console.log('4. pollAccounts AFTER gPA()+filters', pollAccountsPromise);

  // const pollAccountsByAuthorityPromise = connection.getProgramAccounts(
  //   programId,
  //   { filters: pollsByAuthorityFilter }
  // );
  // console.log('5. pollAccountsByAuthority AFTER gPA()+filters', pollAccountsByAuthorityPromise);

  // const voteAccountsPromise = connection.getProgramAccounts(
  //   programId,
  //   { filters: votesFilter }
  // );
  // console.log('6. voteAccounts AFTER gPA()+filters', voteAccountsPromise);

  // const voteAccountsByAuthorityPromise = connection.getProgramAccounts(
  //   programId,
  //   { filters: votesByAuthorityFilter }
  // );
  // console.log('7. voteAccountsByAuthority AFTER gPA()+filters', voteAccountsByAuthorityPromise);

  // NOTE Trying to use Promise.all() instead of blocking with multiple 'await' calls
  // const accountsPromises = [
  //   customProgramAccountsPromise,
  //   profileAccountsPromise,
  //   profileAccountsByAuthorityPromise,
  //   pollAccountsPromise,
  //   pollAccountsByAuthorityPromise,
  //   voteAccountsPromise,
  //   voteAccountsByAuthorityPromise
  // ];

  // const filteredResults = await Promise.all(accountsPromises);
  // console.log('filteredResults after Promise.all(): ', filteredResults); // Array of Arrays
  // return filteredResults;
  // Q: How could I package the results in a way that are easy to 
  // access by account type? I need to decode the data, so I need
  // to loop through results and decode 'Poll', 'Profile', 'Vote', etc.
  // U: Trying Maps + Promise.all() below.


  // ==== UPDATE: Trying Maps + Promise.all() below =====
  // Q: Can I simplify and loop over filters to create array of Promises?
  // Ideally I could match the account type ('Poll', 'Profile') with arrays...
  // Q: Should it be an Object or maybe a Map?
  // const accountTypesWithFilters: Record<string, Array<GetProgramAccountsFilter[]>> = {
  //   'CustomProgram': [customProgramFilter],
  //   'Profile': [profilesFilter, profilesByAuthorityFilter],
  //   'Poll': [pollsFilter, pollsByAuthorityFilter],
  //   'Vote': [votesFilter, votesByAuthorityFilter],
  // };


  // U: Trying a Map instead.
  // NOTE Maps preserve the order of insertions!
  // NOTE I'm setting the value to a single GetProgramAccountsFilter[] to simplify.
  // After decoding the data, I could find by authority, poll, vote, etc. later
  const accountNames = ["CustomProgram", "Profile", "Poll", "Vote"];
  const accountsFiltersMap = new Map<string, GetProgramAccountsFilter[]>();
  accountsFiltersMap.set(accountNames[0], customProgramFilter);
  accountsFiltersMap.set(accountNames[1], profilesFilter);
  accountsFiltersMap.set(accountNames[2], pollsFilter);
  accountsFiltersMap.set(accountNames[3], votesFilter);

  // Confirm accountsFiltersMap has values
  // console.log("accountsFilterMap have values?")
  // for (let [key, value] of accountsFiltersMap.entries()) {
  //   console.log(key);
  //   console.log(value)
  // };


  // NOTE The returned Promise type is Promise<Record<string, any>>[]
  const accountsPromisesMap = new Map<string, Promise<Record<string, any>[]>>();
  // Loop over my Map using for...of loop to create another Map to hold Promises
  for (let [key, value] of accountsFiltersMap.entries()) {
    // console.log(key);
    // console.log(value);
    let promise = connection.getProgramAccounts(programId, { filters: value })
    // Set new Map key: value pair
    accountsPromisesMap.set(key, promise);
  };
  // Confirm accountsPromisesMap has values
  // console.log("accountsPromisesMap have values?")
  // for (let [key, value] of accountsPromisesMap.entries()) {
  //   console.log(key);
  //   console.log(value)
  // };

  // Need to await and resolve the Promises.
  // At this point, should have a Map of key: value, where values are Array of Promises
  // Loop through new Map and get Promises
  const accountsEncodedResultsMap = new Map<string, Record<string, any>[]>();
  // Q: Can I simply await Promise.all(Map.values())? And the set new Map values?
  const encodedAccountsResults = await Promise.all(accountsPromisesMap.values());
  // After this resolves and we have encoded results, set new Map
  // NOTE If this works, may consider just returning this Map for this function
  // and then create a separate function to decode the data
  // NOTE There is a Map.size property that may help with looping...
  encodedAccountsResults.forEach((value, index) => {
    accountsEncodedResultsMap.set(
      accountNames[index],
      value
    );
  });

  // NOTE At this point, should have a Map of encodedAccountsResults
  // Next, need to decode. The Map will allow .get() => [{pubkey, account}...]
  // U: Let's confirm this is working first. May split into another function to decode
  // console.log("accountsEncodedResultsMap have values?")
  // for (let [key, value] of accountsEncodedResultsMap.entries()) {
  //   // console.log(`${key}: ${value}`);
  //   console.log(key);
  //   console.log(value);
  // }

  // return accountsEncodedResultsMap;

  // Try to decode with helper
  await decodeAllProgramAccounts(accountsEncodedResultsMap);
};
