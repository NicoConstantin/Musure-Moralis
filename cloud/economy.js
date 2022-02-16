//VALIDATED
Moralis.Cloud.define('get_economy', async () => {

    const query_economy = new Moralis.Query('ECONOMY');

    try {
        let result = await query_economy.find()
        return {
            economy: result,
            message: 'Economy data'
        }
        
    } catch (error) {
        return error.message
    }
});