Credit to [Jrpl/Bitburner-Scripts](https://github.com/Jrpl/Bitburner-Scripts) for sparking my interest.</br>
Repository for my Bitburner scripts and to learn Git, GitHub & LLMs.

# Bitburner-llm
1) Listed below are the collection of scripts written for the game [Bitburner](https://store.steampowered.com/app/1812820/Bitburner/).
2) Scripts listed require that you are using [ns2](https://bitburner.readthedocs.io/en/latest/netscript/netscriptjs.html) instead of [ns1](https://bitburner.readthedocs.io/en/latest/netscript/netscript1.html).
3) Scripts are authored by a learner developing their scripting skills, with help from LLMs.

# 🐝 Hive Mind OS - A Bitburner Automation Suite
A fully automated script suite for the game Bitburner, designed for maximum efficiency and self-sufficiency. This system operates as a "hive mind," where a central orchestrator (start.js) manages a fleet of worker scripts to fully leverage the network.

## Features
- 🚀 Adaptive Startup: A lightweight launcher (start.js) detects your available RAM and runs either a basic money-making script (for new players) or the full controller.
- 🧠 Modular Design: The system is broken into specialized scripts (controller, upgrade manager, support manager) that work together, keeping the code clean and organized.
- 🎯 Dynamic Targeting: Automatically scans the network, scores all viable targets, and focuses the entire operation on the most profitable server.
- 💰 Advanced Batching (HWGW): The Core Fleet uses a precisely timed batching algorithm to continuously hack, weaken, and grow the target for maximum, stable income.
- ⚙️ Full Automation: Manages purchasing and upgrading your server fleet, buying Dark Web programs, and upgrading your home computer's RAM.
- 📡 Themed Status Reports: Provides periodic, clear updates to the terminal on the status of both your Core and Support fleets, current actions, and performance bottlenecks.

## Scripts
This suite consists of three core scripts that work together:
1.  **`start.js`**
    - start.js (The Launcher): The one and only script you need to run. It's the entry point that boots the rest of the system based on your current resources.
2.  **`controller.js`**
    - controller.js (The Commander): The main brain of the operation. It manages the Core Fleet, handles dynamic target selection, and executes the HWGW batching algorithm.
3.  **`upgrade-manager.js`**
    - upgrade-manager.js (The Quartermaster): A background service that handles all progression. It buys programs, upgrades home RAM, and manages the upgrade cycle for your purchased servers once your fleet is full.
4.  **`pwned-manager.js`**
    - pwned-manager.js (The Support Commander): Manages the Support Fleet. It deploys scripts to all pwned servers to either assist the main attack or earn early-game cash.
5.  **`hack.js`** **`grow.js`** **`weaken.js`** 
    - hack.js, weaken.js, grow.js (The Drones): A lightweight worker script that performs a hack() operation.

## Progression Stages
The script suite automatically adapts to your stage in the game.

### Phase 1: Basic Mode (Low RAM)
If start.js detects you have less RAM than controller.js requires, it runs a simple script to hack n00dles. It will provide a stylized "intermittent" status report and prompt you to manually upgrade your home RAM to unlock the full system.

### Phase 2: Controller Active
Once you have enough RAM, start.js launches the full controller.js and its managers. The system will begin dynamic targeting, server purchasing, and HWGW batching.

### Phase 3: Full Automation (Singularity Unlocked)
The upgrade-manager.js script requires Source-File 4 (unlocked by completing BitNode-4) to function. Once you've unlocked it, the script will gain the ability to automatically buy programs and upgrade your home/purchased servers, making the entire suite truly autonomous.

## Setup & Usage

### Installation

1.  In the Bitburner game, create all the necessary .js files listed above.
2.  Copy the code for each script from this repository into the corresponding in-game file.
3.  Save each file.

### Running the Suite

To start the entire operation, simply run the master script from your `home` server's terminal:

### Configuration

You can easily configure the behavior of the Hive Mind OS by editing the variables at the top of the  `start.js` file.

- minRamToBuy: The minimum RAM a new server must have to be purchased. This also sets the standard for the culling module—any server with less RAM than this will be deleted.
- moneyThreshold: Determines when the script switches from grow to hack. A value of 0.75 means the script will grow the server's money until it reaches 75% of its maximum, then it will begin hacking.
- securityThreshold: Determines when the script switches from weaken to grow. It will weaken the server until its security is minimum_security + securityThreshold.

## License
This project is licensed under the MIT License.
