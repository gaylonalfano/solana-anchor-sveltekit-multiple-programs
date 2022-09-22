use anchor_lang::prelude::*;

use crate::state::CustomProgram; // OR: use super::state::CustomProgram

pub fn create_custom_program(
    ctx: Context<CreateCustomProgram>, 
) -> Result<()> {

    let custom_program = CustomProgram::new(
        ctx.accounts.authority.key(),
        *ctx.bumps.get(CustomProgram::SEED_PREFIX).expect("Bump not found."),
    );
    ctx.accounts.custom_program.set_inner(custom_program.clone());
    Ok(())
}

#[derive(Accounts)]
pub struct CreateCustomProgram<'info> {
    // Q: Do I need authority.key() for a seed?
    // Should I use my program's ID or something as a Seed?
    #[account(
        init, 
        payer = authority, 
        seeds = [
            CustomProgram::SEED_PREFIX.as_ref(), 
        ], 
        space = CustomProgram::ACCOUNT_SPACE, 
        bump
    )]
    pub custom_program: Account<'info, CustomProgram>,

    // Q: Do I need user to be mutable? It is the payer....
    // A: Yes, if I remove this trait then it breaks
    #[account(mut)]
    pub authority: Signer<'info>,
    // NOTE When creating an account with init, the payer needs to sign the tx
    // NOTE However, if we're dealing with PDAs then it could be different...
    // At the very least, PDAs can't technically sign since they are not Keypairs
    // Only via CPI can PDAs do some pseudo signing (read Anchor docs on this)
    pub system_program: Program<'info, System>,
}
