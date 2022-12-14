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
    // Q: How/where do I add the VoteOption Enum? Just in Vote or also in Poll?
    // Perhaps option_a: VoteOption::A? Or, just handle it inside Vote?
    // Eventually need to pass in the enum... Do I need to link the Enum with labels?
    // A: Ended up passing the Enum as an instruction argument for create_vote(Context, VoteOption)
    pub authority: Pubkey, // 32 bytes. NOTE Use as a seed for Poll PDA
    pub poll_number: u64, // 8 bytes Track how many unique Polls have been created
    pub is_active: bool, // 1 byte
    pub option_a_display_label: String, // 40 bytes
    pub option_b_display_label: String, // 40 bytes
    pub option_a_count: u64, // 8 bytes
    pub option_b_count: u64, // 8 bytes
    pub vote_count: u64, // 8 bytes
    pub bump: u8, // 1 byte
}

// Adding useful constants for sizing properties
// REF: https://lorisleiva.com/create-a-solana-dapp-from-scratch/structuring-our-tweet-account#final-code
const DISCRIMINATOR_LENGTH: usize = 8;
const POLL_NUMBER_LENGTH: usize = 8;
const IS_ACTIVE_LENGTH: usize = 1;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the String
const OPTION_A_DISPLAY_LABEL_MAX_LENGTH: usize = 10 * 4; // 10 chars max
const OPTION_B_DISPLAY_LABEL_MAX_LENGTH: usize = 10 * 4; // 10 chars max
const OPTION_A_COUNT_LENGTH: usize = 8;
const OPTION_B_COUNT_LENGTH: usize = 8;
const VOTE_COUNT_LENGTH: usize = 8;
const AUTHORITY_LENGTH: usize = 32; // Pubkey
const BUMP_LENGTH: usize = 1;

impl Poll {

    // pub const ACCOUNT_SPACE: usize = 8 + 8 + 1 + 40 + 40 + 8 + 8 + 8 + 32 + 1;
    pub const ACCOUNT_SPACE: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + POLL_NUMBER_LENGTH
        + IS_ACTIVE_LENGTH
        + STRING_LENGTH_PREFIX
        + OPTION_A_DISPLAY_LABEL_MAX_LENGTH
        + STRING_LENGTH_PREFIX
        + OPTION_B_DISPLAY_LABEL_MAX_LENGTH
        + OPTION_A_COUNT_LENGTH
        + OPTION_B_COUNT_LENGTH
        + VOTE_COUNT_LENGTH
        + BUMP_LENGTH;

    pub const SEED_PREFIX: &'static str = "poll";

    pub fn new(
        poll_number: u64,
        option_a_display_label: String,
        option_b_display_label: String,
        authority: Pubkey,
        bump: u8
    ) -> Self {

        Poll {
            authority,
            poll_number,
            is_active: true,
            option_a_display_label,
            option_b_display_label,
            option_a_count: 0,
            option_b_count: 0,
            vote_count: 0,
            bump,
        }
    }
}
