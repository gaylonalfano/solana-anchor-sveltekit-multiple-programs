use anchor_lang::prelude::*;


#[account]
pub struct Profile {
    // 8 discrimator
    pub authority: Pubkey, // 32
    pub profile_number: u64, // 8
    pub handle: String, // 40
    pub display_name: String, // 40
    pub poll_count: u64, // 8
    pub vote_count: u64, // 8
    pub bump: u8, // 1
}

// Adding useful constants for sizing properties
// REF: https://lorisleiva.com/create-a-solana-dapp-from-scratch/structuring-our-tweet-account#final-code
const DISCRIMINATOR_LENGTH: usize = 8;
const AUTHORITY_LENGTH: usize = 32; // Pubkey
const PROFILE_NUMBER_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the String
const HANDLE_MAX_LENGTH: usize = 10 * 4; // 10 chars max
const DISPLAY_NAME_MAX_LENGTH: usize = 10 * 4; // 10 chars max
const POLL_COUNT_LENGTH: usize = 8;
const VOTE_COUNT_LENGTH: usize = 8;
const BUMP_LENGTH: usize = 1;

impl Profile {

    pub const ACCOUNT_SPACE: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + PROFILE_NUMBER_LENGTH
        + STRING_LENGTH_PREFIX
        + HANDLE_MAX_LENGTH
        + STRING_LENGTH_PREFIX
        + DISPLAY_NAME_MAX_LENGTH
        + POLL_COUNT_LENGTH
        + VOTE_COUNT_LENGTH
        + BUMP_LENGTH;

    pub const SEED_PREFIX: &'static str = "profile";

    pub fn new(
        profile_number: u64,
        handle: String,
        display_name: String,
        authority: Pubkey,
        bump: u8,
    ) -> Self {

        Profile {
            authority,
            profile_number,
            handle,
            display_name,
            poll_count: 0,
            vote_count: 0,
            bump,
        }
    }

}
