
//VALIDATED
Moralis.Cloud.define('get_nfts_assets', async (req) => {

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

Moralis.Cloud.define('create_nft', async (req) => {
    
    const { name, lore, type, rarity, amount_emit, texture_left, texture_right, imageNFT, price, royalties, blockchain, collection_id, date, time, utc, release_time, notification_newsletter, notification_new_assets } = req.params;

    const user = req.user;

    try {
        const query_rarities_accessories = new Moralis.Query ('ACCESSORY_RARITY_MASTER');
        query_rarities_accessories.equalTo('rarity', rarity);
        let rarity_chosen = await query_rarities_accessories.first({ useMasterKey: true});

        const query_collection = new Moralis.Query('Collection')
        const collection = await query_collection.get(collection_id, {useMasterKey: true})

        let unixstamp = 0
        
        if(release_time){
            //VALIDATING TIME PARAMETERS
            let regexTime = /^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/

            if(date && typeof date !== 'string' || date.length !== 24){
                return 'Date must comply with the required parameters'
            }
            if(time && typeof time !== 'string' || regexTime.test(time)){
                return 'Time must comply with the required regex'
            }
            if(utc && typeof utc !== 'number' || utc < -11 || utc > 13){
                return 'UTC must comply with the required parameters'
            }

            //PROCESSING TIME
            if(date)
            unixstamp = Math.floor(Date.parse(date.slice(0,10)) / 1000 )
            let arrayTime = time.split(':')
            let hour = Number(arrayTime[0])
            let minutes = Number(arrayTime[1])
            unixstamp = unixstamp + ((hour - utc) * 3600)
            unixstamp = unixstamp + (minutes * 60)
        }

        if(notification_new_assets || notification_newsletter){
            user.set('notificationNewsletter', notification_newsletter);
            user.set('notificationNewAsset', notification_new_assets);
            await user.save(null,{ useMasterKey: true })
        }

        for (let i = 0; i < amount_emit; i++) {
            const new_NFT = new NFT();
            new_NFT.setACL(new Moralis.ACL(user));
            new_NFT.set('name', name);
            new_NFT.set('lore', lore);
            new_NFT.set('type', type);
            new_NFT.set('rarity', rarity);
            new_NFT.set('rarityNumber', rarity_chosen.attributes.rarityNumber);
            new_NFT.set('textureLeft', texture_left);
            new_NFT.set('textureRight', texture_right);
            new_NFT.set('imageNFT', imageNFT);
            new_NFT.set('owner', user);
            new_NFT.set('royalties', royalties);
            new_NFT.set('blockchain', blockchain);
            new_NFT.set('collection', collection);
            new_NFT.set('price', price);

            if(release_time){
                new_NFT.set('releaseTime', unixstamp);
                new_NFT.set('onSale', false);
                new_NFT.set('publishedTime', -1);
            } else {
                new_NFT.set('releaseTime', -1);
                new_NFT.set('onSale', true);
                new_NFT.set('publishedTime', getDate());
            }
            
            new_NFT.set('blocked', false);   
            new_NFT.set('pending', true);   

            await new_NFT.save(null,{useMasterKey: true});
            logger.info(JSON.stringify(`NFT number ${i} from ${user.id} created`));
        }

        return {
            created: true,
            message: `${amount_emit} NFT's created`
        }

    } catch (error) {
        return {
            created: false,
            message: error.message
        }
    }
},{
    fields:{
        name:{
            required: true,
            type: String,
            options: val=>{
                return val.length >= min_length_names && val.length <= max_length_names
            },
            error: `Name must be between ${min_length_names} and ${max_length_names} characters length`
        },
        lore:{
            required: true,
            type: String,
            options: val=>{
                return val.length >= min_length_bio && val.length <= max_length_bio
            },
            error: `Lore must be between ${min_length_bio} and ${max_length_bio} characters length`
        },
        rarity:{
            required: true,
            type: String,
            options: async(val)=>{
                let query_rarities = new Moralis.Query('ACCESSORY_RARITY_MASTER')
                let raw_rarities = await query_rarities.find({useMasterKey:true})
                rarities_availables = raw_rarities.map(rar=> rar.attributes.rarity)
                return rarities_availables.includes(val)
            },
            error: `Rarity must be one of the rarities declared`
        },
        amount_emit:{
            required: true,
            type: Number,
            options: val=>{
                const qty_emit = [5, 10, 20, 30, 40, 50]
                return qty_emit.includes(val)
            },
            error: `Amount_emit must be a number and one of the declared`
        },
        price:{
            required: true,
            type: Number,
            options: val=>{
                return val > 0
            },
            error: `Price must be a positive number`
        },
        type:{
            required: true,
            type: String,
            options: async(val)=>{
                let query_types = new Moralis.Query('ACCESSORY_TYPE_MASTER')
                let raw_types = await query_types.find({useMasterKey:true})
                types_availables = raw_types.map(rar=> rar.attributes.type)
                return types_availables.includes(val)
            },
            error: `Type must be one of the types declared`
        },
        texture_left:{
            required: true,
            type: String,
            options: val=>{
                return regex_ipfs_moralis.test(val)
            },
            error: `Texture_left must satisfy moralisIpfs regex`
        },
        texture_right:{
            required: true,
            type: String,
            options: val=>{
                return regex_ipfs_moralis.test(val)
            },
            error: `Texture_right must satisfy moralisIpfs regex`
        },
        imageNFT:{
            required: true,
            type: String,
            options: val=>{
                return regex_ipfs_moralis.test(val)
            },
            error: `ImageNFT must satisfy moralisIpfs regex`
        },
        royalties:{
            required: true,
            type: Number,
            options: val=>{
                return val > 0
            },
            error: `Royalties must be a positive number`
        },
        blockchain:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Polygon'
            },
            error: `Blockchain must be equal to Polygon`
        },
        collection_id:{
            ...validation_id,
            error: 'Collection_id is not a valid ID'
        },
        release_time:{
            required: true,
            type: Boolean,
            error: `Release_time must be a Boolean`
        },
        notification_newsletter:{
            required: true,
            type: Boolean,
            error: `Notification_newsletter must be a Boolean`
        },
        notification_new_assets:{
            required: true,
            type: Boolean,
            error: `Notification_new_assets must be a Boolean`
        },
    },
    requireUser: true
});