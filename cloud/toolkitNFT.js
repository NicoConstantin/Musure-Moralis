
Moralis.Cloud.define('get_economy_data', async (req) => {
    
    const query_economy = new Moralis.Query('ECONOMY')

    try {
        query_economy.containedIn("reference", ["commission_marketplace_nft_toolkit", "commission_nft_toolkit", "cost_nft_toolkit",'commission_future_sales'])
        const economyData = await query_economy.find({useMasterKey: true})
        logger.info(JSON.stringify(economyData))
        let economyObj = {};

        for (let i = 0; i < economyData.length; i++) {
            economyObj[economyData[i].attributes.reference] = economyData[i].attributes.price
        }
        logger.info(JSON.stringify(economyObj))
        return {
            economy: economyObj,
            message: 'Economy Data'
        }

    } catch (error) {
        return error.message
    }
});
