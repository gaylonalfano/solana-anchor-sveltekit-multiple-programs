use anchor_lang::{prelude::*, system_program};
use anchor_spl::{associated_token, token};

pub fn sell_nft(ctx: Context<SellNft>, sale_lamports: u64) -> Result<()> {
    msg!("1. Initiating transfer of {} lamports...", sale_lamports);
    msg!("Buyer (sending lamports): {}", &ctx.accounts.buyer_authority.key());
    msg!("Seller (receiving lamports): {}", &ctx.accounts.seller_authority.key());
    // === Reference from RAW ===
    // invoke(
    //     // Instruction
    //     // NOTE See how easy this instruction is since it's a System Instruction!
    //     &system_instruction::transfer(sender.key, receiver.key, amount),
    //     // Accounts Info
    //     &[sender.clone(), receiver.clone()],
    // )?;
    // Q: How do I call the transfer() method?
    // A: Must create a new CpiContext manually! Doesn't align with our SellNft struct!
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(), // Program to invoke
            system_program::Transfer {  // Instructions with accounts to pass to program
                from: ctx.accounts.buyer_authority.to_account_info(),
                to: ctx.accounts.seller_authority.to_account_info() 
            }
        ),
        sale_lamports
    )?;

    msg!("Lamports transferred successfully.");

    msg!("2. Creating buyer associated token account...");
    msg!("Buyer's Token Account Address: {}", &ctx.accounts.buyer_token_account.key());
    // === Reference from RAW ===
    // // Q: Is this spl-token create-account <TOKEN_ADDRESS> <OWNER_ADDRESS>?
    // // A: Yes! This creates ATA based on keypair of the Mint account
    // // NOTE When running this CLI command, the owner of account is our local keypair account
    // // NOTE This create-account command literally adds the token account (ATA) inside owner's wallet!
    // // Q: Is this the Token Metadata Program creating the Metadata Account for the token?
    // // A: NO! Not sure where we create the metadata account, but this isn't it just yet!
    // msg!("3. Creating associated token account for the mint/token and the wallet...");
    // msg!("Token Account Address: {}", token_account.key);
    // invoke(
    // // Instruction
    // &associated_token_account_instruction::create_associated_token_account(
    //     &mint_authority.key, // funding address
    //     &mint_authority.key, // wallet address
    //     &mint.key, // Token Identifier/Address
    // ),
    // // AccountInfo
    // &[
    //     mint.clone(),
    //     token_account.clone(),
    //     mint_authority.clone(),
    //     token_program.clone(),
    //     associated_token_program.clone(),
    // ]
    // )?;
    associated_token::create(
        CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            associated_token::Create { 
                payer: ctx.accounts.buyer_authority.to_account_info(), 
                associated_token: ctx.accounts.buyer_token_account.to_account_info(), 
                // Q: How do you know which is the authority? Authority of what?
                // The wallet that this ATA is getting added to? Perhaps...
                // A: Yes! It's the buyer's wallet that has authority of this new ATA!
                authority: ctx.accounts.buyer_authority.to_account_info(), 
                mint: ctx.accounts.mint.to_account_info(), 
                system_program: ctx.accounts.system_program.to_account_info(), 
                // NOTE Still need main token_program to create associated token account 
                token_program: ctx.accounts.token_program.to_account_info(), 
                rent: ctx.accounts.rent.to_account_info(), 
            }
        )
    )?;



    msg!("3. Transferring NFT from Seller to Buyer...");
    msg!("Seller's Token Account Address: {}", &ctx.accounts.seller_token_account.key());
    msg!("Buyer's Token Account Address: {}", &ctx.accounts.buyer_token_account.key());
    // Q: Is it the Token Program that does the transfer since we're dealing with Tokens
    // and Token Accounts? NOTE We use System Program for regular SOL/Lamports transfers...
    // A: Yes! Token Program has its own transfer() method!
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer { 
                from: ctx.accounts.seller_token_account.to_account_info(), 
                to: ctx.accounts.buyer_token_account.to_account_info(), 
                authority: ctx.accounts.seller_authority.to_account_info()
            }
        ),
        1 // Transfer 1 NFT Token
    )?;
    msg!("NFT transferred successfully.");
    msg!("Sale completed successfully!");

    Ok(())
}




// IMPORTANT: Here we're using a SINGLE Instruction accounts struct to house everything.
// However, you often see this split into smaller structs for specific transaction instruction
// functions. 
#[derive(Accounts)]
pub struct SellNft<'info> {
// Q: For SOL transfers, only the sender (buyer) has to sign (per transferring SOL project)
// How do I configure these accounts? Are they both mutable since eventually the seller's
// token account needs to be modified, right? Do I need separate Account structs to handle
// the different scenarios for when the seller isn't mutable to recieve SOL, but IS mutable
// when transferring the NFT???
// A: Just make them all mutable! Seems like Anchor automatically manages when the instruction
// requires the accounts to be mutable or not. We DO NOT need custom Account structs, since
// we're not dealing with any data accounts -- simply transferring tokens between wallets
// Q: What about creating the Token Account for the buyer? Shouldn't need anything special there...
// A: Yea, we just use UncheckedAccount since Anchor will create the ATA inside the transaction.
// Q: Do we need the Mint and Mint Authority? What's the Mint Authority for an owned NFT? 
// I believe it's the owner's (seller) wallet... We're not minting new supply, just transferring...
// A: Yes, need Mint to create buyer's ATA. Mint Authority SHOULD be seller's wallet...
// === Code below ===
    #[account(mut)]
    pub mint: Account<'info, token::Mint>,
    // Q: Why is type TokenAccount instead of AssociatedToken?
    // A: associated_token::AssociatedToken points to the PROGRAM! Not an ATA type!
    #[account(mut)]
    pub seller_token_account: Account<'info, token::TokenAccount>,

    #[account(mut)]
    pub seller_authority: Signer<'info>,

    /// CHECK: We're about to create this with Anchor inside transaction
    #[account(mut)]
    pub buyer_token_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub buyer_authority: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}


