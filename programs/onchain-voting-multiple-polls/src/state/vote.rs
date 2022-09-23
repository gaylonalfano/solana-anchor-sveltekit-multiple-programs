use anchor_lang::prelude::*;


// TODO
// Q: How to limit a profile (user) from voting more than once
// for the same Poll?
// REF: https://discord.com/channels/889577356681945098/889702325231427584/1022026860328136735
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
    pub authority: Pubkey, // 32 for wallet
    pub profile_pubkey: Pubkey, // 32 User Profile PDA
    pub poll_pubkey: Pubkey, // 32 Poll PDA
    pub vote_number: u64, // 8 Vote number for Poll
    pub vote_option: VoteOption, // 2 Q: Size for Enums? A: 1 + Largest Variant Size
    pub bump: u8, // 1
}

impl Vote {

    pub const ACCOUNT_SPACE: usize = 8 + 32 + 32 + 32 + 8 + 2 + 1; // Q: Size for Enums? A: 1 + Largest Variant Size

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


#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum VoteOption {
    A,
    B 
}
