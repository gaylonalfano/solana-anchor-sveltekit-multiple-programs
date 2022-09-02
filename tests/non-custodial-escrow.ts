import * as anchor from "@project-serum/anchor";
import {
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createMint,
  createAssociatedTokenAccount,
  mintToChecked,
} from "@solana/spl-token";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { NonCustodialEscrow } from "../target/types/non_custodial_escrow";
import { expect } from "chai";

describe("non-custodial-escrow", () => {
  // Configure the client to use the devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .NonCustodialEscrow as Program<NonCustodialEscrow>;

  // Need a couple wallets for buyer and seller
  const buyer = anchor.web3.Keypair.generate();
  const seller = anchor.web3.Keypair.generate();
  let x_mint;
  let y_mint;
  let seller_x_token;
  let seller_y_token;
  let buyer_x_token;
  let buyer_y_token;

  // Use the before() hook to create our mints, find our escrow PDA, etc.
  before(async () => {
    // 1. Ensure our wallets have SOL
    await provider.connection.requestAirdrop(
      buyer.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );

    await provider.connection.requestAirdrop(
      seller.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
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
      seller, // payer
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      6 // decimals location of the decimal place
      // (optional) keypair?
      // (optional) confirmOptions?
      // TOKEN_PROGRAM_ID // programId
    );
    console.log(`x_mint: ${x_mint.toBase58()}`);

    y_mint = await createMint(
      provider.connection, // connection
      seller, // payer of tx and init fees
      seller.publicKey, // mintAuthority
      null, // freezeAuthority?
      6 // decimals location of the decimal place
      // (optional) keypair?
      // (optional) confirmOptions?
      // TOKEN_PROGRAM_ID // programId
    );
    console.log(`y_mint: ${y_mint.toBase58()}`);

    // 4. Create associated token accounts for seller's and buyer's x and y tokens
    // 4.1 Create seller_x_token ATA
    seller_x_token = await createAssociatedTokenAccount(
      provider.connection, // connection
      seller, // payer keypair,
      x_mint, // mint pubkey
      seller.publicKey // owner pubkey
    );
    // 4.2 Mint new supply and transfer to seller_x_token account
    await mintToChecked(
      provider.connection, //connection,
      seller, //payer,
      x_mint, //mint,
      seller_x_token, //destination,
      seller, //authority,
      1e8, //amount,
      8 //decimals
      // [signer1, signer2...], // only multisig account will use
    );
    // 4.3 Create the seller_y_token ATA
    seller_y_token = await createAssociatedTokenAccount(
      provider.connection, // connection
      seller, // payer keypair,
      y_mint, // mint pubkey
      seller.publicKey // owner pubkey
    );

    // 4.4 Create buyer_x_token and buyer_y_token ATAs
    buyer_x_token = await createAssociatedTokenAccount(
      provider.connection,
      seller,
      x_mint,
      buyer.publicKey
    );

    buyer_y_token = await createAssociatedTokenAccount(
      provider.connection,
      seller,
      y_mint,
      buyer.publicKey
    );

    // 4.5 Mint new y token supply and transfer to buyer_y_token account
    await mintToChecked(
      provider.connection,
      seller, // payer
      y_mint, // mint
      buyer_y_token, // destination
      seller, // mint authority
      1e8, // amount
      8 // decimals
      // [signer1, signer2...], // only multisig account will use
    );
  });

  it("Initializes escrow account with x_amount of tokens transferred from seller", async () => {
    // Create some associated token accounts for x and y tokens for buyer and seller
    // Call our on-chain program's initialize() method and set escrow properties values
  });
});
