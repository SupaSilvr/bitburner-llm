/** @param {NS} ns **/
export async function main(ns) {
    // --- Script Configuration ---
    const mainHackScript = 'basic-hack.js';
    const liteHackScript = 'lite-hack.js';
    const stonksScript = 'stonks.js';
    const dataPort = 1;
    const ramToPurchase = 128; 

    // --- State Tracking ---
    const startTime = Date.now();
    const initialMoney = ns.getPlayer().money; 
    ns.disableLog('ALL');
    ns.clearLog();

    // --- Bootstrap Phase ---
    if (ns.fileExists(stonksScript, 'home') && !ns.isRunning(stonksScript, 'home')) {
        if ((ns.getServerMaxRam('home') - ns.getServerUsedRam('home')) >= ns.getScriptRam(stonksScript, 'home')) {
            ns.exec(stonksScript, 'home', 1);
        }
    }
    
    // --- Main Loop ---
    while (true) {
        const hasSingularity = ns.singularity && typeof ns.singularity.purchaseServer === 'function';

        // --- Server Discovery & Rooting ---
        let serverSet = new Set(['home']);
        let serversToScan = ['home'];
        while (serversToScan.length > 0) {
            let currentServer = serversToScan.shift();
            for (const neighbor of ns.scan(currentServer)) {
                if (!serverSet.has(neighbor)) {
                    serverSet.add(neighbor);
                    serversToScan.push(neighbor);
                }
            }
        }
        for (const pserv of ns.getPurchasedServers()) {
            serverSet.add(pserv);
        }
        let allServers = Array.from(serverSet);

        for (const server of allServers) {
            if (ns.hasRootAccess(server) || ns.getHackingLevel() < ns.getServerRequiredHackingLevel(server)) continue;
            let openPorts = 0;
            if (ns.fileExists("BruteSSH.exe", "home")) { ns.brutessh(server); openPorts++; }
            if (ns.fileExists("FTPCrack.exe", "home")) { ns.ftpcrack(server); openPorts++; }
            if (ns.fileExists("relaySMTP.exe", "home")) { ns.relaysmtp(server); openPorts++; }
            if (ns.fileExists("HTTPWorm.exe", "home")) { ns.httpworm(server); openPorts++; }
            if (ns.fileExists("SQLInject.exe", "home")) { ns.sqlinject(server); openPorts++; }
            if (ns.getServerNumPortsRequired(server) <= openPorts) ns.nuke(server);
        }

        const rootedServers = allServers.filter(s => ns.hasRootAccess(s));

        if (hasSingularity) {
            // --- Server Purchasing ---
            const serverLimit = ns.getPurchasedServerLimit();
            const purchasedServers = ns.getPurchasedServers();
            if (purchasedServers.length < serverLimit) {
                const cost = ns.getPurchasedServerCost(ramToPurchase);
                if (ns.getPlayer().money > cost) {
                    const hostname = `pserv-${purchasedServers.length}`;
                    if (ns.singularity.purchaseServer(hostname, ramToPurchase)) {
                        ns.tprint(`✅ Purchased new server: ${hostname} with ${ramToPurchase}GB RAM.`);
                    }
                }
            }
            for (const server of purchasedServers) {
                if (ns.getServerMaxRam(server) < ramToPurchase) {
                    const cost = ns.getPurchasedServerCost(ramToPurchase);
                    if (ns.getPlayer().money > cost) {
                        if (ns.singularity.deleteServer(server) && ns.singularity.purchaseServer(server, ramToPurchase)) {
                            ns.tprint(`✅ Upgraded server ${server} to ${ramToPurchase}GB RAM.`);
                        }
                    }
                }
            }

            // --- Automatic Backdoor Installation ---
            for (const server of rootedServers) {
                const serverInfo = ns.getServer(server);
                if (!serverInfo.backdoorInstalled && server !== 'home') {
                    ns.tprint(`INFO: Attempting to install backdoor on ${server}...`);
                    const path = [server];
                    let current = server;
                    while(current !== 'home'){
                        const parent = ns.scan(current)[0];
                        path.unshift(parent);
                        current = parent;
                    }
                    path.forEach(p => ns.singularity.connect(p));
                    await ns.singularity.installBackdoor();
                    ns.singularity.connect('home');
                    ns.tprint(`✅ Backdoor installed on ${server}.`);
                }
            }
        }

        // --- Target Selection ---
        let bestTarget = '';
        let maxScore = 0;
        for (const server of rootedServers) {
            if (ns.getServerMaxMoney(server) === 0) continue;
            const score = ns.getServerMaxMoney(server) / (ns.getWeakenTime(server) + ns.getGrowTime(server) + ns.getHackTime(server));
            if (score > maxScore) {
                maxScore = score;
                bestTarget = server;
            }
        }

        // --- Script Deployment ---
        const mainScriptRam = ns.getScriptRam(mainHackScript, 'home');
        const liteScriptRam = ns.getScriptRam(liteHackScript, 'home');
        let totalMaxRam = 0, totalUsedRam = 0, attackingHosts = 0;
        for (const host of rootedServers) {
            let maxRam = ns.getServerMaxRam(host);
            let usedRam = ns.getServerUsedRam(host);
            totalMaxRam += maxRam;
            totalUsedRam += usedRam;
            let availableRam = maxRam - usedRam;
            if (ns.scriptRunning(mainHackScript, host) || ns.scriptRunning(liteHackScript, host)) {
                attackingHosts++;
                continue;
            }
            if (!bestTarget) continue;
            if (availableRam >= mainScriptRam) {
                await ns.scp(mainHackScript, host, 'home');
                let threads = Math.floor(availableRam / mainScriptRam);
                if (threads > 0) {
                    ns.exec(mainHackScript, host, threads, bestTarget);
                    attackingHosts++;
                }
            } else if (availableRam >= liteScriptRam) {
                await ns.scp(liteHackScript, host, 'home');
                let threads = Math.floor(availableRam / liteScriptRam);
                if (threads > 0) {
                    ns.exec(liteHackScript, host, threads, bestTarget);
                    attackingHosts++;
                }
            }
        }

        // --- UNIFIED REPORTING SECTION ---
        ns.clearLog();
        let stockData = { portfolioValue: 0, sessionProfitAndLoss: 0 };
        const portData = ns.peek(dataPort);
        if (portData !== "NULL PORT DATA") stockData = JSON.parse(portData);
        const player = ns.getPlayer();
        const runtimeSeconds = (Date.now() - startTime) / 1000;
        const currentNetWorth = player.money + stockData.portfolioValue;
        const totalProfit = currentNetWorth - initialMoney;
        const hackingProfit = player.money - initialMoney - stockData.sessionProfitAndLoss;
        ns.tprint("======== UNIFIED STATUS REPORT ========");
        ns.tprint("Runtime:         " + ns.tFormat(runtimeSeconds * 1000));
        ns.tprint("Total Net Worth: " + ns.nFormat(currentNetWorth, '$0.00a'));
        ns.tprint("Overall P/L:     " + ns.nFormat(totalProfit, '$0.00a') + " (total)");
        ns.tprint("---------------------------------------");
        ns.tprint("Hacking P/L:     " + ns.nFormat(hackingProfit, '$0.00a') + " (total)");
        ns.tprint("Stock P/L:       " + ns.nFormat(stockData.sessionProfitAndLoss, '$0.00a') + " (total)");
        ns.tprint("---------------------------------------");
        ns.tprint("Hacking Target:  " + (bestTarget || "None"));
        ns.tprint("Hacking Hosts:   " + attackingHosts + " / " + rootedServers.length + " rooted");
        ns.tprint("Network RAM:     " + ns.nFormat(totalUsedRam * 1e9, '0.00b') + " / " + ns.nFormat(totalMaxRam * 1e9, '0.00b') + " (" + (totalMaxRam > 0 ? Math.round((totalUsedRam / totalMaxRam) * 100) : 0) + "%)");
        ns.tprint("=======================================");
        
        await ns.sleep(10000);
    }
}
