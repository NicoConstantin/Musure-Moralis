const Accesory = Moralis.Object.extend('Accessory');
//NOT REQUIRE VALIDATION
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

//VALIDATED
Moralis.Cloud.define('mint_accessory', async (req) => {

    const query_accessory_type = new Moralis.Query('ACCESSORY_TYPE_MASTER');
    const query_accessory_rarity = new Moralis.Query('ACCESSORY_RARITY_MASTER');

    try {
        let accessoriesTypes = await query_accessory_type.find();
        let accessoriesRate = await query_accessory_rarity.find();

        let type = getRandomType(accessoriesTypes)
        let rarity = getRandomRarity(accessoriesRate)
        let power = getRandomPower(rarity.attributes.maxPower, rarity.attributes.minPower)

        const newAccessory = new Accesory();
        newAccessory.set('type', type.attributes.type)
        newAccessory.set('rarity', rarity.attributes.rarity)
        newAccessory.set('power', power)
        newAccessory.set('owner', req.user)
        newAccessory.setACL(new Moralis.ACL(req.user))
        await newAccessory.save(null, { useMasterKey:true })
        

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
//VALIDATED
Moralis.Cloud.define('equip_accessory', async (req) => {
    const query_accessory = new Moralis.Query('Accessory');
    const query_avatar = new Moralis.Query('Avatar');

    try {
        
        let avatar = await query_avatar.get(req.params.avatar_id, {useMasterKey:true});
        let accessory = await query_accessory.get(req.params.accessory_id, {useMasterKey:true});
        let typeAcc = accessory.attributes.type.toLowerCase()
        if(avatar.attributes.owner.id !== accessory.attributes.owner.id) {
            return "Not allowed"
        }
        if(avatar.attributes[typeAcc]){
            return {
                equipped:false,
                message: "Avatar already have that kind of item equipped"
            }
        }
        if(accessory.attributes.equippedOn){
            return {
                equipped:false,
                message: 'That accessory is equipped in another avatar'
            }
        }
        else{
            accessory.set('equippedOn', avatar)
            avatar.set(typeAcc, accessory)
            avatar.set('power', avatar.attributes.power + accessory.attributes.power)
            await avatar.save(null, {useMasterKey:true})
    
            return {
               equipped: true,
               avatar: avatar,
               message: "Accessory equipped"
            }
        }
        
    } catch (error) {
        return {
            equipped: false,
            message: error.message
         }
    }

},{
    fields:{
        avatar_id:{
            ...validation_id,
            error: "avatar_id is not passed or has an error"
        },
        accessory_id:{
            ...validation_id,
            error: "accessory_id is not passed or has an error"
        },
    }
});
//VALIDATED
Moralis.Cloud.define('unequip_accessory', async (req) => {

    const query_accessory = new Moralis.Query('Accessory');
    const query_avatar = new Moralis.Query('Avatar');

    try {

        let avatar = await query_avatar.get(req.params.avatar_id, {useMasterKey:true});
        let accessory = await query_accessory.get(req.params.accessory_id, {useMasterKey:true});
        let typeAcc = accessory.attributes.type.toLowerCase()

        if(avatar.attributes.owner.id !== accessory.attributes.owner.id) {
            return "Not allowed"
        }
        if(!accessory.attributes.equippedOn){
            return "You cannot unequip something that is not equipped :)"
        }
        else{
            accessory.set('equippedOn', null)
            avatar.set(typeAcc, null)
            avatar.set('power', avatar.attributes.power - accessory.attributes.power)
            await avatar.save(null, {useMasterKey:true})
    
            return {
               unequipped: true,
               avatar: avatar,
               message: "Accessory unequipped"
            }
        }
        
    } catch (error) {
        return {
            unequipped: false,
            message: error.message
         }
    }

},{
    fields:{
        avatar_id:{
            required: true,
            type: String,
            options: val=>{
                return val.length === 24
            },
            error: "avatar_id is not passed or has an error"
        },
        accessory_id:{
            required: true,
            type: String,
            options: val=>{
                return val.length === 24
            },
            error: "accessory_id is not passed or has an error"
        },
    } 
});
//NOT REQUIRE VALIDATION
Moralis.Cloud.define('get_accessories', async (req) => {

    const query_accessories = new Moralis.Query('Accessory')

    try {
        query_accessories.equalTo('owner', req.user)
        let rawAccessories = await query_accessories.find({useMasterKey:true})
        let accessoriesUser = {}

        for (let i = 0; i < rawAccessories.length; i++) {
            let type = rawAccessories[i].attributes.type
            if (accessoriesUser[type]){
                accessoriesUser[type].push(rawAccessories[i])
            }
            else{
                accessoriesUser[type] = [rawAccessories[i]]
            }
            
        }

        return {
            accessories: accessoriesUser,
            message: "User accessories"
        }

    } catch (error) {
        return {
            accessories: false,
            message: error.message
        }
    }
});
