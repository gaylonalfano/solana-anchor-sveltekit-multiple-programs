// REF: https://examples.anchor-lang.com/docs/onchain-voting -- Using KEYPAIR!
use anchor_lang::prelude::*;

declare_id!("7SxznnN7ztjk4W9xx5FP7GbjkydxUPzXzFthoMvLMdSs");
/// The Program ID can be found in /target/idl/[your_project_name].json
// 
/// This is where the magic happens. We define our program!
/// Each method inside here defines an RPC request handler (aka instruction handler) which can be invoked by clients
#[program]
mod onchain_voting {
    use super::*;

    /// The first parameter for every RPC handler is the Context struct. We define Initialize and Vote below at #[derive(Accounts)]
    /// When `initalize` is called, we'll store the `vote_account_bump` that was used to derive our PDA so that others can easily derive it on their clients
    /// We no longer have to manually set both `crunchy` and `smooth` to 0 because we opted to use the `default` trait on our VoteState struct at the bottom of this file
    /// This a Rust trait that is used via #[derive(Default)]. More info on that here: https://doc.rust-lang.org/std/default/trait.Default.html
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // ctx.accounts.vote_account.bump = vote_account_bump;
        // NOTE Rather than passing vote_account_bump as arg to initialize(),
        // going to follow Anchor PDA example code to find it instead.
        // NOTE The reason I'm attempting this is bc original code init's the vote_account
        // by adding constraint bump = vote_account_bump, but this makes compiling fail
        // Q: Do I need to set defaults to 0 after using Default trait?
        // A: No! #[derive(Default)] macro sets default for type
        // Q: ERROR! For some reason ctx.bumps not available...
        // A: Needed to rebuild and redeploy and then ctx had .bumps method!
        // Q: Why does get("vote_account") work but NOT "vote-account"?
        // A: I *think* "vote_account" corresponds with account variable name (not actual seed)
        // REF: https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor
        ctx.accounts.vote_account.bump = *ctx.bumps.get("vote_account").unwrap();
        ctx.accounts.vote_account.is_active = true;
        Ok(())
    }

    /// All our account validation logic is handled below at the #[account(...)] macros, letting us just focus our business logic
    // pub fn vote_crunchy(ctx: Context<Vote>) -> Result<()> {
    //     ctx.accounts.vote_account.crunchy += 1;
    //     Ok(())
    // }

    // pub fn vote_smooth(ctx: Context<Vote>) -> Result<()> {
    //     ctx.accounts.vote_account.smooth += 1;
    //     Ok(())
    // }
    pub fn vote(ctx: Context<Vote>, vote_type: VoteType) -> Result<()> {
        match vote_type {
            VoteType::GMI => {
                ctx.accounts.vote_account.gmi += 1;
            },
            VoteType::NGMI => {
                ctx.accounts.vote_account.ngmi += 1;
            },
        };
        Ok(())
    }
}


/// The #[derive(Accounts)] macro specifies all the accounts that are required for a given instruction
/// Here, we define two structs: Initialize and Vote
// #[instruction(vote_account_bump: u8)]
#[derive(Accounts)]
pub struct Initialize<'info> {

    /// The #[account(...)] macro enforces that our `vote_account` owned by the currently executing program.
    /// 
    /// We mark `vote_account` with the `init` attribute, which creates a new account owned by the program
    /// When using `init`, we must also provide:
    /// `payer`, which funds the account creation
    /// and the `system_program` which is required by the runtime
    /// 
    /// If our account were to use variable length types like String or Vec we would also need to allocate `space` to our account
    /// Since we are only dealing with fixed-sized integers, we can leave out `space` and Anchor will calculate this for us automatically
    ///
    /// `seeds` and `bump` tell us that our `vote_account` is a PDA that can be derived from their respective values
    /// Account<'info, VoteState> tells us that it should be deserialized to the VoteState struct defined below at #[account]
    // Q: Do I need to use 'pub' on these? Anchor example uses them but
    // original code doesn't
    // A: Yes, seemed to help with compilation
    // Q: Won't using user.key() as a seed limit who can write to the PDA (i.e., only that user)?
    // #[account(init, seeds = [b"vote-account", user.key().as_ref()], payer = user, space = 25, bump)]
    #[account(init, seeds = [b"vote-account"], payer = user, space = 8 + 1 + 8 + 8 + 1, bump)]
    pub vote_account: Account<'info, VoteState>,
    // Q: Do I need user to be mutable? It is the payer....
    // A: Yes, if I remove this trait then it breaks
    #[account(mut)]
    pub user: Signer<'info>,
    // NOTE When creating an account with init, the payer needs to sign the tx
    // NOTE However, if we're dealing with PDAs then it could be different...
    // At the very least, PDAs can't technically sign since they are not Keypairs
    // Only via CPI can PDAs do some pseudo signing (read Anchor docs on this)
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    // #[account(mut, seeds = [b"vote-account", user.key().as_ref()], bump = vote_account.bump)]
    #[account(mut, seeds = [b"vote-account"], bump = vote_account.bump)]
    pub vote_account: Account<'info, VoteState>,
    pub user: Signer<'info>,
}

/// Here we define what the state of our `vote_account` looks like
/// We define a struct with three public properties: crunchy, smooth, and bump
/// The `crunchy` and `smooth` properties will keep track of their respective votes as unsigned 64-bit integers
/// `bump` will store the `vote_account_bump` we passed in when we initialized our program
/// This `bump` combined with our static "vote_account" seed will make it easy for anyone to derive the same PDA we use use to keep track of our state
/// All of this will be passed inside each Transaction Instruction to record votes as they occur
// NOTE PDAs are essentially hashmaps
// NOTE This is a PDA! In some cases a PDA is preferred over a standard account. The b"some-name"
// syntax is essentially naming a static seed so that this PDA is distinguishable from other
// account types that are PDAs: https://book.anchor-lang.com/anchor_in_depth/PDAs.html?highlight=pda#building-hashmaps-with-pdas
#[account]
#[derive(Default)]
pub struct VoteState {
    // 8 bytes for Discrimator
    is_active: bool, // 1 byte
    gmi: u64, // 8 bytes
    ngmi: u64, // 8 bytes
    bump: u8, // 1 byte
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum VoteType {
    GMI,
    NGMI
}



// ======== My version ======
// use anchor_lang::prelude::*;
// use anchor_lang::solana_program::system_program;



// declare_id!("7vScxaW7QhPJ4szzcZ7tafjwVya7b5VFKWvANgqeU5EJ");

// #[program]
// pub mod solana_anchor_voting_app {
//     use super::*;

//     // NOTE Any argument that is NOT an account can be passed after context
//     // NOTE It's good practice to create a custom Instruction Validation struct for each of our functions
//     // e.g. submit_vote() has SubmitVote struct, increment() has Increment struct,etc.
//     pub fn submit_vote(ctx: Context<SubmitVoteInstruction>, topic: String, selection: String) -> Result<()> {
    
//         // 1. Extract all the accounts we need from ctx
//         let vote: &mut Account<Vote> = &mut ctx.accounts.vote;
//         // Access user account to save it on the vote account
//         let user: &Signer = &ctx.accounts.user;
//         // Use Solana's Clock::get() for timestamp on vote
//         let clock: Clock = Clock::get().unwrap();

//         // 2. Add some data validation guards
//         if topic.chars().count() > MAX_TOPIC_CHARS {
//             // Return an error
//             // NOTE into() coverts our ErrorCode type into w/e is required by
//             // the code which here is Err and more precisely ProgramError
//             return Err(ErrorCode::TopicTooLong.into())
//         } 

//         if selection.chars().count() > MAX_SELECTION_CHARS {
//             // Return an error
//             // NOTE into() coverts our ErrorCode type into w/e is required by
//             // the code which here is Err and more precisely ProgramError
//             return Err(ErrorCode::SelectionTooLong.into())
//         }

//         // 3. We now have all the data we need to fill the new vote account
//         vote.user = *user.key;
//         vote.timestamp = clock.unix_timestamp;
//         vote.topic = topic;
//         vote.selection = selection;

//         // NOTE At this point we have a working instruction that initializes
//         // a new Vote account for us and hydrates/populates it with the right info
//         Ok(())
//     }
// }


// // 4. Define the context of Vote instruction for Context<T>
// // NOTE By default ctx: Context<Initialize>. We're changing it to SubmitVoteInstruction struct
// // NOTE Account<'info, Vote> is from Anchor, which wraps AccountInfo
// // and parses the AccountInfo.data (u8[]) according to Vote struct
// // NOTE Account Contraints (by Anchor) are like middleware that occur before
// // the instruction function e.g. submit_tweet() is being executed
// #[derive(Accounts)]
// pub struct SubmitVoteInstruction<'info> {
//     // Ensure account of type Account is signer by using account constraints
//     #[account(init, payer = user, space = Vote::LEN)]
//     pub vote: Account<'info, Vote>, // account that instruction will create
//     // NOTE 'Account' wraps 'AccountInfo' and parses account's data
//     // Mark user prop as mutable so we can change their money balance to pay
//     #[account(mut)]
//     pub user: Signer<'info>, // Submitter of vote. This account signs the instruction
//     // Ensure official Solana System Program is used (ie pub key matches system_program::ID)
//     // NOTE Add a safety check doc comment: https://book.anchor-lang.com/anchor_in_depth/the_accounts_struct.html?highlight=accounts%20struct%20safety%20checks#safety-checks
//     #[account(address = system_program::ID)]
//     // NOTE 'AccountInfo' is low-level struct where account's data is unparsed array of bytes
//     // UPDATE 6/26: Now there is a Program account type:
//     /// CHECK: This is not dangerous because we don't read or write from this account
//     pub system_program: Program<'info, System>, // Used to init the Vote account and rent
// }



// // 1. Define the structure of Vote account
// // NOTE We could consider adding another account e.g. UserProfile that
// // our 'program' object could also create and then fetch
// #[account]
// pub struct Vote {
//     pub user: Pubkey,
//     pub timestamp: i64,
//     pub topic: String,
//     pub selection: String
// }

// // 2. Add some useful constants for sizing properties (helps compute rent)
// const DISCRIMINATOR_LENGTH: usize = 8; // Stores type of account (Vote, UserProfile, etc)
// const USER_PUBLIC_KEY_LENGTH: usize = 32; 
// const TIMESTAMP_LENGTH: usize = 8;
// const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
// const MAX_TOPIC_LENGTH: usize = 200; // 50 chars max
// const MAX_SELECTION_LENGTH: usize = 200; // 50 chars max * 4
// const MAX_TOPIC_CHARS: usize = 50;
// const MAX_SELECTION_CHARS: usize = 50;

// // 3. Add a constant on the Vote account that provides its total size
// impl Vote {
//     const LEN: usize = DISCRIMINATOR_LENGTH
//         + USER_PUBLIC_KEY_LENGTH
//         + TIMESTAMP_LENGTH
//         + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH
//         + STRING_LENGTH_PREFIX + MAX_SELECTION_LENGTH;
// }

// // === Custom Errors
// #[error_code]
// pub enum ErrorCode {
//     #[msg("The provided topic should be 50 characters long maximum.")]
//     TopicTooLong,
//     #[msg("The provided selection should be 50 characters long maximum.")]
//     SelectionTooLong,
// }
