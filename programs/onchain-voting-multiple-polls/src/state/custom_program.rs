use anchor_lang::prelude::*;

/// This `bump` combined with our static "poll_account" seed will make it easy for anyone to derive the same PDA we use use to keep track of our state
/// All of this will be passed inside each Transaction Instruction to record votes as they occur
// NOTE PDAs are essentially hashmaps. Can be used like Primary/Foreign Keys in DB tables!
// NOTE This is a PDA! In some cases a PDA is preferred over a standard account. The b"some-name"
// syntax is essentially naming a static seed so that this PDA is distinguishable from other
// account types that are PDAs: https://book.anchor-lang.com/anchor_in_depth/PDAs.html?highlight=pda#building-hashmaps-with-pdas
#[account]
pub struct CustomProgram {
    // 8 bytes for Discrimator
    // Q: How could I keep track of all unique Polls created?
    // A: Gonna try adding some high level props
    pub authority: Pubkey, // 32 bytes Initializer/Payer
    pub total_profile_count: u64, // 8 bytes Track unique users/profiles created
    pub total_poll_count: u64, // 8 bytes Track how many unique Polls have been created
    pub total_vote_count: u64, // 8 
    pub bump: u8, // 1 byte
}

// Adding useful constants for sizing properties to better target memcmp offsets
// REF: https://lorisleiva.com/create-a-solana-dapp-from-scratch/structuring-our-tweet-account#final-code
const DISCRIMINATOR_LENGTH: usize = 8;
const AUTHORITY_LENGTH: usize = 32; // Pubkey
const TOTAL_PROFILE_COUNT_LENGTH: usize = 8;
const TOTAL_POLL_COUNT_LENGTH: usize = 8;
const TOTAL_VOTE_COUNT_LENGTH: usize = 8;
const BUMP_LENGTH: usize = 1;


impl CustomProgram {

    pub const ACCOUNT_SPACE: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + TOTAL_PROFILE_COUNT_LENGTH
        + TOTAL_POLL_COUNT_LENGTH
        + TOTAL_VOTE_COUNT_LENGTH
        + BUMP_LENGTH;

    pub const SEED_PREFIX: &'static str = "custom-program";

    pub fn new(authority: Pubkey, bump: u8) -> Self {

        CustomProgram {
            authority, 
            total_profile_count: 0, // Starting point
            total_poll_count: 0, // Starting point
            total_vote_count: 0,
            bump,
        }
    }
}

