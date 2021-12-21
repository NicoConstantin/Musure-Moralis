
Moralis.Cloud.define('testing', async (req) => {
    const logger = Moralis.Cloud.getLogger();
    const hash = req.params.hash
    
    const subscription_nameQuery = new Moralis.Query('BscTransactions');
    subscription_nameQuery.equalTo('hash', hash)
    const subscription_nameSubscription = await subscription_nameQuery.subscribe();

    subscription_nameSubscription.on('update', async (e)=>{

        const user = req.user;
        logger.info(JSON.stringify(user))
        try{
            const newEgg = new Egg();
            newEgg.set('timeHatch', getDate(cooldown_set_time, cooldown_set_type))
            newEgg.set('isHatched', false)
            newEgg.set('owner', user)
            newEgg.setACL(new Moralis.ACL(user))
            await newEgg.save(null, { useMasterKey:true })
    
            logger.info(JSON.stringify({
                
                created:true,
                messsage:"Egg created"
            }))  
        }
        
        catch(error){
            logger.info(JSON.stringify(error.message)) 
        }
        
    });
});