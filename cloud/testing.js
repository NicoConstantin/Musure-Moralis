
Moralis.Cloud.define('testing', async (req) => {
    const logger = Moralis.Cloud.getLogger();
    const subscription_nameQuery = new Moralis.Query('BscTransactions');
    const subscription_nameSubscription = await subscription_nameQuery.subscribe();
    subscription_nameSubscription.on('create', (e)=>{
        return 'confirmed'
    });
    subscription_nameSubscription.on('update', async (e)=>{
        logger.info(JSON.stringify(e.attributes.confirmed))
        if(e.attributes.confirmed){
            let aux = await Moralis.Cloud.run('mint_egg') //ASI NO ANDA
            return aux
        }
    });
});