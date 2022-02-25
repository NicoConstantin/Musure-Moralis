//VALIDATED
Moralis.Cloud.define("get_user", async (req) =>{

    const query_user = new Moralis.Query(Moralis.User)

    try {
        query_user.include(['partyOwn.avatarsIn'])
        let actualUser = await query_user.get(req.user.id, { useMasterKey:true })

        return {
            user: actualUser,
            message: "User Info"
        }

    } catch (error) {
        return error.message
    }
})

Moralis.Cloud.define("get_creators", async (req) =>{

    const query_user = new Moralis.Query(Moralis.User)

    try {

        let users = await query_user.find({ useMasterKey:true })
        let users_clean_data = users.map(e=>{
            const obj = {
                id: e.id,
                isValidated: e.attributes.isValidated,
                creatorName: e.attributes.creatorName,
                creatorTwitter: e.attributes.creatorTwitter,
                twitterFollowers: e.attributes.twitterFollowers,
                creatorInstagram: e.attributes.creatorInstagram? `https://www.instagram.com/${e.attributes.creatorInstagram}/`: null,
                instagramFollowers: e.attributes.instagramFollowers,
                creatorEmail: e.attributes.creatorEmail,
                profileImage: e.attributes.creatorImage
            }
            return obj
        })
        return users_clean_data

    } catch (error) {
        return error.message
    }
})

//VALIDATED MISSING TO WORK WITH AUTOMATIZATION OF VALIDATE AND IMAGE
Moralis.Cloud.define('patch_creator_data', async (req) => {

    let {name, bio, image, imageData, twitter, instagram, email} = req.params;
    
    const user = req.user;
    
    try {
        const query_user = new Moralis.Query('User')
        const actualUser = await query_user.get(user.id, { useMasterKey:true })
        
        //IF USER CHANGE HIS NETWORKS LOSE HIS VALIDATION
        
        if(twitter){
            twitter = twitter.toLowerCase();
            //VALIDATING IF SAME TWITTER EXIST
            const query_same_twitter = new Moralis.Query('User')
            query_same_twitter.equalTo('creatorTwitter', twitter)
            query_same_twitter.notEqualTo('objectId', user.id)
            const sameTwitterExist = await query_same_twitter.find({useMasterKey: true})
            if(sameTwitterExist.length>0){
                return 'That twitter is already on use'
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
                return 'That instagram is already on use'
            }
            
            //SETTING INSTAGRAM FIELDS
            actualUser.set('creatorInstagram', instagram);
            // const instagramData = await Moralis.Cloud.httpRequest({
                //     url: `https://www.instagram.com/${instagram}/?__a=1`,
                //     method: 'GET',
                //     followRedirects: true,
                //     headers: {
                    //         'Access-Control-Allow-Origin': '*',
                    //         'Access-Control-Allow-Origin': 'http://127.0.0.1:3000',
                    //         'Access-Control-Request-Headers': 'Content-Type, Authorization',
                    //         'Access-Control-Request-Method': 'GET'
                    //     }
                    // })
                    // return instagramData
                    // logger.info(JSON.stringify(instagramData.data))
                    // actualUser.set('instagramFollowers', instagramData.data.graphql.user.edge_followed_by.count);
            }
            
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

//VALIDATED
Moralis.Cloud.define('claim', async (req) => {

    const actualUser = req.user;

    try {
        let balance_claim = actualUser.attributes.balanceClaim;

        if(balance_claim > 0){

            actualUser.set('balanceClaim', 0)
            await actualUser.save(null, { useMasterKey:true })
    
            return {
                claim: balance_claim,
                message: "Claim balance cleared"
            }
        }

        if(balance_claim === 0){
            return 'you cannot claim anything if your balance is empty'
        }

    } catch (error) {
        return error.message
    }
});
