use anchor_lang::prelude::*;

use crate::state::CustomProgram;
use crate::state::Profile;

pub fn create_profile(
    ctx: Context<CreateProfile>,
    handle: String,
    display_name: String,
) -> Result<()> {
    
    let custom_program = &mut ctx.accounts.custom_program;
    let profile = Profile::new(
        custom_program.total_profile_count + 1, // profile_number
        handle,
        display_name,
        ctx.accounts.authority.key(),
        // NOTE bumps.get("account_name"), NOT seed!
        *ctx.bumps.get("profile").expect("Bump not found."),
    );
    // Update our account data
    ctx.accounts.profile.set_inner(profile.clone());
    // Update total_profile_count (i.e., total unique users)
    custom_program.total_profile_count += 1;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    // Need to init Profile
    // Q: profile.profile_number OR custom_program.total_profile_count + 1 for seed?
    // A: I BELIEVE I need to use custom_program.total_profile_count since I won't have
    // access to profile.profile_number just yet...
    // REF: https://github.com/solana-developers/workshop-dapps/tree/main/solana-twitter
    // profile#1: profile_pda = hash("profile" + 0 + wallet_address)
    // profile#2: profile_pda = hash("profile" + 1 + wallet_address)
    #[account(
        init,
        payer = authority,
        space = Profile::ACCOUNT_SPACE,
        seeds = [
            Profile::SEED_PREFIX.as_ref(),
            authority.key().as_ref(),
            (custom_program.total_profile_count + 1).to_string().as_ref(),
        ],
        bump
    )]
    pub profile: Account<'info, Profile>,

    // Need access to custom_program for total_profile_count
    #[account(
        mut,
        seeds = [CustomProgram::SEED_PREFIX.as_ref()],
        bump = custom_program.bump,
    )]
    pub custom_program: Account<'info, CustomProgram>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,

}
