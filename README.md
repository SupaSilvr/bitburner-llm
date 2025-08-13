Credit to [Jrpl/Bitburner-Scripts](https://github.com/Jrpl/Bitburner-Scripts) for sparking my interest.</br>
Repository for my Bitburner scripts and to learn Git, GitHub & LLMs.

# Bitburner-llm
1) Listed below are the collection of scripts written for the game [Bitburner](https://store.steampowered.com/app/1812820/Bitburner/).
2) Scripts listed require that you are using [ns2](https://bitburner.readthedocs.io/en/latest/netscript/netscriptjs.html) instead of [ns1](https://bitburner.readthedocs.io/en/latest/netscript/netscript1.html).
3) Scripts are authored by a learner developing their scripting skills, with help from LLMs.

# 🐝 Hive Mind OS - A Bitburner Automation Suite
A fully automated script suite for the game Bitburner, designed for maximum efficiency and self-sufficiency. This system operates as a "hive mind," where a central orchestrator (start.js) manages a fleet of worker scripts to fully leverage the network.

## Features
- 🤖 Fully Automated: Requires zero manual intervention after initial launch.
- 🎯 Dynamic Targeting: Automatically analyzes and targets the most profitable server on the network.
- 🌐 Network-Wide RAM Utilization: Uses 100% of the available RAM on your home computer, purchased servers, and all pwned servers.
- 💵 Smart Server Purchasing: Automatically saves up for and purchases new servers that meet a user-defined minimum RAM requirement.
- 🗑️ Automatic Server Culling: Automatically deletes underpowered purchased servers to make room for more powerful ones.
- 📡 Themed Status Reports: Provides periodic, thematic updates to the terminal on fleet status, current operations, and time remaining.

## Scripts
This suite consists of three core scripts that work together:
1.  **`start.js`**
    - start.js: The main orchestrator script (the "Hive Queen"). This is the only script you need to run.
2.  **`hack.js`**
    - hack.js: A lightweight worker script that performs a hack() operation.
3.  **`grow.js`** 
    - grow.js: A lightweight worker script that performs a grow() operation.
4.  **`weaken.js`** 
    - weaken.js: A lightweight worker script that performs a weaken() operation.

## Setup & Usage

### Installation

1.  In the game, create four new script files on your `home` server:
    - `start.js`
    - `hack.js`
    - `grow.js`
    - `weaken.js`
2.  Copy and paste the corresponding code into each file.

### Running the Suite

To start the entire operation, simply run the master script from your `home` server's terminal:
