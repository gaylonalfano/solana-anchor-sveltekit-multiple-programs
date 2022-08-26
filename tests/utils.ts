import * as anchor from "@project-serum/anchor";
import fs from "mz/fs";

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
