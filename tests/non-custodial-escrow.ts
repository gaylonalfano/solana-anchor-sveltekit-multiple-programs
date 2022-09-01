import * as anchor from "@project-serum/anchor";
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

  it("Initializes escrow account with x_amount of tokens transferred from seller", async () => {
    // 1. Find a PDA for our escrow account to be located at
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

    // Create some associated token accounts for x and y tokens for buyer and seller

    // Call our on-chain program's initialize() method and set escrow properties values
  });
});
