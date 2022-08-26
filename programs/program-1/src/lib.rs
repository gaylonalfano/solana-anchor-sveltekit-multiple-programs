use anchor_lang::prelude::*;

declare_id!("4wF9FmzBGs1oCYPMfdCXEbrhajWHdCQePjqAgqX52HUJ");

#[program]
pub mod program_1 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program 1");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
