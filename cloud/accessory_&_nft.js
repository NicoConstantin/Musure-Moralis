
//VALIDATED
Moralis.Cloud.define('get_nfts_assets_main', async (req) => {

    const query_nfts_assets_main = new Moralis.Query('NFT_ASSETS_MAIN');

    try {
        const nfts_main = await query_nfts_assets_main.find({ useMasterKey: true })

        return {
            MainNFTs : nfts_main
        }

    } catch (error) {
        return error.message
    }
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