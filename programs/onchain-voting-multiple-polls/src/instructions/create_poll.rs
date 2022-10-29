use anchor_lang::prelude::*;

use crate::state::CustomProgram;
use crate::state::Profile;
use crate::state::Poll;


pub fn create_poll(
    ctx: Context<CreatePoll>, 
    option_a_display_label: String, 
    option_b_display_label: String,
) -> Result<()> {

    // Q: How to keep track of poll_number? Need it to generated
    // unique Seeds for Poll PDA...
    // Do I need to create a PDA for just the Program to track
    // state for itself? E.g. ProgramState, VotooorState, etc.?
    // A: I'm trying to create a Dapp (CustomProgram) PDA to track
    // program summary data (poll_count, profile_count, etc.)...
    let custom_program = &mut ctx.accounts.custom_program;
    let profile = &mut ctx.accounts.profile;
    // Q: Consider making labels to_uppercase()
    // U: Handling this in frontend for now
    let poll = Poll::new(
        custom_program.total_poll_count + 1, // poll_number
        option_a_display_label,
        option_b_display_label,
        ctx.accounts.authority.key(),
        // NOTE bumps.get("account_name"), NOT seed!
        *ctx.bumps.get("poll").expect("Bump not found."),
    );
    // Q: Should I create another Poll right away that reverses
    // the options in order to prevent duplicate Polls? (A v B, B v A)?
    // Or, do I try to prevent from the frontend?
    // Update poll account data with new Poll
    ctx.accounts.poll.set_inner(poll.clone());
    // Increment custom_program.total_poll_count
    custom_program.total_poll_count += 1;
    // Increment profile.poll_count by one
    profile.poll_count += 1;

    Ok(())
}

/// The #[derive(Accounts)] macro specifies all the accounts that are required for a given instruction
/// Here, we define two structs: CreatePoll and Vote
// #[instruction(vote_account_bump: u8)]
#[derive(Accounts)]
pub struct CreatePoll<'info> {

    /// The #[account(...)] macro enforces that our `poll_account` owned by the currently executing program.
    /// 
    /// We mark `poll_account` with the `init` attribute, which creates a new account owned by the program
    /// When using `init`, we must also provide:
    /// `payer`, which funds the account creation
    /// and the `system_program` which is required by the runtime
    /// 
    /// If our account were to use variable length types like String or Vec we would also need to allocate `space` to our account
    /// Since we are only dealing with fixed-sized integers, we can leave out `space` and Anchor will calculate this for us automatically
    ///
    /// `seeds` and `bump` tell us that our `poll_account` is a PDA that can be derived from their respective values
    /// Account<'info, Poll> tells us that it should be deserialized to the Poll struct defined below at #[account]
    // Q: Do I need to use 'pub' on these? Anchor example uses them but
    // original code doesn't
    // A: Yes, seemed to help with compilation
    // Q: Won't using user.key() as a seed limit who can write to the PDA (i.e., only that user)?
    // #[account(init, seeds = [b"vote-account", user.key().as_ref()], payer = user, space = 25, bump)]
    // Q: For seeds, do I use poll.poll_number or custom_program.total_poll_count?
    // A: I BELIEVE I won't have access to poll.poll_number YET, since this is creating the Poll,
    // so this means I should probably use custom_program.poll_count...
    // REF: https://github.com/solana-developers/workshop-dapps/tree/main/solana-twitter
    // poll#1: poll_pda = hash("poll" + 0)
    // poll#2: poll_pda = hash("poll" + 1)
    #[account(
        init, 
        payer = authority, 
        space = Poll::ACCOUNT_SPACE, 
        seeds = [
            Poll::SEED_PREFIX.as_ref(), 
            // Q: Do I need authority or profile for seed?
            // Q: Won't this limit who can WRITE to this Poll PDA?
            // A: Yes, but may need to consider again if I want to
            // disable a certain poll. Or, maybe can have program do it?
            // authority.key().as_ref(),
            (custom_program.total_poll_count + 1).to_string().as_ref()
        ], 
        bump
    )]
    pub poll: Account<'info, Poll>,

    // Q: Need Profile account for authority and to increment
    // profile.poll_count, right?
    // U: Removing profile_number from seeds so wallet can't create
    // multiple Profiles.
    // Q: What is has_one = authority?
    #[account(
        mut,
        constraint = profile.authority.key() == authority.key(),
        seeds = [
            Profile::SEED_PREFIX.as_ref(),
            authority.key().as_ref(),
            // Q: Since we're not creating the Profile, I should be able
            // to/need to use profile.profile_number as a seed, right?
            // U: Removing profile_number from seeds so wallet can't create
            // multiple Profiles.
            // profile.profile_number.to_string().as_ref(),
        ],
        bump = profile.bump,
    )]
    pub profile: Account<'info, Profile>,


    // Need CustomProgram account
    #[account(
        mut,
        seeds = [CustomProgram::SEED_PREFIX.as_ref()],
        bump = custom_program.bump,
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
