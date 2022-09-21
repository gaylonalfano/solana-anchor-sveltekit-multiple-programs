// REF: https://github.com/solana-developers/workshop-dapps/tree/main/solana-twitter/programs/solana-twitter-v2/src/state
use anchor_lang::prelude::*;

declare_id!("7SxznnN7ztjk4W9xx5FP7GbjkydxUPzXzFthoMvLMdSs");
/// The Program ID can be found in /target/idl/[your_project_name].json
// 
/// This is where the magic happens. We define our program!
/// Each method inside here defines an RPC request handler (aka instruction handler) which can be invoked by clients
#[program]
mod onchain_voting_multiple_polls {
    use super::*;

    /// The first parameter for every RPC handler is the Context struct. We define create_poll and Vote below at #[derive(Accounts)]
    /// When `initalize` is called, we'll store the `vote_account_bump` that was used to derive our PDA so that others can easily derive it on their clients
    /// We no longer have to manually set both `crunchy` and `smooth` to 0 because we opted to use the `default` trait on our Poll struct at the bottom of this file
    /// This a Rust trait that is used via #[derive(Default)]. More info on that here: https://doc.rust-lang.org/std/default/trait.Default.html
    pub fn create_poll(ctx: Context<CreatePoll>) -> Result<()> {
        // ctx.accounts.poll_account.bump = vote_account_bump;
        // NOTE Rather than passing vote_account_bump as arg to create_poll(),
        // going to follow Anchor PDA example code to find it instead.
        // NOTE The reason I'm attempting this is bc original code init's the poll_account
        // by adding constraint bump = vote_account_bump, but this makes compiling fail
        // Q: Do I need to set defaults to 0 after using Default trait?
        // A: No! #[derive(Default)] macro sets default for type
        // Q: ERROR! For some reason ctx.bumps not available...
        // A: Needed to rebuild and redeploy and then ctx had .bumps method!
        // Q: Why does get("poll_account") work but NOT "vote-account"?
        // A: I *think* "poll_account" corresponds with account variable name (not actual seed)
        // REF: https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor
        ctx.accounts.poll.bump = *ctx.bumps.get("poll_account").unwrap();
        ctx.accounts.poll.is_active = true;
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, vote_type: VoteType) -> Result<()> {
        match vote_type {
            VoteType::GMI => {
                ctx.accounts.poll_account.gmi += 1;
            },
            VoteType::NGMI => {
                ctx.accounts.poll_account.ngmi += 1;
            },
        };
        Ok(())
    }
}


/// The #[derive(Accounts)] macro specifies all the accounts that are required for a given instruction
/// Here, we define two structs: CreatePoll and Vote
// #[instruction(vote_account_bump: u8)]
#[derive(Accounts)]
pub struct CreatePoll<'info> {

    /// The #[account(...)] macro enforces that our `poll_account` owned by the currently executing program.
    /// 
    /// We mark `poll_account` with the `init` attribute, which creates a new account owned by the program
    /// When using `init`, we must also provide:
    /// `payer`, which funds the account creation
    /// and the `system_program` which is required by the runtime
    /// 
    /// If our account were to use variable length types like String or Vec we would also need to allocate `space` to our account
    /// Since we are only dealing with fixed-sized integers, we can leave out `space` and Anchor will calculate this for us automatically
    ///
    /// `seeds` and `bump` tell us that our `poll_account` is a PDA that can be derived from their respective values
    /// Account<'info, Poll> tells us that it should be deserialized to the Poll struct defined below at #[account]
    // Q: Do I need to use 'pub' on these? Anchor example uses them but
    // original code doesn't
    // A: Yes, seemed to help with compilation
    // Q: Won't using user.key() as a seed limit who can write to the PDA (i.e., only that user)?
    // #[account(init, seeds = [b"vote-account", user.key().as_ref()], payer = user, space = 25, bump)]
    #[account(init, seeds = [b"poll-account"], payer = user, space = 8 + 1 + 8 + 8 + 1, bump)]
    pub poll: Account<'info, Poll>,
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
    // #[account(mut, seeds = [b"vote-account", user.key().as_ref()], bump = poll_account.bump)]
    #[account(mut, seeds = [b"vote-account"], bump = poll_account.bump)]
    pub poll_account: Account<'info, Poll>,
    pub user: Signer<'info>,
}

/// Here we define what the state of our `poll_account` looks like
/// We define a struct with three public properties: crunchy, smooth, and bump
/// The `crunchy` and `smooth` properties will keep track of their respective votes as unsigned 64-bit integers
/// `bump` will store the `vote_account_bump` we passed in when we initialized our program

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum VoteType {
    // TODO Allow custom vote types/options so you can have several polls open
    GMI,
    NGMI
}
