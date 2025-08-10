/** @param {NS} ns **/
export async function main(ns) {
    // --- Script Configuration ---
    const mainHackScript = 'basic-hack.js';
    const liteHackScript = 'lite-hack.js';

    // --- State Tracking ---
    const startTime = Date.now();
    const initialMoney = ns.getPlayer().money; 
    ns.disableLog('ALL');
    ns.clearLog();
    
    // --- Main Loop ---
    while (true) {
        const hasSingularity = ns.singularity && typeof ns.singularity.purchaseServer === 'function';
        const player = ns.getPlayer();

        // --- Server Discovery & Rooting ---
        const serverSet = new Set(['home']);
        const serversToScan = ['home'];
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
        const allServers = Array.from(serverSet);

        for (const server of allServers) {
            if (ns.hasRootAccess(server)) continue;
            let openPorts = 0;
            if (ns.fileExists("BruteSSH.exe", "home")) { try { ns.brutessh(server); openPorts++; } catch {} }
            if (ns.fileExists("FTPCrack.exe", "home")) { try { ns.ftpcrack(server); openPorts++; } catch {} }
            if (ns.fileExists("relaySMTP.exe", "home")) { try { ns.relaysmtp(server); openPorts++; } catch {} }
            if (ns.fileExists("HTTPWorm.exe", "home")) { try { ns.httpworm(server); openPorts++; } catch {} }
            if (ns.fileExists("SQLInject.exe", "home")) { try { ns.sqlinject(server); openPorts++; } catch {} }
            if (ns.getServerNumPortsRequired(server) <= openPorts) {
                try { ns.nuke(server); } catch {}
            }
        }

        const rootedServers = allServers.filter(s => ns.hasRootAccess(s));

        // --- Singularity Actions ---
        if (hasSingularity && !ns.isBusy()) {
            ns.singularity.purchaseTor();
            const programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
            for (const program of programs) ns.singularity.purchaseProgram(program);

            const backdoorTarget = rootedServers.find(s => !ns.getServer(s).backdoorInstalled && s !== 'home');
            if (backdoorTarget) {
                await ns.singularity.connect(backdoorTarget);
                await ns.singularity.installBackdoor();
                await ns.singularity.connect("home");
            }
        }

        // --- Target Selection ---
        let bestTarget = '';
        let maxScore = 0;
        for (const server of rootedServers) {
            if (server === 'home' || ns.getServerMaxMoney(server) === 0) continue;
            const score = ns.getServerMaxMoney(server) / (ns.getWeakenTime(server) + ns.getGrowTime(server) + ns.getHackTime(server));
            if (score > maxScore) {
                maxScore = score;
                bestTarget = server;
            }
        }

        // --- ROBUST SCRIPT DEPLOYMENT ---
        const mainScriptRam = ns.getScriptRam(mainHackScript, 'home');
        const liteScriptRam = ns.getScriptRam(liteHackScript, 'home');
        let totalMaxRam = 0, totalUsedRam = 0, attackingHosts = 0;
        
        for (const host of rootedServers) {
            const maxRam = ns.getServerMaxRam(host);
            const usedRam = ns.getServerUsedRam(host);
            totalMaxRam += maxRam;
            totalUsedRam += usedRam;
            
            if (host === 'home') continue;
            if (ns.scriptRunning(mainHackScript, host) || ns.scriptRunning(liteHackScript, host)) {
                attackingHosts++;
                continue;
            }
            if (!bestTarget) continue;
            
            let availableRam = maxRam - usedRam;
            if (availableRam >= mainScriptRam) {
                let threads = Math.floor(availableRam / mainScriptRam);
                if (threads > 0 && await ns.scp(mainHackScript, host, 'home')) {
                    if (ns.exec(mainHackScript, host, threads, bestTarget) !== 0) attackingHosts++;
                }
            } else if (availableRam >= liteScriptRam) {
                let threads = Math.floor(availableRam / liteScriptRam);
                 if (threads > 0 && await ns.scp(liteHackScript, host, 'home')) {
                    if (ns.exec(liteHackScript, host, threads, bestTarget) !== 0) attackingHosts++;
                }
            }
        }

        // --- UNIFIED REPORTING SECTION ---
        ns.clearLog();
        const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const hackingProfit = player.money - initialMoney;

        ns.tprint("======== UNIFIED STATUS REPORT ========");
        ns.tprint(`Runtime:         ${ns.tFormat((Date.now() - startTime))}`);
        ns.tprint(`Hacking Profit:  ${moneyFormatter.format(hackingProfit)} (total)`);
        ns.tprint("---------------------------------------");
        ns.tprint(`Hacking Target:  ${(bestTarget || "None")}`);
        ns.tprint(`Hacking Hosts:   ${attackingHosts} / ${rootedServers.length - 1} rooted`);
        ns.tprint(`Network RAM:     ${ns.formatRam(totalUsedRam)} / ${ns.formatRam(totalMaxRam)} (${ns.formatPercent(totalUsedRam / totalMaxRam, 0)})`);
        
        if (hasSingularity) {
            if (ns.isBusy()) {
                const work = ns.singularity.getCurrentWork();
                if (work) {
                     ns.tprint(`Status:          Busy with ${work.type}...`);
                } else {
                     ns.tprint("Status:          Busy with a task...");
                }
            } else {
                const backdoorsRemaining = rootedServers.filter(s => !ns.getServer(s).backdoorInstalled && s !== 'home').length;
                ns.tprint(`Backdoors Left:  ${backdoorsRemaining}`);
            }
        }
        ns.tprint("=======================================");

        await ns.sleep(5000);
    }
}
