import * as anchor from "@project-serum/anchor";


export const NETWORK = "http://localhost:8899";
// export const NETWORK = "https://api.devnet.solana.com";
export const PREFLIGHT_COMMITMENT = "confirmed";
// export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
//     "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
// );
export const MULTIPLE_PROGRAMS_PROGRAM_ID = new anchor.web3.PublicKey(
  "B29aHXp7o9Aa4PUwHsNxYREXP5vzw4KmAJbivfntTZ6X"
);
export const ONCHAIN_VOTING_MULTIPLE_POLLS_PROGRAM_ID = new anchor.web3.PublicKey(
  "2abHAR3JLTTtm1M8SsuWCriuJBmSXvSApMyszuVKTDJo"
);


// Prefixes for seeds
export const CUSTOM_PROGRAM_SEED_PREFIX = "custom-program";
export const PROFILE_SEED_PREFIX = "profile"; 
export const POLL_SEED_PREFIX = "poll";
export const VOTE_SEED_PREFIX = "vote";


// Data Buffer sizes/Account space
export const CUSTOM_PROGRAM_ACCOUNT_SPACE = 65;
export const PROFILE_ACCOUNT_SPACE = 153;
export const POLL_ACCOUNT_SPACE = 162;
export const VOTE_ACCOUNT_SPACE = 115;
