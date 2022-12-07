// REF: UI idea from: https://github.com/paul-schaaf/escrow-ui/blob/master/src/Alice.vue
// REF: Good example of web3/spl-token use: https://github.com/paul-schaaf/escrow-ui/blob/master/src/util/initEscrow.ts
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
} from '@solana/spl-token';

import { walletStore } from '@svelte-on-solana/wallet-adapter-core';
import { workSpace as workspaceStore } from '@svelte-on-solana/wallet-adapter-anchor';
// NOTE Anchor.toml setting can copy IDL to specified dir. However, the 'idl' prop
// on AnchorConnectionProvider wants a JSON instead.
// import { IDL as idl } from '../idl/non_custodial_escrow';

import { notificationStore } from '../../stores/notification';
import { setupStore } from '$stores/escrow/setup-store';
import {
  wMintStore,
  xMintStore,
  yMintStore,
  zMintStore,
} from '$stores/escrow/tokens-store';
import { customProgramStore } from '$stores/escrow/custom-program-store';
import * as constants from '../../helpers/escrow/constants';
import { get } from 'svelte/store';



// Q: When using Stores inside a standard TS file, do I no longer
// have access to the Store value using $? Do I need to use get(Store) instead?
// A: Yep, looks get() is the approach: https://stackoverflow.com/questions/59126405/is-it-possible-to-access-svelte-store-from-external-js-files

// Q: Losing reactivity in UI. Not sure why. Just seems like after I sendTransaction(),
// no other async/awaits really work unless I add to button onclick handler...
// U: Is it my connection's commitment level? Default is 'processed' I think,
// but maybe I need to set to 'confirmed'?
// U: NOPE. Commitment level didn't have any impact.
// A: Need to use Stores to maintain reactivity!
// NOTE Need to type anchor.Wallet to get 'payer' property or errors
// const seller = ($workspaceStore.provider as anchor.AnchorProvider).wallet as anchor.Wallet;
// const buyer = anchor.web3.Keypair.generate();
const buyer = constants.BUYER_WALLET_ADDRESS;
// U: Going to store token Keypairs OUTSIDE of createToken() methods.
// The idea is to stop recreating tokens on refreshes, etc.
let wMintKeypair = Keypair.generate();
let wMintPubkey = wMintKeypair.publicKey;

let xMintKeypair = Keypair.generate();
let xMintPubkey = xMintKeypair.publicKey;

let yMintKeypair = Keypair.generate();
let yMintPubkey = yMintKeypair.publicKey;

let zMintKeypair = Keypair.generate();
let zMintPubkey = zMintKeypair.publicKey;



async function createTokenX() {
  	if (!get(walletStore)) throw Error('Wallet not connected!');
		if (!get(workspaceStore)) throw Error('Workspace not found!');

  // Q 11/1: Explicitly return Promise<Transaction>?
  // REF: https://youtu.be/zai8CX6OwTg?t=573
  // A: Don't think so, but need to sendTransaction() BEFORE
  // I can use getMint() and finally update state (Store)

  // IMPORTANT: Using built-in createMint() will fail bc Anchor Signer clashes. Have to build manually!
  // Q: How do I pass an Anchor Signer to pay for tx?
  // Q: How could I turn createMint() into a tx to then pass to AnchorProvider.sendAndConfirm()?
  // A: Check out Cookbook using new Transaction.add(). Could then use provider to send???
  // REF Cookbook: https://solanacookbook.com/references/token.html#how-to-create-a-new-token
  // A: You have to build it manually! Follow Cookbook example and read Discord:
  // REF: https://discord.com/channels/889577356681945098/889702325231427584/979766795730821200
  // NOTE The built-in works for testing bc we use Anchor directly, but NOT in frontend!
  // xMint = await createMint(
  // 	$workspaceStore.connection,
  // 	seller.payer, // payer (type Signer) - ERROR undefined!
  // 	seller.publicKey, // mintAuthority
  // 	seller.publicKey, // freezeAuthority?
  // 	8 // decimals location of the decimal place
  // );
  // console.log(`xMint: ${xMint.toBase58()}`);

  // U: Moving these local vars to globals so I can save in Stores
  // and prevent having to create tokens on each refresh...
  // const mint = Keypair.generate();
  // xMint = mint.publicKey;
  // console.log(`xMint: ${xMint}`);

  // console.log('provider BEFORE create Token: ', $workspaceStore.provider);
  // console.log('connection BEFORE create Token: ', $workspaceStore.connection);
  const tx = new Transaction().add(
    // create mint account
    SystemProgram.createAccount({
      fromPubkey: get(walletStore).publicKey as anchor.web3.PublicKey,
      newAccountPubkey: xMintPubkey,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(get(workspaceStore).connection),
      programId: TOKEN_PROGRAM_ID
    }),
    // init mint account
    createInitializeMintInstruction(
      xMintPubkey, // mint publicKey
      8, // decimals
      get(walletStore).publicKey as anchor.web3.PublicKey, // mint authority
      get(walletStore).publicKey as anchor.web3.PublicKey // freeze authority
    )
  );

  // console.log('provider AFTER create Token: ', $workspaceStore.provider);
  // console.log('connection AFTER create Token: ', $workspaceStore.connection);
  // Q: Why doesn't workspaceStore.connection.sendTransaction() work?
  // It may be missing the Wallet. When using wallet-adapter, the wallet is a Default
  // Signer, but you don't have access to it. So, maybe the workspaceStore won't work
  // because it doesn't have access to the Wallet? Need to test...
  // A: Yep! Missing the Wallet!
  // NOTE You need to pass in BOTH keypairs of the signer, AND the keypairs
  // of the accounts you're creating.
  // console.log(`TxHash :: ${await $workspaceStore.connection.sendTransaction(tx, [mint])}`); // ERROR: signature verification failed (also deprecated?)
  // console.log(
  // 	`TxHash :: ${await $workspaceStore.provider?.connection.sendTransaction(tx, [mint])}`
  // ); // ERROR: signature verification failed (also deprecated?)

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection, {
    signers: [xMintKeypair]
  });
  console.log('signature:	', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  // U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
  // REF: https://stackoverflow.com/a/72333685
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);

  const xMintAccountData = await getMint(get(workspaceStore).connection, xMintPubkey);
  console.log('xMintAccountData: ', xMintAccountData);
  xMintStore.set({ address: xMintPubkey, mint: xMintAccountData });

  // console.log(
  // 	`TxHash :: ${await get(walletStore).sendTransaction(tx, $workspaceStore.connection, {
  // 		signers: [mint]
  // 	})}`
  // ); // WORKS! Need to use walletStore instead of workspaceStore!

  // UPDATE 11/1: Works! I can await getMint() AFTER I first sendTransaction()
  // and then save the state (Store).
  // UPDATE 9/14: Still not sure. However, for TokenAccountNotFoundError,
  // it may not be needed, or perhaps need to try and fetch after creating ATAs.
  // REF: https://solana.stackexchange.com/questions/1202/spl-token-solana-create-token-account-with-wallet-adapter-react-js
  // Q: Why can't I get the token mint inside this function? Think it's async error...
  // Q: Is it because the above console.log() isn't async, and that's why it
  // it returns TokenAccountNotFoundError?
  // Q: Do I need to do wait for sendTransaction() to complete or something?
  // Below errors for some reason but works if I place inside separate function. Weird.
  // ERROR: TokenAccountNotFoundError
  // NOTE Doesn't error but data isn't Mint data...
  // xMintAccountData = await $workspaceStore.connection.getAccountInfo(xMint, 'confirmed');
  // const currentXMintAccountDataGetAccountInfo = await new Connection(
  // 	'http://localhost:8899',
  // 	'confirmed'
  // ).getAccountInfo(xMint);
  // const currentXMintAccountData = await getMint($workspaceStore.connection, xMint); // error
  // const currentXMintAccountData = await getMint($workspaceStore.connection, xMint).then(
  // 	(res) => res.address
  // ); // Uncaught (in promise) TokenAccountNotFoundError
  // Q: Do I need to simply reassign back to xMintAccountData to get reactivity?
  // let currentXMintAccountDataGetAccountInfo: anchor.web3.AccountInfo<Buffer> | null =
  // 	await $workspaceStore.connection.getAccountInfo(xMint);
  // let currentXMintAccountDataGetAccountInfo = await $workspaceStore.provider?.connection
  // 	.getAccountInfo(xMint)
  // 	.then((res) => res?.data);
  // let currentXMintAccountDataGetParsedAccountInfo =
  // 	await $workspaceStore.connection.getParsedAccountInfo(xMint);
  // let currentXMintAccountDataGetAccount = await getAccount($workspaceStore.connection, xMint); // Error TokenAccountNotFoundError
  // let currentXMintAccountDataGetMint = await getMint($workspaceStore.connection, xMint); // TokenAccountNotFoundError
  // let currentXMintAccountDataGetMint = await getMint(connection, xMint).then(
  // 	(value) => (xMintAccountData = value)
  // );
  // Q: Is there a getMintInfo() to try? Grasping here......
  // A: NOPE. Perhaps in an older version there was.
  // Q: Try building a fresh Connection? NOPE...
  // Q: Try making it an IIFE? NOPE...
  // (async () => {
  // 	let connection = new Connection('http://localhost:8899', 'confirmed');
  // 	let currentXMintAccountDataGetMint = await getMint(connection, mint.publicKey);
  // 	// let currentXMintAccountDataGetMint = await getMintInfo($workspaceStore.connection, xMint);
  // xMintAccountData = currentXMintAccountDataGetAccountInfo;
  // console.log(xMintAccountData); // null
  // })();
  // ==== UPDATE 9/14 ===== Maybe on to something...
  // Q: Do you FIRST have to create the ATA for the Token BEFORE you
  // can get the Mint account info?
  // NOTE I noticed that createTokenX() still doesn't let me find the
  // account using spl-token account-info <ID>. However, when running
  // my Anchor tests, I'm able to find the Mint, BUT this happens AFTER
  // the ATAs are created... So, I should try creating the ATA first and
  // then try to getMint() possibly?
  // A: After createTokenX() and then createSellerTokenXAssociatedTokenAccount(),
  // I STILL cannot find xMint, but I CAN find sellerXToken ATA...
  // Q: Does this mean I need to actually mint some supply in order to
  // finally find Token X Mint info using spl-token account-info <ID>?
  // A: NOPE... still not able to find the Mint account after creating ATAs
  // and even minting new supply to the ATAs. It's like I'm on the wrong network...
  // IMPORTANT: Even creating a token with the CLI, you can't find the account-info
  // right afterwards! (spl-token create-token => spl-token account-info <ID>)
  // Q: Is my Provider or Connection wrong? Why can I find the ATA, but I
  // cannot find the actual Mint using spl-token account-info <ID>?
}

async function createTokenY() {
  if (!get(walletStore)) throw Error('Wallet not connected!');
  if (!get(workspaceStore)) throw Error('Workspace not found!');
  // U: Moving these local vars to globals so I can save in Stores
  // and prevent having to create tokens on each refresh...
  // const mint = Keypair.generate();
  // yMint = mint.publicKey;
  // console.log(`yMint: ${yMint}`);

  const tx = new Transaction().add(
    // create mint account
    SystemProgram.createAccount({
      fromPubkey: get(walletStore).publicKey as anchor.web3.PublicKey,
      newAccountPubkey: yMintPubkey,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(get(workspaceStore).connection),
      programId: TOKEN_PROGRAM_ID
    }),
    // init mint account
    createInitializeMintInstruction(
      yMintPubkey, // mint publicKey
      8, // decimals
      get(walletStore).publicKey as anchor.web3.PublicKey, // seller.publicKey, // mint authority
      get(walletStore).publicKey as anchor.web3.PublicKey // seller.publicKey // freeze authority
    )
  );

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection, {
    signers: [yMintKeypair]
  });
  console.log('signature:	', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);

  const yMintAccountData = await getMint(get(workspaceStore).connection, yMintPubkey);
  yMintStore.set({ address: yMintPubkey, mint: yMintAccountData });

  // console.log(
  // 	`TxHash :: ${await get(walletStore).sendTransaction(tx, $workspaceStore.connection, {
  // 		signers: [mint]
  // 	})}`
  // ); // WORKS! Need to use walletStore instead of workspaceStore!
}

async function createTokenW() {
  const tx = new Transaction().add(
    // create mint account
    SystemProgram.createAccount({
      fromPubkey: get(walletStore).publicKey as anchor.web3.PublicKey,
      newAccountPubkey: wMintPubkey,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(get(workspaceStore).connection),
      programId: TOKEN_PROGRAM_ID
    }),
    // init mint account
    createInitializeMintInstruction(
      wMintPubkey, // mint publicKey
      8, // decimals
      get(walletStore).publicKey as anchor.web3.PublicKey, // seller.publicKey, // mint authority
      get(walletStore).publicKey as anchor.web3.PublicKey // seller.publicKey // freeze authority
    )
  );

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection, {
    signers: [wMintKeypair]
  });
  console.log('signature:	', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);

  const wMintAccountData = await getMint(get(workspaceStore).connection, wMintPubkey);
  wMintStore.set({ address: wMintPubkey, mint: wMintAccountData });

  // console.log(
  // 	`TxHash :: ${await get(walletStore).sendTransaction(tx, $workspaceStore.connection, {
  // 		signers: [mint]
  // 	})}`
  // ); // WORKS! Need to use walletStore instead of workspaceStore!
}

async function createTokenZ() {
  const tx = new Transaction().add(
    // create mint account
    SystemProgram.createAccount({
      fromPubkey: get(walletStore).publicKey as anchor.web3.PublicKey,
      newAccountPubkey: zMintPubkey,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(get(workspaceStore).connection),
      programId: TOKEN_PROGRAM_ID
    }),
    // init mint account
    createInitializeMintInstruction(
      zMintPubkey, // mint publicKey
      8, // decimals
      get(walletStore).publicKey as anchor.web3.PublicKey, // seller.publicKey, // mint authority
      get(walletStore).publicKey as anchor.web3.PublicKey // seller.publicKey // freeze authority
    )
  );

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection, {
    signers: [zMintKeypair]
  });
  console.log('signature:	', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);

  const zMintAccountData = await getMint(get(workspaceStore).connection, zMintPubkey);
  zMintStore.set({ address: zMintPubkey, mint: zMintAccountData });

  // console.log(
  // 	`TxHash :: ${await get(walletStore).sendTransaction(tx, $workspaceStore.connection, {
  // 		signers: [mint]
  // 	})}`
  // ); // WORKS! Need to use walletStore instead of workspaceStore!
}

async function createAllTokens() {
  // NOTE For testing ONLY. Let's airdrop both wallets some SOL
  await get(workspaceStore).connection.confirmTransaction(
    await get(workspaceStore).connection.requestAirdrop(
      get(walletStore).publicKey as PublicKey, // seller
      LAMPORTS_PER_SOL
    )
  );
  await get(workspaceStore).connection.confirmTransaction(
    await get(workspaceStore).connection.requestAirdrop(buyer, LAMPORTS_PER_SOL)
  );

  // Create our Tokens
  await createTokenW();
  await createTokenX();
  await createTokenY();
  await createTokenZ();
}

// TODO Refactor
async function getWMintAccount() {
  const wMintAccountData = await getMint(
    get(workspaceStore).connection,
    get(wMintStore).address as anchor.web3.PublicKey
  );
  wMintStore.set({ address: wMintAccountData.address, mint: wMintAccountData });
}

async function getXMintAccount() {
  // NOTE Currently getMint() only works when I add to onclick event...
  const xMintAccountData = await getMint(
    get(workspaceStore).connection,
    get(xMintStore).address as anchor.web3.PublicKey
  );
  // xMintAccountData = await $workspaceStore.connection.getAccountInfo(xMint); // Promise
  // U: Trying out my Writable<Mint> Store
  // U: Changed it to Writable<TokenMintStoreObject> to store address separately
  xMintStore.set({ address: xMintAccountData.address, mint: xMintAccountData });
}

async function getYMintAccount() {
  const yMintAccountData = await getMint(
    get(workspaceStore).connection,
    get(yMintStore).address as anchor.web3.PublicKey
  );
  yMintStore.set({ address: yMintAccountData.address, mint: yMintAccountData });
}

async function getSellerXTokenAccountBalance() {
  const tokenAmount = await get(workspaceStore).provider?.connection.getTokenAccountBalance(
    get(setupStore).sellerXTokenATA as anchor.web3.PublicKey
  );

  get(setupStore).sellerXTokenBalance = tokenAmount?.value.uiAmount as number;
}

async function getSellerZTokenAccountBalance() {
  const tokenAmount = await get(workspaceStore).provider?.connection.getTokenAccountBalance(
    get(setupStore).sellerZTokenATA as anchor.web3.PublicKey
  );

  get(setupStore).sellerZTokenBalance = tokenAmount?.value.uiAmount as number;
}

async function getBuyerYTokenAccountBalance() {
  const tokenAmount = await get(workspaceStore).provider?.connection.getTokenAccountBalance(
    get(setupStore).buyerYTokenATA as anchor.web3.PublicKey
  );

  get(setupStore).buyerYTokenBalance = tokenAmount?.value.uiAmount as number;
}

async function getBuyerWTokenAccountBalance() {
  const tokenAmount = await get(workspaceStore).provider?.connection.getTokenAccountBalance(
    get(setupStore).buyerWTokenATA as anchor.web3.PublicKey
  );

  get(setupStore).buyerWTokenBalance = tokenAmount?.value.uiAmount as number;
}


async function getZMintAccount() {
  const zMintAccountData = await getMint(
    get(workspaceStore).connection,
    get(zMintStore).address as anchor.web3.PublicKey
  );
  zMintStore.set({ address: zMintAccountData.address, mint: zMintAccountData });
}

async function createSellerTokenXAssociatedTokenAccount() {
  // NOTE Again, can't use the handy built-in methods using spl-token w/ Anchor.
  // Instead, need to build the tx manually and send with walletStore and connection
  // sellerXToken = await createAssociatedTokenAccount(
  // 	get(workspaceStore).connection, // connection
  // 	seller.payer, // payer keypair,
  // 	xMint, // mint pubkey
  // 	seller.publicKey // owner pubkey
  // );
  // console.log(`sellerXToken: ${sellerXToken}`);

  const sellerXToken = await getAssociatedTokenAddress(
    get(xMintStore).address as anchor.web3.PublicKey, // mint
    get(walletStore).publicKey as anchor.web3.PublicKey // seller.publicKey // owner
  );
  console.log(`sellerXToken: ${sellerXToken.toBase58()}`);
  get(setupStore).sellerXTokenATA = sellerXToken;
  get(setupStore).sellerXTokenMint = get(xMintStore).address;

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      get(walletStore).publicKey as anchor.web3.PublicKey, // payer
      get(setupStore).sellerXTokenATA as anchor.web3.PublicKey, // ata
      get(setupStore).sellerWallet as anchor.web3.PublicKey, // seller.publicKey, // owner
      get(setupStore).sellerXTokenMint as anchor.web3.PublicKey // mint
    )
  );

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature: ', signature);

  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);
}

async function createSellerTokenYAssociatedTokenAccount() {
  const sellerYToken = await getAssociatedTokenAddress(
    get(yMintStore).address as anchor.web3.PublicKey, // mint
    get(walletStore).publicKey as anchor.web3.PublicKey // seller.publicKey // owner
  );
  console.log(`sellerYToken: ${sellerYToken.toBase58()}`);
  get(setupStore).sellerYTokenATA = sellerYToken;
  get(setupStore).sellerYTokenMint = get(yMintStore).address;

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      get(walletStore).publicKey as anchor.web3.PublicKey, // payer
      get(setupStore).sellerYTokenATA as anchor.web3.PublicKey, // ata
      get(setupStore).sellerWallet as anchor.web3.PublicKey, // seller.publicKey, // owner
      get(setupStore).sellerYTokenMint as anchor.web3.PublicKey // mint
    )
  );

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature:	', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  // U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
  // REF: https://stackoverflow.com/a/72333685
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);
}

async function createBuyerTokenXAssociatedTokenAccount() {
  const buyerXToken = await getAssociatedTokenAddress(
    get(xMintStore).address as anchor.web3.PublicKey, // mint
    // Q: Use global or buyerStore.walletAddress?
    // A: NOTE I have default walletAddress set to BUYER_WALLET_ADDRESS in Store!
    // U: Replacing with setupStore values
    get(setupStore).buyerWallet as anchor.web3.PublicKey //buyer.publicKey // owner
  );
  console.log(`buyerXToken: ${buyerXToken.toBase58()}`);
  get(setupStore).buyerXTokenATA = buyerXToken;
  get(setupStore).buyerXTokenMint = get(xMintStore).address;

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      get(walletStore).publicKey as anchor.web3.PublicKey, // payer
      get(setupStore).buyerXTokenATA as anchor.web3.PublicKey, // ata
      get(setupStore).buyerWallet as anchor.web3.PublicKey, //  buyer.publicKey, // owner
      get(setupStore).buyerXTokenMint as anchor.web3.PublicKey // mint
    )
  );

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature:	', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  // U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
  // REF: https://stackoverflow.com/a/72333685
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);
}

async function createBuyerTokenYAssociatedTokenAccount() {
  const buyerYToken = await getAssociatedTokenAddress(
    get(yMintStore).address as anchor.web3.PublicKey, // mint
    // Q: Use global or buyerStore.walletAddress?
    // A: NOTE I have default walletAddress set to BUYER_WALLET_ADDRESS in Store!
    // U: Replacing with setupStore values
    get(setupStore).buyerWallet as anchor.web3.PublicKey // buyer.publicKey // owner
  );
  console.log(`buyerYToken: ${buyerYToken.toBase58()}`);
  get(setupStore).buyerYTokenATA = buyerYToken;
  get(setupStore).buyerYTokenMint = get(yMintStore).address;

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      get(walletStore).publicKey as anchor.web3.PublicKey, // payer
      get(setupStore).buyerYTokenATA as anchor.web3.PublicKey, // ata
      get(setupStore).buyerWallet as anchor.web3.PublicKey, // buyer.publicKey, // owner
      get(setupStore).buyerYTokenMint as anchor.web3.PublicKey // mint
    )
  );

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature:	', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  // U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
  // REF: https://stackoverflow.com/a/72333685
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);
}

// TODO - Finish the setup for buyerW and sellerZ ATAs
// U: Added W and Z Mints to simulate a user not having an ATA
async function createBuyerTokenWAssociatedTokenAccount() {
  const buyerWToken = await getAssociatedTokenAddress(
    get(wMintStore).address as anchor.web3.PublicKey, // mint
    get(setupStore).buyerWallet as anchor.web3.PublicKey // buyer.publicKey // owner
  );
  console.log(`buyerWToken: ${buyerWToken.toBase58()}`);
  get(setupStore).buyerWTokenATA = buyerWToken;
  get(setupStore).buyerWTokenMint = get(wMintStore).address;

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      get(walletStore).publicKey as anchor.web3.PublicKey, // payer
      get(setupStore).buyerWTokenATA as anchor.web3.PublicKey, // ata
      get(setupStore).buyerWallet as anchor.web3.PublicKey, // buyer.publicKey, // owner
      get(setupStore).buyerWTokenMint as anchor.web3.PublicKey // mint
    )
  );

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature:	', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  // U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
  // REF: https://stackoverflow.com/a/72333685
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);
}

async function createSellerTokenZAssociatedTokenAccount() {
  const sellerZToken = await getAssociatedTokenAddress(
    get(zMintStore).address as anchor.web3.PublicKey, // mint
    get(setupStore).sellerWallet as anchor.web3.PublicKey // buyer.publicKey // owner
  );
  console.log(`sellerZToken: ${sellerZToken.toBase58()}`);
  get(setupStore).sellerZTokenATA = sellerZToken;
  get(setupStore).sellerZTokenMint = get(zMintStore).address;

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      get(walletStore).publicKey as anchor.web3.PublicKey, // payer
      get(setupStore).sellerZTokenATA as anchor.web3.PublicKey, // ata
      get(setupStore).sellerWallet as anchor.web3.PublicKey,
      get(setupStore).sellerZTokenMint as anchor.web3.PublicKey // mint
    )
  );

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature:	', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  // U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
  // REF: https://stackoverflow.com/a/72333685
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);
}

async function createAllBuyerAndSellerAssociatedTokenAccounts() {
  // Q: Not sure this will be needed when I implement actual wallets...
  // Q: Is there a sendAllTransactions() method?
  try {
    await createBuyerTokenXAssociatedTokenAccount();
    await createBuyerTokenYAssociatedTokenAccount();
    await createBuyerTokenWAssociatedTokenAccount();

    await createSellerTokenXAssociatedTokenAccount();
    await createSellerTokenYAssociatedTokenAccount();
    await createSellerTokenZAssociatedTokenAccount();
  } catch (error) {
    console.log(error);
  }
}

async function mintTokenXAndTransferToSellerTokenXAssociatedTokenAccount() {
  // NOTE Again, can't use the handy built-in methods using spl-token w/ Anchor.
  // Instead, need to build the tx manually and send with walletStore and connection
  // await mintToChecked(
  // 	$workspaceStore.connection, //connection,
  // 	// Q: How do I get type anchor.web3.Signer?
  // 	// NOTE payer is Keypair, but need type Signer
  // 	// REF https://stackoverflow.com/questions/70206015/solana-web3-js-getting-web3-signer-from-wallet
  // 	// A: Still don't know, BUT type Keypair seems to work...
  //  // A: CAN'T from frontend! Must compose raw TransactionInstructions
  //  // and use get(walletStore).sendTransaction()!
  // 	seller.payer, // payer, // NOTE need anchor.web3.Signer
  // 	xMint, // mint,
  // 	sellerXToken, // destination ata,
  // 	seller.publicKey, // mint authority,
  // 	1e8, // amount,
  // 	8 // decimals
  // 	// [signer1, signer2...], // only multisig account will use
  // );

  const tx = new Transaction().add(
    createMintToCheckedInstruction(
      get(setupStore).sellerXTokenMint as anchor.web3.PublicKey, // mint
      get(setupStore).sellerXTokenATA as anchor.web3.PublicKey, // destination ata
      get(walletStore).publicKey as anchor.web3.PublicKey, // mint authority
      3e8, // amount // U: Could add this as arg if needed
      get(xMintStore).mint?.decimals as number // decimals 8 // U: Could maybe reference get(xMintStore).mint.decimals
    )
  );
  // console.log(`TxHash :: ${await get(walletStore).sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

  // FIXME Look into createMintToCheckedInstruction() more I guess...
  // Q: Why don't any other async calls work after sending a transaction?
  // Doesn't work for fetching token account data, balances, etc.
  // Is it my workspaceStore connection? Only reason I consider that is because
  // I can't use it to sendTransaction() for some reason...
  // console.log(
  // 	`sellerXToken.balance: ${await $workspaceStore.connection
  // 		.getTokenAccountBalance(sellerXToken)
  // 		.then((r) => r.value.amount)}`
  // ); // U: Always returns 0!

  // U: Gonna see if saving the signature etc. helps...
  // SOLVED! By awaiting the sendTransaction() and storing in a variable,
  // this seems to have fixed the issue!
  // Q: Do I need to getBalance() or something and update sellerStore?
  // A: NOPE! Just saving the signature (above) seems to resolve!
  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature: ', signature);
  // NOTE Must call confirmTransaction() or else get TokenAccountNotFoundError
  // Q: Why do I get TokenAccountNotFoundError if I DON'T call confirmTransaction()?
  // U: New signature for confirmTransaction uses BlockHeightBasedTransactionConfirmationStrategy
  // REF: https://stackoverflow.com/a/72333685
  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);

  // Get updated xMint data and update xMintStore for Supply UI
  // NOTE Using helper to fetch and update Store
  await getXMintAccount();
}

async function mintTokenYAndTransferToBuyerTokenYAssociatedTokenAccount() {
  const tx = new Transaction().add(
    createMintToCheckedInstruction(
      get(setupStore).buyerYTokenMint as anchor.web3.PublicKey, // mint
      get(setupStore).buyerYTokenATA as anchor.web3.PublicKey, // destination ata
      get(walletStore).publicKey as anchor.web3.PublicKey, // mint authority
      3e8, // amount
      get(yMintStore).mint?.decimals as number // decimals 8 // U: Could maybe reference get(yMintStore).mint.decimals
    )
  );
  // console.log(`TxHash :: ${await get(walletStore).sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

  // Q: Why don't any other async calls work after sending a transaction?
  // Doesn't work for fetching token account data, balances, etc.
  // Is it my workspaceStore connection? Only reason I consider that is because
  // I can't use it to sendTransaction() for some reason...
  // console.log(
  // 	`buyerYToken.balance: ${await $workspaceStore.connection
  // 		.getTokenAccountBalance(buyerYToken)
  // 		.then((r) => r.value.amount)}`
  // );
  // U: Gonna see if saving the signature etc. helps...
  // SOLVED! By awaiting the sendTransaction() and storing in a variable,
  // this seems to have fixed the issue!
  // Q: Do I need to getBalance() or something and update sellerStore?
  // A: NOPE! Just saving the signature (above) seems to resolve!
  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature: ', signature);

  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);

  // Get updated mint account data and update Store for Supply UI
  // NOTE Using helper to fetch and update Store
  await getYMintAccount();
}

// U: Need to mint supply to sellerZ and buyerW
async function mintTokenZAndTransferToSellerTokenZAssociatedTokenAccount() {
  const tx = new Transaction().add(
    createMintToCheckedInstruction(
      get(setupStore).sellerZTokenMint as anchor.web3.PublicKey, // mint
      get(setupStore).sellerZTokenATA as anchor.web3.PublicKey, // destination ata
      get(walletStore).publicKey as anchor.web3.PublicKey, // mint authority
      3e8, // amount
      get(zMintStore).mint?.decimals as number // decimals 8 // U: Could maybe reference get(yMintStore).mint.decimals
    )
  );
  // console.log(`TxHash :: ${await get(walletStore).sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature: ', signature);

  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);

  // Get updated mint account data and update Store for Supply UI
  // NOTE Using helper to fetch and update Store
  await getZMintAccount();
}

async function mintTokenWAndTransferToBuyerTokenWAssociatedTokenAccount() {
  const tx = new Transaction().add(
    createMintToCheckedInstruction(
      get(setupStore).buyerWTokenMint as anchor.web3.PublicKey, // mint
      get(setupStore).buyerWTokenATA as anchor.web3.PublicKey, // destination ata
      get(walletStore).publicKey as anchor.web3.PublicKey, // mint authority
      3e8, // amount
      get(wMintStore).mint?.decimals as number // decimals 8 // U: Could maybe reference get(yMintStore).mint.decimals
    )
  );
  // console.log(`TxHash :: ${await get(walletStore).sendTransaction(tx, $workspaceStore.connection)}`); // WORKS! Need to use walletStore instead of workspaceStore!

  const signature = await get(walletStore).sendTransaction(tx, get(workspaceStore).connection);
  console.log('signature: ', signature);

  const latestBlockhash = await get(workspaceStore).connection.getLatestBlockhash();
  const confirmedTx = await get(workspaceStore).connection.confirmTransaction({
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature: signature
  });
  console.log('confirmedTx: ', confirmedTx);

  // Get updated mint account data and update Store for Supply UI
  // NOTE Using helper to fetch and update Store
  await getWMintAccount();
}

async function mintAllTokensAndTransferToAssociatedTokenAccounts() {
  // TODO Refactor possibly using Promise.all()
  try {
    await mintTokenXAndTransferToSellerTokenXAssociatedTokenAccount();
    await mintTokenZAndTransferToSellerTokenZAssociatedTokenAccount();
    await mintTokenYAndTransferToBuyerTokenYAssociatedTokenAccount();
    await mintTokenWAndTransferToBuyerTokenWAssociatedTokenAccount();

    await getSellerXTokenAccountBalance();
    await getSellerZTokenAccountBalance();
    await getBuyerYTokenAccountBalance();
    await getBuyerWTokenAccountBalance();
  } catch (error) {
    console.log(error);
  }
  // FIXME buyerYToken Balance ALWAYS 0! I have to separately
  // click a getBuyerYTokenAccountBalance button.
  // U: I can also get balance w/: spl-token balance --address <buyerYToken>
  // Q: What about calling directly in here?
  // A: Nope.
  // Q: Would Promise.all() be more efficient in this case?
  // U: Doesn't seem to make a difference.
  // SOLVED! By awaiting the sendTransaction() and storing in a signature variable,
  // try {
  // 	await mintTokenXAndTransferToSellerTokenXAssociatedTokenAccount();
  // 	await mintTokenYAndTransferToBuyerTokenYAssociatedTokenAccount();
  // 	const sellerXTokenBalancePromise =
  // 		$workspaceStore.provider?.connection.getTokenAccountBalance(sellerXToken);
  // 	const buyerYTokenBalancePromise =
  // 		$workspaceStore.provider?.connection.getTokenAccountBalance(buyerYToken);
  // 	const tokenBalances = await Promise.all([
  // 		sellerXTokenBalancePromise,
  // 		buyerYTokenBalancePromise
  // 	]);
  // 	console.log(tokenBalances);
  // } catch (error) {
  // 	console.log(error);
  // }
}

async function handleCreateCustomProgramAccount() {
  if (get(customProgramStore).pda !== null) {
    notificationStore.add({ type: 'error', message: `Data account already exists!` });
    console.log('error', 'Create custom program failed!');
    return;
  }

  let tx: anchor.web3.TransactionSignature = '';

  try {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from(constants.CUSTOM_PROGRAM_SEED_PREFIX)],
      get(workspaceStore).program?.programId as anchor.web3.PublicKey
    );

    tx = (await get(workspaceStore).program?.methods
      .createCustomProgram()
      .accounts({
        customProgram: pda,
        authority: constants.SELLER_WALLET_ADDRESS,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([])
      .rpc()) as string;

    console.log('TxHash ::', tx);

    // Update state
    customProgramStore.getCustomProgramAccount(pda);

    // Add to notificationStore
    notificationStore.add({
      type: 'success',
      message: 'Transaction successful!',
      txid: tx
    });
  } catch (error: any) {
    // Add to notificationStore
    notificationStore.add({
      type: 'error',
      message: 'Transaction failed!',
      description: error?.message,
      txid: tx
    });
    console.log('error', `Transaction failed! ${error?.message}`, tx);
  }
}


// U: Create one BIG setup() that does it all
export async function setupDevelopment() {
  try {
    await handleCreateCustomProgramAccount();
    await createAllTokens();
    await createAllBuyerAndSellerAssociatedTokenAccounts();
    await mintAllTokensAndTransferToAssociatedTokenAccounts();

  } catch (error) {
    console.log(error);
  }
}

