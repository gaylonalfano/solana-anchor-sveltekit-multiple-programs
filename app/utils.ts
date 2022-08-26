import { Keypair, PublicKey } from '@solana/web3.js';
import fs from 'mz/fs';
import * as BufferLayout from '@solana/buffer-layout';
import { Buffer } from 'buffer';

export async function createKeypairFromFile(filepath: string): Promise<Keypair> {
	console.log('Creating Web3 Keypair from JSON file using filepath: ');
	console.log(`   ${filepath}`);
	// Takes a filepath to a JSON keypair and convert into Keypair object
	const secretKeyString = await fs.readFile(filepath, { encoding: 'utf8' });
	const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
	return Keypair.fromSecretKey(secretKey);
}

// Alternate syntax:
// export function createKeypairFromFile(filepath: string): Keypair {
//   return Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(fs.readFileSync(filepath, "utf-8")))
//   );
// }

export async function sendLamports(from: Keypair, to: PublicKey, amount: number) {
	let data = Buffer.alloc(8); // 8 bytes
	BufferLayout.ns64('value').encode(amount, data);

	let instruction;
}

export async function getStringForInstruction(operation: number, operation_value: number) {
	if (operation == 0) {
		return 'reset the example';
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
		BufferLayout.u32('operation'),
		BufferLayout.u32('operation_value')
	]);

	// Allocate the size of the buffer based on bufferLayout schema
	const CALCULATOR_INSTRUCTIONS_SIZE = bufferLayout.span;
	const buffer = Buffer.alloc(CALCULATOR_INSTRUCTIONS_SIZE);

	// Writes the data into the buffer
	bufferLayout.encode(
		{
			operation: operation,
			operation_value: operation_value
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
		BufferLayout.u32('operation'),
		BufferLayout.u32('operation_value')
	]);

	// Allocate the size of the buffer based on bufferLayout schema
	const LEDGER_INSTRUCTIONS_SIZE = bufferLayout.span;
	const buffer = Buffer.alloc(LEDGER_INSTRUCTIONS_SIZE);

	// Writes the data into the buffer
	bufferLayout.encode(
		{
			operation: operation,
			operation_value: operation_value
		},
		buffer
	);

	// console.log("createLedgerInstructionsBuffer: ", buffer);
	return buffer;
}
