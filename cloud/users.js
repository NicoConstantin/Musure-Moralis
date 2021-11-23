Moralis.Cloud.define("get_login", async (req) =>{
    try {
        const query_user = new Moralis.Query(Moralis.User)
        // query_user.exclude('ACL')
        // query_user.exclude('authData')
        // query_user.exclude('sessionToken')
        query_user.equalTo('objectId', req.user.id)
        let actualUser = await query_user.find({ useMasterKey:true })
        return {
            user: actualUser[0],
            message: "User Info"
        }
        //FALTA MANDAR TOKENS
    } catch (error) {
        return {
            user: actualUser,
            message: error.message
        }
    }
})

Moralis.Cloud.define('patch_creator_data', async (req) => {
    try {
        const query_user = new Moralis.Query(Moralis.User)
        const actualUser = await query_user.get(req.user.id, { useMasterKey:true })
        actualUser.set('creatorName', req.params.name);
        actualUser.set('creatorBio', req.params.bio);
        actualUser.set('creatorImg',req.params.image);
        actualUser.set('creatorTwitch', req.params.twitch);
        actualUser.set('creatorYoutube', req.params.youtube);
        actualUser.set('creatorInstagram', req.params.instagram);
        await actualUser.save(null, { useMasterKey:true });
        return {
            updated: true,
            message: "Creator info updated"
        }
    } catch (error) {
        return {
            updated: false,
            message: error.message
        }
    }
    
});
