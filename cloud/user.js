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
Moralis.Cloud.define('patch_creator_data', async (req) => {

    let {name, bio, image, imageData, twitter, instagram, email} = req.params;
    const user = req.user;
    
    try {

        const query_user = new Moralis.Query('User')
        const actualUser = await query_user.get(user.id, { useMasterKey:true })
        
        if(twitter){
            twitter = twitter.toLowerCase();
            //VALIDATING IF SAME TWITTER EXIST
            const query_same_twitter = new Moralis.Query('User')
            query_same_twitter.equalTo('creatorTwitter', twitter)
            query_same_twitter.notEqualTo('objectId', user.id)
            const sameTwitterExist = await query_same_twitter.find({useMasterKey: true})

            if(sameTwitterExist.length>0){
                return {
                    updated: false,
                    message:'That twitter is already on use'
                }
            }
            
            //HITTING TWITTER API
            const query_key_twitter = new Moralis.Query('EnviromentVariable')
            query_key_twitter.equalTo('reference', 'bearer_twitter')
            const bearer = await query_key_twitter.first({useMasterKey: true})
            
            const twitterData = await Moralis.Cloud.httpRequest({
                url: `https://api.twitter.com/2/users/by/username/${twitter}?user.fields=public_metrics`,
                headers: {
                    'Authorization': `Bearer ${bearer.attributes.key}`,
                    'Content-Type': 'application/json;charset=utf-8'
                }
            })
            
            //SETTING TWITTER FIELDS
            actualUser.set('twitterFollowers', twitterData.data.data.public_metrics.followers_count) 
            actualUser.set('creatorTwitter', twitter);
        }
        
        if(instagram){
            instagram = instagram.toLowerCase();
            //VALIDATING IF SAME INSTAGRAM EXIST
            const query_same_instagram = new Moralis.Query('User')
            query_same_instagram.equalTo('creatorInstagram', instagram)
            query_same_instagram.notEqualTo('objectId', user.id)
            const sameInstagramExist = await query_same_instagram.find({useMasterKey: true})
            if(sameInstagramExist.length>0){
                return {
                    updated: false,
                    message:'That instagram is already on use'
                }
            }
            
            //SETTING INSTAGRAM FIELDS
            actualUser.set('creatorInstagram', instagram);
            }
            
        //IF USER CHANGE HIS NETWORKS LOSE HIS VALIDATION
        if((twitter && twitter !== actualUser.attributes.creatorTwitter) || (instagram && instagram !== actualUser.attributes.creatorInstagram)){
            actualUser.set('isValidated', false)
        }
                
        //SETTING OTHER FIELDS
        if(name) actualUser.set('creatorName', name);
        if(bio) actualUser.set('creatorBio', bio);
        if(image) actualUser.set('creatorImage', image);
        if(imageData) actualUser.set('imageData', imageData);
        if(email) actualUser.set('creatorEmail', email)
        
        await actualUser.save(null, { useMasterKey:true });
                
        return {
            updated: true,
            message: "Creator info updated"
        }
        
    } catch (error) {
        return error.message
    }
    
});