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
},{
    requireUser: true
})

//VALIDATED MISSING TO WORK WITH AUTOMATIZATION OF VALIDATE AND IMAGE
Moralis.Cloud.define('patch_creator_data', async (req) => {

    const {name, bio, image, twitch, youtube, instagram} = req.params;
    
    const query_user = new Moralis.Query(Moralis.User)

    try {
        const actualUser = await query_user.get(req.user.id, { useMasterKey:true })

        //VALIDATING NOT REQUIRED FIELDS
        if(name.length < min_length_names || name.length > max_length_names){
            return `name must be a string and must be between ${min_length_names} and ${max_length_names} long`
        }
        if(bio.length < min_length_bio || bio.length > max_length_bio){
            return `bio must be a string and must be between ${min_length_bio} and ${max_length_bio} long`
        }
        //MISSING VALIDATION OF IMAGE, NEED TO LOGG typeof(image)

        //VALIDATING IF SOCIAL NETWORKS WERE SENDED
        if(twitch){
            actualUser.set('creatorTwitch', twitch);
        }
        if(youtube){
            actualUser.set('creatorYoutube', youtube);
        }
        if(instagram){
            actualUser.set('creatorInstagram', instagram);
        }
        //SETTING FIELDS
        actualUser.set('creatorName', name);
        actualUser.set('creatorBio', bio);
        actualUser.set('creatorImg', image);

        await actualUser.save(null, { useMasterKey:true });

        return {
            updated: true,
            message: "Creator info updated"
        }
        
    } catch (error) {
        return error.message
    }
    
},{
    requireUser: true
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
},{
    requireUser: true
});
