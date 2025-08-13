/** @param {NS} ns **/
export async function main(ns) {
  // --- HELPER FUNCTION to format milliseconds into MM:SS ---
  const formatTime = (ms) => new Date(ms).toISOString().substr(14, 5);

  // --- CONFIGURATION ---
  const minRamToBuy = 64; 
  let target = '';
  const moneyThreshold = 0.75;
  const securityThreshold = 5;
  const workerRam = 1.75;

  // --- Status Report Configuration ---
  let lastLogTime = 0;
  const logInterval = 60000;

  // --- SCRIPT INITIALIZATION ---
  ns.disableLog('ALL');
  ns.tprint('🚀 HIVE MIND OS BOOTING... STANDBY...');
  ns.tprint(`🦾 Minimum server RAM target set to: ${minRamToBuy}GB`);

  const home = 'home';
  const workerScripts = ['hack.js', 'grow.js', 'weaken.js'];

  // --- MAIN LOOP ---
  while (true) {
    // --- STEP 1: FLEET MANAGEMENT ---
    for (const server of ns.getPurchasedServers()) {
      if (ns.getServerMaxRam(server) < minRamToBuy) {
        ns.tprint(`🚨 Decommissioning obsolete server: ${server}...`);
        ns.killall(server);
        ns.deleteServer(server);
      }
    }
    
    // --- STEP 2: SERVER ACQUISITION ---
    const purchasedServers = ns.getPurchasedServers();
    if (purchasedServers.length < ns.getPurchasedServerLimit()) {
      const currentMoney = ns.getServerMoneyAvailable(home);
      for (let ram = Math.pow(2, 20); ram >= 2; ram /= 2) {
        if (ram < minRamToBuy) break;
        if (currentMoney > ns.getPurchasedServerCost(ram)) {
          const hostname = `pserv-${purchasedServers.length}`;
          ns.purchaseServer(hostname, ram);
          ns.tprint(`✅ FLEET EXPANDED: Acquired new server '${hostname}' with ${ram}GB RAM.`);
          break;
        }
      }
    }

    // --- STEP 3: NETWORK DISCOVERY & TARGETING ---
    const allServers = new Set([home]);
    const scanQueue = [home];
    while (scanQueue.length > 0) {
      const current = scanQueue.shift();
      for (const neighbor of ns.scan(current)) {
        if (!allServers.has(neighbor)) {
          allServers.add(neighbor);
          scanQueue.push(neighbor);
        }
      }
    }

    const pwnedServers = Array.from(allServers).filter(s => {
      if (s !== home && !ns.hasRootAccess(s)) {
        try { ns.nuke(s); } catch { /* Ignore */ }
      }
      return ns.hasRootAccess(s);
    });
    pwnedServers.push(home);

    const potentialTargets = pwnedServers.filter(s => 
      !s.startsWith('pserv-') && ns.getServerMaxMoney(s) > 0
    );

    target = potentialTargets.reduce((prev, curr) => {
      if (!prev) return curr;
      const prevScore = ns.getServerMaxMoney(prev) / ns.getServerMinSecurityLevel(prev);
      const currScore = ns.getServerMaxMoney(curr) / ns.getServerMinSecurityLevel(curr);
      return currScore > prevScore ? curr : prev;
    }, '');

    if (!target) {
        ns.print("No valid targets found. Waiting...");
        await ns.sleep(10000);
        continue;
    }

    // --- STEP 4: PREPARATION & DEPLOYMENT ---
    const minSec = ns.getServerMinSecurityLevel(target) + securityThreshold;
    const maxMon = ns.getServerMaxMoney(target) * moneyThreshold;

    let actionScript;
    if (ns.getServerSecurityLevel(target) > minSec) {
      actionScript = 'weaken.js';
    } else if (ns.getServerMoneyAvailable(target) < maxMon) {
      actionScript = 'grow.js';
    } else {
      actionScript = 'hack.js';
    }

    for (const server of pwnedServers) {
        await ns.scp(workerScripts, server, home);
        const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        const threads = Math.floor(availableRam / workerRam);
        if (threads > 0) {
          ns.exec(actionScript, server, threads, target);
        }
    }

    // --- UPDATED: SPACERADIO STATUS REPORT ---
    if (Date.now() - lastLogTime > logInterval) {
      lastLogTime = Date.now();
      
      // -- Gather data for the report --
      let totalRam = 0, usedRam = 0;
      pwnedServers.forEach(s => {
          totalRam += ns.getServerMaxRam(s);
          usedRam += ns.getServerUsedRam(s);
      });
      const utilization = totalRam > 0 ? ((usedRam / totalRam) * 100).toFixed(2) : 0;
      
      // -- Determine phase and time remaining --
      let phase, timeRemaining;
      switch(actionScript) {
        case 'weaken.js':
          phase = "PREP (Weaken)";
          timeRemaining = ns.getWeakenTime(target);
          break;
        case 'grow.js':
          phase = "PREP (Grow)";
          timeRemaining = ns.getGrowTime(target);
          break;
        case 'hack.js':
          phase = "ATTACK (Hack)";
          timeRemaining = ns.getHackTime(target);
          break;
      }

      ns.tprint(`
        📡 ==[ SPACERADIO TRANSMISSION ]==
           System Time: ${new Date().toLocaleTimeString()}
           Fleet Status: ${ns.getPurchasedServers().length}/${ns.getPurchasedServerLimit()} servers owned. ${pwnedServers.length} total nodes online.
           Network Utilization: ${utilization}% (${usedRam.toFixed(2)}/${totalRam.toFixed(2)} GB)
           Current Directive: Engaging target [${target}]
           Phase: ${phase}
           Est. Time Remaining: ~${formatTime(timeRemaining)}
           System State: All systems green.
        `
      );
    }

    await ns.sleep(1000);
  }
}
