Moralis.Cloud.define('get_data_user', async (req) => {

    const user_id = req.params.user_id;

    try {

        const query_user = new Moralis.Query('User')
        const user_found = await query_user.get( user_id, {useMasterKey: true})

        const query_collection = new Moralis.Query('Collection')
        query_collection.equalTo('owner', user_found)
        const collections_found = await query_collection.find({useMasterKey: true})

        const query_nfts = new Moralis.Query('AccessoryNFT')
        query_nfts.equalTo('createdBy', user_found)
        const nfts_found = await query_nfts.find({useMasterKey: true})

        let aux = []
        let nfts_filtered= []

        for (let i = 0; i < nfts_found.length; i++) {
            if(!aux.includes(nfts_found[i].attributes.idNFT)){
                nfts_filtered.push(nfts_found[i])
                aux.push(nfts_found[i].attributes.idNFT)
            } else {
                continue;
            }
        }

        return{
            amount_collections: collections_found.length,
            amount_nfts: nfts_filtered.length,
            message: 'Collections ordered'
        }

    } catch (error) {

        return{
            amount_collections: false,
            amount_nfts: false,
            error: error.message
        }
    }
    
},{
    fields:{
        user_id:{
            ...validation_id,
            message: 'User_id is not a valid ID'
        }
    }
});

Moralis.Cloud.define('request_media', async (req) => {
    
    const { email, source, nft_id } = req.params;
    const user = req.user;

    try {

        if(!user.attributes.creatorEmail && email){
            user.set('creatorEmail', email)
            await user.save(null,{useMasterKey: true})
        }

        const query_request = new Moralis.Query('PendingOrder')
        query_request.equalTo('requester', user)
        query_request.equalTo('idNFT', nft_id)
        const exist_request = await query_request.first({useMasterKey:true})
        logger.info(JSON.stringify(exist_request))

        if(!exist_request){
            const new_order = new order();
            new_order.set('idNFT', nft_id)
            new_order.set('requester', user)
            new_order.set('done', false)
    
            if(source === 'teaser'){
                new_order.set('requestTeaser', true)
            }
            if(source === 'filterAR'){
                new_order.set('requestAR', true)
            }
            await new_order.save(null,{useMasterKey: true})
        } 
        else {
            if(source === 'teaser'){
                exist_request.set('requestTeaser', true)
            }
            if(source === 'filterAR'){
                exist_request.set('requestAR', true)
            }
            await exist_request.save(null,{useMasterKey: true})

        }

        return {
            saved:true,
            message: 'Request saved'
        }

    } catch (error) {
        return {
            saved: false,
            message: error.message
        }
    }
},{
    fields:{
        email:{
            required:true,
            type: String,
            options: val=>{
                return regex_email.test(val)
            },
            error: `Email must satisfy regex`
        },
        source:{
            required:true,
            type: String,
            options: val =>{
                return val === 'teaser' || val === 'filterAR'
            },
            message: 'Source must be equal to teaser or filterAR'
        },
        nft_id:{
            ...validation_id,
            message: 'Nft_id is not a valid ID'
        }
    }
});