const Avatar = Moralis.Object.extend('Avatar');

Moralis.Cloud.define('mint_avatar', async (req) => {

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


