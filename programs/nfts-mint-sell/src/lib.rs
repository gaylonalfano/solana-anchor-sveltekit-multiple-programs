// https://www.youtube.com/watch?v=c1GJ-13z6pE&list=PLUBKxx7QjtVnU3hkPc8GF1Jh4DE7cf4n1&index=8
use {
    anchor_lang::prelude::*,
    crate::mint::*,
    crate::sell::*,
};

pub mod mint;
pub mod sell;

declare_id!("BxkVzPHMxjtPqwipVHqmUyw1Ftr33Vd8FFxcRByDHMgJ");

#[program]
pub mod nfts_mint_sell {
    use super::*;

    // NOTE The fn name corresponds to IDL's program.methods.[fn]
    // NOTE All other args are Instruction Data! Anchor simplifies it for us!
    pub fn mint(ctx: Context<MintNft>, metadata_name: String, metadata_symbol: String, metadata_uri: String) -> Result<()> {
        mint::mint_nft(
            ctx,
            metadata_name,
            metadata_symbol,
            metadata_uri,
        )
    }

    pub fn sell(ctx: Context<SellNft>, sale_lamports: u64) -> Result<()> {
        sell::sell_nft(
            ctx,
            sale_lamports,
        )
    }

}

