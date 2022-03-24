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
    
});

Moralis.Cloud.define('save_email', async (req) => {
    
    const email = req.params.email;
    const user = req.user;

    try {
        user.set('creatorEmail', email)
        await user.save(null,{useMasterKey: true})
        
        return {
            saved:true,
            message: 'Email saved'
        }

    } catch (error) {
        return {
            saved: false,
            message: error.message
        }
    }
});