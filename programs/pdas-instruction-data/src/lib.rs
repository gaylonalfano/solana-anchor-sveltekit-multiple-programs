use anchor_lang::prelude::*;

declare_id!("FsQ7Br8rjcPMmL9BCQnDwnvVEYqYWoiF4gAX6HZ69S2L");

#[program]
pub mod pdas_instruction_data {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
