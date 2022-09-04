import * as anchor from "@project-serum/anchor";
import {
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  mintToChecked,
  createMintToCheckedInstruction,
} from "@solana/spl-token";
import { Program } from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { NonCustodialEscrow } from "../target/types/non_custodial_escrow";
import { expect } from "chai";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";

describe("non-custodial-escrow", () => {
  // NOTE Anchor tests use provider.wallet as the payer, and thus automatically
  // use the provider.wallet as the signer.
  // Configure the client to use the devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  console.log(`provider.wallet: ${provider.wallet}`);

  const program = anchor.workspace
    .NonCustodialEscrow as Program<NonCustodialEscrow>;

  // Need a couple wallets for buyer and seller
  // NOTE We'll use my local keypair as the seller's wallet
  // NOTE Need an anchor.web3.Signer for payer (e.g. anchor.Wallet.payer)
  // Q: How to create type anchor.web3.Signer?
  const seller = provider.wallet as anchor.Wallet; // anchor.web3.Keypair.generate();
  // const payer = Keypair.fromSecretKey(secretKey); // TODO see mint nft project
  const buyer = anchor.web3.Keypair.generate();
  let x_mint;
  let y_mint;
  let seller_x_token; // Associated Token Accounts
  let seller_y_token;
  let buyer_x_token;
  let buyer_y_token;

  // Use the before() hook to create our mints, find our escrow PDA, etc.
  before(async () => {
    // 1. Ensure our wallets have SOL
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        buyer.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      )
    );
    console.log(
      `buyer balance: ${await provider.connection.getBalance(buyer.publicKey)}`
    );

    // await new Promise((resolve) => setTimeout(resolve, 500));

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        seller.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      )
    );
    console.log(
      `seller balance: ${await provider.connection.getBalance(
        seller.publicKey
      )}`
    );

    // 2. Find a PDA for our escrow account to be located at
    const [escrowAccountPDA, escrowAccountBump] =
      await PublicKey.findProgramAddress(
        [anchor.utils.bytes.utf8.encode("escrow"), seller.publicKey.toBuffer()],
        program.programId
      );

    console.log(
      "PDA for program",
      program.programId.toBase58(),
      "is generated :",
      escrowAccountPDA.toBase58()
    );

    // 3. Create our x and y token Mints using @solana/spl-token methods
    // NOTE SPL Token program has changed. Trying to use latest v0.3.4
    // REF Cookbook: https://solanacookbook.com/references/token.html#how-to-create-a-new-token
    x_mint = await createMint(
      provider.connection, // connection
      seller.payer, // payer
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      8 // decimals location of the decimal place
      // (optional) keypair?
      // (optional) confirmOptions?
      // TOKEN_PROGRAM_ID // programId
    );
    console.log(`x_mint: ${x_mint.toBase58()}`);

    // await new Promise((resolve) => setTimeout(resolve, 500));

    y_mint = await createMint(
      provider.connection, // connection
      seller.payer, // payer of tx and init fees
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      8 // decimals location of the decimal place
      // (optional) keypair?
      // (optional) confirmOptions?
      // TOKEN_PROGRAM_ID // programId
    );
    console.log(`y_mint: ${y_mint.toBase58()}`);
    // await new Promise((resolve) => setTimeout(resolve, 500));

    // 4. Create associated token accounts for seller's and buyer's x and y tokens
    // 4.1 Create seller_x_token ATA
    // // Alternative 1:
    // seller_x_token = await anchor.utils.token.associatedAddress({
    //   mint: x_mint,
    //   owner: seller.publicKey,
    // });
    // Alternative 2:
    seller_x_token = await createAssociatedTokenAccount(
      provider.connection, // connection
      // Q: How does seller.payer (Keypair) work when it's supposed to be Signer?
      seller.payer, // payer keypair,
      x_mint, // mint pubkey
      seller.publicKey // owner pubkey
    );
    console.log(`seller_x_token: ${seller_x_token}`); // WORKS
    // await new Promise((resolve) => setTimeout(resolve, 500));

    // 4.2 Mint new supply and transfer to seller_x_token account
    // == Attempt 1 using built-in mintToChecked()
    // ERROR ---- Was it the Decimals???????? since using MintToChecked() asserts decimals!;
    await mintToChecked(
      provider.connection, //connection,
      // Q: How do I get type anchor.web3.Signer?
      // NOTE payer is Keypair, but need type Signer
      // REF https://stackoverflow.com/questions/70206015/solana-web3-js-getting-web3-signer-from-wallet
      seller.payer, // payer, // NOTE need anchor.web3.Signer
      x_mint, // mint,
      seller_x_token, // destination ata,
      seller.publicKey, // mint authority,
      1e8, // amount,
      8 // decimals
      // [signer1, signer2...], // only multisig account will use
    );
    console.log(
      `seller_x_token balance: ${await provider.connection.getTokenAccountBalance(
        seller_x_token
      )}`
    );

    // == Attempt 2 w/o built-in mintToChecked()
    // ERROR: Everything below errors...
    // let ix = createMintToCheckedInstruction(
    //   x_mint, // mint
    //   seller_x_token, // destination ata
    //   seller.publicKey, // mint authority
    //   1e8, // amount
    //   8 // decimals
    // );
    // console.log(ix);
    // let tx = new Transaction().add(ix);
    // console.log(tx);

    // let tx = new Transaction().add(
    //   createMintToCheckedInstruction(
    //     x_mint, // mint
    //     seller_x_token, // destination ata
    //     seller.publicKey, // mint authority
    //     1e8, // amount
    //     8 // decimals
    //   )
    // );
    // console.log(tx);
    // console.log(
    //   `txhash: ${await provider.sendAndConfirm(tx, [x_mint], {
    //     skipPreflight: true,
    //   })}`
    // ); // InstructionError
    // console.log(
    //   `txhash: ${await provider.connection.sendTransaction(tx, [
    //     seller.payer,
    //   ])})`
    // );
    // console.log(
    //   `txhash: ${await provider.connection.sendTransaction(tx, [
    //     seller.payer, // payer
    //     // Q: How to get type Signer?
    //     // Error - Don't have type Signer...
    //     // provider.wallet, // mint authority ????
    //   ])}`
    // );

    // await new Promise((resolve) => setTimeout(resolve, 500));

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
      seller.payer,
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

    // Check the status of these wallets and token accounts
    console.log(
      `seller_x_token balance: ${await provider.connection.getTokenAccountBalance(
        seller_x_token
      )}`
    );
    console.log(
      `buyer_y_token balance: ${await provider.connection.getTokenAccountBalance(
        buyer_y_token
      )}`
    );
  });

  it("Initializes escrow account with x_amount of tokens transferred from seller", async () => {
    // Create some associated token accounts for x and y tokens for buyer and seller
    // Call our on-chain program's initialize() method and set escrow properties values
    console.log("initialize test here...");
  });
});
