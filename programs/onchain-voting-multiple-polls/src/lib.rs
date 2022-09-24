// REF: https://github.com/solana-developers/workshop-dapps/tree/main/solana-twitter
use anchor_lang::prelude::*;

use instructions::*;
use state::*;

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

    pub fn create_custom_program(ctx: Context<CreateCustomProgram>) -> Result<()> {
        // Q: instructions::create_custom_program::create_custom_program()?
        // OR instructions::create_custom_program()?
        instructions::create_custom_program::create_custom_program(ctx)

    }

    pub fn create_profile(
        ctx: Context<CreateProfile>,
        handle: String,
        display_name: String,
    ) -> Result<()> {

        instructions::create_profile::create_profile(ctx, handle, display_name)

    }


    pub fn create_poll(
        ctx: Context<CreatePoll>, 
        option_a_display_label: String, 
        option_b_display_label: String,
    ) -> Result<()> {

        instructions::create_poll::create_poll(ctx, option_a_display_label, option_b_display_label)

    }


    pub fn create_vote(
        ctx: Context<CreateVote>, 
        vote_option: VoteOption,
    ) -> Result<()> {

        instructions::create_vote::create_vote(ctx, vote_option)

    }


}
