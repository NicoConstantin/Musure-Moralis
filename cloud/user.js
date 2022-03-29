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
            message: 'User data ordered'
        }

    } catch (error) {
        return error.message
    }
    
},{
    fields:{
        user_id:{
            ...validation_id,
            message: 'User_id is not a valid ID'
        }
    }
});
