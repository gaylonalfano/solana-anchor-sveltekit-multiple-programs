import * as anchor from "@project-serum/anchor";
import * as splToken from "@solana/spl-token";
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
  let x_mint: PublicKey;
  let y_mint: PublicKey;
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
    x_mint = await splToken.createMint(
      provider.connection, // connection
      seller, // payer
      seller.publicKey, // mintAuthority
      seller.publicKey, // freezeAuthority?
      6, // decimals location of the decimal place
      // (optional) keypair?
      // (optional) confirmOptions?
      splToken.TOKEN_PROGRAM_ID // programId
    );

    y_mint = await splToken.createMint(
      provider.connection, // connection
      seller, // payer of tx and init fees
      seller.publicKey, // mintAuthority
      null, // freezeAuthority?
      6, // decimals location of the decimal place
      // (optional) keypair?
      // (optional) confirmOptions?
      splToken.TOKEN_PROGRAM_ID // programId
    );

    // 4. Create associated token accounts for seller's x and y tokens
    seller_x_token = await x_mint.createAccount(seller);
    await x_mint.mintTo(seller_x_token, seller, [], 10_000_000_000);
  });

  it("Initializes escrow account with x_amount of tokens transferred from seller", async () => {
    // Create some associated token accounts for x and y tokens for buyer and seller
    // Call our on-chain program's initialize() method and set escrow properties values
  });
});
