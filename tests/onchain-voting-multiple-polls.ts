import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { OnchainVotingMultiplePolls } from "../target/types/onchain_voting_multiple_polls";
import { expect } from "chai";
import { BN } from "bn.js";

describe("onchain-voting-multiple-polls", () => {
  const CUSTOM_PROGRAM_SEED_PREFIX = "custom-program";
  const PROFILE_SEED_PREFIX = "profile";
  const POLL_SEED_PREFIX = "poll";
  const VOTE_SEED_PREFIX = "vote";

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace
    .OnchainVotingMultiplePolls as Program<OnchainVotingMultiplePolls>;

  // Global customProgram
  let customProgram: anchor.IdlTypes<anchor.Idl>["CustomProgram"];
  let customProgramPda: anchor.web3.PublicKey;

  // Build some test users
  const testUser1 = anchor.web3.Keypair.generate();
  let testUser1Profile: anchor.IdlTypes<anchor.Idl>["Profile"];
  let testUser1ProfilePda: anchor.web3.PublicKey;
  const testUser1Handle = "testUser1Handle";
  const testUser1DisplayName = "User 1 DN";

  const testUser2 = anchor.web3.Keypair.generate();
  let testUser2Profile: anchor.IdlTypes<anchor.Idl>["Profile"];
  let testUser2ProfilePda: anchor.web3.PublicKey;
  const testUser2Handle = "testUser2Handle";
  const testUser2DisplayName = "User 2 DN";

  // User without a Profile
  const testUser3 = anchor.web3.Keypair.generate();

  // Test polls
  // Q: Do I need global poll account data variables?
  let testPoll1: anchor.IdlTypes<anchor.Idl>["Poll"];
  let testPoll2: anchor.IdlTypes<anchor.Idl>["Poll"];
  let testPoll1Pda: anchor.web3.PublicKey;
  let testPoll2Pda: anchor.web3.PublicKey;

  // Use the before() hook for setup
  before(async () => {
    // 1. Ensure our wallets have SOL
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        testUser1.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      )
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        testUser2.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      )
    );
  });

  it("Create custom program (dApp) account", async () => {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode(CUSTOM_PROGRAM_SEED_PREFIX)],
      program.programId
    );

    // Update global state
    customProgramPda = pda;

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      customProgramPda.toBase58()
    );

    const tx = await program.methods
      .createCustomProgram()
      .accounts({
        customProgram: customProgramPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("TxHash ::", tx);

    // Fetch data after tx confirms and update our account
    const currentCustomProgram = await program.account.customProgram.fetch(
      customProgramPda
    );
    customProgram = currentCustomProgram;

    // Verify the account has set up correctly
    expect(customProgram.totalProfileCount.toNumber()).to.equal(0);
    expect(customProgram.totalPollCount.toNumber()).to.equal(0);
    expect(customProgram.totalVoteCount.toNumber()).to.equal(0);
    expect(customProgram.authority.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
  });

  it("Create user 1 profile", async () => {
    const profileCount = (
      customProgram.totalProfileCount.toNumber() + 1
    ).toString();
    console.log("profileCount: ", profileCount);

    // NOTE Error processing Instruction 0: Cross-program invocation
    // with unauthorized signer or writable account
    // REF: https://stackoverflow.com/questions/72849618/transaction-simulation-failed-error-processing-instruction-0-cross-program-inv
    // U: Check the seeds!
    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(PROFILE_SEED_PREFIX),
        testUser1.publicKey.toBuffer(),
        anchor.utils.bytes.utf8.encode(profileCount),
      ],
      program.programId
    );
    // Update global state
    testUser1ProfilePda = pda;

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      testUser1ProfilePda.toBase58()
    );

    const tx = await program.methods
      .createProfile(testUser1Handle, testUser1DisplayName)
      .accounts({
        profile: testUser1ProfilePda,
        customProgram: customProgramPda,
        authority: testUser1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testUser1])
      .rpc();
    console.log("TxHash ::", tx);

    // Fetch data after tx confirms & update global state
    const currentProfile = await program.account.profile.fetch(
      testUser1ProfilePda
    );
    testUser1Profile = currentProfile;
    const currentCustomProgram = await program.account.customProgram.fetch(
      customProgramPda
    );
    customProgram = currentCustomProgram;

    // Verify the account has set up correctly
    expect(currentProfile.handle).to.equal(testUser1Handle);
    expect(currentProfile.displayName).to.equal(testUser1DisplayName);
    expect(currentProfile.authority.toString()).to.equal(
      testUser1.publicKey.toString()
    );
    expect(currentProfile.pollCount.toNumber()).to.equal(0);
    expect(currentProfile.voteCount.toNumber()).to.equal(0);
    expect(customProgram.totalProfileCount.toNumber()).to.equal(1);
  });

  it("Create new testPoll1 with testUser1", async () => {
    // Need to access current customProgram.totalPollCount
    const pollCount: string = (
      customProgram.totalPollCount.toNumber() + 1
    ).toString();
    console.log("pollCount: ", pollCount);

    // NOTE From Anchor PDA example: https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor
    // NOTE They find the PDA address INSIDE the it() test!
    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(POLL_SEED_PREFIX),
        // Q: Need wallet publicKey? Won't this restrict to only that user
        // being able to write to PDA?
        // A: YES! The original crunchy-vs-smooth didn't use wallet pubkeys,
        // since that would create a unique PDA for the user (not users!).
        anchor.utils.bytes.utf8.encode(pollCount),
      ],
      program.programId
    );
    // Update global state
    testPoll1Pda = pda;

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      testPoll1Pda.toBase58()
    );

    // Following this example to call the methods:
    // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
    const tx = await program.methods
      .createPoll("GMI", "NGMI")
      .accounts({
        poll: testPoll1Pda,
        profile: testUser1ProfilePda,
        customProgram: customProgramPda,
        authority: testUser1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testUser1])
      .rpc();
    console.log("TxHash ::", tx);

    // Fetch data after tx confirms & update global state
    const currentTestPoll1 = await program.account.poll.fetch(testPoll1Pda);
    testPoll1 = currentTestPoll1;
    const currentProfile = await program.account.profile.fetch(
      testUser1ProfilePda
    );
    testUser1Profile = currentProfile;
    const currentCustomProgram = await program.account.customProgram.fetch(
      customProgramPda
    );
    customProgram = currentCustomProgram;

    // Verify the vote account has set up correctly
    expect(currentTestPoll1.pollNumber.toNumber()).to.equal(
      parseInt(pollCount)
    );
    expect(currentTestPoll1.isActive).to.equal(true);
    expect(currentTestPoll1.optionADisplayLabel.toString()).to.equal("GMI");
    expect(currentTestPoll1.optionBDisplayLabel.toString()).to.equal("NGMI");
    expect(currentTestPoll1.optionACount.toNumber()).to.equal(0);
    expect(currentTestPoll1.optionBCount.toNumber()).to.equal(0);
    expect(currentTestPoll1.voteCount.toNumber()).to.equal(0);
    expect(currentTestPoll1.authority.toString()).to.equal(
      currentProfile.authority.toString()
    );

    expect(currentProfile.pollCount.toNumber()).to.equal(1);

    expect(customProgram.totalPollCount.toNumber()).to.equal(
      parseInt(pollCount)
    );
  });

  it("Create new testPoll2 with testUser1", async () => {
    // Need to access current customProgram.totalPollCount
    const pollCount: string = (
      customProgram.totalPollCount.toNumber() + 1
    ).toString();
    console.log("pollCount: ", pollCount);

    // NOTE From Anchor PDA example: https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor
    // NOTE They find the PDA address INSIDE the it() test!
    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(POLL_SEED_PREFIX),
        // Q: Need wallet publicKey? Won't this restrict to only that user
        // being able to write to PDA?
        // A: YES! The original crunchy-vs-smooth didn't use wallet pubkeys,
        // since that would create a unique PDA for the user (not users!).
        anchor.utils.bytes.utf8.encode(pollCount),
      ],
      program.programId
    );
    // Update global state
    testPoll2Pda = pda;

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      testPoll2Pda.toBase58()
    );

    // Following this example to call the methods:
    // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
    const tx = await program.methods
      .createPoll("Chocolate", "Vanilla")
      .accounts({
        poll: testPoll2Pda,
        profile: testUser1ProfilePda,
        customProgram: customProgramPda,
        authority: testUser1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testUser1])
      .rpc();
    console.log("TxHash ::", tx);

    // Fetch data after tx confirms & update global state
    const currentTestPoll2 = await program.account.poll.fetch(testPoll2Pda);
    testPoll2 = currentTestPoll2;
    const currentProfile = await program.account.profile.fetch(
      testUser1ProfilePda
    );
    testUser1Profile = currentProfile;
    const currentCustomProgram = await program.account.customProgram.fetch(
      customProgramPda
    );
    customProgram = currentCustomProgram;

    // Verify the vote account has set up correctly
    expect(currentTestPoll2.pollNumber.toNumber()).to.equal(
      parseInt(pollCount)
    );
    expect(currentTestPoll2.isActive).to.equal(true);
    expect(currentTestPoll2.optionADisplayLabel.toString()).to.equal(
      "Chocolate"
    );
    expect(currentTestPoll2.optionBDisplayLabel.toString()).to.equal("Vanilla");
    expect(currentTestPoll2.optionACount.toNumber()).to.equal(0);
    expect(currentTestPoll2.optionBCount.toNumber()).to.equal(0);
    expect(currentTestPoll2.voteCount.toNumber()).to.equal(0);
    expect(currentTestPoll2.authority.toString()).to.equal(
      currentProfile.authority.toString()
    );

    expect(currentProfile.pollCount.toNumber()).to.equal(2);

    expect(customProgram.totalPollCount.toNumber()).to.equal(
      parseInt(pollCount)
    );
  });

  it("Create new vote:optionA for testPoll1 with testUser1", async () => {
    // Need to access current poll.voteCount
    // Q: Need profile and/or customProgram? Or, just pass as accounts?
    // A: Eventually will need to increment/update values, but not yet!
    let currentTestPoll1 = await program.account.poll.fetch(testPoll1Pda);
    const voteCount: string = (
      currentTestPoll1.voteCount.toNumber() + 1
    ).toString();
    console.log("voteCount: ", voteCount);

    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(VOTE_SEED_PREFIX),
        testPoll1Pda.toBuffer(),
        testUser1.publicKey.toBuffer(),
      ],
      program.programId
    );
    // Update global state for vote?

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      pda.toBase58()
    );

    // Following this example to call the methods:
    // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
    const tx = await program.methods
      .createVote({ a: {} })
      .accounts({
        vote: pda,
        poll: testPoll1Pda,
        profile: testUser1ProfilePda,
        customProgram: customProgramPda,
        authority: testUser1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testUser1])
      .rpc();
    console.log("TxHash ::", tx);

    // Fetch data after tx confirms & update global state
    const currentVote: anchor.IdlTypes<anchor.Idl>["Vote"] =
      await program.account.vote.fetch(pda);
    currentTestPoll1 = await program.account.poll.fetch(testPoll1Pda);
    testPoll1 = currentTestPoll1;
    const currentProfile = await program.account.profile.fetch(
      testUser1ProfilePda
    );
    testUser1Profile = currentProfile;
    const currentCustomProgram = await program.account.customProgram.fetch(
      customProgramPda
    );
    customProgram = currentCustomProgram;

    // Verify the vote account has set up correctly
    expect(currentVote.voteNumber.toNumber()).to.equal(parseInt(voteCount));
    expect(currentVote.profilePubkey.toString()).to.equal(
      testUser1ProfilePda.toString()
    );
    expect(currentVote.pollPubkey.toString()).to.equal(testPoll1Pda.toString());
    // Q: How do you check Enum structure?
    // ERROR: AssertionError: expected { a: {} } to equal { a: {} }
    // expect(currentVote.voteOption).to.equal({ a: {} });

    expect(currentTestPoll1.voteCount.toNumber()).to.equal(parseInt(voteCount));
    expect(currentTestPoll1.optionACount.toNumber()).to.equal(1);
    expect(currentProfile.voteCount.toNumber()).to.equal(1);
    expect(currentVote.authority.toString()).to.equal(
      currentProfile.authority.toString()
    );

    expect(customProgram.totalVoteCount.toNumber()).to.equal(1);
  });

  it("Try to vote again on testPoll1 with testUser1", async () => {
    try {
      // Need to access current poll.voteCount
      let currentTestPoll1 = await program.account.poll.fetch(testPoll1Pda);
      const voteCount: string = (
        currentTestPoll1.voteCount.toNumber() + 1
      ).toString();
      console.log("voteCount: ", voteCount);

      const [pda, bump] = await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode(VOTE_SEED_PREFIX),
          testPoll1Pda.toBuffer(),
          testUser1.publicKey.toBuffer(),
        ],
        program.programId
      );
      // Update global state for vote?

      console.log(
        "PDA for program",
        program.programId.toBase58(),
        "is generated :",
        pda.toBase58()
      );

      // NOTE This should ERROR
      const tx = await program.methods
        .createVote({ a: {} })
        .accounts({
          vote: pda,
          poll: testPoll1Pda,
          profile: testUser1ProfilePda,
          customProgram: customProgramPda,
          authority: testUser1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([testUser1])
        .rpc();
      console.log("TxHash ::", tx);

      // Fetch data after tx confirms & update global state
      const currentVote: anchor.IdlTypes<anchor.Idl>["Vote"] =
        await program.account.vote.fetch(pda);

      currentTestPoll1 = await program.account.poll.fetch(testPoll1Pda);
      testPoll1 = currentTestPoll1;
      const currentProfile = await program.account.profile.fetch(
        testUser1ProfilePda
      );
      testUser1Profile = currentProfile;
      const currentCustomProgram = await program.account.customProgram.fetch(
        customProgramPda
      );
      customProgram = currentCustomProgram;

      // Q: How to write tests that should fail?
      expect(currentTestPoll1.voteCount.toNumber()).to.equal(
        parseInt(voteCount) - 1
      );
      expect(currentTestPoll1.optionACount.toNumber()).to.equal(1);
      expect(currentProfile.voteCount.toNumber()).to.equal(1);
    } catch (error) {
      console.log("Vote failed. User has already voted on this poll!");
      console.warn(error);
    }
  });

  it("Create user 2 profile", async () => {
    const profileCount = (
      customProgram.totalProfileCount.toNumber() + 1
    ).toString();
    console.log("profileCount: ", profileCount);

    // NOTE Error processing Instruction 0: Cross-program invocation
    // with unauthorized signer or writable account
    // REF: https://stackoverflow.com/questions/72849618/transaction-simulation-failed-error-processing-instruction-0-cross-program-inv
    // U: Check the seeds!
    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(PROFILE_SEED_PREFIX),
        testUser2.publicKey.toBuffer(),
        anchor.utils.bytes.utf8.encode(profileCount),
      ],
      program.programId
    );
    // Update global state
    testUser2ProfilePda = pda;

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      testUser2ProfilePda.toBase58()
    );

    const tx = await program.methods
      .createProfile(testUser2Handle, testUser2DisplayName)
      .accounts({
        profile: testUser2ProfilePda,
        customProgram: customProgramPda,
        authority: testUser2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testUser2])
      .rpc();
    console.log("TxHash ::", tx);

    // Fetch data after tx confirms & update global state
    const currentProfile = await program.account.profile.fetch(
      testUser2ProfilePda
    );
    testUser2Profile = currentProfile;
    const currentCustomProgram = await program.account.customProgram.fetch(
      customProgramPda
    );
    customProgram = currentCustomProgram;

    // Verify the account has set up correctly
    expect(currentProfile.handle).to.equal(testUser2Handle);
    expect(currentProfile.displayName).to.equal(testUser2DisplayName);
    expect(currentProfile.authority.toString()).to.equal(
      testUser2.publicKey.toString()
    );
    expect(currentProfile.pollCount.toNumber()).to.equal(0);
    expect(currentProfile.voteCount.toNumber()).to.equal(0);
    expect(customProgram.totalProfileCount.toNumber()).to.equal(2); // 2 users now
  });

  it("Create new vote:optionA for testPoll1 with testUser2", async () => {
    // Need to access current poll.voteCount
    // Q: Need profile and/or customProgram? Or, just pass as accounts?
    // A: Eventually will need to increment/update values, but not yet!
    let currentTestPoll1 = await program.account.poll.fetch(testPoll1Pda);
    const voteCount: string = (
      currentTestPoll1.voteCount.toNumber() + 1
    ).toString();
    console.log("voteCount: ", voteCount);

    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(VOTE_SEED_PREFIX),
        testPoll1Pda.toBuffer(),
        testUser2.publicKey.toBuffer(),
      ],
      program.programId
    );
    // Update global state for vote?

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      pda.toBase58()
    );

    // Following this example to call the methods:
    // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
    const tx = await program.methods
      .createVote({ a: {} })
      .accounts({
        vote: pda,
        poll: testPoll1Pda,
        profile: testUser2ProfilePda,
        customProgram: customProgramPda,
        authority: testUser2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testUser2])
      .rpc();
    console.log("TxHash ::", tx);

    // Fetch data after tx confirms & update global state
    const currentVote: anchor.IdlTypes<anchor.Idl>["Vote"] =
      await program.account.vote.fetch(pda);
    currentTestPoll1 = await program.account.poll.fetch(testPoll1Pda);
    testPoll1 = currentTestPoll1;
    const currentProfile = await program.account.profile.fetch(
      testUser2ProfilePda
    );
    testUser2Profile = currentProfile;
    const currentCustomProgram = await program.account.customProgram.fetch(
      customProgramPda
    );
    customProgram = currentCustomProgram;

    // Verify the vote account has set up correctly
    expect(currentVote.voteNumber.toNumber()).to.equal(parseInt(voteCount));
    expect(currentVote.profilePubkey.toString()).to.equal(
      testUser2ProfilePda.toString()
    );
    expect(currentVote.pollPubkey.toString()).to.equal(testPoll1Pda.toString());
    // Q: How do you check Enum structure?
    // ERROR: AssertionError: expected { a: {} } to equal { a: {} }
    // expect(currentVote.voteOption).to.equal({ a: {} });

    expect(currentTestPoll1.voteCount.toNumber()).to.equal(parseInt(voteCount));
    expect(currentTestPoll1.optionACount.toNumber()).to.equal(2);
    expect(currentProfile.voteCount.toNumber()).to.equal(1);
    expect(currentVote.authority.toString()).to.equal(
      currentProfile.authority.toString()
    );

    // Check that customProgram.totalVoteCount incremented
    expect(customProgram.totalVoteCount.toNumber()).to.equal(2); // 2 votes, 1 failed
  });

  it("Create new vote:optionB for testPoll2 with testUser2", async () => {
    // Need to access current poll.voteCount
    // Q: Need profile and/or customProgram? Or, just pass as accounts?
    // A: Eventually will need to increment/update values, but not yet!
    let currentTestPoll2 = await program.account.poll.fetch(testPoll2Pda);
    const voteCount: string = (
      currentTestPoll2.voteCount.toNumber() + 1
    ).toString();
    console.log("voteCount: ", voteCount);

    const [pda, bump] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode(VOTE_SEED_PREFIX),
        testPoll2Pda.toBuffer(),
        testUser2.publicKey.toBuffer(),
      ],
      program.programId
    );
    // Update global state for vote?

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      pda.toBase58()
    );

    // Following this example to call the methods:
    // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
    const tx = await program.methods
      .createVote({ b: {} })
      .accounts({
        vote: pda,
        poll: testPoll2Pda,
        profile: testUser2ProfilePda,
        customProgram: customProgramPda,
        authority: testUser2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testUser2])
      .rpc();
    console.log("TxHash ::", tx);

    // Fetch data after tx confirms & update global state
    const currentVote: anchor.IdlTypes<anchor.Idl>["Vote"] =
      await program.account.vote.fetch(pda);
    currentTestPoll2 = await program.account.poll.fetch(testPoll2Pda);
    testPoll2 = currentTestPoll2;
    const currentProfile = await program.account.profile.fetch(
      testUser2ProfilePda
    );
    testUser2Profile = currentProfile;
    const currentCustomProgram = await program.account.customProgram.fetch(
      customProgramPda
    );
    customProgram = currentCustomProgram;

    // Verify the vote account has set up correctly
    expect(currentVote.voteNumber.toNumber()).to.equal(parseInt(voteCount));
    expect(currentVote.profilePubkey.toString()).to.equal(
      testUser2ProfilePda.toString()
    );
    expect(currentVote.pollPubkey.toString()).to.equal(testPoll2Pda.toString());
    // Q: How do you check Enum structure?
    // ERROR: AssertionError: expected { a: {} } to equal { a: {} }
    // expect(currentVote.voteOption).to.equal({ a: {} });

    expect(currentTestPoll2.voteCount.toNumber()).to.equal(parseInt(voteCount));
    expect(currentTestPoll2.optionACount.toNumber()).to.equal(0);
    expect(currentTestPoll2.optionBCount.toNumber()).to.equal(1);
    expect(currentProfile.voteCount.toNumber()).to.equal(2);
    expect(currentVote.authority.toString()).to.equal(
      currentProfile.authority.toString()
    );

    expect(customProgram.totalVoteCount.toNumber()).to.equal(3);
  });

  // TODO Try to vote with a User who doesn't have a Profile
  it("Try to create new vote:optionB for testPoll2 with INVALID testUser3", async () => {
    try {
      // Need to access current poll.voteCount
      let currentTestPoll2 = await program.account.poll.fetch(testPoll2Pda);
      let currentOptionBVoteCount = currentTestPoll2.optionBCount.toNumber();
      const voteCount: string = (
        currentTestPoll2.voteCount.toNumber() + 1
      ).toString();

      const [pda, bump] = await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode(VOTE_SEED_PREFIX),
          testPoll2Pda.toBuffer(),
          testUser3.publicKey.toBuffer(),
        ],
        program.programId
      );
      // Update global state for vote?

      console.log(
        "PDA for program",
        program.programId.toBase58(),
        "is generated :",
        pda.toBase58()
      );

      // NOTE This should ERROR
      const tx = await program.methods
        .createVote({ b: {} })
        .accounts({
          vote: pda,
          poll: testPoll2Pda,
          profile: testUser3.publicKey, // Should error since no profile!
          customProgram: customProgramPda,
          authority: testUser3.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([testUser3])
        .rpc();
      console.log("TxHash ::", tx);

      // Fetch data after tx confirms & update global state
      const currentVote: anchor.IdlTypes<anchor.Idl>["Vote"] =
        await program.account.vote.fetch(pda);

      currentTestPoll2 = await program.account.poll.fetch(testPoll2Pda);
      testPoll1 = currentTestPoll2;
      const currentProfile = await program.account.profile.fetch(
        testUser3.publicKey
      );
      // testUser1Profile = currentProfile;
      const currentCustomProgram = await program.account.customProgram.fetch(
        customProgramPda
      );
      customProgram = currentCustomProgram;

      // Q: How to write tests that should fail?
      expect(currentTestPoll2.voteCount.toNumber()).to.equal(
        parseInt(voteCount) - 1
      );
      expect(currentTestPoll2.optionBCount.toNumber()).to.equal(
        currentOptionBVoteCount
      );
    } catch (error) {
      console.log("Vote failed. User does not have a profile!");
      console.warn(error);
    }
  });

  // TODO Have testUser1 create testPoll2 and then vote
});
