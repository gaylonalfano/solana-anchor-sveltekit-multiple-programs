use anchor_lang::prelude::*;


#[account]
pub struct Profile {
    // 8 discrimator
    pub profile_number: u64, // 8
    pub handle: String, // 40
    pub display_name: String, // 40
    pub poll_count: u64, // 8
    pub vote_count: u64, // 8
    pub authority: Pubkey, // 32
    pub bump: u8, // 1
}

impl Profile {

    pub const ACCOUNT_SPACE: usize = 8 + 8 + 40 + 40 + 8 + 8 + 32 + 1;

    pub const SEED_PREFIX: &'static str = "profile";

    pub fn new(
        profile_number: u64,
        handle: String,
        display_name: String,
        authority: Pubkey,
        bump: u8,
    ) -> Self {

        Profile {
            profile_number,
            handle,
            display_name,
            poll_count: 0,
            vote_count: 0,
            authority,
            bump,
        }
    }

}
