const Avatar = Moralis.Object.extend('Avatar');

Moralis.Cloud.define('mint_avatar', async (req) => {

    const query_egg = new Moralis.Query('Egg')

    try {
        let eggToHatch = await query_egg.get( req.params.egg_id )
        
        eggToHatch.set( 'isHatched', true )
        await eggToHatch.save()
        const newAvatar = new Avatar();
        //ACA SE PUEDE HACER EL TIPO DE RAREZA
        // rarityGenerator()
        //
        newAvatar.set('rarity', 'rarity')
        newAvatar.set('power', 1000)
        newAvatar.set('timeMine', -1)
        newAvatar.set('timeContract', -1)
        newAvatar.set('owner', eggToHatch.attributes.owner)
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

Moralis.Cloud.define('put_join_party', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');
    const query_party = new Moralis.Query('Party');

    try {
        let partyToJoin = await query_party.get(req.params.party_id);
        let avatarToJoin = await query_avatar.get(req.params.avatar_id);

        partyToJoin.addUnique('avatarsIn',avatarToJoin)
        avatarToJoin.set('timeMine', getDate())
        avatarToJoin.set('timeContract', getDate(req.params.time_contract, 'days'))
        avatarToJoin.set('belongParty', partyToJoin)
        await avatarToJoin.save()

        return {
            joined: true,
            message: "Avatar joined"
        }

    } catch (error) {
        return {
            joined: false,
            message: error.message
        }
    }

});

Moralis.Cloud.define('get_avatar', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');

    try {
        let avatar = await query_avatar.get(req.params.avatar_id);

        return {
            avatar: avatar,
            message: "Avatar info"
        }

    } catch (error) {
        return {
            avatar: false,
            message: error.message
        }
    }
});


Moralis.Cloud.define('kick_avatar_party', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');

    try {
        let avatarExpired = await query_avatar.get(req.params.avatar_id)
        
            let avatar = avatarExpired
            let party = avatarExpired.attributes.belongParty

            party.remove('avatarsIn', avatar)
            await party.save()
            avatar.set('belongParty', null)
            avatar.set('timeContract', -1)
            avatar.set('timeMine', -1)
            await avatar.save()
            

        return {
            kicked: true,
            message: 'Avatar Kicked'
        }


    } catch (error) {
        return {
            kicked: false,
            message: error.message
        }
    }

});