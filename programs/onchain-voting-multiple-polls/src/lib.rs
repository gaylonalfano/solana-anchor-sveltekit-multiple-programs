// REF: https://github.com/solana-developers/workshop-dapps/tree/main/solana-twitter/programs/solana-twitter-v2/src/state
use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;


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
