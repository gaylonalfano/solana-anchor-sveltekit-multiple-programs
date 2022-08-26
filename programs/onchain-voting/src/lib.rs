use anchor_lang::prelude::*;

declare_id!("7SxznnN7ztjk4W9xx5FP7GbjkydxUPzXzFthoMvLMdSs");

#[program]
pub mod onchain_voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
