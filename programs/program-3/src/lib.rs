use anchor_lang::prelude::*;

declare_id!("E9zwFX6bW5HdxtrpjoAYrNNmLSK48HaJ7g1HDeu51hvf");

#[program]
pub mod program_3 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Program 3");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
