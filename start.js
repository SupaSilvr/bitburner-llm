    // The script will first launch the stock trader, then begin its main hacking loop. 
    // The unified report will appear in your terminal and update every 10 seconds.


/** @param {NS} ns **/
export async function main(ns) {
    // --- Script Configuration ---
    const scriptToRun = 'basic-hack.js';
    const stonksScript = 'stonks.js';
    const dataPort = 1;

    // --- State Tracking ---
    const startTime = Date.now();
    // Record initial money state to calculate profit later.
    const initialMoney = ns.getPlayer().money; 
    ns.disableLog('ALL');
    ns.clearLog();

    // --- Bootstrap Phase ---
    // This part launches the stock script.
    if (ns.fileExists(stonksScript, 'home')) {
        if (!ns.isRunning(stonksScript, 'home')) {
            if ((ns.getServerMaxRam('home') - ns.getServerUsedRam('home')) >= ns.getScriptRam(stonksScript, 'home')) {
                ns.exec(stonksScript, 'home', 1);
            }
        }
    }
    
    // --- Main Hacking Loop ---
    while (true) {
        // This entire section for discovering, rooting, and deploying hack scripts is correct and unchanged.
        let serverSet = new Set(['home']);
        let serversToScan = ['home'];
        while (serversToScan.length > 0) {
            let currentServer = serversToScan.shift();
            let neighbors = ns.scan(currentServer);
            for (let i = 0; i < neighbors.length; i++) {
                if (!serverSet.has(neighbors[i])) {
                    serverSet.add(neighbors[i]);
                    serversToScan.push(neighbors[i]);
                }
            }
        }
        let allServers = Array.from(serverSet);

        for (let i = 0; i < allServers.length; i++) {
            let server = allServers[i];
            if (ns.hasRootAccess(server) || ns.getHackingLevel() < ns.getServerRequiredHackingLevel(server)) continue;
            let openPorts = 0;
            if (ns.fileExists("BruteSSH.exe", "home")) { ns.brutessh(server); openPorts++; }
            if (ns.fileExists("FTPCrack.exe", "home")) { ns.ftpcrack(server); openPorts++; }
            if (ns.fileExists("relaySMTP.exe", "home")) { ns.relaysmtp(server); openPorts++; }
            if (ns.fileExists("HTTPWorm.exe", "home")) { ns.httpworm(server); openPorts++; }
            if (ns.fileExists("SQLInject.exe", "home")) { ns.sqlinject(server); openPorts++; }
            if (ns.getServerNumPortsRequired(server) <= openPorts) ns.nuke(server);
        }

        let rootedServers = allServers.filter(s => ns.hasRootAccess(s));
        
        let bestTarget = '';
        let maxScore = 0;
        for (let i = 0; i < rootedServers.length; i++) {
            let server = rootedServers[i];
            let serverMaxMoney = ns.getServerMaxMoney(server);
            if (serverMaxMoney === 0) continue;
            let score = serverMaxMoney / ns.getServerMinSecurityLevel(server);
            if (score > maxScore) { maxScore = score; bestTarget = server; }
        }

        let totalMaxRam = 0, totalUsedRam = 0, attackingHosts = 0;
        for (let i = 0; i < rootedServers.length; i++) {
            let host = rootedServers[i];
            let maxRam = ns.getServerMaxRam(host), usedRam = ns.getServerUsedRam(host);
            totalMaxRam += maxRam;
            totalUsedRam += usedRam;
            if (ns.scriptRunning(scriptToRun, host)) {
                attackingHosts++;
            } else if (maxRam > 0 && bestTarget !== '') {
                await ns.scp(scriptToRun, host, 'home');
                let threads = Math.floor((maxRam - usedRam) / ns.getScriptRam(scriptToRun, host));
                if (threads > 0) {
                    ns.exec(scriptToRun, host, threads, bestTarget);
                    attackingHosts++;
                }
            }
        }

        // --- UNIFIED REPORTING SECTION ---
        ns.clearLog();

        // 1. Get Stock Data from Port
        let stockData = { portfolioValue: 0, sessionProfitAndLoss: 0 };
        const portData = ns.peek(dataPort);
        if (portData !== "NULL PORT DATA") {
            stockData = JSON.parse(portData);
        }

        // 2. Perform Corrected Financial Calculations
        const player = ns.getPlayer();
        const runtimeSeconds = (Date.now() - startTime) / 1000;
        
        // Overall P/L is the change in total net worth (cash + stocks)
        const currentNetWorth = player.money + stockData.portfolioValue;
        const totalProfit = currentNetWorth - initialMoney;
        const totalProfitPerMinute = (runtimeSeconds > 0) ? (totalProfit / runtimeSeconds) * 60 : 0;
        
        // Hacking P/L is the change in cash NOT accounted for by stock sales
        const hackingProfit = player.money - initialMoney - stockData.sessionProfitAndLoss;
        const hackingProfitPerMinute = (runtimeSeconds > 0) ? (hackingProfit / runtimeSeconds) * 60 : 0;

        // 3. Print Final Report
        ns.tprint("======== UNIFIED STATUS REPORT ========");
        ns.tprint("Runtime:         " + ns.tFormat(runtimeSeconds * 1000));
        ns.tprint("Total Net Worth: " + ns.nFormat(currentNetWorth, '$0.00a'));
        ns.tprint("Overall P/L:     " + ns.nFormat(totalProfitPerMinute, '$0.00a') + "/min");
        ns.tprint("---------------------------------------");
        ns.tprint("Hacking P/L:     " + ns.nFormat(hackingProfitPerMinute, '$0.00a') + "/min");
        ns.tprint("Stock P/L:       " + ns.nFormat(stockData.sessionProfitAndLoss, '$0.00a') + " (total)");
        ns.tprint("---------------------------------------");
        ns.tprint("Hacking Target:  " + (bestTarget || "None"));
        ns.tprint("Hacking Hosts:   " + attackingHosts + " / " + rootedServers.length + " rooted");
        ns.tprint("Network RAM:     " + ns.nFormat(totalUsedRam * 1e9, '0.00b') + " / " + ns.nFormat(totalMaxRam * 1e9, '0.00b') + " (" + (totalMaxRam > 0 ? Math.round((totalUsedRam / totalMaxRam) * 100) : 0) + "%)");
        ns.tprint("=======================================");
        
        await ns.sleep(10000);
    }
}
