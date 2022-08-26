// https://www.youtube.com/watch?v=c1GJ-13z6pE&list=PLUBKxx7QjtVnU3hkPc8GF1Jh4DE7cf4n1&index=8
use {
    anchor_lang::{
        prelude::*,
        solana_program::program::invoke,
        system_program,
    },
    anchor_spl::{
        associated_token,
        token,
    },
    mpl_token_metadata::{
        ID as TOKEN_METADATA_PROGRAM_ID,
        instruction as token_metadata_instruction,
    },
};

pub fn mint_nft(ctx: Context<MintNft>, metadata_name: String, metadata_symbol: String, metadata_uri: String) -> Result<()> {

    // Invoke a Cross-program Invocation: 
    // NOTE Hits another program by sending required accounts
    // Q: Is this the spl-token create-account <TOKEN_ADDRESS> command?
    // A: NO! I believe this is the CPI to SystemProgram, which creates
    // a fresh account and makes the Token Program its owner.
    msg!("1. Creating account for the actual mint (token)...");
    // msg!("Mint: {}", &ctx.accounts.mint.key());
    system_program::create_account(
        // NOTE The CpiContext stores the program and Accounts
        CpiContext::new(
            // NOTE Every CpiContext takes a program ID and instruction
            // NOTE Program = What program to hit
            // NOTE Instructions = What instructions to pass to the program
            // NOTE Everything is AccountInfo in CpiContext
            // IMPORTANT I believe this is equivalent to AccountInfo[]:
            // 
            // &[
            //     mint.clone(), // Clone so ownership isn't moved into each tx
            //     mint_authority.clone(),
            //     token_program.clone(),
            // ]
            ctx.accounts.token_program.to_account_info(),
            system_program::CreateAccount {
                // Our wallet is paying to create the mint account
                from: ctx.accounts.mint_authority.to_account_info(), // wallet
                to: ctx.accounts.mint.to_account_info(), // mint
            }
        ),
        // Additional params
        10000000, // Lamports
        82, // Size
        &ctx.accounts.token_program.key() // Owner i.e. Token Program owns the Mint account
    )?;

    // Q: Is this the spl-token create-account <TOKEN_ADDRESS> command?
    // A: NO! This is spl-token create-token --decimals 0
    // NOTE --decimals 0 is the protocol for NFTs
    msg!("2. Initializing mint account as a mint...");
    // msg!("Mint: {}", &ctx.accounts.mint.key());
    token::initialize_mint(
        CpiContext::new(
            // Q: Do I use to_account_info() or key()?
            // A: MUST use to_account_info() inside CpiContext
            // NOTE Don't use '&' references when using to_account_info()
            // Only use '&' when referencing Pubkeys
            ctx.accounts.token_program.to_account_info(), // Pinging Token Program
            // Q: What about mint_authority account? Where does it go?
            // A: It's still present, just passed as arg to initialize_mint(),
            // instead of inside CpiContext. Not 100% sure why...
            token::InitializeMint { // Instructions
                mint: ctx.accounts.mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ), 
        0, // Decimals - Set to 0 for NFTs
        &ctx.accounts.mint_authority.key(), // authority
        Some(&ctx.accounts.mint_authority.key()) // freeze authority
    )?;

    // Q: Is this spl-token create-account <TOKEN_ADDRESS> <OWNER_ADDRESS>?
    // A: Yes, I believe this is more-or-less the equivalent, BUT it's hitting
    // the Associated Token Program, which hits the main Token Program, which itself
    // hits the System Program that creates the ATA.
    // Q: Does the System Program assign the Associated Token Program OR
    // the Token Program as the OWNER of the ATA? Is there even an Owner to ATAs? Probably...
    // NOTE When running this CLI command, the owner of account is our local keypair account
    // NOTE This create-account command literally adds the token account (token holdings) inside owner's wallet!
    // Q: Is this the Token Metadata Program creating the Metadata Account for the token?
    // A: Don't believe so because this comes later with steps 5 and 6 w/ Metaplex
    msg!("3. Creating associated token account for the mint and the wallet...");
    // msg!("Token Address: {}", &ctx.accounts.token_account.to_account_info().key());
    associated_token::create(
        CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            associated_token::Create { 
                payer: ctx.accounts.mint_authority.to_account_info(), 
                associated_token: ctx.accounts.token_account.to_account_info(),
                // Q: How do you know which is the authority? Authority of what?
                // The wallet that this ATA is getting added to? Perhaps...
                // A: Yes! It's the owner's wallet <OWNER_ADDRESS> that has authority of this new ATA!
                authority: ctx.accounts.mint_authority.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                // NOTE Still need main token_program to create associated token account 
                token_program: ctx.accounts.token_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            }
            // Q: What about the other args mint_authority, mint_authority, mint?
            // Q: Why do we pass rent? This is very different from the raw example
            // I believe since we're creating a new account using System Program,
            // that it needs the rent to initialize the account, but not 100% sure...
        ),
    )?;

    // Q: Is this spl-token mint <TOKEN_ADDRESS> <AMOUNT> <RECIPIENT_ADDRESS>?
    // A: Yes! This mints (increases supply of Token) and transfers new tokens
    // to owner's token account (default recipient token address) balance
    msg!("4. Minting token to the token account (i.e. give it 1 for NFT)...");
    // msg!("Mint: {}", &ctx.accounts.mint.key());
    // msg!("Token Address: {}", &ctx.accounts.token_account.to_account_info().key());
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(), // Program to ping
            token::MintTo { // Instructions with accounts to pass to program
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            }
            // Q: Why not pass rent account? We do in the raw version
            // NOTE I believe the raw INSTRUCTION corresponds (mostly) to the
            // Anchor CpiContext. It's not 100%, but seems to be mostly the case
        ), 
        // Additonal args
        1 // amount
    )?;

    msg!("5. Creating metadata account...");
    // msg!("Metadata Account Address: {}", &ctx.accounts.metadata.to_account_info().key());
    // NOTE Need to use metadata.to_account_info().key() since it's an UncheckedAccount
    // NOTE Use solana_program invoke() CPI to create the transaction
    // Specifically, we use Metaplex's instruction function to create the
    // instruction we need and pass in the needed accounts
    invoke(
        // Instruction
        // NOTE Metaplex creates this account and this account stores
        // a lot of the following data on-chain. HOWEVER, the metadata_uri
        // (in this example) will point to off-chain metadata.
        // FIXME create_metadata_accounts_v3() Errors (may need spl-token-2022?? *Read the
        // solana logs!) due to Program computational budget exceeded!
        // UPDATE Using the version2 method WORKS!
        // UPDATE2: Well, now it's failing again...Read: https://stackoverflow.com/questions/71887004/solana-computational-budget-exceeded
        // &token_metadata_instruction::create_metadata_accounts_v2(
        //     TOKEN_METADATA_PROGRAM_ID, // Token Metadata Program we're invoking
        //     ctx.accounts.metadata.key(), // metadata_account
        //     ctx.accounts.mint.key(), // mint_account
        //     ctx.accounts.mint_authority.key(), // Mint authority
        //     ctx.accounts.mint_authority.key(), // Payer
        //     ctx.accounts.mint_authority.key(), // Update authority
        //     metadata_name, // Passed in fn as ix data argument
        //     metadata_symbol, // Passed in fn as ix data argument 
        //     metadata_uri, // Passed in fn as ix data argument. Off-chain Metadata (in this example)
        //     None, // Option<Vec<Creator, Global>>
        //     1, // seller_fee_basis_points, 
        //     true, // update_authority_is_signer, 
        //     false, // is_mutable, 
        //     None, // Option<Uses>
        //     None, // Option<Collection>
        // ),
        &token_metadata_instruction::create_metadata_accounts_v3(
            TOKEN_METADATA_PROGRAM_ID, // Token Metadata Program we're invoking
            ctx.accounts.metadata.key(), // metadata_account
            ctx.accounts.mint.key(), // mint_account
            ctx.accounts.mint_authority.key(), // Mint authority
            ctx.accounts.mint_authority.key(), // Payer
            ctx.accounts.mint_authority.key(), // Update authority
            metadata_name, // Passed in fn as ix data argument
            metadata_symbol, // Passed in fn as ix data argument 
            metadata_uri, // Passed in fn as ix data argument. Off-chain Metadata (in this example)
            None, // Option<Vec<Creator, Global>>
            1, // seller_fee_basis_points, 
            true, // update_authority_is_signer, 
            false, // is_mutable, 
            None, // Option<Collection>
            None, // Option<Uses>
            None, // Option<CollectionDetails>
        ),
        // Account Info
        &[
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.mint_authority.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ]
    )?;

    msg!("6. Creating master edition metadata account...");
    // msg!("Master Edition Metadata Account Address: {}", &ctx.accounts.master_edition_metadata.to_account_info().key());
    // NOTE Use solana_program invoke() CPI to create the transaction
    // Specifically, we use Metaplex's instruction function to create the
    // instruction we need and pass in the needed accounts
    invoke(
        // Instruction
        // NOTE This master_edition_metadata account allows you to get
        // into details such as royalties, limited editions, etc.
        &token_metadata_instruction::create_master_edition_v3(
            TOKEN_METADATA_PROGRAM_ID, // Token Metadata Program we're invoking
            ctx.accounts.master_edition_metadata.key(), // (master) edition account
            ctx.accounts.mint.key(), // mint account
            ctx.accounts.mint_authority.key(), // Update authority
            ctx.accounts.mint_authority.key(), // Mint authority
            ctx.accounts.metadata.key(), // Metadata
            ctx.accounts.mint_authority.key(), // Payer
            Some(0), // max_supply: Option<u64>
        ),
        // Account Info
        &[
            ctx.accounts.master_edition_metadata.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.mint_authority.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ]
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct MintNft<'info> {
// NOTE Anchor uses a Struct to handle all the accounts needed for tx:
// let mint = next_account_info(accounts_iter)?; // Create a new mint (token)
// let token_account = next_account_info(accounts_iter)?; // Create a token account for the mint
// let mint_authority = next_account_info(accounts_iter)?; // Our wallet
// let rent = next_account_info(accounts_iter)?; // Sysvar but still an account
// let system_program = next_account_info(accounts_iter)?;
// let token_program = next_account_info(accounts_iter)?;
// let associated_token_program = next_account_info(accounts_iter)?;

/// CHECK: We're about to create this with Metaplex inside transaction
#[account(mut)]
pub master_edition_metadata: UncheckedAccount<'info>,
/// CHECK: We're about to create this with Metaplex inside transaction,
/// so we don't need to validate that it exists
#[account(mut)]
pub metadata: UncheckedAccount<'info>,

#[account(mut)]
pub mint: Signer<'info>,

/// CHECK: We're about to create this with Anchor inside transaction
#[account(mut)]
pub token_account: UncheckedAccount<'info>,

#[account(mut)]
pub mint_authority: Signer<'info>, // The wallet

pub rent: Sysvar<'info, Rent>,
pub system_program: Program<'info, System>,
pub token_program: Program<'info, token::Token>,
pub associated_token_program: Program<'info, associated_token::AssociatedToken>,

// NOTE This is Metaplex's on-chain program. We're going to use it via CPI to create some metadata
// FIXME I'm running into: Error processing Instruction 0: instruction expected an
// executable account when trying to anchor test on localnet. It MAY be a
// problem since I'm trying to run Metaplex's on-chain program, but I may not
// have that account data on localnet. READ for details:
// https://discord.com/channels/889577356681945098/889702325231427584/946505326830690354
// NOTE I believe you may need to CLONE the account from mainnet in order
// to use locally. To do this, you can use an Anchor.toml feature:
// https://discord.com/channels/889577356681945098/889702325231427584/943483106852212766
// #[account(address = spl_token_metadata::id())]
// pub token_metadata_program: AccountInfo<'info>,

/// CHECK: Metaplex will check this
pub token_metadata_program: UncheckedAccount<'info>,
// #[account(address = TOKEN_METADATA_PROGRAM_ID)]
// pub token_metadata_program: UncheckedAccount<'info>

}


