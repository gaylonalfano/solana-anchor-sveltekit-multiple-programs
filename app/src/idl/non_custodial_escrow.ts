export type NonCustodialEscrow = {
  "version": "0.1.0",
  "name": "non_custodial_escrow",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "outMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "inMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sellerOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowedOutTokenAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "outAmount",
          "type": "u64"
        },
        {
          "name": "inAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "accept",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowedOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerInTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerInTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cancel",
      "accounts": [
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowedOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "escrowedOutTokenAccount",
            "type": "publicKey"
          },
          {
            "name": "outMint",
            "type": "publicKey"
          },
          {
            "name": "outAmount",
            "type": "u64"
          },
          {
            "name": "inMint",
            "type": "publicKey"
          },
          {
            "name": "inAmount",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "hasExchanged",
            "type": "bool"
          }
        ]
      }
    }
  ]
};

export const IDL: NonCustodialEscrow = {
  "version": "0.1.0",
  "name": "non_custodial_escrow",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "outMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "inMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sellerOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowedOutTokenAccount",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "outAmount",
          "type": "u64"
        },
        {
          "name": "inAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "accept",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowedOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerInTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerInTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cancel",
      "accounts": [
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowedOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerOutTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "escrowedOutTokenAccount",
            "type": "publicKey"
          },
          {
            "name": "outMint",
            "type": "publicKey"
          },
          {
            "name": "outAmount",
            "type": "u64"
          },
          {
            "name": "inMint",
            "type": "publicKey"
          },
          {
            "name": "inAmount",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "hasExchanged",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
