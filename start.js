/** @param {NS} ns **/

// --- HELPER FUNCTION (MOVED TO GLOBAL SCOPE) ---
const formatTime = (ms) => new Date(ms).toISOString().substr(14, 5);

export async function main(ns) {
  ns.disableLog('ALL');
  ns.tprint('🚀 HWGW Batcher OS Starting...');
  
  // --- CONFIGURATION ---
  let target = 'n00dles'; 
  const hackPercent = 0.25; 
  const batchSeparation = 200; 
  const prep_moneyThreshold = 0.90;
  const prep_securityThreshold = 5;

  // --- Status Report Configuration ---
  let lastLogTime = 0;
  const logInterval = 60000;

  // --- MAIN LOOP ---
  while (true) {
    ns.clearLog();
    
    // --- STEP 1: Find best target ---
    if (ns.getServerRequiredHackingLevel(target) > ns.getHackingLevel()) {
      target = 'joesguns';
      ns.tprint(`WARN: Target changed to ${target}`);
    }

    // --- STEP 2: Prepare Target Server ---
    const maxMoney = ns.getServerMaxMoney(target);
    const minSec = ns.getServerMinSecurityLevel(target);

    if (ns.getServerSecurityLevel(target) > minSec + prep_securityThreshold) {
      await runPrep(ns, target, 'weaken.js');
      continue;
    }
    if (ns.getServerMoneyAvailable(target) < maxMoney * prep_moneyThreshold) {
      await runPrep(ns, target, 'grow.js');
      continue;
    }

    // --- STEP 3: Calculate and Launch Batches ---
    const batch = calculateBatch(ns, target, hackPercent);
    if (batch.ramCost > getNetworkRam(ns).total) {
      ns.print(`ERROR: Not enough RAM for a single batch. Need ${ns.formatRam(batch.ramCost)}. Waiting...`);
      await ns.sleep(30000);
      continue;
    }

    // Main batching loop
    let batching = true;
    while (batching) {
      if (ns.getServerSecurityLevel(target) > minSec + prep_securityThreshold || ns.getServerMoneyAvailable(target) < maxMoney * prep_moneyThreshold) {
          ns.print(`WARN: Target ${target} de-synced. Breaking to re-prep.`);
          batching = false; 
          continue;
      }
      if (batch.ramCost > (getNetworkRam(ns).total - getNetworkRam(ns).used)) {
          await ns.sleep(1000); 
          continue;
      }

      const weakenTime = ns.getWeakenTime(target);
      const landTime = Date.now() + weakenTime + (2 * batchSeparation);

      deploy(ns, target, 'hack.js', batch.hackThreads, landTime - (2 * batchSeparation) - ns.getHackTime(target));
      deploy(ns, target, 'weaken.js', batch.weaken1Threads, landTime - batchSeparation - ns.getWeakenTime(target));
      deploy(ns, target, 'grow.js', batch.growThreads, landTime - ns.getGrowTime(target));
      deploy(ns, target, 'weaken.js', batch.weaken2Threads, landTime + batchSeparation - ns.getWeakenTime(target));
      
      if (Date.now() - lastLogTime > logInterval) {
        lastLogTime = Date.now();
        const network = getNetworkRam(ns);
        const utilization = network.total > 0 ? ((network.used / network.total) * 100).toFixed(2) : 0;
        ns.tprint(`
        📡 ==[ SPACERADIO TRANSMISSION ]==
           System Time: ${new Date().toLocaleTimeString()}
           Fleet Status: ${ns.getPurchasedServers().length}/${ns.getPurchasedServerLimit()} servers owned.
           Network Utilization: ${utilization}% (${ns.formatRam(network.used)}/${ns.formatRam(network.total)})
           Current Directive: Engaging target [${target}]
           Phase: BATCHING (HWGW)
           Est. Cycle Time: ~${formatTime(ns.getWeakenTime(target))}
           Batch RAM Cost: ${ns.formatRam(batch.ramCost)}
        `);
      }
      
      await ns.sleep(4 * batchSeparation);
    }
  }
}

// --- GLOBAL HELPER FUNCTIONS ---

/** Calculates the threads and RAM for one HWGW batch */
function calculateBatch(ns, target, hackPercent) {
  const serverMaxMoney = ns.getServerMaxMoney(target);
  const moneyToHack = serverMaxMoney * hackPercent;

  const hackThreads = Math.max(1, Math.floor(ns.hackAnalyzeThreads(target, moneyToHack)));
  const hackSecIncrease = ns.hackAnalyzeSecurity(hackThreads);
  const weaken1Threads = Math.max(1, Math.ceil(hackSecIncrease / ns.weakenAnalyze(1)));
  
  const growThreads = Math.max(1, Math.ceil(ns.growthAnalyze(target, 1 / (1 - hackPercent))));
  const growSecIncrease = ns.growthAnalyzeSecurity(growThreads);
  const weaken2Threads = Math.max(1, Math.ceil(growSecIncrease / ns.weakenAnalyze(1)));

  const hRam = ns.getScriptRam('hack.js');
  const gRam = ns.getScriptRam('grow.js');
  const wRam = ns.getScriptRam('weaken.js');

  return {
    hackThreads, weaken1Threads, growThreads, weaken2Threads,
    ramCost: (hackThreads * hRam) + (growThreads * gRam) + ((weaken1Threads + weaken2Threads) * wRam),
  };
}

/** Deploys a script to any available server */
function deploy(ns, target, script, threads, delay) {
  if (threads === 0) return;
  let remainingThreads = threads;
  const pservs = ['home', ...ns.getPurchasedServers()];

  for (const server of pservs) {
    if (remainingThreads <= 0) break;
    const ramCost = ns.getScriptRam(script);
    const freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    const threadsOnThisServer = Math.min(remainingThreads, Math.floor(freeRam / ramCost));

    if (threadsOnThisServer > 0) {
      ns.scp(script, server, 'home');
      ns.exec(script, server, threadsOnThisServer, target, delay);
      remainingThreads -= threadsOnThisServer;
    }
  }
}

/** Gets total and used RAM on purchased servers + home */
function getNetworkRam(ns) {
  let totalRam = 0;
  let usedRam = 0;
  const pservs = ['home', ...ns.getPurchasedServers()];
  for (const server of pservs) {
    totalRam += ns.getServerMaxRam(server);
    usedRam += ns.getServerUsedRam(server);
  }
  return { total: totalRam, used: usedRam };
}

/** A simple deployment function for the initial server prep */
async function runPrep(ns, target, script) {
  const ramCost = ns.getScriptRam(script);
  const network = getNetworkRam(ns);
  const threads = Math.floor((network.total - network.used) / ramCost);
  
  if (threads > 0) {
    deploy(ns, target, script, threads, 0);
  }

  let waitTime = 0;
  if(script === 'weaken.js') waitTime = ns.getWeakenTime(target);
  if(script === 'grow.js') waitTime = ns.getGrowTime(target);
  
  ns.print(`INFO: Prepping ${target} with ${script} using ${threads} threads. Waiting for ~${formatTime(waitTime)}.`);
  await ns.sleep(waitTime + 1000);
}
