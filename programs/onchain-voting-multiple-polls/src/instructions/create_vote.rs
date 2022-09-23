use anchor_lang::prelude::*;

use crate::state::CustomProgram;
use crate::state::Profile;
use crate::state::Poll;
use crate::state::Vote;

pub fn create_vote(
    ctx: Context<CreateVote>, 
    vote_option: Vote::VoteOption
) -> Result<()> {
    // Q: We simply just pass the VoteOption Variant as the
    // argument, right?
    // Q: How to limit a profile (user) from voting more than once
    // for the same Poll?
    // REF: https://discord.com/channels/889577356681945098/889702325231427584/1022026860328136735
    // NOTE: Suggested to store each Vote into a PDA, and then can use
    // getProgramAccounts or fetchMultiple from program.account.
    // When you init a new Vote with user and voting session (vote_number???) as SEEDS,
    // the same user cant init a new Vote in the same voting session because the
    // seeds collide.
    // Q: Which accounts are we going to need to access?
    // --- CustomProgram, Profile, Poll

    let custom_program = &mut ctx.accounts.custom_program;
    let profile = &mut ctx.accounts.profile;
    let poll = &mut ctx.accounts.poll;
    let vote = Vote::new(
        ctx.accounts.authority.key(), // authority
        profile.key(), // profile_pubkey PDA
        poll.key(), // poll_pubkey PDA
        poll.vote_count + 1, // vote_number
        vote_option, // VoteOption
        *ctx.bumps.get(Vote::SEED_PREFIX).expect("Bump not found.") // bump
    );

    // Update Poll option counts based on vote_option
    // NOTE I believe we'll pass our VoteOption Variant!
    match vote_option {
        VoteOption::A => {
            poll.option_a_count += 1;
        },
        VoteOption::B => {
            poll.option_b_count += 1;
        },
    };

    // Update our vote account
    ctx.accounts.vote.set_inner(vote.clone());

    // Increment vote_counts
    custom_program.total_vote_count += 1;
    profile.vote_count += 1;
    poll.vote_count += 1;
    
    Ok(())
}


#[derive(Accounts)]
pub struct CreateVote<'info> {
    #[account(
        init,
        payer = authority,
        space = Vote::ACCOUNT_SPACE,
        // Q: Can you add constraints with init?
        constraint = vote.profile_pubkey.key() == profile.key(),
        seeds = [
            Vote::SEED_PREFIX.as_ref(),
            // Q: Use authority or profile or poll?
            // I think it's flexible, but definitely feel Poll PDA
            // should be a seed... 
            // U: Think I'm going to try just using 'authority' since 
            // it's the actual connected wallet
            poll.key().as_ref(),
            authority.key().as_ref(), // profile.key().as_ref(),
            // Q: Should I use the increment as seed? Won't this allow the
            // same wallet to vote again for same Poll?
            // U: I believe so, so I'm NOT using for now.
        ],
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(
        mut, 
        //constraint = seller_x_token.mint == x_mint.key(),
        constraint = poll.key() == vote.poll_pubkey.key(),
        seeds = [
            Poll::SEED_PREFIX.as_ref(),
            // Q: Do I need authority or profile for seed?
            // Q: Won't this limit who can WRITE to this Poll PDA?
            // authority.key().as_ref(),
            poll.poll_number.to_string().as_ref(),
        ], 
        bump = poll.bump
    )]
    pub poll: Account<'info, Poll>,

    // Need profile
    // Q: Would I use an Anchor constraint = profile.authority == wallet_pubkey?
    #[account(
        mut,
        constraint = profile.key() == vote.profile_pubkey.key(),
        constraint = profile.authority.key() == authority.key(),
        seeds = [
            Profile::SEED_PREFIX.as_ref(),
            authority.key().as_ref(),
            profile.profile_number.to_string().as_ref(),
        ],
        bump
    )]
    pub profile: Account<'info, Profile>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

