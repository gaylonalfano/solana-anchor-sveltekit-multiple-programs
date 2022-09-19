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
          "name": "xMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sellerXToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowedXToken",
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
          "name": "xAmount",
          "type": "u64"
        },
        {
          "name": "yAmount",
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
          "name": "escrowedXToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerYToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerXToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerYToken",
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
          "name": "escrowedXToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerXToken",
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
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "escrowedXToken",
            "type": "publicKey"
          },
          {
            "name": "yMint",
            "type": "publicKey"
          },
          {
            "name": "yAmount",
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
          "name": "xMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sellerXToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrow",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowedXToken",
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
          "name": "xAmount",
          "type": "u64"
        },
        {
          "name": "yAmount",
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
          "name": "escrowedXToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerYToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerXToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerYToken",
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
          "name": "escrowedXToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerXToken",
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
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "escrowedXToken",
            "type": "publicKey"
          },
          {
            "name": "yMint",
            "type": "publicKey"
          },
          {
            "name": "yAmount",
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
