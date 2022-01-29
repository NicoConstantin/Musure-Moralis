const Accesory = Moralis.Object.extend('Accessory');

//VALIDATED
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
        return error.message
    }
},{
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('equip_accessory', async (req) => {
    
    const query_accessory = new Moralis.Query('Accessory');
    const query_avatar = new Moralis.Query('Avatar');

    const { avatar_id, accessory_id } = req.params;

    try {
        
        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});
        let accessory = await query_accessory.get(accessory_id, {useMasterKey:true});
        let typeAcc = accessory.attributes.type.toLowerCase()

        //VALIDATING CONTEXT
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
        if(avatar.attributes.onSale){
            return 'Your avatar is on sale, you cannot equip any accessory'
        }
        //REVISAR
        if(avatar.attributes.playsLeft === 0){
            return 'Your cannot equip accessories if your avatar is tired'
        }
        if(accessory.attributes.rarityNumber > avatar.attributes.rarityNumber){
            return 'You cannot equip an accessory whose power is greater than the avatar'
        }

        //EQUIPPING ACCESSORY
        else{
            accessory.set('equippedOn', avatar)
            await accessory.save(null, {useMasterKey:true})
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
        return error.message
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
    },
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('unequip_accessory', async (req) => {

    const query_accessory = new Moralis.Query('Accessory');
    const query_avatar = new Moralis.Query('Avatar');

    const { avatar_id, accessory_id } = req.params;

    try {

        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});
        let accessory = await query_accessory.get(accessory_id, {useMasterKey:true});
        let typeAcc = accessory.attributes.type.toLowerCase()

        //VALIDATING CONTEXT
        if(avatar.attributes.owner.id !== accessory.attributes.owner.id) {
            return "Not allowed"
        }
        if(!accessory.attributes.equippedOn){
            return "You cannot unequip something that is not equipped :)"
        }
        if(avatar.attributes.onSale){
            return 'Your avatar is on sale, you cannot unequip any accessory'
        }
        //REVISAR
        if(avatar.attributes.playsLeft === 0){
            return 'Your cannot unequip accessories if your avatar is tired'
        }

        //UNEQUIPPING ACCESSORY
        else{
            accessory.set('equippedOn', null)
            await accessory.save(null, {useMasterKey:true})

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
        return error.message
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
    },
    requireUser: true 
});
//VALIDATED

Moralis.Cloud.define('get_accessories', async (req) => {

    const { filter, sort } = req.params
    const user = req.user

    const query_user_accessories = new Moralis.Query('Accessory');

    try {
        query_user_accessories.equalTo('owner', user)
        query_user_accessories.equalTo("onSale", false);
        query_user_accessories.equalTo("equippedOn", null);
        //FILTERING
        if (filter){
            if (filter.rarity) {
                query_user_accessories.equalTo('rarityNumber', filter.rarity)
            }
            if (filter.powerMin) {
                query_user_accessories.greaterThanOrEqualTo('power', filter.powerMin)
            }
            if (filter.powerMax) {
                query_user_accessories.lessThanOrEqualTo('power', filter.powerMax)
            }
            if (filter.type){
                query_user_accessories.equalTo('type', filter.type)
            }
        }
        //SORTING
        if (sort){
            if(sort.type){
                query_user_accessories[sort.type]('type')
            }
            if(sort.rarity){
                query_user_accessories[sort.rarity]('rarityNumber')
            }
            if(sort.power){
                query_user_accessories[sort.power]('power')
            }
            if(sort.durationLeft){
                query_user_accessories[sort.durationLeft]('durationLeft')
            }
        }
        query_user_accessories.limit(1000)
        query_user_accessories.withCount()

        let resultAccessories = await query_user_accessories.find({useMasterKey:true})

        return {
            ...resultAccessories,
            message: 'Items that were ordered'
        }

    } catch (error) {
        return error.message
    }
},{
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('put_onsale_accessory', async (req) => {
    const query_accessory = new Moralis.Query('Accessory');

    const { price, accessory_id } = req.params;
    
    try {
        let accessoryToSell = await query_accessory.get(accessory_id, {useMasterKey:true})

        //VALIDATING CONTEXT
        if(accessoryToSell.attributes.equippedOn){
            const query_avatar = new Moralis.Query('Avatar');
            let avatarToUnequip = await query_avatar.get(accessoryToSell.attributes.equippedOn, {useMasterKey:true})

            //UNEQUIPPING ACCESSORY FROM AVATAR
            avatarToUnequip.set(accessoryToSell.attributes.type.toLowerCase(), null)
            avatarToUnequip.set('power', avatarToUnequip.attributes.power - accessoryToSell.attributes.power)
            await avatarToUnequip.save(null, {useMasterKey:true})
        }

        //SETTING ACCESORY FIELDS
        accessoryToSell.set('price', price)
        accessoryToSell.set('onSale', true)
        accessoryToSell.set('publishedTime', getDate())
        await accessoryToSell.save(null, {useMasterKey:true})

        return {
            onSale: true,
            message: 'Accessory was successfully put on sale'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        price: validation_price,
        accessory_id:{
            ...validation_id,
            error: "accessory_id is not passed or has an error"
        },
    },
    requireUser: true 
});

//VALIDATED
Moralis.Cloud.define('kick_onsale_accessory', async (req) => {

    const query_accessory = new Moralis.Query('Accessory');

    const accessory_id = req.params.accessory_id;
    
    try {
        let accessoryToSell = await query_accessory.get(accessory_id, {useMasterKey:true})

        //SETTING ACCESSORY FIELDS
        accessoryToSell.set('price', null)
        accessoryToSell.set('onSale', false)
        accessoryToSell.set('publishedTime', -1)
        await accessoryToSell.save(null, {useMasterKey:true})

        return {
            removed: true,
            message: 'Accessory was successfully removed from sale'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        accessory_id:{
            ...validation_id,
            error: "accessory_id is not passed or has an error"
        },
    },
    requireUser: true
});