const Egg = Moralis.Object.extend('Egg');

//VALIDATED
Moralis.Cloud.define('get_master_egg', async () => {

    const query_egg_master = new Moralis.Query('EGG_MASTER');
    const query_economy = new Moralis.Query('ECONOMY');

    try {

        query_economy.equalTo('reference','mint_avatar')
        let price_egg = await query_economy.first()
        query_egg_master.descending('dropRate')
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