const Egg = Moralis.Object.extend('Egg');

Moralis.Cloud.define('mint_egg', async (req) => {
    
    const query_user = new Moralis.Query(Moralis.User)

    try{
        let actualUser = await query_user.get( req.user.id, { useMasterKey:true } )
        const newEgg = new Egg();
        newEgg.set('timeHatch', getDate(2,"hours"))
        newEgg.set('isHatched', false)
        newEgg.set('owner', actualUser)
        await newEgg.save()
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

    //LUEGO MANEJAR EL TEMA DINERO DEL USUARIO 
});

Moralis.Cloud.define('get_master_egg', async (req) => {

    const query_egg_master = new Moralis.Query('EGG_MASTER');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        let economy = await query_economy.find()
        let mastereggs = await query_egg_master.find()
        let price_egg = economy.find(el=>el.attributes.reference === "egg_price")
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