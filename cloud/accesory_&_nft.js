const Accesory = Moralis.Object.extend('Accessory');

//VALIDATED
Moralis.Cloud.define('get_master_accessories', async(req) => {

    const query_accessory_type = new Moralis.Query('ACCESSORY_TYPE_MASTER');
    const query_accessory_rarity = new Moralis.Query('ACCESSORY_RARITY_MASTER');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        let accessoriesTypes = await query_accessory_type.find({useMasterKey:true});
        let accessoriesRate = await query_accessory_rarity.find({useMasterKey:true});
        query_economy.equalTo('reference','accessory_price')
        let accessoriesPrice = await query_economy.first({useMasterKey:true})

        return {
            accessoriesTypes,
            accessoriesRate,
            accessoriesPrice 
        }

    } catch (error) {
        return error.message
    }
});

//VALIDATED
Moralis.Cloud.define('equip_item', async(req) => {
    
    const query_accessory = new Moralis.Query('Accessory');
    const query_avatar = new Moralis.Query('Avatar');
    const query_nft = new Moralis.Query('AccessoryNFT');

    const { avatar_id, item_id, item_kind } = req.params;

    try {
        
        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});
        let item;
        
        if(item_kind === 'accessory'){
            item = await query_accessory.get(item_id, {useMasterKey:true});
        }
        if(item_kind === 'nft'){
            item = await query_nft.get(item_id, {useMasterKey:true});
        }
        let type_item = item.attributes.type.toLowerCase()


        //VALIDATING CONTEXT
        if(avatar.attributes.owner.id !== item.attributes.owner.id) {
            return "Not allowed"
        }
        if(avatar.attributes[type_item]){
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
        if(item.attributes.rarityNumber > avatar.attributes.rarityNumber){
            return 'You cannot equip an accessory whose power is greater than the avatar'
        }

        //EQUIPPING ACCESSORY
        else{
            item.set('equippedOn', avatar)
            await item.save(null, {useMasterKey:true})
            avatar.set(type_item, item)
            avatar.set('power', avatar.attributes.power + item.attributes.power)
            await avatar.save(null, {useMasterKey:true})
    
            return {
               equipped: true,
               avatar: avatar,
               message: "Item equipped"
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
        item_id:{
            ...validation_id,
            error: "item_id is not passed or has an error"
        },
    },
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('unequip_item', async (req) => {

    const query_accessory = new Moralis.Query('Accessory');
    const query_avatar = new Moralis.Query('Avatar');
    const query_nft = new Moralis.Query('AccessoryNFT');

    const { avatar_id, item_id, item_kind } = req.params;

    try {
        
        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});
        let item;
        
        if(item_kind === 'accessory'){
            item = await query_accessory.get(item_id, {useMasterKey:true});
        }
        if(item_kind === 'nft'){
            item = await query_nft.get(item_id, {useMasterKey:true});
        }
        let type_item = item.attributes.type.toLowerCase()

        //VALIDATING CONTEXT
        if(avatar.attributes.owner.id !== item.attributes.owner.id) {
            return "Not allowed"
        }
        if(!item.attributes.equippedOn){
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
            item.set('equippedOn', null)
            await item.save(null, {useMasterKey:true})

            avatar.set(type_item, null)
            avatar.set('power', avatar.attributes.power - item.attributes.power)
            await avatar.save(null, {useMasterKey:true})
    
            return {
               unequipped: true,
               avatar: avatar,
               message: "Item unequipped"
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
        item_id:{
            ...validation_id,
            error: "item_id is not passed or has an error"
        },
    },
    requireUser: true 
});

//VALIDATED
Moralis.Cloud.define('get_items', async (req) => {

    const { filter, sort, item_kind } = req.params;
    const user = req.user;
    
    try {
        let results = {};
        
        if(item_kind === 'accessory' || item_kind === 'all'){
            results = {
                ...results,
                accessories: await getItems('Accessory', filter, sort, user)
            }
        }
        if(item_kind === 'nft' || item_kind === 'all'){
            results = {
                ...results,
                nfts: await getItems('AccessoryNFT', filter, sort, user)
            }
        }
        return {
            results,
            count: results.nfts.length + results.accessories.length,
            message: 'Items that were ordered'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'accessory' || val === 'nft' || val === 'all'
            },
            error:"item_kind must be equal to 'accessory', 'all' or 'nft'"
        },
    },
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