import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
// import { SolanaAnchorMetaplexMintSellNfts } from "../target/types/solana_anchor_metaplex_mint_nfts";
import { SolanaAnchorMetaplexMintSellNfts } from "../target/types/solana_anchor_metaplex_mint_sell_nfts";
import { createKeypairFromFile } from "./utils";

describe("solana-anchor-metaplex-mint-sell-nfts", () => {
  const testNftTitle = "YouTube NFT";
  const testNftSymbol = "TUBE";
  const testNftUri =
    "https://raw.githubusercontent.com/gaylonalfano/solana-anchor-metaplex-mint-sell-nfts/main/assets/example.json";

  const provider = anchor.AnchorProvider.env();
  // NOTE We use anchor.Wallet to help with typing
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  // OLD PROGRAM NAME:
  // const program = anchor.workspace
  //   .SolanaAnchorMetaplexMintNfts as Program<SolanaAnchorMetaplexMintSellNfts>;

  // NEW PROGRAM NAME:
  // NOTE Had to update this name EVERYWHERE! TL;DR Just init a fresh project and copy files!
  const program = anchor.workspace
    .SolanaAnchorMetaplexMintSellNfts as Program<SolanaAnchorMetaplexMintSellNfts>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  it("Mint!", async () => {
    // 1. Derive the mint address of NFT and associated token account address
    // NOTE We just derive the account addresses on the Client-side, and then
    // let our program take care of creating the actual accounts
    const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    const tokenAccountAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: wallet.publicKey,
    });
    console.log(`New token (mint): ${mintKeypair.publicKey}`);
    // 2. Derive the metadata account and master edition metadata account addresses
    // NOTE I believe we're using PDAs for these accounts. Specifically,
    // we're using findProgramAddress and passing it some seeds.
    // IMPORTANT This is finding an address (PDA, I think) on Solana that can exist with these seeds,
    // and we're going to use it to create the address (of metadata account) that points to the mint
    // We're ONLY finding the ADDRESS! Our program will do the actual creating of the metadata account!
    // Q: Do I need to wrap the await inside parens? (await anchor...)
    // A: Don't believe so. Just an alternate syntax
    const metadataAccountAddress = (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID // Program that will own the PDA
      )
    )[0]; // Just want the address
    console.log(
      `Metadata Account Address (PDA) initialized: ${metadataAccountAddress}`
    );
    // let [metadataAccountAddress, metadataAccountBump] =
    //   await anchor.web3.PublicKey.findProgramAddress(
    //     [
    //       Buffer.from("metadata"),
    //       TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    //       mintKeypair.publicKey.toBuffer(),
    //     ],
    //     TOKEN_METADATA_PROGRAM_ID // Program that will own the PDA
    //   );
    // console.log(
    //   `Metadata Account Address (PDA) initialized: ${metadataAccountAddress}`
    // );

    let masterEditionMetadataAccountAddress = (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0]; // Just want the address
    console.log(
      `Master Edition Metadata Account Address (PDA) initialized: ${masterEditionMetadataAccountAddress}`
    );
    // Handy account info search. This errors because there is no
    // local version of MP Token Program in the local test validator
    // let metaplexTokenProgramAccountInfo =
    //   await provider.connection.getAccountInfo(TOKEN_METADATA_PROGRAM_ID);
    // console.log(
    //   `${TOKEN_METADATA_PROGRAM_ID.toString()} length: ${
    //     metaplexTokenProgramAccountInfo.data.length
    //   }`
    // );
    // let [
    //   masterEditionMetadataAccountAddress,
    //   masterEditionMetadataAccountBump,
    // ] = await anchor.web3.PublicKey.findProgramAddress(
    //   [
    //     Buffer.from("metadata"),
    //     TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    //     mintKeypair.publicKey.toBuffer(),
    //     Buffer.from("master-edition"),
    //   ],
    //   TOKEN_METADATA_PROGRAM_ID // Program that will own the PDA
    // ); // Just want the address
    // console.log(
    //   `Master Edition Metadata Account Address (PDA) initialized: ${masterEditionMetadataAccountAddress}`
    // );

    // 2. Transact with the mint_nft() fn in our on-chain program
    // NOTE This sends and confirms the transaction in one go!
    // FIXME: Encountered two errors when running anchor test:
    // -- One about metadata not being added correctly or at all
    // -- Two was the familiar ix error: instruction modified the
    // UPDATE: Turns out was running older version of Solana program CLI!
    // program ID of an account. In the past, this was space/size related...
    // NOTE You DO NOT pass the Context as an arg! Anchor does this automatically!
    await program.methods
      .mint(testNftTitle, testNftSymbol, testNftUri)
      // NOTE We only provide the PublicKeys for all the accounts.
      // We do NOT have to deal with isSigner, isWritable, etc. like in RAW
      // since we already declared that in the program MintNft Context struct.
      // This means Anchor will look for all that info in our MintNft struct
      // ON ENTRY!
      // NOTE We also don't have to pass the System Program, Token Program, and
      // Associated Token Program, since Anchor resolves these automatically. We
      // only have to pass in Token Metadata Program since it's 'UncheckedAccount'
      .accounts({
        masterEditionMetadata: masterEditionMetadataAccountAddress,
        metadata: metadataAccountAddress,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAccountAddress,
        mintAuthority: wallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        // Q: What about the others (tokenProgram, associatedTokenProgram, rent, etc.)?
        // A: It's because Anchor automatically resolves these.
        // A: We add tokenMetadataProgram because it's UNCHECKED!
        // Q: AFTER a successful mint, How does the Token/Mint's Mint Authority transfer
        // to the Master Edition Metadata Account? We specify mintAuthority: wallet.publicKey,
        // but in Solana Explorer, the Token's 'Mint Authority'= Master Edition Metadata Account
        // and 'Update Authority' = Wallet
      })
      // NOTE I was right that the mintKeypair and wallet are signers,
      // but you don't pass wallet as signer for Anchor. It already knows.
      .signers([mintKeypair])
      .rpc({ skipPreflight: true }); // Get better logs
  });

  // it("Sell!", async () => {
  //   console.log("1. Set up mint, buyer, and seller (wallet) accounts...");
  //   const buyer: anchor.web3.Keypair = await createKeypairFromFile(
  //     __dirname + "/keypairs/buyer1.json"
  //   );
  //   console.log(`Buyer's public key: ${buyer.publicKey}`);
  //   console.log(`Seller's public key: ${wallet.publicKey}`);
  //   const saleAmount = 1 * anchor.web3.LAMPORTS_PER_SOL;
  //   // NOTE I don't have to mint a new NFT! I can simply open explorer and find its address!
  //   // This means our Wallet is the current owner (seller)!
  //   const mint: anchor.web3.PublicKey = new anchor.web3.PublicKey(
  //     "CpNaRA41un7CqEsSSE5VzKyGviCtiSa9b9vfKGb8xATe"
  //   );

  //   console.log("2. Derive ATAs for both buyer and seller...");
  //   const sellerTokenAccount = await anchor.utils.token.associatedAddress({
  //     mint: mint,
  //     owner: wallet.publicKey,
  //   });

  //   // NOTE The buyer likely doesn't have an ATA for this mint, so we first
  //   // get a compatable ATA address that the Associated Token Program can use.
  //   const buyerTokenAccount = await anchor.utils.token.associatedAddress({
  //     mint: mint,
  //     owner: buyer.publicKey,
  //   });
  //   console.log(`Request to sell NFT: ${mint} for ${saleAmount} lamports.`);
  //   console.log(`Seller's (owner) Token Address: ${sellerTokenAccount}`);
  //   console.log(`Buyer's Token Address: ${buyerTokenAccount}`);

  //   // Need to then sell NFT to second account
  //   // === Accounts Reference ===
  //   //     #[account(mut)]
  //   // pub mint: Account<'info, token::Mint>,
  //   // // Q: Why is type TokenAccount instead of AssociatedToken?
  //   // // A: associated_token::AssociatedToken points to the PROGRAM! Not an ATA type!
  //   // #[account(mut)]
  //   // pub seller_token_account: Account<'info, token::TokenAccount>,

  //   // #[account(mut)]
  //   // pub seller_authority: Signer<'info>,

  //   // /// CHECK: We're about to create this with Anchor inside transaction
  //   // #[account(mut)]
  //   // pub buyer_token_account: UncheckedAccount<'info>,

  //   // #[account(mut)]
  //   // pub buyer_authority: Signer<'info>,

  //   // pub rent: Sysvar<'info, Rent>,
  //   // pub system_program: Program<'info, System>,
  //   // pub token_program: Program<'info, token::Token>,
  //   // pub associated_token_program: Program<'info, associated_token::AssociatedToken>,

  //   console.log(
  //     "3. Transact with the 'sell' function in our on-chain program..."
  //   );
  //   await program.methods
  //     .sell(
  //       // Q: Why can't I pass 'number'?
  //       // A: For serialization purposes, you MUST use Anchor's BN()
  //       new anchor.BN(saleAmount)
  //     )
  //     .accounts({
  //       mint: mint,
  //       sellerTokenAccount: sellerTokenAccount,
  //       sellerAuthority: wallet.publicKey,
  //       // Q: How/where to create the buyer's ATA? Use the same anchor.utils.token.associatedAddress()?
  //       // A: Yes!
  //       buyerTokenAccount: buyerTokenAccount,
  //       buyerAuthority: buyer.publicKey,
  //     })
  //     .signers([buyer])
  //     .rpc({ skipPreflight: true });
  // });
});
