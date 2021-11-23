Moralis.Cloud.define('get_crew', async (req) => {
    
    const User = Moralis.Object.extend(Moralis.User)    
    const query_egg = new Moralis.Query('Egg')
    const query_avatar = new Moralis.Query('Avatar')

    try {
        const newUser = new User()
        newUser.id = req.user.id

        query_avatar.equalTo('owner', newUser);
        let avatarsUser = await query_avatar.find()
        query_egg.equalTo('owner', newUser)
        let eggsRaw = await query_egg.find()
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