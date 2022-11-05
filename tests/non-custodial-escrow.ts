import * as anchor from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintToChecked,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { Program } from "@project-serum/anchor";
import { PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { NonCustodialEscrow } from "../target/types/non_custodial_escrow";
import { expect } from "chai";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

// U: 11/5 - Added a few more fields to Escrow account struct to better track more
// details about the exchange. Trying to allow creating multiple escrows and later
// querying details about buyer, seller, x, y, amounts, etc.
describe("non-custodial-escrow", () => {
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
  let x_mint;
  let y_mint;
  let seller_x_token; // Associated Token Accounts
  let seller_y_token;
  let buyer_x_token;
  let buyer_y_token;
  // NOTE This is just saving the Pubkey, since program creates actual account
  let escrowed_x_token = anchor.web3.Keypair.generate();
  console.log(`escrowed_x_token: ${escrowed_x_token.publicKey}`);
  // NOTE This is a PDA that we'll get below
  let escrow: anchor.web3.PublicKey;

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

    // 2. Find a PDA for our escrow account to be located at
    const [escrowPDA, escrowBump] = await PublicKey.findProgramAddress(
      // [anchor.utils.bytes.utf8.encode("escrow"), seller.publicKey.toBuffer()],
      [Buffer.from(ESCROW_SEED_PREFIX), seller.publicKey.toBuffer()],
      program.programId
    );
    escrow = escrowPDA;
    console.log(`escrowPDA: ${escrowPDA}`);
    console.log(`escrow: ${escrow}`);

    // console.log(
    //   "PDA for program",
    //   program.programId.toBase58(),
    //   "is generated :\n    ",
    //   escrow.toBase58()
    // );

    // 3. Create our x and y token Mints using @solana/spl-token methods
    // NOTE SPL Token program has changed. Trying to use latest v0.3.4
    // REF Cookbook: https://solanacookbook.com/references/token.html#how-to-create-a-new-token
    x_mint = await createMint(
      provider.connection, // connection
      seller.payer, // payer
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      8 // decimals location of the decimal place
    );
    console.log(`x_mint: ${x_mint.toBase58()}`);

    // await new Promise((resolve) => setTimeout(resolve, 500));

    y_mint = await createMint(
      provider.connection, // connection
      seller.payer, // payer of tx and init fees
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      8 // decimals location of the decimal place
    );
    console.log(`y_mint: ${y_mint.toBase58()}`);
    // await new Promise((resolve) => setTimeout(resolve, 500));

    // 4. Create associated token accounts for seller's and buyer's x and y tokens
    // 4.1 Create seller_x_token ATA
    seller_x_token = await createAssociatedTokenAccount(
      provider.connection, // connection
      seller.payer, // payer keypair,
      x_mint, // mint pubkey
      seller.publicKey // owner pubkey
    );
    console.log(`seller_x_token: ${seller_x_token}`);
    // await new Promise((resolve) => setTimeout(resolve, 500));

    // 4.2 Mint new supply and transfer to seller_x_token account
    await mintToChecked(
      provider.connection, //connection,
      // Q: How do I get type anchor.web3.Signer?
      // NOTE payer is Keypair, but need type Signer
      // REF https://stackoverflow.com/questions/70206015/solana-web3-js-getting-web3-signer-from-wallet
      // A: Still don't know, BUT type Keypair seems to work...
      seller.payer, // payer, // NOTE need anchor.web3.Signer
      x_mint, // mint,
      seller_x_token, // destination ata,
      seller.publicKey, // mint authority,
      1e8, // amount,
      8 // decimals
      // [signer1, signer2...], // only multisig account will use
    );
    console.log(
      `seller_x_token balance: ${await provider.connection
        .getTokenAccountBalance(seller_x_token)
        .then((r) => r.value.amount)}`
    );

    // 4.3 Create the seller_y_token ATA
    seller_y_token = await createAssociatedTokenAccount(
      provider.connection, // connection
      seller.payer, // payer keypair,
      y_mint, // mint pubkey
      seller.publicKey // owner pubkey
    );
    console.log(`seller_y_token: ${seller_y_token}`);

    // 4.4 Create buyer_x_token and buyer_y_token ATAs
    buyer_x_token = await createAssociatedTokenAccount(
      provider.connection,
      buyer, // seller.payer, // Q: Buyer or seller is the payer?
      x_mint,
      buyer.publicKey
    );
    console.log(`buyer_x_token: ${buyer_x_token}`);

    // await new Promise((resolve) => setTimeout(resolve, 500));

    buyer_y_token = await createAssociatedTokenAccount(
      provider.connection,
      seller.payer,
      y_mint,
      buyer.publicKey
    );
    console.log(`buyer_y_token: ${buyer_y_token}`);
    // await new Promise((resolve) => setTimeout(resolve, 500));

    // 4.5 Mint new y token supply and transfer to buyer_y_token account
    await mintToChecked(
      provider.connection,
      seller.payer, // payer
      y_mint, // mint
      buyer_y_token, // destination
      seller.publicKey, // mint authority
      1e8, // amount. NOTE If decimals is 8, you mint 10^8 for 1 token
      8 // decimals
      // [signer1, signer2...], // only multisig account will use
    );
    console.log(
      `buyer_y_token balance: ${await provider.connection
        .getTokenAccountBalance(buyer_y_token)
        .then((r) => r.value.amount)}`
    );
  });


  it("Initialize escrow", async () => {
    // Create some associated token accounts for x and y tokens for buyer and seller
    // Call our on-chain program's initialize() method and set escrow properties values
    console.log("STARTED: Initialize escrow test...");
    // NOTE Results in 0.0000004 in escrowed_x_token balance
    const x_amount = new anchor.BN(40);
    const y_amount = new anchor.BN(40); // number of token seller wants in exchange for x_amount
    // Check whether escrow account already has data
    let data;

    // 2. Try to retreive PDA account data if it exists
    console.log(`Checking if escrow account ${escrow} exists...`);
    try {
      // Check whether our PDA address has an escrow account
      data = await program.account.escrow.fetch(escrow);
      console.log("Account already exists!");
    } catch (e) {
      console.log(`Account ${escrow} does NOT exist!`);
      console.log("Creating account...");
      const tx = await program.methods
        .initialize(x_amount, y_amount)
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
          xMint: x_mint,
          yMint: y_mint,
          sellerXToken: seller_x_token,
          escrow: escrow, // created in program
          escrowedXToken: escrowed_x_token.publicKey, // created in program
          tokenProgram: TOKEN_PROGRAM_ID, // Q: Use 2022 version? A: TOKEN_PROGRAM_ID!
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        // Q: Which accounts are Signers?
        // A: Check IDL! Wallet and escrowed_x_token!
        // Q: Why is escrowed_x_token a Signer? It's just a type TokenAccount...
        // I believe it's because it gets created and we set its props?
        .signers([escrowed_x_token])
        .rpc({ skipPreflight: true });

      console.log("TxHash ::", tx);

      data = await program.account.escrow.fetch(escrow);
    }

    const escrowedXTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(
        escrowed_x_token.publicKey
      );
    console.log(
      "INITIALIZE::escrowedXTokenAccountBalance: ",
      escrowedXTokenAccountBalance
    );
    // INITIALIZE::escrowedXTokenAccountBalance:  {
    //   context: { apiVersion: '1.10.38', slot: 80 },
    //   value: {
    //     amount: '40',
    //     decimals: 8,
    //     uiAmount: 4e-7,
    //     uiAmountString: '0.0000004'
    //   }
    // }

    // const escrowedXTokenAccountData = await provider.connection.getAccountInfo(
    //   escrowed_x_token.publicKey
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

    // Q: Why is escrowed_x_token NOT initialized and has no 'amount'?
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

    console.log('escrow account: ', data);
    console.log("Our Escrow PDA has account with data:\n");
    console.log(`{
      data: ${data}
      authority: ${data.authority},
      escrowedXToken.amount: ${data.escrowedXToken.amount},
      escrowedXToken.state: ${data.escrowedXToken.state},
      yMint: ${data.yMint},
      yAmount: ${data.yAmount},
    }`);
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
    //     escrowedXToken: Dcp4JVmrGncru1etSih5JFdooWK3BZDP8h5QK7qTgxA7,
    //     yMint: GEkKTvAmnpkRhvftq6sbcKcDWnGXByky9Fbt1kBm99Qi,
    //     yAmount: 40,
    //   }

    expect(data.authority.toString()).to.equal(seller.publicKey.toString());
    expect(data.isActive).to.equal(true);
    expect(data.hasExchanged).to.equal(false);
  });

  it("Accept the trade", async () => {
    // Q: Why isn't escrowed_x_token NOT initialized?
    // Program log: AnchorError caused by account: escrowed_x_token. Error Code: AccountNotInitialized. Error Number: 3012.
    // Error Message: The program expected this account to be already initialized.
    // Shouldn't escrowed_x_token be a TokenAccount with an 'amount' property?
    // A: Two reasons: wrong Program ID and need to restart validator before tests

    const tx = await program.methods
      .accept()
      .accounts({
        buyer: buyer.publicKey,
        escrow: escrow,
        escrowedXToken: escrowed_x_token.publicKey,
        sellerYToken: seller_y_token,
        buyerXToken: buyer_x_token,
        buyerYToken: buyer_y_token,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    // Get account data to verify is_active and has_exchanged values
    const data = await program.account.escrow.fetch(escrow);
    console.log('escrow account: ', data);

    const escrowedXTokenAccountBalance =
      await provider.connection.getTokenAccountBalance(
        escrowed_x_token.publicKey
      );
    console.log(
      "ACCEPT::escrowedXTokenAccountBalance: ",
      escrowedXTokenAccountBalance
    );
    // ACCEPT::escrowedXTokenAccountBalance:  {
    //   context: { apiVersion: '1.10.38', slot: 81 },
    //   value: { amount: '0', decimals: 8, uiAmount: 0, uiAmountString: '0' }
    // }

    // const escrowedXTokenAccountData = await provider.connection
    //   .getAccountInfo(escrowed_x_token.publicKey)
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
  });

  it("Cancel the trade", async () => {
    const tx = await program.methods
      .cancel()
      .accounts({
        seller: seller.publicKey,
        escrow: escrow,
        escrowedXToken: escrowed_x_token.publicKey,
        sellerXToken: seller_x_token,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([seller.payer])
      .rpc({ skipPreflight: true });

    console.log("TxHash ::", tx);

    // Get the updated account data to verify is_active and has_exchanged updated
    // Q: Is 'escrow' still available after closing 'escrowed_x_token'?
    // A: NOPE! It's completely closed so no need to update!
    // const data = await program.account.escrow.fetch(escrow);
    // console.log("data.isActive: ", data.isActive);
    // console.log("data.hasExchanged: ", data.hasExchanged);

    // const escrowedXTokenAccountBalance =
    //   await provider.connection.getTokenAccountBalance(
    //     escrowed_x_token.publicKey
    //   );
    // console.log(
    //   "CANCEL::escrowedXTokenAccountBalance: ",
    //   escrowedXTokenAccountBalance
    // ); // Errors since the account no longer exists (closed)!
    // const escrowedXTokenAccountData = await provider.connection.getAccountInfo(
    //   escrowed_x_token.publicKey
    // );
    // console.log(
    //   "CANCEL::escrowedXTokenAccountData: ",
    //   escrowedXTokenAccountData
    // );
    // CANCEL::escrowedXTokenAccountData:  null
  });
});
