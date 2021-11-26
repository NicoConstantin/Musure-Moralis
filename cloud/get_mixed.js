const User = Moralis.Object.extend(Moralis.User)    
//NOT REQUIRE VALIDATION
Moralis.Cloud.define('get_crew', async (req) => {
    
    const query_egg = new Moralis.Query('Egg')
    const query_avatar = new Moralis.Query('Avatar')

    try {

        query_avatar.equalTo('owner', req.user);
        let avatarsUser = await query_avatar.find(null, {useMasterKey:true})
        
        query_egg.equalTo('owner', newUser)
        let eggsRaw = await query_egg.find(null, {useMasterKey:true})
        let eggsUser = eggsRaw.filter(egg=> egg.attributes.isHatched === false )

        return {
            result: {
                avatars : avatarsUser,
                eggs: eggsUser
            },
            message: "User crew data"
        }

    } catch (error) {
        return {
            result: false,
            message: error.message
        }
    }
});