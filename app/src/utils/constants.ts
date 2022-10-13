import * as anchor from "@project-serum/anchor"

export const CUSTOM_PROGRAM_SEED_PREFIX = "custom-program";
export const PROFILE_SEED_PREFIX = "profile"; 
export const POLL_SEED_PREFIX = "poll";
export const VOTE_SEED_PREFIX = "vote";

export const NETWORK = "http://localhost:8899";
// export const NETWORK = "https://api.devnet.solana.com";

export const PREFLIGHT_COMMITMENT = "confirmed";

export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
