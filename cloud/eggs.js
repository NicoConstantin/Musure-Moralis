const Egg = Moralis.Object.extend('Egg');
//VALIDATED
Moralis.Cloud.define('mint_egg', async (req) => {
    
    const query_user = new Moralis.Query(Moralis.User)

    try{
        let actualUser = await query_user.get( req.user.id, { useMasterKey:true } )
        const newEgg = new Egg();
        newEgg.set('timeHatch', getDate(cooldown_set_time, cooldown_set_type))
        newEgg.set('isHatched', false)
        newEgg.set('owner', actualUser)
        newEgg.setACL(new Moralis.ACL(req.user))
        await newEgg.save(null, { useMasterKey:true })

        return {
            created:true,
            messsage:"Egg created"
        }
    }
    
    catch(error){
        return {
            created: false,
            messsage: error.message
        }
    }

});
//NOT REQUIRE VALIDATION
Moralis.Cloud.define('get_master_egg', async (req) => {

    const query_egg_master = new Moralis.Query('EGG_MASTER');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        query_economy.equalTo('reference','egg_price')
        let price_egg = await query_economy.first()
        let mastereggs = await query_egg_master.find()
        
        return {
            master_eggs : mastereggs,
            price_egg: price_egg.attributes.price,
            message: 'Egg master info'
        }
    } catch (error) {
        return {
            master_eggs : false,
            message: error.message
        }
    }
});