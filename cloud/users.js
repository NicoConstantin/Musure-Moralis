Moralis.Cloud.define("get_user", async (req) =>{

    const query_user = new Moralis.Query(Moralis.User)

    try {
        query_user.include(['partyOwn.avatarsIn'])
        let actualUser = await query_user.get(req.user.id, { useMasterKey:true })

        return {
            user: actualUser,
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

    const query_user = new Moralis.Query(Moralis.User)

    try {
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

Moralis.Cloud.define('claim', async (req) => {
    const query_user = new Moralis.Query(Moralis.User)

    try {
        const actualUser = await query_user.get(req.user.id, { useMasterKey:true })
        let balance_claim = actualUser.attributes.balanceClaim;
        actualUser.set('balanceClaim', 0)
        await actualUser.save(null, { useMasterKey:true })

        return {
            balance_claim: balance_claim,
            message: "Claim balance cleared"
        }

    } catch (error) {
        return {
            balance_claim: false,
            message: error.message
        }
    }
});
