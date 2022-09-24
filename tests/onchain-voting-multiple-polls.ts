import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { OnchainVotingMultiplePolls } from "../target/types/onchain_voting_multiple_polls";
import { expect } from "chai";
import { BN } from "bn.js";

describe("onchain-voting", () => {
  const CUSTOM_PROGRAM_SEED_PREFIX = "custom-program";
  const PROFILE_SEED_PREFIX = "profile";
  const POLL_SEED_PREFIX = "poll";
  const VOTE_SEED_PREFIX = "vote";

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace
    .OnchainVotingMultiplePolls as Program<OnchainVotingMultiplePolls>;

  // Build some test users
  const testUser1 = anchor.web3.Keypair.generate();
  let testUser1ProfilePda: anchor.web3.PublicKey;
  const testUser1Handle = "testUser1Handle";
  const testUser1DisplayName = "User 1 DN";

  const testUser2 = anchor.web3.Keypair.generate();
  let testUser2ProfilePda: anchor.web3.PublicKey;
  const testUser2Handle = "testUser2Handle";
  const testUser2DisplayName = "User 2 DN";

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
    const [customProgramPda, customProgramBump] =
      await PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode(CUSTOM_PROGRAM_SEED_PREFIX)],
        program.programId
      );

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

    // Fetch data after tx confirms
    const customProgramDataAccount = await program.account.customProgram.fetch(
      customProgramPda
    );

    // Verify the account has set up correctly
    expect(customProgramDataAccount.totalProfileCount.toNumber()).to.equal(0);
    expect(customProgramDataAccount.totalPollCount.toNumber()).to.equal(0);
    expect(customProgramDataAccount.totalVoteCount.toNumber()).to.equal(0);
    expect(customProgramDataAccount.authority.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
  });

  // it("Initializes with 0 votes for GMI and NGMI and is active", async () => {
  //   // NOTE From Anchor PDA example: https://book.anchor-lang.com/anchor_in_depth/PDAs.html#how-to-build-pda-hashmaps-in-anchor
  //   // NOTE They find the PDA address INSIDE the it() test!
  //   const [voteAccountPDA, voteAccountBump] =
  //     await PublicKey.findProgramAddress(
  //       // Q: Would toBuffer() be better than encode()?
  //       // NOTE See solana-pdas example
  //       [
  //         anchor.utils.bytes.utf8.encode("vote-account"),
  //         // Q: Need wallet publicKey? Won't this restrict to only that user
  //         // being able to write to PDA?
  //         // A: YES! The original crunchy-vs-smooth didn't use wallet pubkeys,
  //         // since that would create a unique PDA for the user (not users!).
  //         // provider.wallet.publicKey.toBuffer(),
  //       ],
  //       program.programId
  //     );

  //   console.log(
  //     "PDA for program",
  //     program.programId.toBase58(),
  //     "is generated :",
  //     voteAccountPDA.toBase58()
  //   );

  //   // Following this example to call the methods:
  //   // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
  //   const tx = await program.methods
  //     .initialize()
  //     .accounts({
  //       // Q: I believe the order of accounts need to be consistent
  //       // Doesn't seem to make any difference so far...
  //       // A: In lib.rs > Initialize struct, if I put user before vote_account
  //       // it seems to work, even if order isn't consistent here in test.
  //       // NOTE It may not be the order, but something up with resetting
  //       // the test-validator before running the tests...
  //       voteAccount: voteAccountPDA,
  //       user: provider.wallet.publicKey,
  //       // Q: Which programId to pass? Is it my program's or the systemProgram's?
  //       // NOTE I BELIEVE it should be the SystemProgram's based on this SO thread AND
  //       // the fact that when I use my program's ID, the error shows it should be 111111...
  //       // A: I don't think I need to provide the SystemProgramID,
  //       // since it's a PDA, AND since it doesn't seem needed at all (see below)
  //       // NOTE https://stackoverflow.com/questions/70675404/cross-program-invocation-with-unauthorized-signer-or-writable-account
  //       // Q: Do I even need to pass systemProgram? The Anchor PDA tutorial doesn't...
  //       // A: I didn't need it when just running 'anchor test' (w/o test-validator)
  //       // systemProgram: program.programId, // ERROR CPI
  //       systemProgram: anchor.web3.SystemProgram.programId, // ERROR CPI
  //     })
  //     .rpc();
  //   console.log("TxHash ::", tx);

  //   // 3. After the transaction returns, we can fetch the state of the vote account
  //   let currentVoteAccountState = await program.account.voteState.fetch(
  //     voteAccountPDA
  //   );
  //   // console.log("currentVoteAccountState: ", currentVoteAccountState);

  //   // 4. Verify the vote account has set up correctly
  //   expect(currentVoteAccountState.gmi.toNumber()).to.equal(0);
  //   expect(currentVoteAccountState.ngmi.toNumber()).to.equal(0);
  //   expect(currentVoteAccountState.isActive).to.equal(true);
  // });

  // it("INIT USER Votes correctly for GMI", async () => {
  //   const [voteAccountPDA, voteAccountBump] =
  //     await PublicKey.findProgramAddress(
  //       [
  //         anchor.utils.bytes.utf8.encode("vote-account"),
  //         // provider.wallet.publicKey.toBuffer(),
  //       ],
  //       program.programId
  //     );

  //   console.log(
  //     "PDA for program",
  //     program.programId.toBase58(),
  //     "is generated :",
  //     voteAccountPDA.toBase58()
  //   );

  //   // const initializeTx = await program.methods
  //   //   .initialize()
  //   //   .accounts({
  //   //     // Q: I believe the order of accounts need to be consistent
  //   //     // Doesn't seem to make any difference so far...
  //   //     // A: In lib.rs > Initialize struct, if I put user before vote_account
  //   //     // it seems to work, even if order isn't consistent here in test.
  //   //     // NOTE It may not be the order, but something up with resetting
  //   //     // the test-validator before running the tests...
  //   //     voteAccount: voteAccountPDA,
  //   //     user: provider.wallet.publicKey,
  //   //     // Q: Which programId to pass? Is it my program's or the systemProgram's?
  //   //     // NOTE I BELIEVE it should be the SystemProgram's based on this SO thread AND
  //   //     // the fact that when I use my program's ID, the error shows it should be 111111...
  //   //     // A: I don't think I need to provide the SystemProgramID,
  //   //     // since it's a PDA, AND since it doesn't seem needed at all (see below)
  //   //     // NOTE https://stackoverflow.com/questions/70675404/cross-program-invocation-with-unauthorized-signer-or-writable-account
  //   //     // Q: Do I even need to pass systemProgram? The Anchor PDA tutorial doesn't...
  //   //     // NOTE I didn't need it when just running 'anchor test' (w/o test-validator)
  //   //     // systemProgram: program.programId, // ERROR CPI
  //   //     systemProgram: anchor.web3.SystemProgram.programId, // ERROR CPI
  //   //   })
  //   //   .rpc();
  //   // console.log("initializeTx signature: ", initializeTx);

  //   // Following this example to call the methods:
  //   // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
  //   const tx = await program.methods
  //     .vote({ gmi: {} })
  //     .accounts({
  //       voteAccount: voteAccountPDA,
  //       user: provider.wallet.publicKey,
  //     })
  //     .rpc();
  //   console.log("TxHash ::", tx);
  //   console.log("Provider Wallet:", provider.wallet.publicKey.toBase58());

  //   // 3. After the transaction returns, we can fetch the state of the vote account
  //   let currentVoteAccountState = await program.account.voteState.fetch(
  //     voteAccountPDA
  //   );
  //   console.log("currentVoteAccountState: ", currentVoteAccountState);

  //   // 4. Verify the crunchy vote incremented
  //   expect(currentVoteAccountState.gmi.toNumber()).to.equal(1);
  // });

  // it("INIT USER Votes correctly for NGMI", async () => {
  //   const [voteAccountPDA, _] = await PublicKey.findProgramAddress(
  //     [
  //       anchor.utils.bytes.utf8.encode("vote-account"),
  //       // provider.wallet.publicKey.toBuffer(),
  //     ],
  //     program.programId
  //   );
  //   console.log(voteAccountPDA.toBase58());

  //   console.log(
  //     "PDA for program",
  //     program.programId.toBase58(),
  //     "is generated :",
  //     voteAccountPDA.toBase58()
  //   );

  //   // Following this example to call the methods:
  //   // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
  //   const tx = await program.methods
  //     .vote({ ngmi: {} }) // Custom Instruction Data struct passed like this
  //     .accounts({
  //       voteAccount: voteAccountPDA,
  //     })
  //     .rpc();
  //   console.log("TxHash ::", tx);
  //   console.log("Provider Wallet:", provider.wallet.publicKey.toBase58());

  //   // 3. After the transaction returns, we can fetch the state of the vote account
  //   let currentVoteAccountState = await program.account.voteState.fetch(
  //     voteAccountPDA
  //   );
  //   console.log("currentVoteAccountState: ", currentVoteAccountState);

  //   // 4. Verify the NGMI vote incremented
  //   expect(currentVoteAccountState.ngmi.toNumber()).to.equal(1);
  //   // NOTE Because we're using the same PDA to track the votes over time
  //   // then the previous voteCrunchy() test vote will increment/persist!
  //   expect(currentVoteAccountState.gmi.toNumber()).to.equal(1);
  // });

  // it("TESTUSER 1 votes correctly for NGMI", async () => {
  //   // Q: Need to reset the Provider with a different wallet? Think so...
  //   // The reason is that you only need the user/wallet to SIGN to vote...
  //   // A: YES! Otherwise, Provider Wallet remains the same Signer!
  //   const newConnection = new anchor.web3.Connection("http://localhost:8899");
  //   const newWallet = new anchor.Wallet(testUser1);
  //   const newProvider = new anchor.AnchorProvider(newConnection, newWallet, {
  //     commitment: "confirmed",
  //   });
  //   anchor.setProvider(newProvider);

  //   const [voteAccountPDA, _] = await PublicKey.findProgramAddress(
  //     [
  //       anchor.utils.bytes.utf8.encode("vote-account"),
  //       // provider.wallet.publicKey.toBuffer(),
  //     ],
  //     program.programId
  //   );
  //   console.log(voteAccountPDA.toBase58());

  //   console.log(
  //     "PDA for program",
  //     program.programId.toBase58(),
  //     "is generated :",
  //     voteAccountPDA.toBase58()
  //   );

  //   // Following this example to call the methods:
  //   // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
  //   const tx = await program.methods
  //     .vote({ ngmi: {} })
  //     .accounts({
  //       voteAccount: voteAccountPDA,
  //     })
  //     .rpc();
  //   console.log("TxHash ::", tx);
  //   console.log("Provider Wallet:", newProvider.wallet.publicKey.toBase58());

  //   // 3. After the transaction returns, we can fetch the state of the vote account
  //   let currentVoteAccountState = await program.account.voteState.fetch(
  //     voteAccountPDA
  //   );
  //   console.log("currentVoteAccountState: ", currentVoteAccountState);

  //   // 4. Verify the NGMI vote incremented
  //   expect(currentVoteAccountState.ngmi.toNumber()).to.equal(2);
  //   // NOTE Because we're using the same PDA to track the votes over time
  //   // then the previous vote() test vote will increment/persist!
  //   expect(currentVoteAccountState.gmi.toNumber()).to.equal(1);
  // });

  // it("TESTUSER 2 votes correctly for GMI", async () => {
  //   // Q: Need to reset the Provider with a different wallet? Think so...
  //   // The reason is that you only need the user/wallet to SIGN to vote...
  //   // A: YES! Otherwise, Provider Wallet remains the same Signer!
  //   const newConnection = new anchor.web3.Connection("http://localhost:8899");
  //   const newWallet = new anchor.Wallet(testUser2);
  //   const newProvider = new anchor.AnchorProvider(newConnection, newWallet, {
  //     commitment: "confirmed",
  //   });
  //   anchor.setProvider(newProvider);

  //   const [voteAccountPDA, _] = await PublicKey.findProgramAddress(
  //     [
  //       anchor.utils.bytes.utf8.encode("vote-account"),
  //       // provider.wallet.publicKey.toBuffer(),
  //     ],
  //     program.programId
  //   );
  //   console.log(voteAccountPDA.toBase58());

  //   console.log(
  //     "PDA for program",
  //     program.programId.toBase58(),
  //     "is generated :",
  //     voteAccountPDA.toBase58()
  //   );

  //   // Following this example to call the methods:
  //   // https://book.anchor-lang.com/anchor_in_depth/milestone_project_tic-tac-toe.html?highlight=test#testing-the-setup-instruction
  //   const tx = await program.methods
  //     .vote({ gmi: {} })
  //     .accounts({
  //       voteAccount: voteAccountPDA,
  //     })
  //     .rpc();
  //   console.log("TxHash ::", tx);
  //   console.log("Provider Wallet:", newProvider.wallet.publicKey.toBase58());

  //   // 3. After the transaction returns, we can fetch the state of the vote account
  //   let currentVoteAccountState = await program.account.voteState.fetch(
  //     voteAccountPDA
  //   );
  //   console.log("currentVoteAccountState: ", currentVoteAccountState);

  //   // 4. Verify the smooth vote incremented
  //   expect(currentVoteAccountState.ngmi.toNumber()).to.equal(2);
  //   // NOTE Because we're using the same PDA to track the votes over time
  //   // then the previous voteCrunchy() test vote will increment/persist!
  //   expect(currentVoteAccountState.gmi.toNumber()).to.equal(2);
  // });
});
