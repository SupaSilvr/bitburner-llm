/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('ALL');
  const checkInterval = 60000;

  try {
    ns.singularity.getUpgradeHomeRamCost();
  } catch {
    ns.print('WARN: Singularity API not yet available (requires Source-File 4). The upgrade-manager will remain dormant.');
    ns.exit();
  }

  while (true) {
    // -- Home RAM Upgrade --
    const upgradeCost = ns.singularity.getUpgradeHomeRamCost();
    if (ns.getServerMoneyAvailable('home') > upgradeCost * 2) {
      if (ns.singularity.upgradeHomeRam()) {
        ns.tprint(`✅ HOME UPGRADE: RAM successfully upgraded for ${ns.formatNumber(upgradeCost)}.`);
      }
    }

    // -- Program Purchase --
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
    
    await ns.sleep(checkInterval);
  }
}
