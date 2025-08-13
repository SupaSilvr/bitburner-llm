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
    const programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
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
    
    // ### NEW: Purchased Server Upgrade Logic ###
    const purchasedServers = ns.getPurchasedServers();
    // Only run this logic if the fleet is full.
    if (purchasedServers.length === ns.getPurchasedServerLimit()) {
      // Find the server with the lowest RAM
      let weakestServer = purchasedServers[0];
      let minRam = ns.getServerMaxRam(weakestServer);

      for (const server of purchasedServers) {
        const currentRam = ns.getServerMaxRam(server);
        if (currentRam < minRam) {
          minRam = currentRam;
          weakestServer = server;
        }
      }

      const nextRamTier = minRam * 2;
      // Check if we can afford to upgrade the weakest server
      if (nextRamTier <= ns.getPurchasedServerMaxRam()) {
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
