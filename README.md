# NodeJS Reddit TipBot

This repository contains a Node.js-based Reddit TipBot designed to facilitate tipping users with Cannacoins (CC) on the Reddit platform. The tip bot allows users to send and receive CC tokens as tips for valuable contributions or as a way to encourage engagement within the community.

## Getting started?
Take a look at our [Wiki](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/wiki) for more info on usage and installation.

## Features
[![Node.js CI](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/actions/workflows/node.js.yml/badge.svg)](https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot/actions/workflows/node.js.yml)

- **Tip Command**: Users can tip each other by replying to a comment or post with a specific command, such as `!canna 100 `, where `100` represents the amount.
- **Balance Inquiry**: Users can check their current balance by using the `balance` command.
- **Deposit Address**: Users can get the memo and address used to `deposit` funds into their account.
- **Withdrawal**: Users can withdraw their CC tokens to an external wallet address by using the `send` command.

## Installation

To install and set up the NodeJS Reddit TipBot locally, follow these steps:

1. Clone the repository:
```git clone https://github.com/Stellar-Cannacoin/NodeJS_Reddit_TipBot.git```
2. Install the dependencies: `cd NodeJS_Reddit_TipBot && npm install`

3. Configure the application:

- Rename the `config.example.json` file to `config.json`.
- Open `config.json` and provide the required configuration details, including your Reddit API credentials, database connection details, and token settings.

4. Set up the database:

- Create a new database (e.g., PostgreSQL) and update the connection details in the `config.json` file.

5. Run the application: `npm start`

The NodeJS Reddit TipBot should now be running on your local machine.
  
## Usage

Once the application is up and running, the Reddit TipBot will automatically monitor comments and posts within the specified subreddit(s) for tip commands. Users can interact with the bot by issuing various commands in the subreddit where it is active.

### Available Commands

- **Tip**: To send a tip to another user, reply to their comment or post with the command `!canna AMOUNT SYMBOL`. Replace `AMOUNT` with the desired number of tokens to be sent and `SYMBOL` with the token symbol (e.g., `CC` for Cannacoins).

- **Balance**: To check your current balance, use the command `!balance`.

- **Deposit**: To generate a unique deposit address, use the command `!deposit`. The bot will reply with a unique address where others can send you tips or deposits.

- **Withdraw**: To withdraw your tokens to an external wallet address, use the command `!send AMOUNT ADDRESS`. Replace `ADDRESS` with the recipient's wallet address, `AMOUNT` with the number of tokens to be withdrawn.


## Contributing

Contributions to the NodeJS Reddit TipBot project are welcome. If you have any bug fixes, enhancements, or new features to propose, please follow these steps:

1. Fork the repository.
2. Create a new branch with a descriptive name.
3. Make your changes and ensure the code follows the project's coding conventions.
4. Commit and push your changes to your forked repository.
5. Submit a pull request, describing your changes and the motivation behind them.

Please note that all contributions are subject to




