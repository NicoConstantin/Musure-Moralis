Moralis.Cloud.define('get_nfts_assets', async (req) => {

    const query_nfts_assets_main = new Moralis.Query('ACCESSORY_TYPE_MASTER');

    try {
        const nfts_main = await query_nfts_assets_main.find({ useMasterKey: true })

        return {
            MainNFTs : nfts_main
        }

    } catch (error) {
        return error.message
    }
});

Moralis.Cloud.define('get_nft', async (req) => {
    
    const nft_id = req.params.nft_id;
    
    try {
        const query_nfts = new Moralis.Query('AccessoryNFT');
        query_nfts.equalTo('idNFT', nft_id)
        query_nfts.include('collection')
        query_nfts.include('owner')
        const nfts_raw = await query_nfts.find({ useMasterKey:true })
        if(nfts_raw.length <=0){
            throw new Error('idNFT not existent')
        }
        const nfts_onsale_left = nfts_raw.filter(nft=>nft.attributes.onSale)
        const nfts_original_onsale = nfts_raw.filter(nft=>nft.attributes.onSale && nft.attributes.createdBy.id === nft.attributes.owner.id)

        return {
            nft: nfts_raw[0],
            amount_emitted: nfts_raw.length,
            amount_onsale_left: nfts_onsale_left.length,
            amount_original_onsale_left: nfts_original_onsale.length,
            message: 'NFT required'
        }
    } catch (error) {
        return error.message
    }
},{
    fields:{
        nft_id:{
            ...validation_id,
            error: "Nft_id is not passed or has an error"
        }
    }
});

Moralis.Cloud.define('create_nft', async (req) => {
    
    const { name, lore, type, rarity, amount_emit, texture_left, texture_right, imageNFT, price, royalties, blockchain, collection_id, date, time, timezone, release_time, notification_newsletter, notification_new_assets } = req.params;

    const user = req.user;
    let collection;

    try {
        const query_rarities_accessories = new Moralis.Query ('ACCESSORY_RARITY_MASTER');
        query_rarities_accessories.equalTo('rarity', rarity);
        let rarity_chosen = await query_rarities_accessories.first({ useMasterKey: true});

        if(collection_id !== 'unique'){
            const query_collection = new Moralis.Query('Collection')
            collection = await query_collection.get(collection_id, {useMasterKey: true})
        }

        let unixstamp = 0
        if(release_time){
            //VALIDATING TIME PARAMETERS
            
            if(date && typeof date !== 'string' || !regex_date.test(date)){
                return 'Date must comply with the required parameters'
            }
            if(time && typeof time !== 'string' || !regex_time.test(time)){
                return 'Time must comply with the required regex'
            }
            if(timezone && typeof timezone !== 'string' || !regex_timezone.test(time)){
                return 'Timezone must comply with the required parameters'
            }
            
            unixstamp = timeParser(date, time, timezone)
        }
        
        //SETTING NOTIFICATION FIELDS
        if(notification_new_assets || notification_newsletter){
            user.set('notificationNewsletter', notification_newsletter);
            user.set('notificationNewAsset', notification_new_assets);
            await user.save(null,{ useMasterKey: true })
        }
        
        //GENERATING ID FOR NFT
        nftID = generateIdNFT(user, name)
        
        //CREATING NFTS
        for (let i = 0; i < amount_emit; i++) {
            const new_NFT = new NFT();
            new_NFT.setACL(new Moralis.ACL(user));
            new_NFT.set('idNFT', nftID);
            new_NFT.set('name', name);
            new_NFT.set('lore', lore);
            new_NFT.set('type', type);
            new_NFT.set('rarity', rarity);
            new_NFT.set('rarityNumber', rarity_chosen.attributes.rarityNumber);
            new_NFT.set('textureLeft', texture_left);
            new_NFT.set('textureRight', texture_right);
            new_NFT.set('imageNFT', imageNFT);
            new_NFT.set('owner', user);
            new_NFT.set('createdBy', user)
            new_NFT.set('royalties', royalties);
            new_NFT.set('blockchain', blockchain);
            new_NFT.set('teaser', null);
            new_NFT.set('filterAR', null);
            new_NFT.set('price', price);

            if(collection){
                new_NFT.set('collection', collection);
            }
            else{
                new_NFT.set('collection', null);
            }
            if(release_time){
                new_NFT.set('releaseTime', unixstamp);
                new_NFT.set('onSale', false);
                new_NFT.set('publishedTime', null);
            }
            else{
                new_NFT.set('releaseTime', null);
                new_NFT.set('onSale', true);
                new_NFT.set('publishedTime', getDate());
            }

            await new_NFT.save(null,{useMasterKey: true});
            logger.info(JSON.stringify(`NFT number ${i} from ${user.id} created`));
        }

        return {
            created: nftID,
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
        name: validation_name,
        lore: validation_lore_bio,
        rarity: validation_rarity,
        amount_emit:{
            required: true,
            type: Number,
            options: val=>{
                const qty_emit = [1, 10, 25, 50, 100]
                return qty_emit.includes(val)
            },
            error: `Amount_emit must be a number and one of the declared`
        },
        price: validation_price,
        type: validation_type,
        texture_left:{
            ...validation_moralis_url,
            error: `Texture_left must satisfy moralisIpfs regex`
        },
        texture_right:{
            ...validation_moralis_url,
            error: `Texture_right must satisfy moralisIpfs regex`
        },
        imageNFT:{
            ...validation_moralis_url,
            error: `ImageNFT must satisfy moralisIpfs regex`
        },
        royalties:{
            required: true,
            type: Number,
            options: val=>{
                return val >= 0 && val <= 100
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
            required: true,
            type: String,
            options: val=>{
                return val.length === 24 || val === 'unique'
            },
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

Moralis.Cloud.define('get_nft_economy', async (req) => {
    
    const query_economy = new Moralis.Query('ECONOMY')

    try {
        query_economy.containedIn("reference", ["commission_marketplace", "commission_musure", "cost_nft_creation",'property_nft_owner'])
        const economyData = await query_economy.find({useMasterKey: true})
        let economyObj = {};

        for (let i = 0; i < economyData.length; i++) {
            economyObj[economyData[i].attributes.reference] = economyData[i].attributes.price
        }
        return {
            economy: economyObj,
            message: 'Economy Data'
        }

    } catch (error) {
        return error.message
    }
});

Moralis.Cloud.define('buy_nft', async (req) => {

    const nft_id = req.params.nft_id;

    const user = req.user;
    
    try {
        const query_nft = new Moralis.Query('AccessoryNFT');
        query_nft.equalTo('idNFT', nft_id)
        query_nft.equalTo('onSale', true)
        const nfts_raw_array = await query_nft.find({useMasterKey: true})
        if(nfts_raw_array.length === 0){
            return "This NFT is not for sale now"
        }
        let nft_bought = nfts_raw_array.pop()

        nft_bought.setACL(new Moralis.ACL(user))
        nft_bought.set('owner', user)
        nft_bought.set('price', null)
        nft_bought.set('onSale', false)
        nft_bought.set('publishedTime', null)
        nft_bought.set('pending', true)
        nft_bought.set('releaseTime', null)
        nft_bought.set('royalties', null)
        await nft_bought.save(null, {useMasterKey: true})
        return{
            bought: true,
            message: 'NFT transfered'
        }

    } catch (error) {
        return {
            bought: false,
            message: error.message
        }    
    }

},{
    fields:{
        nft_id:{
            ...validation_id,
            error: 'NFT_id is not passed or it has an error'
        }
    },
    requireUser: true
});

Moralis.Cloud.define('change_price_nft', async (req) => {

    const {nft_id, price} = req.params;

    const user = req.user;
    
    try {
        const query_nft = new Moralis.Query('AccessoryNFT');
        query_nft.equalTo('idNFT', nft_id)
        query_nft.equalTo('onSale', true)
        query_nft.equalTo('owner', user)
        const nfts_raw_array = await query_nft.find({useMasterKey: true})

        if(nfts_raw_array.length === 0){
            return "This NFT is not for sale now"
        }

        for (let i = 0; i < nfts_raw_array.length; i++) {
            nfts_raw_array[i].set('price', price)
            await nfts_raw_array[i].save(null, {useMasterKey: true})
        }

        return{
            changed: true,
            message: 'NFT price changed'
        }

    } catch (error) {
        return {
            changed: false,
            message: error.message
        }    
    }

},{
    fields:{
        nft_id:{
            ...validation_id,
            error: 'NFT_id is not passed or it has an error'
        },
        price: validation_price
    },
    requireUser: true
});

Moralis.Cloud.define('set_QR', async (req) => {
    const { nft_id, QR} = req.params;

    try {
        
        const query_nfts = new Moralis.Query('AccessoryNFT')
        query_nfts.equalTo('idNFT', nft_id)
        const nfts = await query_nfts.find({useMasterKey: true})

        for (let i = 0; i < nfts.length; i++) {
            nfts[i].set('QR', QR)
            await nfts[i].save(null,{ useMasterKey: true}) 
        }

        return {
            setted: true,
            message: 'QR setted'
        }
    } catch (error) {
        return {
            setted: false,
            message: error.message
        }
    }
});