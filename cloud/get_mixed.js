
//VALIDATED
Moralis.Cloud.define('get_crew', async (req) => {
    
    const query_egg = new Moralis.Query('Egg')
    const query_avatar = new Moralis.Query('Avatar')

    try {
        //SEARCHING FOR AVATARS
        query_avatar.equalTo('owner', req.user);
        query_avatar.descending('createdAt')
        query_avatar.include('belongParty')
        let avatarsUser = await query_avatar.find({useMasterKey:true})
        
        //SEARCHING FOR EGGS
        query_egg.equalTo('owner', req.user)
        let eggsRaw = await query_egg.find({useMasterKey:true})
        let eggsUser = eggsRaw.filter(egg=> egg.attributes.isHatched === false )

        return {
            result: {
                avatars : avatarsUser,
                eggs: eggsUser
            },
            message: "User crew data"
        }

    } catch (error) {
        return error.message
    }
},{
    requireUser: true
});