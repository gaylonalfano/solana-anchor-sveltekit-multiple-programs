use anchor_lang::prelude::*;

/// This `bump` combined with our static "poll_account" seed will make it easy for anyone to derive the same PDA we use use to keep track of our state
/// All of this will be passed inside each Transaction Instruction to record votes as they occur
// NOTE PDAs are essentially hashmaps
// NOTE This is a PDA! In some cases a PDA is preferred over a standard account. The b"some-name"
// syntax is essentially naming a static seed so that this PDA is distinguishable from other
// account types that are PDAs: https://book.anchor-lang.com/anchor_in_depth/PDAs.html?highlight=pda#building-hashmaps-with-pdas
#[account]
#[derive(Default)]
pub struct Poll {
    // 8 bytes for Discrimator
    // Q: How could I keep track of all unique Polls created?
    // A: Trying to add another PDA for CustomProgram...
    // Q: Do I need to add a 'profile_pubkey' field?
    pub poll_number: u64, // 8 bytes Track how many unique Polls have been created
    pub is_active: bool, // 1 byte
    pub option_a_display_label: String, // 40 bytes
    pub option_b_display_label: String, // 40 bytes
    pub option_a_count: u64, // 8 bytes
    pub option_b_count: u64, // 8 bytes
    pub vote_count: u64, // 8 bytes
    pub authority: Pubkey, // 32 bytes. NOTE Use as a seed for Poll PDA
    pub bump: u8, // 1 byte
}

impl Poll {

    pub const ACCOUNT_SPACE: usize = 8 + 8 + 1 + 40 + 40 + 8 + 8 + 8 + 32 + 1;

    pub const SEED_PREFIX: &'static str = "poll";

    pub fn new(
        poll_number: u64,
        option_a_display_label: String,
        option_b_display_label: String,
        authority: Pubkey,
        bump: u8
    ) -> Self {

        Poll {
            poll_number,
            is_active: true,
            option_a_display_label,
            option_b_display_label,
            option_a_count: 0,
            option_b_count: 0,
            vote_count: 0,
            authority,
            bump,
        }
    }
}
