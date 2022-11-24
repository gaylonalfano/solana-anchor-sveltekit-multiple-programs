// https://examples.anchor-lang.com/docs/non-custodial-escrow
use anchor_lang::prelude::*;
use anchor_spl::token::{
    Mint, 
    Token, 
    TokenAccount
};
declare_id!("2StMWoVSWWjefwhoFsvjXVcaFABDBeMaFH2pKarQGjdW");

// U: Updated/renamed escrow fields to use out/in instead of x/y. I eventually want to allow users
// the ability to create multiple escrows, but need to rethink the seeds to allow more. 
// May need to change/add another account struct as a parent or something.

#[program]
pub mod non_custodial_escrow {
    use super::*;

    pub fn create_custom_program(ctx: Context<CreateCustomProgram>) -> Result<()> {
        let custom_program = CustomProgram::new(
            ctx.accounts.authority.key(),         
            // NOTE bumps.get("account_name"), NOT seed!
            *ctx.bumps.get("custom_program").expect("Bump not found.")
        );

        ctx.accounts.custom_program.set_inner(custom_program.clone());

        Ok(())
    }


    pub fn initialize(ctx: Context<Initialize>, out_amount: u64, in_amount: u64) -> Result<()> {
        let custom_program = &mut ctx.accounts.custom_program;
        let escrow = &mut ctx.accounts.escrow;
        escrow.authority = ctx.accounts.seller.key();
        escrow.escrow_number = custom_program.total_escrow_count + 1;
        // Q: How to add a placeholder Pubkey until accept() ix? Can it be left empty?
        // U: Pubkey::new_unique() that may work
        // U: I don't think this will work at this point since 'buyer' account
        // isn't part of Context until accept() ix. 
        // U: Can I initialize with an empty escrow.buyer field? Think so...
        // A: Yes! It seems I don't have to assign an actual value to the field
        // and the placeholder is: buyer: PublicKey { _bn: <BN: 0> },
        // NOTE bumps.get("account_name"), NOT seed!
        escrow.bump = *ctx.bumps.get("escrow").unwrap();
        escrow.escrowed_out_token_account = ctx.accounts.escrowed_out_token_account.key();
        escrow.out_mint = ctx.accounts.out_mint.key(); // token seller HAS
        escrow.out_amount = out_amount; 
        escrow.in_amount = in_amount; // number of token sellers wants in exchange
        escrow.in_mint = ctx.accounts.in_mint.key(); // token seller WANTS
        escrow.is_active = true;
        escrow.has_exchanged = false;
        msg!("escrow BEFORE transfer: {:?}", ctx.accounts.escrow);


        // Transfer seller's out_token_account to program owned escrow token account
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.seller_out_token_account.to_account_info(),
                    to: ctx.accounts.escrowed_out_token_account.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            out_amount,
        )?;

        // U: Increment the custom_program.total_escrow_count
        custom_program.total_escrow_count += 1;

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
        // 1. Transfer escrowed_out_token_account to buyer
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(), 
                anchor_spl::token::Transfer {
                    from: ctx.accounts.escrowed_out_token_account.to_account_info(),
                    to: ctx.accounts.buyer_in_token_account.to_account_info(),
                    // Q: Who's the authory of escrow.escrowed_out_token_account?
                    // A: The escrow account itself (see init token::authority = escrow)
                    // Q: But this is a PDA... How to sign or pass seeds?
                    // A: Must use CpiContext::new_with_signer() to add a PDA signer!
                    // NOTE https://github.com/coral-xyz/anchor/issues/1611
                    authority: ctx.accounts.escrow.to_account_info(),
                },
                // signer_seeds
                // Q: Do we need our program Id as a seed?
                // A: Nope! But we need the bump!
                &[&[
                    Escrow::SEED_PREFIX.as_bytes(), 
                    ctx.accounts.escrow.authority.as_ref(),
                    // U: Add escrow_number seed
                    ctx.accounts.escrow.escrow_number.to_string().as_ref(),
                    &[ctx.accounts.escrow.bump]
                ]]
            ),
            ctx.accounts.escrowed_out_token_account.amount,
        )?;

        // 2. Transfer in_amount of buyer_out_token_account to seller
        // ... THAT'S IT! Wow, overthought that one...
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(), 
                anchor_spl::token::Transfer {
                    from: ctx.accounts.buyer_out_token_account.to_account_info(),
                    to: ctx.accounts.seller_in_token_account.to_account_info(),
                    // Q: Authority of buyer_out_token_account is buyer, right?
                    // A: Yes! It's the buyer's wallet after all...
                    authority: ctx.accounts.buyer.to_account_info(),
                }
            ),
            ctx.accounts.escrow.in_amount,
        )?;

        // Update the escrow account is_active and has_exchanged fields
        ctx.accounts.escrow.is_active = false;
        ctx.accounts.escrow.has_exchanged = true;
        // Q: Should I also close the account?
        // A: No! We close the escrowed_out_token_account account with cancel()
        // U: Trying to add buyer, out_mint, out_amount to Escrow...
        // Q: Is this where I would update escrow.buyer field?
        // U: First test that I can initialize() with EMPTY escrow.buyer field...
        // U: I CAN init with empty Pubkey field: buyer: PublicKey { _bn: <BN: 0> },
        // so now it's time to try setting/updating the buyer field...
        ctx.accounts.escrow.buyer = ctx.accounts.buyer.key();
        
        Ok(())
    }

    pub fn cancel(ctx: Context<Cancel>) -> Result<()> {
        // NOTE Allow the seller (initiator) to cancel the escrow
        // Q: What't the flow?
        // Transfer escrowed_out_token_account back to seller (initiator)?
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.escrowed_out_token_account.to_account_info(),
                    to: ctx.accounts.seller_out_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                }, 
                // signer_seeds since escrow is authority and is PDA
                &[&[
                    Escrow::SEED_PREFIX.as_bytes(),
                    ctx.accounts.escrow.authority.as_ref(),
                    ctx.accounts.escrow.escrow_number.to_string().as_ref(),
                    &[ctx.accounts.escrow.bump]
                ]]
            ),
            // amount of x token
            ctx.accounts.escrowed_out_token_account.amount,
        )?;

        // Q: Which account do we close? escrow? escrowed_out_token_account?
        // A: escrowed_out_token_account!
        // Q: How do you close an account?
        // A: Use the token::close_account() method!
        anchor_spl::token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::CloseAccount {
                    account: ctx.accounts.escrowed_out_token_account.to_account_info(),
                    // Q: Is 'destination' where the refund should go to (i.e., original payer)?
                    destination: ctx.accounts.seller.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                },  
                // signer_seeds since 'escrow' is authority of escrowed_out_token_account and is PDA
                // NOTE signer_seeds is a bunch of &[u8] types, so use .as_bytes(), as_ref(), etc.
                // NOTE escrow.authority = seller since the seller paid to create the PDA account
                // Q: When do I use escrow.authority versus seller? Either okay?
                &[&[
                    Escrow::SEED_PREFIX.as_bytes(),
                    ctx.accounts.escrow.authority.as_ref(),
                    ctx.accounts.escrow.escrow_number.to_string().as_ref(),
                    &[ctx.accounts.escrow.bump]
                ]]
                // &[&["escrow".as_bytes(), ctx.accounts.seller.as_ref()], &[ctx.accounts.escrow.bump]]
            )
        )?;

        // Update the escrow account is_active and has_exchanged fields
        // Q: Is 'escrow' still available after closing 'escrowed_out_token_account'?
        // A: NOPE! It's completely closed so no need to update!
        // ctx.accounts.escrow.is_active = false;
        // ctx.accounts.escrow.has_exchanged = false;

        Ok(())
    }
}


// === INSTRUCTIONS ===
#[derive(Accounts)]
pub struct CreateCustomProgram<'info> {
    // Q: Do I need authority.key() for a seed?
    // Should I use my program's ID or something as a Seed?
    #[account(
        init, 
        payer = authority, 
        space = CustomProgram::ACCOUNT_SPACE, 
        seeds = [
            CustomProgram::SEED_PREFIX.as_ref(), 
        ], 
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


#[derive(Accounts)]
pub struct Initialize<'info> {
    // U: Need custom_program for escrow_number (seed)
    // Q: Add any constraints?
    // A: We need the seeds and bump to derive/find the PDA!
    #[account(
        mut,
        seeds = [CustomProgram::SEED_PREFIX.as_ref()],
        bump = custom_program.bump,
    )]
    custom_program: Account<'info, CustomProgram>,

    // Q: Need 'pub' or no?
    #[account(mut)]
    seller: Signer<'info>,

    out_mint: Account<'info, Mint>,

    in_mint: Account<'info, Mint>,

    #[account(
        mut, 
        constraint = seller_out_token_account.mint == out_mint.key(),
        constraint = seller_out_token_account.owner == seller.key()
    )] 
    seller_out_token_account: Account<'info, TokenAccount>,

    #[account(
        init, 
        payer = seller,  // authority (wallet that's paysing for PDA account creation)
        space = Escrow::ACCOUNT_SPACE,
        // Q: If I want to create MULTIPLE escrow accounts, then do I need
        // to rethink the seed with only seller.key()? 
        seeds = [
            Escrow::SEED_PREFIX.as_bytes(),
            seller.key().as_ref(),
            (custom_program.total_escrow_count + 1).to_string().as_ref(),
        ],
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
        token::mint = out_mint, // Setting the .mint property
        token::authority = escrow, // Setting the .authority property to be escrow PDA account address
    )]
    escrowed_out_token_account: Account<'info, TokenAccount>,

    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Accept<'info> {
    // Q: What do we need to accept the escrow and exchange their current assets for new one?
    // - buyer's wallet account (also the signer, right?)
    // - buyer_out_token_account account YES!
    // - buyer_in_token_account account (to send escrowed_out_token_account amount to) YES!
    // --- Maybe system_program too in case needs to create buyer_in_token_account account? NOPE!
    // - Access to escrow account data YES!
    // - token_program to perform transfers YES!
    // Q: Add Token Program, Rent and System Program?
    // A: Only Token Program for transfers.
    // Q: Are we creating any accounts with this instruction or just confirming escrow data?
    // A: No! Just verifying token match up/align.
    // Q: What about Token Program for transfers?
    // A: Yes, need Token Program for transfers
    // U: Need custom_program for escrow_number (seed)
    // Q: Add any constraints?
    // A: We need the seeds and bump to derive/find the PDA!
    // // Q: Do I need access
    // #[account(
    //     mut,
    //     seeds = [CustomProgram::SEED_PREFIX.as_ref()],
    //     bump = custom_program.bump,
    // )]
    // custom_program: Account<'info, CustomProgram>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    // NOTE 'seeds' are &[u8], so need to use as_bytes(), as_ref(), etc.
    #[account(
        mut, 
        seeds = [
            Escrow::SEED_PREFIX.as_bytes(),
            escrow.authority.key().as_ref(),
            // Q: How to handle u64 values as a seed?
            // A: Convert using .to_string().as_ref()
            escrow.escrow_number.to_string().as_ref(),
        ],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    // Q: Do we need to create a escrowed_in_token_account account inside escrow?
    // A: NO! But we DO need buyer and seller's out and in token accounts data
    // Or, do we just need to confirm the in_mint address and in_amount?
    // NOTE Our initialize ix already stored in_mint and in_amount data
    // NOTE Confirm that this account arg matches the escrow.escrowed_out_token_account account address
    #[account(mut, constraint = escrowed_out_token_account.key() == escrow.escrowed_out_token_account)]
    pub escrowed_out_token_account: Account<'info, TokenAccount>,

    // NOTE Confirm the seller_in_token_account.mint matches escrow.in_mint address
    // This ensures we're matching the same y token
    #[account(mut, constraint = seller_in_token_account.mint == escrow.in_mint)]
    pub seller_in_token_account: Account<'info, TokenAccount>,

    // NOTE Verifying that x token are the same. Can't use escrow.mint (no prop)!
    #[account(mut, constraint = buyer_in_token_account.mint == escrowed_out_token_account.mint)]
    pub buyer_in_token_account: Account<'info, TokenAccount>,

    // NOTE Verify that y token align AND that our buyer account matches buyer_in_token_account.owner!
    #[account(
        mut, 
        constraint = buyer_out_token_account.mint == escrow.in_mint, 
        constraint = buyer_out_token_account.owner == buyer.key()
    )]
    pub buyer_out_token_account: Account<'info, TokenAccount>,

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
        seeds = [
            Escrow::SEED_PREFIX.as_bytes(),
            escrow.authority.as_ref(),
            escrow.escrow_number.to_string().as_ref(),
        ], 
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    // NOTE The owner/authority of token account is the escrow PDA account
    // This means we'll need CpiContext::new_with_signer() to have PDA signer
    #[account(mut, constraint = escrowed_out_token_account.key() == escrow.escrowed_out_token_account)]
    pub escrowed_out_token_account: Account<'info, TokenAccount>,

    // Q: Need seller_out_token_account account?
    // A: Yes!
    // Q: What kind of checks are needed?
    // A: Check that seller is the owner and verify the mint matches
    #[account(
        mut, 
        constraint = seller_out_token_account.owner == seller.key(),
        constraint = seller_out_token_account.mint == escrowed_out_token_account.mint,
    )]
    seller_out_token_account: Account<'info, TokenAccount>,

    // Need token program for transfers
    token_program: Program<'info, Token>,
}

// === STATE ===
// This is a PDA for our escrow data account
// REF: Check out solana-escrow/state.rs to see how Escrow struct is defined
// U: Adding a few new fields to help: out_mint, out_amount, buyer_wallet
// NOTE I'd like to be able to create MULTIPLE escrows with their own PDA route (similar to /polls/[pda])
// So, I could later query the exchange details such as xAmount, buyer, seller, yAmount, etc.
// Most of this is in Escrow account, but may need to add out_amount field.
// Q: Would it be worth creating an Exchange account Struct that stores all of the final
// details of the swap? It would have a escrow: Pubkey field that points to the Escrow
// account PDA, as well as the final buyer's wallet info, etc.
// Q: OR, what if I added some new fields to Escrow account and create a new Instruction
// that allows the Escrow to be updated/modified some way?
// NOTE The cancel() instruction closes the escrowed_out_token_account account, which also
// closes the escrow as well.
#[derive(Debug)]
#[account]
pub struct Escrow {
    authority: Pubkey, // The seller (initiator of exchange)
    // U: Adding escrow_number to enable multiple escrows
    escrow_number: u64,
    // Q: How can I init buyer field with a placeholder until accept()?
    // A: Don't have to! I can be empty until accept() ix updates the field!
    buyer: Pubkey, 
    bump: u8,
    escrowed_out_token_account: Pubkey, // Token Account Address
    out_mint: Pubkey, // new
    out_amount: u64, // new
    in_mint: Pubkey, // Mint Address
    in_amount: u64, // Amount seller is wanting in exchange of out_amount of out_token_account
    is_active: bool,
    has_exchanged: bool, // If is_active == false && has_exchanged == false => CANCELLED
}


impl Escrow {
    // 8 Discrimator
    // 32 Authority
    // 8 Escrow number
    // 32 Buyer 
    // 1 Bump
    // 32 X Token Account Address
    // 32 X Mint Address 
    // 8 X Amount
    // 32 Y Mint Address
    // 8 Y Amount
    // 1 Is Active
    // 1 Has Exchanged
    pub const ACCOUNT_SPACE: usize = 8 + 8 + 32 + 32 + 1 + 32 + 32 + 8 + 32 + 8 + 1 + 1;
    pub const SEED_PREFIX: &'static str = "escrow";
}

// U: Adding another high-level account to enable multiple escrows created by same/single wallet
#[account]
pub struct CustomProgram {
    // 8 bytes for Discrimator
    pub authority: Pubkey, // 32 bytes Initializer/Payer
    pub total_escrow_count: u64, // 8 bytes 
    pub bump: u8, // 1 byte
}

// Adding useful constants for sizing properties to better target memcmp offsets
// REF: https://lorisleiva.com/create-a-solana-dapp-from-scratch/structuring-our-tweet-account#final-code
const DISCRIMINATOR_LENGTH: usize = 8;
const AUTHORITY_LENGTH: usize = 32; // Pubkey
const TOTAL_ESCROW_COUNT_LENGTH: usize = 8;
const BUMP_LENGTH: usize = 1;


impl CustomProgram {

    pub const ACCOUNT_SPACE: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + TOTAL_ESCROW_COUNT_LENGTH
        + BUMP_LENGTH;

    pub const SEED_PREFIX: &'static str = "custom-program";

    pub fn new(authority: Pubkey, bump: u8) -> Self {

        CustomProgram {
            authority, 
            total_escrow_count: 0,
            bump,
        }
    }
}





