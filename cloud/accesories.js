const Accesory = Moralis.Object.extend('Accessory');

Moralis.Cloud.define('get_master_accessories', async (req) => {

    const query_accessory_type = new Moralis.Query('ACCESSORY_TYPE_MASTER');
    const query_accessory_rarity = new Moralis.Query('ACCESSORY_RARITY_MASTER');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        let accessoriesTypes = await query_accessory_type.find();
        let accessoriesRate = await query_accessory_rarity.find();
        query_economy.equalTo('reference','accessory_price')
        let accessoriesPrice = await query_economy.first()

        return {
            accessoriesTypes,
            accessoriesRate,
            accessoriesPrice 
        }

    } catch (error) {
        return {
            status: false,
            message: error.message
        }
        
    }
});

Moralis.Cloud.define('mint_accesory', async (req) => {

    const query_accessory_type = new Moralis.Query('ACCESSORY_TYPE_MASTER');
    const query_accessory_rarity = new Moralis.Query('ACCESSORY_RARITY_MASTER');
    const query_user = new Moralis.Query(Moralis.User);

    try {
        let accessoriesTypes = await query_accessory_type.find();
        let accessoriesRate = await query_accessory_rarity.find();
        let actualUser = await query_user.get(req.user.id, { useMasterKey:true })

        let type = getRandomType(accessoriesTypes)
        let rarity = getRandomRarity(accessoriesRate)
        let power = getRandomPower(rarity.attributes.maxPower, rarity.attributes.minPower)

        const newAccessory = new Accesory();
        newAccessory.set('type', type.attributes.type)
        newAccessory.set('rarity', rarity.attributes.rarity)
        newAccessory.set('power', power)
        newAccessory.set('owner', actualUser)
        await newAccessory.save()
        

        return {
           created: true,
           accessory: newAccessory,
           message: "Accessory created"
        }
        
    } catch (error) {
        return {
            created: false,
            message: error.message
         }
    }

});

Moralis.Cloud.define('equip_accessory', async (req) => {

    const query_accessory = new Moralis.Query('Accessory');
    const query_avatar = new Moralis.Query('Avatar');

    try {
        let avatar = await query_avatar.get(req.params.avatar_id);
        let accessory = await query_accessory.get(req.params.accessory_id);
        let typeAcc = accessory.attributes.type.toLowerCase()

        if(avatar.attributes.owner.id !== accessory.attributes.owner.id) {
            return "Imposible"
        }
        if(avatar.attributes[typeAcc]){
            return {
                equiped:false,
                message: "Avatar already have that kind of item equiped"
            }
        }
        else{
            accessory.set('equipedOn', avatar)
            avatar.set(typeAcc, accessory)
            avatar.set('power', avatar.attributes.power + accessory.attributes.power)
            await avatar.save()
    
            return {
               equiped: true,
               message: "Accessory equiped"
            }
        }
        
    } catch (error) {
        return {
            equiped: false,
            message: error.message
         }
    }

});