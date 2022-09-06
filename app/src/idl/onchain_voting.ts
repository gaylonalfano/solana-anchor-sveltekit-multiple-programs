export type OnchainVoting = {
  "version": "0.1.0",
  "name": "onchain_voting",
  "docs": [
    "The Program ID can be found in /target/idl/[your_project_name].json",
    "This is where the magic happens. We define our program!",
    "Each method inside here defines an RPC request handler (aka instruction handler) which can be invoked by clients"
  ],
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "The first parameter for every RPC handler is the Context struct. We define Initialize and Vote below at #[derive(Accounts)]",
        "When `initalize` is called, we'll store the `vote_account_bump` that was used to derive our PDA so that others can easily derive it on their clients",
        "We no longer have to manually set both `crunchy` and `smooth` to 0 because we opted to use the `default` trait on our VoteState struct at the bottom of this file",
        "This a Rust trait that is used via #[derive(Default)]. More info on that here: https://doc.rust-lang.org/std/default/trait.Default.html"
      ],
      "accounts": [
        {
          "name": "voteAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The #[account(...)] macro enforces that our `vote_account` owned by the currently executing program.",
            "",
            "We mark `vote_account` with the `init` attribute, which creates a new account owned by the program",
            "When using `init`, we must also provide:",
            "`payer`, which funds the account creation",
            "and the `system_program` which is required by the runtime",
            "",
            "If our account were to use variable length types like String or Vec we would also need to allocate `space` to our account",
            "Since we are only dealing with fixed-sized integers, we can leave out `space` and Anchor will calculate this for us automatically",
            "",
            "`seeds` and `bump` tell us that our `vote_account` is a PDA that can be derived from their respective values",
            "Account<'info, VoteState> tells us that it should be deserialized to the VoteState struct defined below at #[account]"
          ]
        },
        {
          "name": "user",
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
      "name": "vote",
      "docs": [
        "All our account validation logic is handled below at the #[account(...)] macros, letting us just focus our business logic"
      ],
      "accounts": [
        {
          "name": "voteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "voteType",
          "type": {
            "defined": "VoteType"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "voteState",
      "docs": [
        "Here we define what the state of our `vote_account` looks like",
        "We define a struct with three public properties: crunchy, smooth, and bump",
        "The `crunchy` and `smooth` properties will keep track of their respective votes as unsigned 64-bit integers",
        "`bump` will store the `vote_account_bump` we passed in when we initialized our program",
        "This `bump` combined with our static \"vote_account\" seed will make it easy for anyone to derive the same PDA we use use to keep track of our state",
        "All of this will be passed inside each Transaction Instruction to record votes as they occur"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "gmi",
            "type": "u64"
          },
          {
            "name": "ngmi",
            "type": "u64"
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
      "name": "VoteType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "GMI"
          },
          {
            "name": "NGMI"
          }
        ]
      }
    }
  ]
};

export const IDL: OnchainVoting = {
  "version": "0.1.0",
  "name": "onchain_voting",
  "docs": [
    "The Program ID can be found in /target/idl/[your_project_name].json",
    "This is where the magic happens. We define our program!",
    "Each method inside here defines an RPC request handler (aka instruction handler) which can be invoked by clients"
  ],
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "The first parameter for every RPC handler is the Context struct. We define Initialize and Vote below at #[derive(Accounts)]",
        "When `initalize` is called, we'll store the `vote_account_bump` that was used to derive our PDA so that others can easily derive it on their clients",
        "We no longer have to manually set both `crunchy` and `smooth` to 0 because we opted to use the `default` trait on our VoteState struct at the bottom of this file",
        "This a Rust trait that is used via #[derive(Default)]. More info on that here: https://doc.rust-lang.org/std/default/trait.Default.html"
      ],
      "accounts": [
        {
          "name": "voteAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The #[account(...)] macro enforces that our `vote_account` owned by the currently executing program.",
            "",
            "We mark `vote_account` with the `init` attribute, which creates a new account owned by the program",
            "When using `init`, we must also provide:",
            "`payer`, which funds the account creation",
            "and the `system_program` which is required by the runtime",
            "",
            "If our account were to use variable length types like String or Vec we would also need to allocate `space` to our account",
            "Since we are only dealing with fixed-sized integers, we can leave out `space` and Anchor will calculate this for us automatically",
            "",
            "`seeds` and `bump` tell us that our `vote_account` is a PDA that can be derived from their respective values",
            "Account<'info, VoteState> tells us that it should be deserialized to the VoteState struct defined below at #[account]"
          ]
        },
        {
          "name": "user",
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
      "name": "vote",
      "docs": [
        "All our account validation logic is handled below at the #[account(...)] macros, letting us just focus our business logic"
      ],
      "accounts": [
        {
          "name": "voteAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "voteType",
          "type": {
            "defined": "VoteType"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "voteState",
      "docs": [
        "Here we define what the state of our `vote_account` looks like",
        "We define a struct with three public properties: crunchy, smooth, and bump",
        "The `crunchy` and `smooth` properties will keep track of their respective votes as unsigned 64-bit integers",
        "`bump` will store the `vote_account_bump` we passed in when we initialized our program",
        "This `bump` combined with our static \"vote_account\" seed will make it easy for anyone to derive the same PDA we use use to keep track of our state",
        "All of this will be passed inside each Transaction Instruction to record votes as they occur"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "gmi",
            "type": "u64"
          },
          {
            "name": "ngmi",
            "type": "u64"
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
      "name": "VoteType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "GMI"
          },
          {
            "name": "NGMI"
          }
        ]
      }
    }
  ]
};
