/** @param {NS} ns **/
export async function main(ns) {
    const initialServers = ['n00dles', 'foodnstuff', 'sigma-cosmetics', 'joesguns'];
    const hackScript = 'lite-hack.js';
    const target = 'n00dles'; // The best early-game target

    ns.tprint("INFO: Starting bootstrap process...");

    for (const server of initialServers) {
        // Gain root access if we don't have it
        if (!ns.hasRootAccess(server)) {
            try { ns.nuke(server); }
            catch { ns.tprint(`WARN: Could not NUKE ${server}. Need BruteSSH.`); }
        }

        // Copy the lite hack script to the server
        await ns.scp(hackScript, server, 'home');

        // Run the script on the server, using all its available RAM
        const maxRam = ns.getServerMaxRam(server);
        const scriptRam = ns.getScriptRam(hackScript);
        const threads = Math.floor(maxRam / scriptRam);

        if (threads > 0) {
            ns.exec(hackScript, server, threads, target);
        }
    }
    
    ns.tprint("SUCCESS: Bootstrap complete. Hacking 'n00dles' to earn money for RAM upgrade.");
    ns.tprint("When you have enough cash, buy a 'home' RAM upgrade, then you can run start.js");
}
