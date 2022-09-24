import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { OnchainVoting } from "../target/types/onchain_voting";
import { expect } from "chai";
import { BN } from "bn.js";
