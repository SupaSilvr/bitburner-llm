/** @param {NS} ns **/
export async function main(ns) {
    // --- Script Configuration ---
    const scriptToRun = 'basic-hack.js';
    const stonksScript = 'stonks.js';
    const dataPort = 1; // Port to read stock data from

    // --- State Tracking ---
    const startTime = Date.now();
    ns.disableLog('ALL');
    ns.clearLog();

    // --- Bootstrap Phase ---
    if (ns.fileExists(stonksScript, 'home')) {
        if (!ns.isRunning(stonksScript, 'home')) {
            if ((ns.getServerMaxRam('home') - ns.getServerUsedRam('home')) >= ns.getScriptRam(stonksScript, 'home')) {
                ns.exec(stonksScript, 'home', 1);
            }
        }
    }
    
    // --- Main Hacking Loop ---
    while (true) {
        // ... (The entire server discovery and hacking section is unchanged) ...
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

        // 2. Get Player and Net Worth
        const player = ns.getPlayer();
        const totalNetWorth = player.money + stockData.portfolioValue;

        // 3. Print Report
        ns.tprint("======== UNIFIED STATUS REPORT ========");
        ns.tprint("Runtime:         " + ns.tFormat(Date.now() - startTime));
        ns.tprint("Total Net Worth: " + ns.nFormat(totalNetWorth, '$0.00a'));
        ns.tprint("---------------------------------------");
        ns.tprint("Cash on hand:    " + ns.nFormat(player.money, '$0.00a'));
        ns.tprint("Stock Portfolio: " + ns.nFormat(stockData.portfolioValue, '$0.00a'));
        ns.tprint("Stock Session P/L: " + ns.nFormat(stockData.sessionProfitAndLoss, '$0.00a'));
        ns.tprint("---------------------------------------");
        ns.tprint("Hacking Target:  " + (bestTarget || "None"));
        ns.tprint("Hacking Hosts:   " + attackingHosts + " / " + rootedServers.length + " rooted");
        ns.tprint("Network RAM:     " + ns.nFormat(totalUsedRam * 1e9, '0.00b') + " / " + ns.nFormat(totalMaxRam * 1e9, '0.00b') + " (" + (totalMaxRam > 0 ? Math.round((totalUsedRam / totalMaxRam) * 100) : 0) + "%)");
        ns.tprint("=======================================");
        
        await ns.sleep(10000); // Report updates every 10 seconds
    }
}
