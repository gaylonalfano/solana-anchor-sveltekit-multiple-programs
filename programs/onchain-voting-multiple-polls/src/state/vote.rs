use anchor_lang::prelude::*;


// Q: How to limit a profile (user) from voting more than once
// for the same Poll?
// U: REF: https://discord.com/channels/889577356681945098/889702325231427584/1022026860328136735
// NOTE: Suggested to store each Vote into a PDA, and then can use
// getProgramAccounts or fetchMultiple from program.account.
// When you init a new Vote with user and voting session (poll?) as SEEDS,
// the same user cant init a new Vote in the same voting session because the
// seeds collide.
#[account]
pub struct Vote {
    // Q: Use profile_pubkey to point to PDA?
    // Q: Would I use an Anchor constraint = profile.authority == authority?
    // I don't think I need 'authority' and 'wallet' - same thing basically
    // U: Can't use constraints when initializing an account.
    pub authority: Pubkey, // 32 for wallet
    pub profile_pubkey: Pubkey, // 32 User Profile PDA
    pub poll_pubkey: Pubkey, // 32 Poll PDA
    pub vote_number: u64, // 8 Vote number for Poll
    pub vote_option: VoteOption, // 2 Q: Size for Enums? A: 1 + Largest Variant Size
    pub bump: u8, // 1
}

// Adding useful constants for sizing properties to better target memcmp offsets
// REF: https://lorisleiva.com/create-a-solana-dapp-from-scratch/structuring-our-tweet-account#final-code
const DISCRIMINATOR_LENGTH: usize = 8;
const AUTHORITY_LENGTH: usize = 32; // Pubkey
const PROFILE_LENGTH: usize = 32; // Profile PDA
const POLL_LENGTH: usize = 32; // Poll PDA
const VOTE_NUMBER_LENGTH: usize = 8;
const VOTE_OPTION_LENGTH: usize = 2; // 2 Q: Size for Enums? A: 1 + Largest Variant Size
const BUMP_LENGTH: usize = 1;


impl Vote {

    pub const ACCOUNT_SPACE: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + PROFILE_LENGTH
        + POLL_LENGTH
        + VOTE_NUMBER_LENGTH
        + VOTE_OPTION_LENGTH
        + BUMP_LENGTH;

    pub const SEED_PREFIX: &'static str = "vote";

    pub fn new(
        authority: Pubkey,
        profile_pubkey: Pubkey,
        poll_pubkey: Pubkey,
        vote_number: u64,
        vote_option: VoteOption,
        bump: u8,
    ) -> Self {

        Vote {
            authority,
            profile_pubkey,
            poll_pubkey,
            vote_number,
            vote_option,
            bump,
        }
    }
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum VoteOption {
    A,
    B 
}
