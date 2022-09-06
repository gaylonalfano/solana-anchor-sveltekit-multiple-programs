import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import * as BufferLayout from "@solana/buffer-layout";
import { Buffer } from "buffer";
import fs from "mz/fs";

// Testing TX dump:
// 49wxwrfGq8VVt94oCWy1Le7tdsRZiUkdYM7C5uQh3ETHP5EKY648cFFi9jBEtYjYTcfE9cuJWiwuAPrmnrnW3z9r

export async function createKeypairFromFile(
  filepath: string
): Promise<anchor.web3.Keypair> {
  const secretKeyString = await fs.readFile(filepath, {
    encoding: "utf8",
  });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return anchor.web3.Keypair.fromSecretKey(secretKey);
}

// Alternate syntax:
// export function createKeypairFromFile(filepath: string): Keypair {
//   return Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(fs.readFileSync(filepath, "utf-8")))
//   );
// }

export async function sendLamports(
  from: Keypair,
  to: PublicKey,
  amount: number
) {
  let data = Buffer.alloc(8); // 8 bytes
  BufferLayout.ns64("value").encode(amount, data);

  let instruction;
}

export async function getStringForInstruction(
  operation: number,
  operation_value: number
) {
  if (operation == 0) {
    return "reset the example";
  } else if (operation == 1) {
    return `add: ${operation_value}`;
  } else if (operation == 2) {
    return `subtract: ${operation_value}`;
  } else if (operation == 3) {
    return `multiply by: ${operation_value}`;
  }
}

/*
 * Converts Instructions Data Struct into a bytes representation
 * so that Borsh can serialize its contents into BPF format
 */

export async function createCalculatorInstructionsBuffer(
  operation: number,
  operation_value: number
): Promise<Buffer> {
  // Define the layout/schema of the instructions struct
  const bufferLayout: BufferLayout.Structure<any> = BufferLayout.struct([
    BufferLayout.u32("operation"),
    BufferLayout.u32("operation_value"),
  ]);

  // Allocate the size of the buffer based on bufferLayout schema
  const CALCULATOR_INSTRUCTIONS_SIZE = bufferLayout.span;
  const buffer = Buffer.alloc(CALCULATOR_INSTRUCTIONS_SIZE);

  // Writes the data into the buffer
  bufferLayout.encode(
    {
      operation: operation,
      operation_value: operation_value,
    },
    buffer
  );

  return buffer;
}

// UPDATE 8/18: NOT Needed! This may not even be needed when using Anchor, since Anchor
// automatically creates the IDL and types for the Client! I finally got the
// custom Instruction Data struct (LedgerInstructions) to work, and I didn't
// even need to use this helper function.
// NOTE I DID notice the types used camelCase instead of snake_case, which also
// caused me some errors! But AGAIN, this Buffer doesn't seem necessary!
export async function createLedgerInstructionsBuffer(
  operation: number,
  operation_value: number
): Promise<Buffer> {
  // Define the layout/schema of the instructions struct
  // TODO Add some logs to see what data gets packed back inside the Buffer
  // since I'm seeing LedgerInstructions { operation: 0, operation_value: 0 }
  // when testing...
  const bufferLayout: BufferLayout.Structure<any> = BufferLayout.struct([
    BufferLayout.u32("operation"),
    BufferLayout.u32("operation_value"),
  ]);

  // Allocate the size of the buffer based on bufferLayout schema
  const LEDGER_INSTRUCTIONS_SIZE = bufferLayout.span;
  const buffer = Buffer.alloc(LEDGER_INSTRUCTIONS_SIZE);

  // Writes the data into the buffer
  bufferLayout.encode(
    {
      operation: operation,
      operation_value: operation_value,
    },
    buffer
  );

  // console.log("createLedgerInstructionsBuffer: ", buffer);
  return buffer;
}
