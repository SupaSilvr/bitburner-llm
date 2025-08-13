/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('ALL');
  const checkInterval = 60000; // Check for upgrades every 60 seconds

  // Check for Singularity API access first
  try {
    ns.singularity.getUpgradeHomeRamCost();
  } catch {
    ns.print('WARN: Singularity API not yet available (requires Source-File 4). The upgrade-manager will remain dormant.');
    ns.exit();
  }

  while (true) {
    // -- Home RAM Upgrade --
    if (ns.getServerMoneyAvailable('home') > ns.singularity.getUpgradeHomeRamCost() * 2) {
      if (ns.singularity.upgradeHomeRam()) {
        ns.tprint(`✅ HOME UPGRADE: RAM successfully upgraded.`);
      }
    }

    // -- Program Purchase --
    // ### UPDATED: Added all remaining programs to the list ###
    const programs = [
        "BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe",
        "DeepscanV1.exe", "DeepscanV2.exe", "ServerProfiler.exe", "AutoLink.exe"
    ];
    
    if (!ns.hasTorRouter() && ns.getServerMoneyAvailable('home') > 200000) {
      if (ns.singularity.purchaseTor()) {
        ns.tprint('✅ Purchased TOR Router.');
      }
    }

    for (const prog of programs) {
      if (!ns.fileExists(prog, 'home') && ns.getServerMoneyAvailable('home') > ns.singularity.getDarkwebProgramCost(prog)) {
        if (ns.singularity.purchaseProgram(prog)) {
            ns.tprint(`✅ Purchased new program: ${prog}`);
        }
      }
    }
    
    // -- Purchased Server Upgrade Logic --
    const purchasedServers = ns.getPurchasedServers();
    if (purchasedServers.length === ns.getPurchasedServerLimit()) {
      let weakestServer = purchasedServers[0] || null;
      let minRam = weakestServer ? ns.getServerMaxRam(weakestServer) : 0;

      for (const server of purchasedServers) {
        const currentRam = ns.getServerMaxRam(server);
        if (currentRam < minRam) {
          minRam = currentRam;
          weakestServer = server;
        }
      }

      const nextRamTier = minRam * 2;
      if (weakestServer && nextRamTier <= ns.getPurchasedServerMaxRam()) {
        const upgradeCost = ns.getPurchasedServerCost(nextRamTier);
        if (ns.getServerMoneyAvailable('home') > upgradeCost) {
          if (ns.singularity.upgradePurchasedServer(weakestServer, nextRamTier)) {
            ns.tprint(`✅ FLEET UPGRADE: Upgraded ${weakestServer} to ${nextRamTier}GB RAM.`);
          }
        }
      }
    }

    await ns.sleep(checkInterval);
  }
}
