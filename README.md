Credit to [Jrpl/Bitburner-Scripts](https://github.com/Jrpl/Bitburner-Scripts) for sparking my interest.</br>
Repository for my Bitburner scripts and to learn Git and GitHub.

# Bitburner-llm
1) Listed below are the collection of scripts written for the game [Bitburner](https://store.steampowered.com/app/1812820/Bitburner/).
2) Scripts listed require that you are using [ns2](https://bitburner.readthedocs.io/en/latest/netscript/netscriptjs.html) instead of [ns1](https://bitburner.readthedocs.io/en/latest/netscript/netscript1.html).
3) Scripts are authored by a learner developing their scripting skills, with help from LLMs.

# BitBurner Automation Suite
This is a comprehensive, multi-script suite for BitBurner designed to automate hacking and stock market trading from a single command. It provides a unified dashboard in your terminal to monitor all operations and profit streams in real-time.

## Features
- **One-Command Start**: Launch the entire automation suite with a single script.
- **Automated Hacking Network**: Automatically discovers, roots, and deploys hacking scripts across all available servers.
- **Automated Stock Trading**: Runs a background script to buy and sell stocks based on market forecasts.
- **Unified Dashboard**: A single, clean report in the terminal shows combined and individual P/L from both hacking and stocks, along with network status.
- **Resource Aware**: Intelligently launches utility scripts before consuming all RAM with hacking operations.

## Scripts
This suite consists of three core scripts that work together:
1.  **`start.js`**
    - The **master controller** and main entry point.
    - Launches all other scripts.
    - Scans and takes over the network.
    - Gathers data from other scripts and prints the unified status report to the terminal.

2.  **`basic-hack.js`**
    - A simple, lightweight script for hacking, weakening, and growing a target server.
    - This script is deployed by `start.js` onto every available rooted server.

3.  **`stonks.js`**
    - A silent, background stock trader.
    - It continuously evaluates the market, buying promising stocks and selling underperforming ones.
    - It reports its financial data back to `start.js` via a port without printing to the terminal itself.

## Setup & Usage

### Prerequisites

To use the stock market features, you must first purchase the following in-game:
- WSE Account
- TIX API Access
- 4S Market Data
- 4S Market Data TIX API Access

### Installation

1.  In the game, create three new script files on your `home` server:
    - `start.js`
    - `basic-hack.js`
    - `stonks.js`
2.  Copy and paste the corresponding code into each file.

### Running the Suite

To start the entire operation, simply run the master script from your `home` server's terminal:
