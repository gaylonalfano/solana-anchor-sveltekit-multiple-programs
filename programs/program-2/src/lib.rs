use anchor_lang::prelude::*;

declare_id!("3i5S58AWdLzpSbXaiEQp1pQvZBH4ybCdCeCNpDcgeFaf");

#[program]
pub mod program_2 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program 2");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
