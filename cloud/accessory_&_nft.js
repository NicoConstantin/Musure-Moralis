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
    
    const { avatar_id, item_id, item_kind } = req.params;
    
    const query_avatar = new Moralis.Query('Avatar');
    const query_item = new Moralis.Query(item_kind);

    try {
        
        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});
        let item = await query_item.get(item_id, {useMasterKey:true});
        
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
        if(item.attributes.equippedOn){
            return {
                equipped:false,
                message: 'That item is equipped in another avatar'
            }
        }
        if(avatar.attributes.onSale){
            return 'Your avatar is on sale, you cannot equip any item'
        }
        if(avatar.attributes.playsLeft === 0){
            return 'Your cannot equip items if your avatar is tired'
        }
        if(item.attributes.rarityNumber > avatar.attributes.rarityNumber){
            return 'You cannot equip an item whose power is greater than the avatar'
        }

        //EQUIPPING ITEM
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
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Accessory' || val === 'AccessoryNFT' 
            },
            error:"item_kind must be equal to 'Accessory' or 'AccessoryNFT'"
        },
    },
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('unequip_item', async (req) => {

    const { avatar_id, item_id, item_kind } = req.params;
    
    const query_avatar = new Moralis.Query('Avatar');
    let query_item = new Moralis.Query(item_kind);

    try {
        
        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});
        let item = await query_item.get(item_id, {useMasterKey:true});
        
        let type_item = item.attributes.type.toLowerCase()

        //VALIDATING CONTEXT
        if(avatar.attributes.owner.id !== item.attributes.owner.id) {
            return "Not allowed"
        }
        if(!item.attributes.equippedOn){
            return "You cannot unequip something that is not equipped :)"
        }
        if(avatar.attributes.onSale){
            return 'Your avatar is on sale, you cannot unequip any item'
        }
        //REVISAR
        if(avatar.attributes.playsLeft === 0){
            return 'Your cannot unequip items if your avatar is tired'
        }

        //UNEQUIPPING ITEM
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
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Accessory' || val === 'AccessoryNFT' 
            },
            error:"item_kind must be equal to 'Accessory' or 'AccessoryNFT'"
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
        
        if(item_kind === 'Accessory' || item_kind === 'All'){
            results = {
                ...results,
                accessories: await getItems('Accessory', filter, sort, user)
            }
        }
        if(item_kind === 'AccessoryNFT' || item_kind === 'All'){
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
                return val === 'Accessory' || val === 'AccessoryNFT' || val === 'All'
            },
            error:"item_kind must be equal to 'Accessory', 'All' or 'AccessoryNFT'"
        },
    },
    requireUser: true 
});

//VALIDATED
Moralis.Cloud.define('put_onsale_item', async (req) => {

    const { price, item_id, item_kind } = req.params;
    
    const query_avatar = new Moralis.Query('Avatar');
    const query_item = new Moralis.Query(item_kind);
    
    try {
        let item = await query_item.get(item_id, {useMasterKey:true});

        //VALIDATING CONTEXT
        if(item.attributes.equippedOn){
            let avatar_to_unequip = await query_avatar.get(item.attributes.equippedOn, {useMasterKey:true})

            //UNEQUIPPING ITEM FROM AVATAR
            avatar_to_unequip.set(item.attributes.type.toLowerCase(), null)
            avatar_to_unequip.set('power', avatar_to_unequip.attributes.power - item.attributes.power)
            await avatar_to_unequip.save(null, {useMasterKey:true})
        }

        //SETTING ACCESORY FIELDS
        item.set('price', price)
        item.set('onSale', true)
        item.set('publishedTime', getDate())
        await item.save(null, {useMasterKey:true})

        return {
            onSale: true,
            message: 'Item was successfully put on sale'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        price: validation_price,
        item_id:{
            ...validation_id,
            error: "item_id is not passed or has an error"
        },
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Accessory' || val === 'AccessoryNFT'
            },
            error:"item_kind must be equal to 'Accessory' or 'AccessoryNFT'"
        }
    },
    requireUser: true 
});

//VALIDATED
Moralis.Cloud.define('kick_onsale_item', async (req) => {

    const { item_id, item_kind } = req.params;
    
    let query_item = new Moralis.Query(item_kind);

    try {
        let item = await query_item.get(item_id, {useMasterKey:true});

        //SETTING ITEM FIELDS
        item.set('price', null)
        item.set('onSale', false)
        item.set('publishedTime', -1)
        await item.save(null, {useMasterKey:true})

        return {
            removed: true,
            message: 'Item was successfully removed from sale'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        item_id:{
            ...validation_id,
            error: "item_id is not passed or has an error"
        },
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Accessory' || val === 'AccessoryNFT'
            },
            error:"item_kind must be equal to 'Accessory' or 'AccessoryNFT'"
        }
    },
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('get_item', async (req) => {
    
    const { item_id, item_kind} = req.params;

    const query_item = new Moralis.Query(item_kind);

    try {
        const item_required = await query_item.get(item_id, { useMasterKey:true })

        return {
            item: item_required,
            message: 'Item required'
        }
    } catch (error) {
        return error.message
    }
},{
    fields:{
        item_id:{
            ...validation_id,
            error: "item_id is not passed or has an error"
        },
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Accessory' || val === 'AccessoryNFT'
            },
            error:"item_kind must be equal to 'Accessory' or 'AccessoryNFT'"
        }
    },
    requireUser: true
});