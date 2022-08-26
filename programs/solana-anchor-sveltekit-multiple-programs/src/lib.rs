use anchor_lang::prelude::*;

declare_id!("B29aHXp7o9Aa4PUwHsNxYREXP5vzw4KmAJbivfntTZ6X");

#[program]
pub mod solana_anchor_sveltekit_multiple_programs {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
