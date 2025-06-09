const fs = require("fs");
const path = require("path");

class TraderAssortLimitTweaker {
    mod = "TraderAssortLimitTweaker";

    constructor() {
        this.modPath = path.resolve(__dirname);
        this.configPath = path.join(__dirname, "..", "config.json");
    }

    postDBLoad(container) {
        const logger = container.resolve("WinstonLogger");
        const tables = container.resolve("DatabaseServer").getTables();

        let config = {};
        try {
            config = JSON.parse(fs.readFileSync(this.configPath, "utf-8"));
        } catch (err) {
            logger.error(`[${this.mod}] ❌ Failed to read config.json: ${err.message}`);
            return;
        }

        const {
            modeType = "option1",
            option1 = {
                mode: "multiply",
                multiplier: 10,
                affectGlobalLimits: true,
                affectPersonalLimits: true
            },
            option2 = {
                removePersonalLimits: true,
                affectGlobalLimits: false,
                setGlobalUnlimited: false
            }
        } = config;

        let count = 0;

        for (const traderId in tables.traders) {
            const trader = tables.traders[traderId];
            const assort = trader.assort;
            if (!assort) continue;

            if (modeType === "option1") {
                const { mode, multiplier, affectGlobalLimits, affectPersonalLimits } = option1;

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
                    logger.log("GLOBAL LIMITS DISABLED", "yellow");
                }

                // PERSONAL LIMITS
                if (affectPersonalLimits && assort?.items) {
                    for (const item of assort.items) {
                        if (item.upd && item.upd.BuyRestrictionMax !== undefined) {
                            item.upd.BuyRestrictionMax = (mode === "unlimited")
                                ? 999999
                                : item.upd.BuyRestrictionMax * multiplier;
                            count++;
                        }
                    }
                } else {
                    logger.log("PERSONAL LIMITS DISABLED", "yellow");
                }
            }

            if (modeType === "option2") {
                const { removePersonalLimits, affectGlobalLimits } = option2;

                // Remove personal limits
                if (removePersonalLimits && assort?.items) {
                    for (const item of assort.items) {
                        if (item.upd?.BuyRestrictionMax !== undefined) {
                            delete item.upd.BuyRestrictionMax;
                            delete item.upd.BuyRestrictionCurrent;
                            count++;
                        }
                    }
                } else {
                    logger.log("PERSONAL LIMITS DISABLED", "yellow");
                }

                // Optional: modify global limits
                if (affectGlobalLimits && assort?.barter_scheme) {
                    for (const schemeId in assort.barter_scheme) {
                        const options = assort.barter_scheme[schemeId];
                        options.forEach(option => {
                            option.count = 999999;
                            count++;
                        });
                    }
                } else {
                    logger.log("GLOBAL LIMITS DISABLED", "yellow");
                }
            }
        }

        logger.success(`[${this.mod}] ✅ Updated ${count} item(s) using modeType: ${modeType}`);
    }
}

module.exports = { mod: new TraderAssortLimitTweaker() };