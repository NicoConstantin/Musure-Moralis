const Egg = Moralis.Object.extend('Egg');

//VALIDATED
Moralis.Cloud.define('mint_egg', async (req) => {
    
    const user = req.user;

    try{
        const newEgg = new Egg();
        newEgg.set('timeHatch', getDate(cooldown_set_time, cooldown_set_type))
        newEgg.set('isHatched', false)
        newEgg.set('owner', user)
        newEgg.setACL(new Moralis.ACL(user))
        await newEgg.save(null, { useMasterKey:true })

        return {
            created:true,
            messsage:"Egg created"
        }
    }
    
    catch(error){
        return error.message
    }

},{
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('get_master_egg', async () => {

    const query_egg_master = new Moralis.Query('EGG_MASTER');
    const query_economy = new Moralis.Query('ECONOMY');

    try {

        query_economy.equalTo('reference','mint_price')
        let price_egg = await query_economy.first()
        let mastereggs = await query_egg_master.find()
        
        return {
            master_eggs : mastereggs,
            price_egg: price_egg.attributes.price,
            message: 'Egg master info'
        }
    } catch (error) {
        return error.message
    }
},{
    requireUser: true
});