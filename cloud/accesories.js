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
// Moralis.Cloud.define('mint_accessory', async (req) => {

//     const query_accessory_type = new Moralis.Query('ACCESSORY_TYPE_MASTER');
//     const query_accessory_rarity = new Moralis.Query('ACCESSORY_RARITY_MASTER');

//     const user = req.user;

//     try {
//         let accessoriesTypes = await query_accessory_type.find();
//         let accessoriesRate = await query_accessory_rarity.find();

//         //GETTING RANDOMIZERS
//         let type = getRandomType(accessoriesTypes)
//         let rarity = getRandomRarity(accessoriesRate)
//         let power = getRandomPower(rarity.attributes.maxPower, rarity.attributes.minPower)

//         //SETTING ACCESSORY FIELDS
//         const newAccessory = new Accesory();
//         newAccessory.set('type', type.attributes.type)
//         newAccessory.set('rarity', rarity.attributes.rarity)
//         newAccessory.set('rarityNumber', rarity.attributes.rarityNumber)
//         newAccessory.set('durationLeft', rarity.attributes.maxDuration)
//         newAccessory.set('power', power)
//         newAccessory.set('owner', user)
//         newAccessory.set('onSale', false)
//         newAccessory.set('publishedTime', -1)
//         newAccessory.setACL(new Moralis.ACL(user))
//         await newAccessory.save(null, { useMasterKey:true })
        
//         return {
//            created: true,
//            accessory: newAccessory,
//            message: "Accessory created"
//         }
        
//     } catch (error) {
//         return error.message
//     }

// },{
//     requireUser: true
// });

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
        if(avatar.attributes.timeMine >= getDate()){
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
        if(avatar.attributes.timeMine >= getDate()){
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

    const query_accessories = new Moralis.Query('Accessory')

    const user = req.user;

    try {
        query_accessories.equalTo('owner', user)
        query_accessories.equalTo("onSale", false);
        let rawAccessories = await query_accessories.find({useMasterKey:true})
        let accessoriesUser = {}

        //SORTING DATA TO BE SEND
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

//VALIDATED
Moralis.Cloud.define('buy_accessory', async (req) => {
    
    const query_accessory = new Moralis.Query('Accessory')
    const accessory_id = req.params.accessory_id;
    const user = req.user;

    try {

        let accessory = await query_accessory.get(accessory_id, {useMasterKey: true})

        //VALIDATING CONTEXT
        if(accessory.attributes.owner.id === user.id){
            return 'you cannot buy your own accessory'
        }
        if(!accessory.attributes.onSale){
            return 'this accessory is not on sale'
        }
        else{
            //TRANSFERING ACCESSORY
            accessory.set('price', null)
            accessory.set('onSale', false)
            accessory.set('publishedTime', -1)
            accessory.set('owner', user)
            accessory.setACL(new Moralis.ACL(user))
            await accessory.save(null, {useMasterKey:true})
    
            return {
                transferred: true,
                message: 'accessory transferred'
            }
        }
        
    } catch (error) {
        return error.message
    }
},{
    fields:{
        accessory_id: {
            ...validation_id,
            error: "accessory_id is not passed or has an error"
        },

    },
    requireUser: true
});