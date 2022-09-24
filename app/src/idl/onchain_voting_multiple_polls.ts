export type OnchainVotingMultiplePolls = {
  "version": "0.1.0",
  "name": "onchain_voting_multiple_polls",
  "docs": [
    "The Program ID can be found in /target/idl/[your_project_name].json",
    "This is where the magic happens. We define our program!",
    "Each method inside here defines an RPC request handler (aka instruction handler) which can be invoked by clients"
  ],
  "instructions": [
    {
      "name": "createCustomProgram",
      "accounts": [
        {
          "name": "customProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createProfile",
      "accounts": [
        {
          "name": "profile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "customProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "handle",
          "type": "string"
        },
        {
          "name": "displayName",
          "type": "string"
        }
      ]
    },
    {
      "name": "createPoll",
      "accounts": [
        {
          "name": "poll",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The #[account(...)] macro enforces that our `poll_account` owned by the currently executing program.",
            "",
            "We mark `poll_account` with the `init` attribute, which creates a new account owned by the program",
            "When using `init`, we must also provide:",
            "`payer`, which funds the account creation",
            "and the `system_program` which is required by the runtime",
            "",
            "If our account were to use variable length types like String or Vec we would also need to allocate `space` to our account",
            "Since we are only dealing with fixed-sized integers, we can leave out `space` and Anchor will calculate this for us automatically",
            "",
            "`seeds` and `bump` tell us that our `poll_account` is a PDA that can be derived from their respective values",
            "Account<'info, Poll> tells us that it should be deserialized to the Poll struct defined below at #[account]"
          ]
        },
        {
          "name": "profile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "customProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "optionADisplayLabel",
          "type": "string"
        },
        {
          "name": "optionBDisplayLabel",
          "type": "string"
        }
      ]
    },
    {
      "name": "createVote",
      "accounts": [
        {
          "name": "vote",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poll",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "profile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "customProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "voteOption",
          "type": {
            "defined": "VoteOption"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "customProgram",
      "docs": [
        "This `bump` combined with our static \"poll_account\" seed will make it easy for anyone to derive the same PDA we use use to keep track of our state",
        "All of this will be passed inside each Transaction Instruction to record votes as they occur"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalPollCount",
            "type": "u64"
          },
          {
            "name": "totalProfileCount",
            "type": "u64"
          },
          {
            "name": "totalVoteCount",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "poll",
      "docs": [
        "This `bump` combined with our static \"poll_account\" seed will make it easy for anyone to derive the same PDA we use use to keep track of our state",
        "All of this will be passed inside each Transaction Instruction to record votes as they occur"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pollNumber",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "optionADisplayLabel",
            "type": "string"
          },
          {
            "name": "optionBDisplayLabel",
            "type": "string"
          },
          {
            "name": "optionACount",
            "type": "u64"
          },
          {
            "name": "optionBCount",
            "type": "u64"
          },
          {
            "name": "voteCount",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "profile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "profileNumber",
            "type": "u64"
          },
          {
            "name": "handle",
            "type": "string"
          },
          {
            "name": "displayName",
            "type": "string"
          },
          {
            "name": "pollCount",
            "type": "u64"
          },
          {
            "name": "voteCount",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vote",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "profilePubkey",
            "type": "publicKey"
          },
          {
            "name": "pollPubkey",
            "type": "publicKey"
          },
          {
            "name": "voteNumber",
            "type": "u64"
          },
          {
            "name": "voteOption",
            "type": {
              "defined": "VoteOption"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "VoteOption",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "A"
          },
          {
            "name": "B"
          }
        ]
      }
    }
  ]
};

export const IDL: OnchainVotingMultiplePolls = {
  "version": "0.1.0",
  "name": "onchain_voting_multiple_polls",
  "docs": [
    "The Program ID can be found in /target/idl/[your_project_name].json",
    "This is where the magic happens. We define our program!",
    "Each method inside here defines an RPC request handler (aka instruction handler) which can be invoked by clients"
  ],
  "instructions": [
    {
      "name": "createCustomProgram",
      "accounts": [
        {
          "name": "customProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createProfile",
      "accounts": [
        {
          "name": "profile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "customProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "handle",
          "type": "string"
        },
        {
          "name": "displayName",
          "type": "string"
        }
      ]
    },
    {
      "name": "createPoll",
      "accounts": [
        {
          "name": "poll",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The #[account(...)] macro enforces that our `poll_account` owned by the currently executing program.",
            "",
            "We mark `poll_account` with the `init` attribute, which creates a new account owned by the program",
            "When using `init`, we must also provide:",
            "`payer`, which funds the account creation",
            "and the `system_program` which is required by the runtime",
            "",
            "If our account were to use variable length types like String or Vec we would also need to allocate `space` to our account",
            "Since we are only dealing with fixed-sized integers, we can leave out `space` and Anchor will calculate this for us automatically",
            "",
            "`seeds` and `bump` tell us that our `poll_account` is a PDA that can be derived from their respective values",
            "Account<'info, Poll> tells us that it should be deserialized to the Poll struct defined below at #[account]"
          ]
        },
        {
          "name": "profile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "customProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "optionADisplayLabel",
          "type": "string"
        },
        {
          "name": "optionBDisplayLabel",
          "type": "string"
        }
      ]
    },
    {
      "name": "createVote",
      "accounts": [
        {
          "name": "vote",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poll",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "profile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "customProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "voteOption",
          "type": {
            "defined": "VoteOption"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "customProgram",
      "docs": [
        "This `bump` combined with our static \"poll_account\" seed will make it easy for anyone to derive the same PDA we use use to keep track of our state",
        "All of this will be passed inside each Transaction Instruction to record votes as they occur"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalPollCount",
            "type": "u64"
          },
          {
            "name": "totalProfileCount",
            "type": "u64"
          },
          {
            "name": "totalVoteCount",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "poll",
      "docs": [
        "This `bump` combined with our static \"poll_account\" seed will make it easy for anyone to derive the same PDA we use use to keep track of our state",
        "All of this will be passed inside each Transaction Instruction to record votes as they occur"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pollNumber",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "optionADisplayLabel",
            "type": "string"
          },
          {
            "name": "optionBDisplayLabel",
            "type": "string"
          },
          {
            "name": "optionACount",
            "type": "u64"
          },
          {
            "name": "optionBCount",
            "type": "u64"
          },
          {
            "name": "voteCount",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "profile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "profileNumber",
            "type": "u64"
          },
          {
            "name": "handle",
            "type": "string"
          },
          {
            "name": "displayName",
            "type": "string"
          },
          {
            "name": "pollCount",
            "type": "u64"
          },
          {
            "name": "voteCount",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vote",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "profilePubkey",
            "type": "publicKey"
          },
          {
            "name": "pollPubkey",
            "type": "publicKey"
          },
          {
            "name": "voteNumber",
            "type": "u64"
          },
          {
            "name": "voteOption",
            "type": {
              "defined": "VoteOption"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "VoteOption",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "A"
          },
          {
            "name": "B"
          }
        ]
      }
    }
  ]
};
