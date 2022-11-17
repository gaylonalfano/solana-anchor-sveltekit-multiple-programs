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
export const NON_CUSTODIAL_ESCROW_PROGRAM_ID = new anchor.web3.PublicKey(
  "2StMWoVSWWjefwhoFsvjXVcaFABDBeMaFH2pKarQGjdW"
);

// Prefixes for seeds
export const ESCROW_SEED_PREFIX = "escrow";

// Data Buffer sizes/Account space
export const ESCROW_ACCOUNT_SPACE = 115;

// NOTE Development Only

export const SELLER_WALLET_ADDRESS = new anchor.web3.PublicKey(
  "2BScwdytqa6BnjW6SUqKt8uaKYn6M4gLbWBdn3JuJWjE"
) // Phantom Dev
export const BUYER_WALLET_ADDRESS = new anchor.web3.PublicKey(
  "HzgMBJvpsKgTRe84q7BgdYbf3w4hBCWoy384rZBF9viy"
) // Solflare Dev

export const SOL_PUBLIC_KEY = new anchor.web3.PublicKey(
  "So11111111111111111111111111111111111111111"
)
