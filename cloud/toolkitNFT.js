Moralis.Cloud.define('get_economy_data', async (request) => {
    
    const query_economy = new Moralis.Query('ECONOMY')

    try {
        query_economy.containedIn("reference", ["commission_marketplace_nft_toolkit", "commission_nft_toolkit", "cost_nft_toolkit"])
        const economyData = await query_economy.find({useMasterKey: true})

        return {
            economy: economyData,
            message: 'Economy Data'
        }

    } catch (error) {
        return error.message
    }
});