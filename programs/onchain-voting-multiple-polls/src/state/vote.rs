use anchor_lang::prelude::*;


#[account]
pub struct Vote {
    pub wallet_pubkey: Pubkey, // 32 User Profile
    pub poll_pubkey: Pubkey, // 32 Poll PDA
    pub vote_number: u32, // 4
    pub vote_option: VoteOption, // 2 Q: Size for Enums? A: 1 + Largest Variant Size
    pub bump: u8, // 1
}

impl Vote {

    pub const ACCOUNT_SPACE: usize = 8 + 32 + 32 + 4 + 2 + 1; // Q: Size for Enums? A: 1 + Largest Variant Size

    pub const SEED_PREFIX: &'static str = "vote";

    pub fn new(
        wallet_pubkey: Pubkey,
        poll_pubkey: Pubkey,
        vote_number: u32,
        vote_option: VoteOption,
        bump: u8,
    ) -> Self {

        Vote {
            wallet_pubkey,
            poll_pubkey,
            vote_number,
            vote_option,
            bump,
        }
    }
}


/// Here we define what the state of our `poll_account` looks like
/// We define a struct with three public properties: crunchy, smooth, and bump
/// The `crunchy` and `smooth` properties will keep track of their respective votes as unsigned 64-bit integers
/// `bump` will store the `vote_account_bump` we passed in when we initialized our program
#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum VoteOption {
    A,
    B 
}
