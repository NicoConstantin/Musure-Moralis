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

//VALIDATED MISSING TO WORK WITH AUTOMATIZATION OF VALIDATE AND IMAGE
Moralis.Cloud.define('patch_creator_data', async (req) => {

    const {name, bio, image, imageData, twitter, instagram, email, userId} = req.params;
    const user = req.user;
    
    const query_user = new Moralis.Query('User')

    try {
        const actualUser = await query_user.get(userId, { useMasterKey:true })

        //VALIDATING NOT REQUIRED FIELDS
        if(name.length < min_length_names || name.length > max_length_names){
            return `name must be a string and must be between ${min_length_names} and ${max_length_names} long`
        }
        if(bio.length < min_length_bio || bio.length > max_length_bio){
            return `bio must be a string and must be between ${min_length_bio} and ${max_length_bio} long`
        }
        //MISSING VALIDATION OF IMAGE, NEED TO LOGG typeof(image)


        //IF USER CHANGE HIS NETWORKS LOSE HIS VALIDATION
        if( twitter || instagram){
            actualUser.set('isValidated', false)
        }
        if(twitter){
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
            
            actualUser.set('twitterFollowers', twitterData.data.data.public_metrics.followers_count) 
            actualUser.set('creatorTwitter', twitter);
        }
        if(instagram){
            actualUser.set('creatorInstagram', instagram);
            const instagramData = await Moralis.Cloud.httpRequest({
                url: `https://www.instagram.com/${instagram}/?__a=1`,
                followRedirects: true,
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            })
            logger.info(JSON.stringify(instagram))
            logger.info(JSON.stringify(instagramData))
            return instagramData
            logger.info(JSON.stringify(instagramData.data))
            actualUser.set('instagramFollowers', instagramData.data.graphql.user.edge_followed_by.count);
        }

        //SETTING FIELDS
        actualUser.set('creatorName', name);
        actualUser.set('creatorBio', bio);
        actualUser.set('creatorImage', image);
        actualUser.set('imageData', imageData);
        actualUser.set('creatorEmail', email)

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
