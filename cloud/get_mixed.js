
//VALIDATED
Moralis.Cloud.define('get_crew', async (req) => {
    
    const query_egg = new Moralis.Query('Egg')
    const query_avatar = new Moralis.Query('Avatar')

    const user = req.user

    try {
        //SEARCHING FOR AVATARS
        query_avatar.equalTo('owner', user);
        query_avatar.notEqualTo("onSale", true);
        query_avatar.descending('createdAt')
        query_avatar.include('belongParty')
        query_avatar.limit(500)
        let avatarsUser = await query_avatar.find({useMasterKey:true})
        
        //SEARCHING FOR EGGS
        query_egg.equalTo('owner', user)
        query_egg.limit(500)
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

//VALIDATED
Moralis.Cloud.define('get_crew_onsale', async (req) => {
    
    const query_accessories = new Moralis.Query('Accessory')
    const query_avatar = new Moralis.Query('Avatar')

    const user = req.user

    try {
        //SEARCHING FOR AVATARS
        query_avatar.equalTo('owner', user);
        query_avatar.equalTo("onSale", true);
        query_avatar.descending('publishedTime')
        query_avatar.limit(500)
        let avatarsUser = await query_avatar.find({useMasterKey:true})
        
        //SEARCHING FOR ACCESSORIES
        query_accessories.equalTo('owner', user)
        query_accessories.notEqualTo("durationLeft", null);
        query_accessories.equalTo("onSale", true);
        query_accessories.descending('publishedTime')
        query_accessories.descending('type')
        query_accessories.limit(500)
        let accessoriesUser = await query_accessories.find({useMasterKey:true})

        return {
            result: {
                avatars : avatarsUser,
                accessories: accessoriesUser
            },
            message: "User crew_onsale data"
        }

    } catch (error) {
        return error.message
    }
},{
    requireUser: true
});