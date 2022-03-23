
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

Moralis.Cloud.define('get_nft', async (req) => {
    
    const nft_id = req.params.nft_id;
    
    try {
        const query_nfts = new Moralis.Query('AccessoryNFT');
        query_nfts.equalTo('idNFT', nft_id)
        query_nfts.include('collection')
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
            let regexTime = /^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/
            let regexDate = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/
            let regexTimezone = /^-?([0-1][0-9]|[2][0-3]):([0-5][0-9])$/

            if(date && typeof date !== 'string' || !regexDate.test(date)){
                return 'Date must comply with the required parameters'
            }
            if(time && typeof time !== 'string' || !regexTime.test(time)){
                return 'Time must comply with the required regex'
            }
            if(timezone && typeof timezone !== 'string' || !regexTimezone.test(time)){
                return 'Timezone must comply with the required parameters'
            }

            //PROCESSING DATE
            unixstamp = Math.floor(Date.parse(date) / 1000 )

            //PROCESSING TIME
            let arrayTime = time.split(':')
            let hourTime = Number(arrayTime[0])
            let minutesTime = Number(arrayTime[1])

            //PROCESSING TIMEZONE
            let arrayTimezone = timezone.split(':')
            let hourTimezone = Number(arrayTimezone[0])
            let minutesTimezone = Number(arrayTimezone[1])

            //JOINING ALL DATE INFO
            unixstamp = unixstamp + ((hourTime - hourTimezone) * 3600)
            unixstamp = unixstamp + ((minutesTime + minutesTimezone) * 60)
        }
        
        //GENERATING ID FOR NFT
        let userID= user.id
        const nameTrimmed = name.split(" ").join("")
        let nftID = ""
        for (let j = 0; j < nameTrimmed.length; j++) {
            
            nftID= nftID + userID[j] + nameTrimmed[j] + Math.floor(Math.random() * 10)
            
            if(j+1 >= nameTrimmed.length){
                nftID = nftID + userID.slice(j+1)
                break;
            }

            if(j+1 >= userID.length){
                nftID = nftID + nameTrimmed.slice(j+1)
                break;
            }
        }

        nftID = nftID.slice(0,24).split("").reverse().join("")

        //SETTING NOTIFICATION FIELDS
        if(notification_new_assets || notification_newsletter){
            user.set('notificationNewsletter', notification_newsletter);
            user.set('notificationNewAsset', notification_new_assets);
            await user.save(null,{ useMasterKey: true })
        }

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
            if(collection){
                new_NFT.set('collection', collection);
            }
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
            //VER QUE PASA CON EL PENDING
            new_NFT.set('blocked', false);
            new_NFT.set('pending', true);

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
                const qty_emit = [1, 10, 25, 50, 100]
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

});