const fs = require("fs");
const path = require("path");

class Mod {
    postDBLoad(container) {
        const logger = container.resolve("WinstonLogger");
        const tables = container.resolve("DatabaseServer").getTables();
        
        const configPath = path.join(__dirname, "..", "config.json");
        if (!fs.existsSync(configPath)) {
            logger.error("[Limitless] config.json not found!");
            return;
        }
        const { mode = "multiplier", multiplier = 10, affectGlobalLimits = true, affectPersonalLimits = true } = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        
        let count = 0;

        for (const traderId in tables.traders) {
            const trader = tables.traders[traderId];
            const assort = trader.assort;
            if (!assort) continue;

            // GLOBAL LIMITS
            if (affectGlobalLimits && assort?.barter_scheme) {
                for (const schemeId in assort.barter_scheme) {
                    const options = assort.barter_scheme[schemeId];
                    options.forEach(option => {
                        option.count = (mode === "unlimited")
                            ? 999999
                            : option.count * multiplier;
                        count++;
                    });
                }
            } else {
                logger.log("GLOBAL LIMITS DISABLE","yellow");
            }

            // PERSONAL LIMITS
            if (affectPersonalLimits && assort?.items) {
                for (const item of assort.items) {
                    if (item.upd) {
                        if (item.upd.BuyRestrictionMax !== undefined) {
                            item.upd.BuyRestrictionMax = (mode === "unlimited")
                                ? 999999
                                : item.upd.BuyRestrictionMax * multiplier;
                            count++;
                        }
                    }
                }
            } else {
                logger.log("PERSONAL LIMITS DISABLE","yellow");
            }
        }
        logger.success(`[Limitless] Mode "${mode}" applied to ${count} parameters.`);
    }
}

module.exports = { mod: new Mod() };
