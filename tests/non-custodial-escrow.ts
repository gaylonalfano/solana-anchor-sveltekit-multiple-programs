import * as anchor from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  getOrCreateAssociatedTokenAccount,
  mintToChecked,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { Program } from "@project-serum/anchor";
import { PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { NonCustodialEscrow } from "../target/types/non_custodial_escrow";
import { expect } from "chai";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

// IMPORTANT: Connection errors due to Node 18! Gotta switch to 16
// in order to: anchor run test-escrow command! nvm use 16..
// REF: https://github.com/solana-labs/example-helloworld/issues/392

// TODOS
//    - DONE Add test for SOL -> SPL token transfers
//      - DONE Add third mint (z) and test whether buyer without inTokenATA can accept
//      - DONE Add a fourth mint (w) and test whether seller without inToken ATA can accept
//    - Rename the out/in token accounts to w,x,y,z accounts


// U: 11/22 - Added a new CustomProgram account to track total_escrow_count,
// in order to allow wallets to create multiple escrow PDAs.
// U: 11/5 - Added a few more fields to Escrow account struct to better track more
// details about the exchange. Trying to allow creating multiple escrows and later
// querying details about buyer, seller, x, y, amounts, etc.
describe("non-custodial-escrow", () => {
  const CUSTOM_PROGRAM_PREFIX = "custom-program";
  const ESCROW_SEED_PREFIX = "escrow";

  // NOTE Anchor tests use provider.wallet as the payer, and thus automatically
  // use the provider.wallet as the signer.
  // Configure the client to use the devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  // console.log(`provider.wallet: ${provider.wallet}`);
  console.log(
    `provider.connection.rpcEndpoint: ${provider.connection.rpcEndpoint}`
  );

  // Q: Which Token Program ID should I use?
  // Can't get initialize() to pass and create the Escrow account
  // REF: https://github.com/solana-labs/solana-program-library/tree/master/token
  // NOTE 2022 ID: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
  // A: TOKEN_PROGRAM_ID! Interesting. I'm using spl-token 0.3.4, so I thought to use
  // the latest 2022 ID, but when I printed the ix (ie w/o rpc() call), the errors
  // became easier to follow. TL;DR Use TOKEN_PROGRAM_ID!
  // console.log("TOKEN_PROGRAM_ID: ", TOKEN_PROGRAM_ID.toBase58()); // TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
  // console.log("TOKEN_2022_PROGRAM_ID: ", TOKEN_2022_PROGRAM_ID.toBase58()); // TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

  const program = anchor.workspace
    .NonCustodialEscrow as Program<NonCustodialEscrow>;

  // Need a couple wallets for buyer and seller
  // NOTE We'll use my local keypair as the seller's wallet
  // NOTE Need an anchor.web3.Signer for payer (e.g. anchor.Wallet.payer)
  // Q: How to create type anchor.web3.Signer?
  // A: Not sure if I can from tests, but Keypair (provider.wallet.payer) seems to work
  const seller = provider.wallet as anchor.Wallet; // anchor.web3.Keypair.generate();
  // const payer = (provider.wallet as anchor.Wallet).payer;
  const buyer = anchor.web3.Keypair.generate();
  console.log(`seller: ${seller.publicKey}`);
  console.log(`buyer: ${buyer.publicKey}`);

  // Global customProgram
  let customProgram: anchor.IdlTypes<anchor.Idl>["CustomProgram"];
  let customProgramPda: anchor.web3.PublicKey;


  let w_mint;
  let x_mint;
  let y_mint;
  let z_mint;
  let seller_w_token_account;
  let seller_x_token_account;
  let seller_y_token_account;
  let seller_z_token_account;
  let seller_out_token_account; // Associated Token Accounts
  let seller_in_token_account;
  let buyer_in_token_account;
  let buyer_out_token_account;
  let buyer_w_token_account;
  let buyer_x_token_account;
  let buyer_y_token_account;
  let buyer_z_token_account;
  // console.log(buyer_z_token_account); // undefined
  // U: Adding multiple tokenAccounts and escrows after implementing customProgram
  // NOTE This is just saving the Pubkey, since program creates actual account
  let escrowedOutTokenAccount1 = anchor.web3.Keypair.generate();
  let escrowedOutTokenAccount2 = anchor.web3.Keypair.generate();
  let escrowedOutTokenAccount3 = anchor.web3.Keypair.generate();
  let escrowedOutTokenAccount4 = anchor.web3.Keypair.generate();
  console.log(`escrowedOutTokenAccount1: ${escrowedOutTokenAccount1.publicKey}`);
  // NOTE This is a PDA that we'll get below
  let escrow1: anchor.IdlTypes<anchor.Idl>["Escrow"];
  let escrow1Pda: anchor.web3.PublicKey;
  let escrow2: anchor.IdlTypes<anchor.Idl>["Escrow"];
  let escrow2Pda: anchor.web3.PublicKey;
  let escrow3: anchor.IdlTypes<anchor.Idl>["Escrow"];
  let escrow3Pda: anchor.web3.PublicKey;
  let escrow4: anchor.IdlTypes<anchor.Idl>["Escrow"];
  let escrow4Pda: anchor.web3.PublicKey;

  // Use the before() hook to create our mints, find our escrow PDA, etc.
  before(async () => {
    // 1. Ensure our wallets have SOL
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        buyer.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      )
    );
    // console.log(
    //   `buyer balance: ${await provider.connection.getBalance(buyer.publicKey)}`
    // );

    // await new Promise((resolve) => setTimeout(resolve, 500));

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        seller.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      )
    );
    // console.log(
    //   `seller balance: ${await provider.connection.getBalance(
    //     seller.publicKey
    //   )}`
    // );


    // Create our x and y token Mints using @solana/spl-token methods
    // NOTE SPL Token program has changed. Trying to use latest v0.3.4
    // REF Cookbook: https://solanacookbook.com/references/token.html#how-to-create-a-new-token
    w_mint = await createMint(
      provider.connection, // connection
      seller.payer, // payer
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      8 // decimals location of the decimal place
    );
    console.log(`w_mint: ${w_mint.toBase58()}`);

    x_mint = await createMint(
      provider.connection, // connection
      seller.payer, // payer
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      8 // decimals location of the decimal place
    );
    console.log(`x_mint: ${x_mint.toBase58()}`);

    y_mint = await createMint(
      provider.connection, // connection
      seller.payer, // payer of tx and init fees
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      8 // decimals location of the decimal place
    );
    console.log(`y_mint: ${y_mint.toBase58()}`);
    // await new Promise((resolve) => setTimeout(resolve, 500));

    z_mint = await createMint(
      provider.connection, // connection
      seller.payer, // payer of tx and init fees
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      8 // decimals location of the decimal place
    );
    console.log(`z_mint: ${z_mint.toBase58()}`);

    // Create associated token accounts for seller's and buyer's x and y tokens
    // Create seller_out_token_account ATA
    seller_out_token_account = await createAssociatedTokenAccount(
      provider.connection, // connection
      seller.payer, // payer keypair,
      x_mint, // mint pubkey
      seller.publicKey // owner pubkey
    );
    console.log(`seller_out_token_account: ${seller_out_token_account}`);
    // await new Promise((resolve) => setTimeout(resolve, 500));

    // 4.2 Mint new supply and transfer to seller_out_token_account account
    await mintToChecked(
      provider.connection, //connection,
      // Q: How do I get type anchor.web3.Signer?
      // NOTE payer is Keypair, but need type Signer
      // REF https://stackoverflow.com/questions/70206015/solana-web3-js-getting-web3-signer-from-wallet
      // A: Still don't know, BUT type Keypair seems to work...
      seller.payer, // payer, // NOTE need anchor.web3.Signer
      x_mint, // mint,
      seller_out_token_account, // destination ata,
      seller.publicKey, // mint authority,
      1e8, // amount,
      8 // decimals
      // [signer1, signer2...], // only multisig account will use
    );
    console.log(
      `seller_out_token_account balance: ${await provider.connection
        .getTokenAccountBalance(seller_out_token_account)
        .then((r) => r.value.amount)}`
    );

    // 4.3 Create the seller_in_token_account ATA
    seller_in_token_account = await createAssociatedTokenAccount(
      provider.connection, // connection
      seller.payer, // payer keypair,
      y_mint, // mint pubkey
      seller.publicKey // owner pubkey
    );
    console.log(`seller_in_token_account: ${seller_in_token_account}`);

    // 4.4 Create buyer_in_token_account and buyer_out_token_account ATAs
    buyer_in_token_account = await createAssociatedTokenAccount(
      provider.connection,
      buyer, // seller.payer, // Q: Buyer or seller is the payer?
      x_mint,
      buyer.publicKey
    );
    console.log(`buyer_in_token_account: ${buyer_in_token_account}`);

    // await new Promise((resolve) => setTimeout(resolve, 500));

    buyer_out_token_account = await createAssociatedTokenAccount(
      provider.connection,
      seller.payer,
      y_mint,
      buyer.publicKey
    );
    console.log(`buyer_out_token_account: ${buyer_out_token_account}`);
    // await new Promise((resolve) => setTimeout(resolve, 500));

    // 4.5 Mint new y token supply and transfer to buyer_out_token_account account
    await mintToChecked(
      provider.connection,
      seller.payer, // payer
      y_mint, // mint
      buyer_out_token_account, // destination
      seller.publicKey, // mint authority
      1e8, // amount. NOTE If decimals is 8, you mint 10^8 for 1 token
      8 // decimals
      // [signer1, signer2...], // only multisig account will use
    );
    console.log(
      `buyer_out_token_account balance: ${await provider.connection
        .getTokenAccountBalance(buyer_out_token_account)
        .then((r) => r.value.amount)}`
    );

    // U: Adding Z mint and ONLY creating seller_z_token_account ATA
    // Not creating buyer_y_token_account to test if the exchange
    // can still happen.
    seller_z_token_account = await createAssociatedTokenAccount(
      provider.connection,
      seller.payer,
      z_mint,
      seller.publicKey
    );
    console.log(`seller_z_token_account: ${seller_z_token_account}`);

    await mintToChecked(
      provider.connection,
      seller.payer, // payer
      z_mint, // mint
      seller_z_token_account, // destination
      seller.publicKey, // mint authority
      1e8, // amount. NOTE If decimals is 8, you mint 10^8 for 1 token
      8 // decimals
      // [signer1, signer2...], // only multisig account will use
    );
    console.log(
      `seller_z_token_account balance: ${await provider.connection
        .getTokenAccountBalance(seller_z_token_account)
        .then((r) => r.value.amount)}`
    );


    // U: Adding W mint for buyer so seller can init escrow
    // and ask for inToken to be W mint, which buyer will have.
    buyer_w_token_account = await createAssociatedTokenAccount(
      provider.connection,
      seller.payer,
      w_mint,
      buyer.publicKey // owner
    );
    console.log(`buyer_w_token_account: ${buyer_w_token_account}`);

    await mintToChecked(
      provider.connection,
      seller.payer, // payer
      w_mint, // mint
      buyer_w_token_account, // destination
      seller.publicKey, // mint authority
      1e8, // amount. NOTE If decimals is 8, you mint 10^8 for 1 token
      8 // decimals
      // [signer1, signer2...], // only multisig account will use
    );
    console.log(
      `buyer_w_token_account balance: ${await provider.connection
        .getTokenAccountBalance(buyer_w_token_account)
        .then((r) => r.value.amount)}`
    );

  });


  it("Create custom program (dApp) account", async () => {
    // U: Find a PDA for the new custom program account
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from(CUSTOM_PROGRAM_PREFIX)],
      program.programId
    );

    customProgramPda = pda;
    console.log(`customProgramPda: ${customProgramPda}`);

    const tx = await program.methods.createCustomProgram()
      .accounts({
        customProgram: customProgramPda,
        authority: seller.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([]) // NOTE wallet isn't needed w/ Anchor
      .rpc();

    console.log("TxHash ::", tx);

    const data = await program.account.customProgram.fetch(customProgramPda);
    console.log("currentCustomProgram: ", data);
    // Update global
    customProgram = data;

    expect(data.authority.toBase58()).to.equal(seller.publicKey.toBase58());
    expect(data.totalEscrowCount.toNumber()).to.equal(0);
    expect(data.bump).to.equal(bump);

  });



  it("Initialize escrow", async () => {
    // Get the customProgram.totalEscrowCount to use as a seed
    // Q: How to pass a type u64 into seeds array? Uint8Array
    const escrowNumber: string = (
      customProgram.totalEscrowCount.toNumber() + 1
    ).toString();
    console.log("escrowNumber: ", escrowNumber);

    // Find a PDA for our escrow account to be located at
    // U: Added a new CustomProgram account with totalEscrowCount field as a seed
    const [pda, bump] = await PublicKey.findProgramAddress(
      // [anchor.utils.bytes.utf8.encode("escrow"), seller.publicKey.toBuffer()],
      [Buffer.from(ESCROW_SEED_PREFIX), seller.publicKey.toBuffer(), anchor.utils.bytes.utf8.encode(escrowNumber)],
      program.programId
    );

    escrow1Pda = pda;
    console.log(`escrow1Pda: ${escrow1Pda}`);

    // console.log(
    //   "PDA for program",
    //   program.programId.toBase58(),
    //   "is generated :\n    ",
    //   escrow1.toBase58()
    // );

    // Create some associated token accounts for x and y tokens for buyer and seller
    // Call our on-chain program's initialize() method and set escrow properties values
    console.log("STARTED: Initialize escrow test...");
    // NOTE Results in 0.0000004 in escrowedOutTokenAccount1 balance
    // NOTE BN doesn't accept decimals! Must be whole numbers!
    const out_amount = new anchor.BN(40);
    const in_amount = new anchor.BN(40); // number of token seller wants in exchange for out_amount

    const tx = await program.methods
      .initialize(out_amount, in_amount)
      // NOTE We only provide the PublicKeys for all the accounts.
      // We do NOT have to deal with isSigner, isWritable, etc. like in RAW
      // since we already declared that in the program Context struct.
      // This means Anchor will look for all that info in our struct on ENTRY!
      // NOTE We also don't have to pass the System Program, Token Program, and
      // Associated Token Program, since Anchor resolves these automatically.
      // NOTE Values in accounts([]) are PublicKeys!
      // U: Can I initialize with an empty escrow.buyer field? Think so...
      // A: Yes! It seems I don't have to assign an actual value to the field
      // and the placeholder is: buyer: PublicKey { _bn: <BN: 0> },
      .accounts({
        seller: seller.publicKey,
        customProgram: customProgramPda,
        outMint: x_mint,
        inMint: y_mint,
        sellerOutTokenAccount: seller_out_token_account,
        escrow: escrow1Pda, // created in program
        escrowedOutTokenAccount: escrowedOutTokenAccount1.publicKey, // created in program
        tokenProgram: TOKEN_PROGRAM_ID, // Q: Use 2022 version? A: TOKEN_PROGRAM_ID!
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      // Q: Which accounts are Signers?
      // A: Check IDL! Wallet and escrowedOutTokenAccount1!
      // Q: Why is escrowedOutTokenAccount1 a Signer? It's just a type TokenAccount...
      // I believe it's because it gets created and we set its props?
      .signers([escrowedOutTokenAccount1])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    const currentCustomProgram = await program.account.customProgram.fetch(customProgramPda);
    customProgram = currentCustomProgram;

    const currentEscrow = await program.account.escrow.fetch(escrow1Pda);
    console.log("currentEscrow: ", currentEscrow);
    // Update global state
    escrow1 = currentEscrow;


    const escrowedOutTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(
        escrowedOutTokenAccount1.publicKey
      );
    console.log(
      "INITIALIZE::escrowedOutTokenAccountBalance: ",
      escrowedOutTokenAccountBalance
    );
    // INITIALIZE::escrowedOutTokenAccountBalance:  {
    //   context: { apiVersion: '1.10.38', slot: 80 },
    //   value: {
    //     amount: '40',
    //     decimals: 8,
    //     uiAmount: 4e-7,
    //     uiAmountString: '0.0000004'
    //   }
    // }

    // const escrowedXTokenAccountData = await provider.connection.getAccountInfo(
    //   escrowedOutTokenAccount1.publicKey
    // );
    // console.log(
    //   "INITIALIZE::escrowedXTokenAccountData: ",
    //   escrowedXTokenAccountData
    // );
    // INITIALIZE::escrowedXTokenAccountData:  {
    //   data: <Buffer e2 bd 5c 49 60 9d 4b 7d 64 2e 61 e0 a0 a5 b3 44 e0 4d 24 98 5a 43 3c 10 9c cd e1 6d 69 01 a1 9e b1 f0 cc 28 e1 e2 41 58 0f 62 c
    // c 70 0f 9c cb d2 bb 7d ... 115 more bytes>,
    //   executable: false,
    //   lamports: 2039280,
    //   owner: PublicKey {
    //     _bn: <BN: 6ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9>
    //   },
    //   rentEpoch: 0
    // }

    // Q: Why is escrowedOutTokenAccount1 NOT initialized and has no 'amount'?
    // UPDATE: May be a test-validator thing... If I shutdown, I was able to
    // find the account using spl-token account-info --address <ADDRESS>:
    // Address: E66iwqshxQgtvBLGueezLZEYGTviB12ecSJPWizbeszB  (Aux*)
    // Balance: 0.0000004
    // Mint: E8iZHzr8pXpW7nwiYbbAzFoXHUEtAnRJDMFnTL1jgLjc
    // Owner: Cyc8FcKWYH7DBeGj6WKBJn8kagnCJdSwFPHsaPnLXVfS
    // State: Initialized
    // Delegation: (not set)
    // Close authority: (not set)
    // A: YEP! test-validator issue! Need to hard restart the validator
    // before running the tests.

    console.log('escrow account: ', currentEscrow);
    // NOTE spl_token::state::Account has the following struct:
    // pub struct Account {
    // /// The mint associated with this account
    // pub mint: Pubkey,
    // /// The owner of this account.
    // pub owner: Pubkey,
    // /// The amount of tokens this account holds.
    // pub amount: u64,
    // /// If `delegate` is `Some` then `delegated_amount` represents
    // /// the amount authorized by the delegate
    // pub delegate: COption<Pubkey>,
    // /// The account's state
    // pub state: AccountState, (NOTE enum Uninitialized, Initialized, Frozen)
    // /// If is_native.is_some, this is a native token, and the value logs the rent-exempt reserve. An
    // /// Account is required to be rent-exempt, so the value is used by the Processor to ensure that
    // /// wrapped SOL accounts do not drop below this threshold.
    // pub is_native: COption<u64>,
    // /// The amount delegated
    // pub delegated_amount: u64,
    // /// Optional authority to close the account.
    // pub close_authority: COption<Pubkey>,
    // }

    // {
    //     authority: HCpmSRydSxpnybDDi51hNb9hjowvAqdpwprKL2ufh5PE,
    //     escrowedOutTokenAccount: Dcp4JVmrGncru1etSih5JFdooWK3BZDP8h5QK7qTgxA7,
    //     inMint: GEkKTvAmnpkRhvftq6sbcKcDWnGXByky9Fbt1kBm99Qi,
    //     yAmount: 40,
    //   }

    expect(currentEscrow.authority.toString()).to.equal(seller.publicKey.toString());
    expect(currentEscrow.isActive).to.equal(true);
    expect(currentEscrow.hasExchanged).to.equal(false);
    // U: Confirm that out/in amounts are correct
    // NOTE out/inAmounts are BN and BN doesn't support decimals!
    // Q: How to compare BN values?
    // A: Use BN.toNumber() or .toString()!
    expect(currentEscrow.outAmount.toNumber()).to.equal(40);
    expect(currentEscrow.inAmount.toNumber()).to.equal(40);
    expect(parseInt(escrowedOutTokenAccountBalance.value.amount)).to.equal(40);
    expect(currentEscrow.bump).to.equal(bump);
    expect(customProgram.totalEscrowCount.toNumber()).to.equal(parseInt(escrowNumber)); // Error!
    // expect(customProgram.totalEscrowCount.toNumber()).to.equal(1); // 1
  });

  it("Accept the trade", async () => {
    // Q: Why isn't escrowedOutTokenAccount1 NOT initialized?
    // Program log: AnchorError caused by account: escrowedOutTokenAccount1. Error Code: AccountNotInitialized. Error Number: 3012.
    // Error Message: The program expected this account to be already initialized.
    // Shouldn't escrowedOutTokenAccount1 be a TokenAccount with an 'amount' property?
    // A: Two reasons: wrong Program ID and need to restart validator before tests

    const tx = await program.methods
      .accept()
      .accounts({
        buyer: buyer.publicKey,
        escrow: escrow1Pda,
        escrowedOutTokenAccount: escrowedOutTokenAccount1.publicKey,
        sellerInTokenAccount: seller_in_token_account,
        buyerInTokenAccount: buyer_in_token_account,
        buyerOutTokenAccount: buyer_out_token_account,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    // Get account data to verify is_active and has_exchanged values
    const data = await program.account.escrow.fetch(escrow1Pda);
    console.log('escrow account: ', data);

    const escrowedOutTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(
        escrowedOutTokenAccount1.publicKey
      );
    console.log(
      "ACCEPT::escrowedOutTokenAccountBalance: ",
      escrowedOutTokenAccountBalance
    );
    // ACCEPT::escrowedOutTokenAccountBalance:  {
    //   context: { apiVersion: '1.10.38', slot: 81 },
    //   value: { amount: '0', decimals: 8, uiAmount: 0, uiAmountString: '0' }
    // }

    // const escrowedXTokenAccountData = await provider.connection
    //   .getAccountInfo(escrowedOutTokenAccount1.publicKey)
    //   .then((res) => res.data.toJSON());
    // console.log(
    //   "ACCEPT::escrowedXTokenAccountData: ",
    //   escrowedXTokenAccountData
    // );
    // ACCEPT::escrowedXTokenAccountData:  {
    //   data: <Buffer e2 bd 5c 49 60 9d 4b 7d 64 2e 61 e0 a0 a5 b3 44 e0 4d 24 98 5a 43 3c 10 9c cd e1 6d 69 01 a1 9e b1 f0 cc 28 e1 e2 41 58 0f 62 c
    // c 70 0f 9c cb d2 bb 7d ... 115 more bytes>,
    //   executable: false,
    //   lamports: 2039280,
    //   owner: PublicKey {
    //     _bn: <BN: 6ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9>
    //   },
    //   rentEpoch: 0
    // }

    expect(data.buyer.toString()).to.equal(buyer.publicKey.toString());
    expect(data.isActive).to.equal(false);
    expect(data.hasExchanged).to.equal(true);
    expect(parseInt(escrowedOutTokenAccountBalance.value.amount)).to.equal(0);
    // TODO Check that buyer and seller ATA balances are accurately updated.
  });

  it("Cancel the trade", async () => {
    const tx = await program.methods
      .cancel()
      .accounts({
        seller: seller.publicKey,
        escrow: escrow1Pda,
        escrowedOutTokenAccount: escrowedOutTokenAccount1.publicKey,
        sellerOutTokenAccount: seller_out_token_account,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([seller.payer])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    // Get the updated account data to verify is_active and has_exchanged updated
    // Q: Is 'escrow' still available after closing 'escrowedOutTokenAccount1'?
    // A: NOPE! It's completely closed so no need to update!
    // const data = await program.account.escrow.fetch(escrow);
    // console.log("data.isActive: ", data.isActive);
    // console.log("data.hasExchanged: ", data.hasExchanged);

    // const escrowedOutTokenAccountBalance =
    //   await provider.connection.getTokenAccountBalance(
    //     escrowedOutTokenAccount1.publicKey
    //   );
    // console.log(
    //   "CANCEL::escrowedOutTokenAccountBalance: ",
    //   escrowedOutTokenAccountBalance
    // ); // Errors since the account no longer exists (closed)!
    // const escrowedXTokenAccountData = await provider.connection.getAccountInfo(
    //   escrowedOutTokenAccount1.publicKey
    // );
    // console.log(
    //   "CANCEL::escrowedXTokenAccountData: ",
    //   escrowedXTokenAccountData
    // );
    // CANCEL::escrowedXTokenAccountData:  null
  });


  it("Initialize escrow2 with same wallet", async () => {
    const escrowNumber: string = (
      customProgram.totalEscrowCount.toNumber() + 1
    ).toString();
    console.log("escrowNumber: ", escrowNumber);

    const [pda, bump] = await PublicKey.findProgramAddress(
      // [anchor.utils.bytes.utf8.encode("escrow"), seller.publicKey.toBuffer()],
      [Buffer.from(ESCROW_SEED_PREFIX), seller.publicKey.toBuffer(), anchor.utils.bytes.utf8.encode(escrowNumber)],
      program.programId
    );

    escrow2Pda = pda;
    console.log(`escrow2Pda: ${escrow2Pda}`);
    console.log("STARTED: Initialize escrow test...");

    const out_amount = new anchor.BN(20);
    const in_amount = new anchor.BN(80); // number of token seller wants in exchange for out_amount

    const tx = await program.methods
      .initialize(out_amount, in_amount)
      .accounts({
        seller: seller.publicKey,
        customProgram: customProgramPda,
        outMint: x_mint,
        inMint: y_mint,
        sellerOutTokenAccount: seller_out_token_account,
        escrow: escrow2Pda, // created in program
        escrowedOutTokenAccount: escrowedOutTokenAccount2.publicKey, // created in program
        tokenProgram: TOKEN_PROGRAM_ID, // Q: Use 2022 version? A: TOKEN_PROGRAM_ID!
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([escrowedOutTokenAccount2])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    const currentCustomProgram = await program.account.customProgram.fetch(customProgramPda);
    customProgram = currentCustomProgram;

    const currentEscrow = await program.account.escrow.fetch(escrow2Pda);
    console.log("currentEscrow: ", currentEscrow);
    // Update global state
    escrow2 = currentEscrow;


    const escrowedOutTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(
        escrowedOutTokenAccount2.publicKey
      );
    console.log(
      "INITIALIZE::escrowedOutTokenAccountBalance: ",
      escrowedOutTokenAccountBalance
    );

    console.log('escrow account: ', currentEscrow);

    expect(currentEscrow.authority.toString()).to.equal(seller.publicKey.toString());
    expect(currentEscrow.isActive).to.equal(true);
    expect(currentEscrow.hasExchanged).to.equal(false);
    expect(currentEscrow.outAmount.toNumber()).to.equal(20);
    expect(currentEscrow.inAmount.toNumber()).to.equal(80);
    expect(parseInt(escrowedOutTokenAccountBalance.value.amount)).to.equal(20);
    expect(currentEscrow.bump).to.equal(bump);
    expect(customProgram.totalEscrowCount.toNumber()).to.equal(parseInt(escrowNumber)); //
  });


  it("Initialize escrow3 with seller out token as Z mint", async () => {
    const escrowNumber: string = (
      customProgram.totalEscrowCount.toNumber() + 1
    ).toString();
    console.log("escrowNumber: ", escrowNumber);

    const [pda, bump] = await PublicKey.findProgramAddress(
      // [anchor.utils.bytes.utf8.encode("escrow"), seller.publicKey.toBuffer()],
      [Buffer.from(ESCROW_SEED_PREFIX), seller.publicKey.toBuffer(), anchor.utils.bytes.utf8.encode(escrowNumber)],
      program.programId
    );

    escrow3Pda = pda;
    console.log(`escrow3Pda: ${escrow3Pda}`);
    console.log("STARTED: Initialize escrow test...");

    const out_amount = new anchor.BN(20);
    const in_amount = new anchor.BN(80); // number of token seller wants in exchange for out_amount

    const tx = await program.methods
      .initialize(out_amount, in_amount)
      .accounts({
        seller: seller.publicKey,
        customProgram: customProgramPda,
        outMint: z_mint,
        inMint: y_mint,
        sellerOutTokenAccount: seller_z_token_account,
        escrow: escrow3Pda, // created in program
        escrowedOutTokenAccount: escrowedOutTokenAccount3.publicKey, // created in program
        tokenProgram: TOKEN_PROGRAM_ID, // Q: Use 2022 version? A: TOKEN_PROGRAM_ID!
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([escrowedOutTokenAccount3])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    const currentCustomProgram = await program.account.customProgram.fetch(customProgramPda);
    customProgram = currentCustomProgram;

    const currentEscrow = await program.account.escrow.fetch(escrow3Pda);
    console.log("currentEscrow: ", currentEscrow);
    // Update global state
    escrow3 = currentEscrow;


    const escrowedOutTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(
        escrowedOutTokenAccount3.publicKey
      );
    console.log(
      "INITIALIZE::escrowedOutTokenAccountBalance: ",
      escrowedOutTokenAccountBalance
    );

    console.log('escrow account: ', currentEscrow);

    expect(currentEscrow.authority.toString()).to.equal(seller.publicKey.toString());
    expect(currentEscrow.isActive).to.equal(true);
    expect(currentEscrow.hasExchanged).to.equal(false);
    expect(currentEscrow.outAmount.toNumber()).to.equal(20);
    expect(currentEscrow.inAmount.toNumber()).to.equal(80);
    expect(parseInt(escrowedOutTokenAccountBalance.value.amount)).to.equal(20);
    expect(currentEscrow.bump).to.equal(bump);
    expect(customProgram.totalEscrowCount.toNumber()).to.equal(parseInt(escrowNumber)); //
  });


  it("Accept the escrow3 trade without buyer having token Z ATA", async () => {
    // Q: Should I add some assert up top ensure that buyer doesn't have ATA?
    // Q: In Chai, how to check if 'undefined'?
    // A: Use the to.be.undefined
    expect(buyer_z_token_account).to.be.undefined; // WORKS

    // Use the getOrCreateAssociatedTokenAccount() function
    // NOTE This returns type Account (not PublicKey), so you have to
    // access the 'address' property to get the pubkey!
    buyer_z_token_account = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer, // payer
      z_mint,
      buyer.publicKey // owner
    );
    console.log('buyer_z_token_account AFTER getOrCreateAssociatedTokenAccount: ', buyer_z_token_account);


    const tx = await program.methods
      .accept()
      .accounts({
        buyer: buyer.publicKey,
        escrow: escrow3Pda,
        escrowedOutTokenAccount: escrowedOutTokenAccount3.publicKey,
        sellerInTokenAccount: seller_in_token_account, // Y mint
        buyerInTokenAccount: buyer_z_token_account.address, // Q: Will this work without creating ATA first? A: No!
        buyerOutTokenAccount: buyer_out_token_account, // Y mint
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    // Get account data to verify is_active and has_exchanged values
    const data = await program.account.escrow.fetch(escrow3Pda);
    console.log('escrow account: ', data);

    const escrowedOutTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(
        escrowedOutTokenAccount3.publicKey
      );
    console.log(
      "ACCEPT::escrowedOutTokenAccountBalance: ",
      escrowedOutTokenAccountBalance
    );
    // ACCEPT::escrowedOutTokenAccountBalance:  {
    //   context: { apiVersion: '1.10.38', slot: 81 },
    //   value: { amount: '0', decimals: 8, uiAmount: 0, uiAmountString: '0' }
    // }

    // const escrowedXTokenAccountData = await provider.connection
    //   .getAccountInfo(escrowedOutTokenAccount1.publicKey)
    //   .then((res) => res.data.toJSON());
    // console.log(
    //   "ACCEPT::escrowedXTokenAccountData: ",
    //   escrowedXTokenAccountData
    // );
    // ACCEPT::escrowedXTokenAccountData:  {
    //   data: <Buffer e2 bd 5c 49 60 9d 4b 7d 64 2e 61 e0 a0 a5 b3 44 e0 4d 24 98 5a 43 3c 10 9c cd e1 6d 69 01 a1 9e b1 f0 cc 28 e1 e2 41 58 0f 62 c
    // c 70 0f 9c cb d2 bb 7d ... 115 more bytes>,
    //   executable: false,
    //   lamports: 2039280,
    //   owner: PublicKey {
    //     _bn: <BN: 6ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9>
    //   },
    //   rentEpoch: 0
    // }

    expect(data.buyer.toString()).to.equal(buyer.publicKey.toString());
    expect(data.isActive).to.equal(false);
    expect(data.hasExchanged).to.equal(true);
    expect(parseInt(escrowedOutTokenAccountBalance.value.amount)).to.equal(0);
    // TODO Check that buyer and seller ATA balances are accurately updated.
  });



  it("Initialize escrow4 with seller in token as W mint", async () => {
    // Q: Should the seller pay for their inTokenATA or the buyer?
    const escrowNumber: string = (
      customProgram.totalEscrowCount.toNumber() + 1
    ).toString();
    console.log("escrowNumber: ", escrowNumber);

    const [pda, bump] = await PublicKey.findProgramAddress(
      // [anchor.utils.bytes.utf8.encode("escrow"), seller.publicKey.toBuffer()],
      [Buffer.from(ESCROW_SEED_PREFIX), seller.publicKey.toBuffer(), anchor.utils.bytes.utf8.encode(escrowNumber)],
      program.programId
    );

    escrow4Pda = pda;
    console.log(`escrow4Pda: ${escrow4Pda}`);
    console.log("STARTED: Initialize escrow test...");

    const out_amount = new anchor.BN(20);
    const in_amount = new anchor.BN(80); // number of token seller wants in exchange for out_amount

    const tx = await program.methods
      .initialize(out_amount, in_amount)
      .accounts({
        seller: seller.publicKey,
        customProgram: customProgramPda,
        outMint: x_mint,
        inMint: w_mint,
        sellerOutTokenAccount: seller_out_token_account,
        escrow: escrow4Pda, // created in program
        escrowedOutTokenAccount: escrowedOutTokenAccount4.publicKey, // created in program
        tokenProgram: TOKEN_PROGRAM_ID, // Q: Use 2022 version? A: TOKEN_PROGRAM_ID!
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([escrowedOutTokenAccount4])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    const currentCustomProgram = await program.account.customProgram.fetch(customProgramPda);
    customProgram = currentCustomProgram;

    const currentEscrow = await program.account.escrow.fetch(escrow4Pda);
    console.log("currentEscrow: ", currentEscrow);
    // Update global state
    escrow4 = currentEscrow;


    const escrowedOutTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(
        escrowedOutTokenAccount4.publicKey
      );
    console.log(
      "INITIALIZE::escrowedOutTokenAccountBalance: ",
      escrowedOutTokenAccountBalance
    );

    console.log('escrow account: ', currentEscrow);

    expect(currentEscrow.authority.toString()).to.equal(seller.publicKey.toString());
    expect(currentEscrow.isActive).to.equal(true);
    expect(currentEscrow.hasExchanged).to.equal(false);
    expect(currentEscrow.outAmount.toNumber()).to.equal(20);
    expect(currentEscrow.inAmount.toNumber()).to.equal(80);
    expect(parseInt(escrowedOutTokenAccountBalance.value.amount)).to.equal(20);
    expect(currentEscrow.bump).to.equal(bump);
    expect(customProgram.totalEscrowCount.toNumber()).to.equal(parseInt(escrowNumber)); //
  });


  it("Accept the escrow4 trade without seller having token W ATA", async () => {
    // Q: Should I add some assert up top ensure that seller doesn't have ATA?
    // Q: In Chai, how to check if 'undefined'?
    // A: Use the to.be.undefined
    expect(seller_w_token_account).to.be.undefined; // WORKS

    // Use the getOrCreateAssociatedTokenAccount() function
    // NOTE This returns type Account (not PublicKey), so you have to
    // access the 'address' property to get the pubkey!
    // Q: Should the SELLER pay to create their ATA or the buyer?
    seller_w_token_account = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      buyer, // payer
      w_mint,
      seller.publicKey // owner
    );
    console.log('seller_w_token_account AFTER getOrCreateAssociatedTokenAccount: ', seller_w_token_account);


    const tx = await program.methods
      .accept()
      .accounts({
        buyer: buyer.publicKey,
        escrow: escrow4Pda,
        escrowedOutTokenAccount: escrowedOutTokenAccount4.publicKey,
        sellerInTokenAccount: seller_w_token_account.address, // W mint
        buyerInTokenAccount: buyer_in_token_account, // X Mint
        buyerOutTokenAccount: buyer_w_token_account, // W mint
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    // Get account data to verify is_active and has_exchanged values
    const data = await program.account.escrow.fetch(escrow4Pda);
    console.log('escrow account: ', data);

    const escrowedOutTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(
        escrowedOutTokenAccount4.publicKey
      );
    console.log(
      "ACCEPT::escrowedOutTokenAccountBalance: ",
      escrowedOutTokenAccountBalance
    );

    expect(data.buyer.toString()).to.equal(buyer.publicKey.toString());
    expect(data.isActive).to.equal(false);
    expect(data.hasExchanged).to.equal(true);
    expect(parseInt(escrowedOutTokenAccountBalance.value.amount)).to.equal(0);
    // TODO Check that buyer and seller ATA balances are accurately updated.
  });

});


