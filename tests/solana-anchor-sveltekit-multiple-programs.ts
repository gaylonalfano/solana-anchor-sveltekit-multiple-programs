import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaAnchorSveltekitMultiplePrograms } from "../target/types/solana_anchor_sveltekit_multiple_programs";

describe("solana-anchor-sveltekit-multiple-programs", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolanaAnchorSveltekitMultiplePrograms as Program<SolanaAnchorSveltekitMultiplePrograms>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
