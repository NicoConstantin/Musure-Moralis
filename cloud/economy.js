Moralis.Cloud.define('get_prices', async (req) => {

    const query_economy = new Moralis.Query('ECONOMY')

    try {
        let prices = await query_economy.find()
        return {
            prices : prices,
            message: 'Prices info'
        }
    } catch (error) {
        return {
            prices : prices,
            message: error.message
        }
    }
});