import * as anchor from '@project-serum/anchor';
import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
import { PublicKey, type GetProgramAccountsFilter } from '@solana/web3.js';
import type { OnchainVotingMultiplePolls } from '../../idl/onchain_voting_multiple_polls';
import idl from '../../../../target/idl/onchain_voting_multiple_polls.json';
import { get } from 'svelte/store';
import { notificationStore } from '$stores/notification';
import { customProgramStore } from '$stores/polls/custom-program-store';
import { profileStore } from '$stores/polls/profile-store';
import { profilesStore } from '$stores/polls/profiles-store';
import { pollStore } from '$stores/polls/poll-store';
import { pollsStore } from '$stores/polls/polls-store';
import * as constants from './constants';
import type {
  CustomProgramObject,
  ProfileObject,
  PollObject,
  VoteObject
} from '../../models/polls-types';

// ==== UPDATE ====
// Not entirely sure how to use this and/or recreate the workspaceStore
// and walletStore without turning this into a Svelte component so that
// I can use the <AnchorConnectionProvider {network} {idl} />
// THEREFORE, I'm gonna leave this here and may come back later once I know more
//
// U: Trying again but cleaning it up.


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
  console.log("getAllProgramAccounts INVOKED!")

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
  const filters: Array<GetProgramAccountsFilter[]> = [
    customProgramFilter,
    profilesFilter,
    profilesByAuthorityFilter,
    pollsFilter,
    pollsByAuthorityFilter,
    votesFilter,
    votesByAuthorityFilter,
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
    programId,
    { filters: customProgramFilter }
  );
  console.log('1. customProgramAccountsPromise AFTER gPA()+filters', customProgramAccountsPromise);

  // Only filtering on dataSize to reduce requests
  const profileAccountsPromise = connection.getProgramAccounts(
    programId,
    { filters: profilesFilter }
  );
  console.log('2. profileAccounts AFTER gPA()+filters', profileAccountsPromise);

  const profileAccountsByAuthorityPromise = connection.getProgramAccounts(
    programId,
    { filters: profilesByAuthorityFilter }
  );
  console.log('3. profileAccountsByAuthority AFTER gPA()+filters', profileAccountsByAuthorityPromise);

  const pollAccountsPromise = connection.getProgramAccounts(
    programId,
    { filters: pollsFilter }
  );
  console.log('4. pollAccounts AFTER gPA()+filters', pollAccountsPromise);

  const pollAccountsByAuthorityPromise = connection.getProgramAccounts(
    programId,
    { filters: pollsByAuthorityFilter }
  );
  console.log('5. pollAccountsByAuthority AFTER gPA()+filters', pollAccountsByAuthorityPromise);

  const voteAccountsPromise = connection.getProgramAccounts(
    programId,
    { filters: votesFilter }
  );
  console.log('6. voteAccounts AFTER gPA()+filters', voteAccountsPromise);

  const voteAccountsByAuthorityPromise = connection.getProgramAccounts(
    programId,
    { filters: votesByAuthorityFilter }
  );
  console.log('7. voteAccountsByAuthority AFTER gPA()+filters', voteAccountsByAuthorityPromise);


  // Q: Can I simplify and loop over filters to create array of Promises?
  // Ideally I could match the account type ('Poll', 'Profile') with arrays...
  const accountTypesWithFilters: Record<string, Array<GetProgramAccountsFilter[]>> = {
    'CustomProgram': [customProgramFilter],
    'Profile': [profilesFilter, profilesByAuthorityFilter],
    'Poll': [pollsFilter, pollsByAuthorityFilter],
    'Vote': [votesFilter, votesByAuthorityFilter],
  };


  

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

  // Q: How could I package the results in a way that are easy to 
  // access by account type? I need to decode the data, so I need
  // to loop through results and decode 'Poll', 'Profile', 'Vote', etc.
  const filteredResults = await Promise.all(accountsPromises);
  console.log('filteredResults after Promise.all(): ', filteredResults); // Array of Arrays


  return filteredResults;
};


async function decodeAllProgramAccounts(
  accounts: Record<string, any>[]
) {



}
  // // === AWAIT
  // const customProgramAccounts = await connection.getProgramAccounts(
  //   programId,
  //   { filters: customProgramFilter }
  // );
  // console.log('1. customProgramAccounts AFTER gPA()+filters', customProgramAccounts);

  // // Only filtering on dataSize to reduce requests
  // const profileAccounts = await connection.getProgramAccounts(
  //   programId,
  //   { filters: profilesFilter }
  // );
  // console.log('2. profileAccounts AFTER gPA()+filters', profileAccounts);

  // const profileAccountsByAuthority = await connection.getProgramAccounts(
  //   programId,
  //   { filters: profilesByAuthorityFilter }
  // );
  // console.log('3. profileAccountsByAuthority AFTER gPA()+filters', profileAccountsByAuthority);

  // const pollAccounts = await connection.getProgramAccounts(
  //   programId,
  //   { filters: pollsFilter }
  // );
  // console.log('4. pollAccounts AFTER gPA()+filters', pollAccounts);

  // const pollAccountsByAuthority = await connection.getProgramAccounts(
  //   programId,
  //   { filters: pollsByAuthorityFilter }
  // );
  // console.log('5. pollAccountsByAuthority AFTER gPA()+filters', pollAccountsByAuthority);

  // const voteAccounts = await connection.getProgramAccounts(
  //   programId,
  //   { filters: votesFilter }
  // );
  // console.log('6. voteAccounts AFTER gPA()+filters', voteAccounts);

  // const voteAccountsByAuthority = await connection.getProgramAccounts(
  //   programId,
  //   { filters: votesByAuthorityFilter }
  // );
  // console.log('7. voteAccountsByAuthority AFTER gPA()+filters', voteAccountsByAuthority);

  // // NOTE No filter - get all accounts and check size
  // const programAccounts = await connection.getProgramAccounts(
  //   programId
  // );
  // console.log('8. ALL programAccounts: ', programAccounts);



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

  // console.log('=== Votes ===');
  votesStore.reset();
  const decodedVoteAccounts = voteAccounts.map((value) => {
    // Manually decode the account data using coder
    const decodedAccountInfo = $workspaceStore.program!.coder.accounts.decode(
      'Vote',
      value.account.data
    );

    // Update Store
    // NOTE Not storing PDA for Votes as I don't see the point...
    votesStore.addVote(decodedAccountInfo);
  });
}

async function loadAllProgramAccounts() {
  // TODO Refactor
  // ===UPDATE===
  // WAIT on this... let's get it working and then can refactor later

  // 1. Get the accounts from 'await Promise.all()'
  const accounts = await getAllProgramAccounts();

  // 2. Decode the data
  const decodedAccounts = await decodeAllProgramAccounts(accounts);

  // 3. Update Stores


}

