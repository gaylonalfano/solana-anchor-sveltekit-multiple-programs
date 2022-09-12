// https://examples.anchor-lang.com/docs/non-custodial-escrow
use anchor_lang::prelude::*;
use anchor_spl::token::{
    Mint, 
    Token, 
    TokenAccount
};
declare_id!("2StMWoVSWWjefwhoFsvjXVcaFABDBeMaFH2pKarQGjdW");

#[program]
pub mod non_custodial_escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, x_amount: u64, y_amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        // NOTE bumps.get("account_name"), NOT seed!
        escrow.bump = *ctx.bumps.get("escrow").unwrap();
        escrow.authority = ctx.accounts.seller.key();
        escrow.escrowed_x_token = ctx.accounts.escrowed_x_token.key();
        escrow.y_amount = y_amount; // number of token sellers wants in exchange
        escrow.y_mint = ctx.accounts.y_mint.key(); // token seller wants in exchange
        msg!("escrow BEFORE transfer: {:?}", ctx.accounts.escrow);


        // Transfer seller's x_token to program owned escrow token account
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.seller_x_token.to_account_info(),
                    to: ctx.accounts.escrowed_x_token.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            x_amount,
        )?;

        Ok(())
    }

    pub fn accept(ctx: Context<Accept>) -> Result<()> {
        // Q: Add Token Program, Rent and System Program?
        // Q: Are we creating any accounts with this instruction or just confirming escrow data?
        // Q: What about Token Program for transfers?
        // Q: Verify escrow data matches?
        // NOTE Well, lots is verified inside the instruction validation struct...
        // A: No! It's already validated! Just transfer!

        // Q: What's the flow? 
        // A: Here's the flow:
        // 1. Transfer escrowed_x_token to buyer
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(), 
                anchor_spl::token::Transfer {
                    from: ctx.accounts.escrowed_x_token.to_account_info(),
                    to: ctx.accounts.buyer_x_token.to_account_info(),
                    // Q: Who's the authory of escrow.escrowed_x_token?
                    // A: The escrow account itself (see init token::authority = escrow)
                    // Q: But this is a PDA... How to sign or pass seeds?
                    // A: Must use CpiContext::new_with_signer() to add a PDA signer!
                    // NOTE https://github.com/coral-xyz/anchor/issues/1611
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                // signer_seeds
                // Q: Do we need our program Id as a seed?
                // A: Nope! But we need the bump!
                &[&["escrow2".as_bytes(), ctx.accounts.escrow.authority.as_ref(), &[ctx.accounts.escrow.bump]]]
            ),
            ctx.accounts.escrowed_x_token.amount,
        )?;

        // 2. Transfer y_amount of buyer_y_token to seller
        // ... THAT'S IT! Wow, overthought that one...
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(), 
                anchor_spl::token::Transfer {
                    from: ctx.accounts.buyer_y_token.to_account_info(),
                    to: ctx.accounts.seller_y_token.to_account_info(),
                    // Q: Authority of buyer_y_token is buyer, right?
                    // A: Yes! It's the buyer's wallet after all...
                    authority: ctx.accounts.buyer.to_account_info(),
                }
            ),
            ctx.accounts.escrow.y_amount,
        )?;
        
        Ok(())
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        // NOTE Allow the seller (initiator) to cancel the escrow
        // Q: What't the flow?
        // Transfer escrowed_x_token back to seller (initiator)?
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.escrowed_x_token.to_account_info(),
                    to: ctx.accounts.seller_x_token.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                }, 
                // signer_seeds since escrow is authority and is PDA
                &[&["escrow2".as_bytes(), ctx.accounts.escrow.authority.as_ref(), &[ctx.accounts.escrow.bump]]]
            ),
            // amount of x token
            ctx.accounts.escrowed_x_token.amount,
        )?;

        // Q: Which account do we close? escrow? escrowed_x_token?
        // A: escrowed_x_token!
        // Q: How do you close an account?
        // A: Use the token::close_account() method!
        anchor_spl::token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::CloseAccount {
                    account: ctx.accounts.escrowed_x_token.to_account_info(),
                    // Q: Is 'destination' where the refund should go to (i.e., original payer)?
                    destination: ctx.accounts.seller.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },  
                // signer_seeds since 'escrow' is authority of escrowed_x_token and is PDA
                // NOTE signer_seeds is a bunch of &[u8] types, so use .as_bytes(), as_ref(), etc.
                // NOTE escrow.authority = seller since the seller paid to create the PDA account
                // Q: When do I use escrow.authority versus seller? Either okay?
                &[&["escrow2".as_bytes(), ctx.accounts.escrow.authority.as_ref(), &[ctx.accounts.escrow.bump]]]
                // &[&["escrow".as_bytes(), ctx.accounts.seller.as_ref()], &[ctx.accounts.escrow.bump]]
            )
        )?;

        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    // Q: Need 'pub' or no?
    #[account(mut)]
    seller: Signer<'info>,

    x_mint: Account<'info, Mint>,

    y_mint: Account<'info, Mint>,

    #[account(
        mut, 
        constraint = seller_x_token.mint == x_mint.key(),
        constraint = seller_x_token.owner == seller.key()
    )] 
    seller_x_token: Account<'info, TokenAccount>,

    #[account(
        init, 
        payer = seller,  // authority (wallet that's paysing for PDA account creation)
        space = Escrow::LEN,
        seeds = ["escrow2".as_bytes(), seller.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,

    // Q: This isn't a PDA, right? But making the escrow PDA account
    // the authority, so guess the escrow PDA grants permission?
    // FIXME For some reason this account isn't getting initialized
    // according to my tests. If if spl-token account-info --address <TOKEN_ACCOUNT_ADDRESS>
    // it doesn't exist. Somehow this 'init' isn't working...
    // A: YEP! test-validator issue! Need to hard restart the validator
    // before running the tests.
    #[account(
        init,
        payer = seller,
        token::mint = x_mint, // Setting the .mint property
        token::authority = escrow, // Setting the .authority property to be escrow PDA account address
    )]
    escrowed_x_token: Account<'info, TokenAccount>,

    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Accept<'info> {
    // Q: What do we need to accept the escrow and exchange their current assets for new one?
    // - buyer's wallet account (also the signer, right?)
    // - buyer_y_token account YES!
    // - buyer_x_token account (to send escrowed_x_token amount to) YES!
    // --- Maybe system_program too in case needs to create buyer_x_token account? NOPE!
    // - Access to escrow account data YES!
    // - token_program to perform transfers YES!
    // Q: Add Token Program, Rent and System Program?
    // A: Only Token Program for transfers.
    // Q: Are we creating any accounts with this instruction or just confirming escrow data?
    // A: No! Just verifying token match up/align.
    // Q: What about Token Program for transfers?
    // A: Yes, need Token Program for transfers
    #[account(mut)]
    pub buyer: Signer<'info>,

    // NOTE 'seeds' are &[u8], so need to use as_bytes(), as_ref(), etc.
    #[account(mut, seeds = ["escrow2".as_bytes(), escrow.authority.key().as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    // Q: Do we need to create a escrowed_y_token account inside escrow?
    // A: NO! But we DO need buyer and seller's x and y token accounts data
    // Or, do we just need to confirm the y_mint address and y_amount?
    // NOTE Our initialize ix already stored y_mint and y_amount data
    // NOTE Confirm that this account arg matches the escrow.escrowed_x_token account address
    #[account(mut, constraint = escrowed_x_token.key() == escrow.escrowed_x_token)]
    pub escrowed_x_token: Account<'info, TokenAccount>,

    // NOTE Confirm the seller_y_token.mint matches escrow.y_mint address
    // This ensures we're matching the same y token
    #[account(mut, constraint = seller_y_token.mint == escrow.y_mint)]
    pub seller_y_token: Account<'info, TokenAccount>,

    // NOTE Verifying that x token are the same. Can't use escrow.mint (no prop)!
    #[account(mut, constraint = buyer_x_token.mint == escrowed_x_token.mint)]
    pub buyer_x_token: Account<'info, TokenAccount>,

    // NOTE Verify that y token align AND that our buyer account matches buyer_x_token.owner!
    #[account(
        mut, 
        constraint = buyer_y_token.mint == escrow.y_mint, 
        constraint = buyer_y_token.owner == buyer.key()
    )]
    pub buyer_y_token: Account<'info, TokenAccount>,

    // NOTE Pass Token Program so we can perform all the transfers
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    // Q: Need a constraint = escrow.authority.key() == seller.key()?
    // A: Yes! But just need escrow.authority (no .key() needed). Also need close = seller
    // Q: What is 'close' arg?
    #[account(
        mut, 
        close = seller, 
        constraint = escrow.authority == seller.key(), 
        seeds = ["escrow2".as_bytes(), escrow.authority.as_ref()], 
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    // NOTE The owner/authority of token account is the escrow PDA account
    // This means we'll need CpiContext::new_with_signer() to have PDA signer
    #[account(mut, constraint = escrowed_x_token.key() == escrow.escrowed_x_token)]
    pub escrowed_x_token: Account<'info, TokenAccount>,

    // Q: Need seller_x_token account?
    // A: Yes!
    // Q: What kind of checks are needed?
    // A: Check that seller is the owner and verify the mint matches
    #[account(
        mut, 
        constraint = seller_x_token.owner == seller.key(),
        constraint = seller_x_token.mint == escrowed_x_token.mint,
    )]
    seller_x_token: Account<'info, TokenAccount>,

    // Need token program for transfers
    token_program: Program<'info, Token>,
}


// This is a PDA for our escrow data account
// REF: Check out solana-escrow/state.rs to see how Escrow struct is defined
#[derive(Debug)]
#[account]
pub struct Escrow {
    authority: Pubkey, // The seller (initiator of exchange)
    bump: u8,
    escrowed_x_token: Pubkey, // Token Account Address
    y_mint: Pubkey, // Mint Address
    y_amount: u64, // Amount seller is wanting in exchange of x_amount of x_token
}


impl Escrow {
    // 8 Discrimator
    // 1 Bump
    // 32 Authority
    // 32 X Token Account Address
    // 32 Y Mint Address
    // 8 Y Amount
    pub const LEN: usize = 8 + 1 + 32 + 32 + 32 + 8;
}
