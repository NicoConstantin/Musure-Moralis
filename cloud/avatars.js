const Avatar = Moralis.Object.extend('Avatar');

Moralis.Cloud.define('mint_avatar', async (req) => {

    const query_egg = new Moralis.Query('Egg')
    const query_user = new Moralis.Query(Moralis.User)

    try {
        let eggToHatch = await query_egg.get( req.params.egg_id )
        let actualUser = await query_user.get( req.user.id, { useMasterKey:true } )
        
        eggToHatch.set( 'isHatched', true )
        await eggToHatch.save()
        const newAvatar = new Avatar();
        newAvatar.set('rarity', 'rarity')
        newAvatar.set('power', 1000)
        newAvatar.set('owner', actualUser)
        await newAvatar.save()
    
        return {
            created:true,
            message:"Avatar created"
        }
        
    } catch (error) {
        return {
            created: false,
            message: error.message
        }
    }
});

Moralis.Cloud.define('put_rename', async (req) => {
    
    const query_avatar = new Moralis.Query('Avatar')
    
    try {
        let avatarToRename = await query_avatar.get(req.params.avatar_id)
        avatarToRename.set('name', req.params.new_name)
        await avatarToRename.save()
    
        return {
            avatar: avatarToRename,
            message: "Name Changed"
        }
    } catch (error) {
        return {
            avatar: false,
            message: error.message
        }
        
    }
    
});


