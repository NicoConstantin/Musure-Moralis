
Moralis.Cloud.define('get_economy', async (req) => {

    const query_economy = new Moralis.Query('ECONOMY');

    try {
        let result = query_economy.find()
        return {
            economy: result,
            message: 'Economy data'
        }
        
    } catch (error) {
        return {
            economy: false,
            message: error.message
        }
    }
});