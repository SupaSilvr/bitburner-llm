/** @param {NS} ns **/
export async function main(ns) {
    // --- Configuration ---
    const buyThreshold = 0.6;
    const sellThreshold = 0.5;
    const reserveCash = 1_000_000;
    const commission = 100_000;
    const cycleTime = 6000; // Operates every 6 seconds
    const dataPort = 1; // The port this script will write data to

    // --- State Tracking ---
    let sessionProfitAndLoss = 0;

    // Clear the port at the start to ensure no old data is lingering.
    ns.clearPort(dataPort);

    // --- Main Loop ---
    while (true) {
        const allSymbols = ns.stock.getSymbols();
        let portfolioValue = 0;

        // Sell phase
        for (const sym of allSymbols) {
            const [shares, avgPrice] = ns.stock.getPosition(sym);
            if (shares > 0) {
                const bidPrice = ns.stock.getBidPrice(sym);
                portfolioValue += shares * bidPrice;
                
                if (ns.stock.getForecast(sym) < sellThreshold) {
                    const salePrice = ns.stock.sellStock(sym, shares);
                    if (salePrice > 0) {
                        const saleGain = shares * (salePrice - avgPrice) - (2 * commission);
                        sessionProfitAndLoss += saleGain;
                        ns.print(`SELL: Sold ${sym} for a profit of ${ns.nFormat(saleGain, '$0.0a')}`);
                    }
                }
            }
        }

        // Buy phase
        let bestStock = '';
        let bestForecast = 0;
        for (const sym of allSymbols) {
            const forecast = ns.stock.getForecast(sym);
            if (forecast > bestForecast) {
                bestForecast = forecast;
                bestStock = sym;
            }
        }
        
        if (bestForecast > buyThreshold) {
            let cashToSpend = ns.getPlayer().money - reserveCash;
            if (cashToSpend > commission) {
                const stockPrice = ns.stock.getAskPrice(bestStock);
                const sharesToBuy = Math.min(Math.floor((cashToSpend - commission) / stockPrice), ns.stock.getMaxShares(bestStock) - ns.stock.getPosition(bestStock)[0]);
                if (sharesToBuy > 0) {
                    ns.stock.buyStock(bestStock, sharesToBuy);
                }
            }
        }
        
        // --- COMMUNICATION ---
        // Clear the port to ensure the master script doesn't read stale data.
        ns.clearPort(dataPort);
        // Write the new data as a JSON string.
        await ns.writePort(dataPort, JSON.stringify({
            portfolioValue: portfolioValue,
            sessionProfitAndLoss: sessionProfitAndLoss
        }));

        await ns.sleep(cycleTime);
    }
}
