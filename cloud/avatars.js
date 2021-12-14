const Avatar = Moralis.Object.extend('Avatar');
//VALIDATED
Moralis.Cloud.define('mint_avatar', async (req) => {

    const query_egg = new Moralis.Query('Egg')
    const query_egg_master = new Moralis.Query('EGG_MASTER')

    try {
        let eggToHatch = await query_egg.get( req.params.egg_id, {useMasterKey:true} )
        let dataToRandomizer = await query_egg_master.find()
        
        if(eggToHatch.attributes.isHatched){
            return 'That egg is already hatched'
        }

        eggToHatch.set('isHatched', true )
        await eggToHatch.save(null, {useMasterKey:true})
        const newAvatar = new Avatar();
        let rarityFound = getRandomRarity( dataToRandomizer )
        let power = getRandomPower( rarityFound.attributes.minPower, rarityFound.attributes.maxPower )
        
        newAvatar.set('rarity', rarityFound.attributes.rarity)
        newAvatar.set('rarityNumber', rarityFound.attributes.rarityNumber)
        newAvatar.set('power', power)
        newAvatar.set('timeMine', -1)
        newAvatar.set('timeContract', -1)
        newAvatar.set('owner', eggToHatch.attributes.owner)
        newAvatar.set('onSale', false)
        newAvatar.set('publishedTime', -1)
        newAvatar.setACL(new Moralis.ACL(req.user))
        await newAvatar.save(null, { useMasterKey:true })
    
        return {
            created:true,
            avatar: newAvatar,
            message:"Avatar created"
        }
        
    } catch (error) {
        return {
            created: false,
            message: error.message
        }
    }
},{
    fields:{
        egg_id:{
            ...validation_id,
            error: "egg_id is not passed or has an error"
        }
    }
});
//VALIDATED
Moralis.Cloud.define('put_rename', async (req) => {
    
    const query_avatar = new Moralis.Query('Avatar')
    
    try {
        let avatarToRename = await query_avatar.get(req.params.avatar_id, {useMasterKey:true})
        avatarToRename.set('name', req.params.new_name)
        await avatarToRename.save(null, {useMasterKey:true})
    
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
    
},{
    fields:{
        avatar_id:{
            ...validation_id,
            error:"avatar_id is not passed or has an error"
        },
        new_name:validation_length_word
    }
});
//VALIDATED
Moralis.Cloud.define('put_join_party', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');
    const query_party = new Moralis.Query('Party');

    try {
        let partyToJoin = await query_party.get(req.params.party_id, {useMasterKey:true});
        let avatarToJoin = await query_avatar.get(req.params.avatar_id, {useMasterKey:true});

        if(avatarToJoin.attributes.timeContract>-1 || avatarToJoin.attributes.belongParty){
            return 'That avatar belongs to a party, you cannot contract other'
        }

        partyToJoin.addUnique('avatarsIn',avatarToJoin)
        avatarToJoin.set('timeMine', getDate())
        avatarToJoin.set('timeContract', getDate(7, 'hours'))
        // avatarToJoin.set('timeContract', getDate(req.params.time_contract, 'days'))
        avatarToJoin.set('belongParty', partyToJoin)
        await avatarToJoin.save(null, {useMasterKey:true})

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

},{
    fields:{
        party_id:{
            ...validation_id,
            error:"party_id is not passed or has an error"
        },
        avatar_id:{
            ...validation_id,
            error:"avatar_id is not passed or has an error"
        },
    }
});
//VALIDATED
Moralis.Cloud.define('get_avatar', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');

    try {
        let avatar = await query_avatar.get(req.params.avatar_id, {useMasterKey:true});

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
},{
    fields:{
        avatar_id:{
            ...validation_id,
            error:"avatar_id is not passed or has an error"
        },
    }
});

//VALIDATED
Moralis.Cloud.define('kick_avatar_party', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');

    try {
        let avatarExpired = await query_avatar.get(req.params.avatar_id, {useMasterKey:true})
        
            let avatar = avatarExpired
            let party = avatarExpired.attributes.belongParty

            if(avatar.attributes.timeContract > getDate()){
                return 'Why you want to kick an avatar before his time expire ? :('
            }
            if(avatar.attributes.timeContract <= getDate() && avatar.attributes.belongParty){
                party.remove('avatarsIn', avatar)
                await party.save(null, {useMasterKey:true})
                avatar.set('belongParty', null)
                avatar.set('timeContract', -1)
                avatar.set('timeMine', -1)
                await avatar.save(null, {useMasterKey:true})

            }

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

},{
    fields:{
        avatar_id:{
            ...validation_id,
            error:"avatar_id is not passed or has an error"
        },
    }
});

Moralis.Cloud.define('put_onsale_avatar', async (req) => {
    const query_avatar = new Moralis.Query('Avatar');
    const query_accessories = new Moralis.Query('Accessory');

    try {
        let avatarToSell = await query_avatar.get(req.params.avatar_id, {useMasterKey:true})
        query_accessories.equalTo('equippedOn', avatarToSell)
        let accessoriesEquiped = await query_accessories.find({useMasterKey:true})

        if(accessoriesEquiped.length>0){
            accessoriesEquiped.forEach(async acc=>{
                acc.set('equippedOn', null)
                await acc.save(null, {useMasterKey:true})
                avatarToSell.set(acc.attributes.type.toLowerCase(), null)
                await avatarToSell.save(null, {useMasterKey:true})
            })
        }

        avatarToSell.set('price', req.params.price)
        avatarToSell.set('onSale', true)
        avatarToSell.set('publishedTime', getDate())
        await avatarToSell.save(null, {useMasterKey:true})

        return {
            onSale: true,
            message: 'Avatar was successfully put on sale'
        }

    } catch (error) {
        return {
            onSale: false,
            message: error.message
        }
    }
});

Moralis.Cloud.define('kick_onsale_avatar', async (req) => {
    const query_avatar = new Moralis.Query('Avatar');

    try {
        let avatarToSell = await query_avatar.get(req.params.avatar_id, {useMasterKey:true})

        avatarToSell.set('price', null)
        avatarToSell.set('onSale', false)
        avatarToSell.set('publishedTime', -1)
        await avatarToSell.save(null, {useMasterKey:true})

        return {
            onSale: true,
            message: 'Avatar was successfully removed from sale'
        }

    } catch (error) {
        return {
            onSale: false,
            message: error.message
        }
    }
});

//REMOVE THIS ENDPOINT ON PRODUCTION
Moralis.Cloud.define('delete_avatar', async (req) => {
    const query_avatar = new Moralis.Query('Avatar');
    const query_accessories = new Moralis.Query('Accessory');

    try {
        let avatarToDelete = await query_avatar.get(req.params.avatar_id, {useMasterKey:true})
        query_accessories.equalTo('equippedOn', avatarToDelete)
        let accessoriesEquiped = await query_accessories.find({useMasterKey:true})

            if(avatarToDelete.attributes.belongParty){
                let party = avatarToDelete.attributes.belongParty
    
                party.remove('avatarsIn', avatarToDelete)
                await party.save(null, {useMasterKey:true})

            }

            if(accessoriesEquiped.length>0){
                accessoriesEquiped.forEach(async acc=>{
                    acc.set('equippedOn', null)
                    await acc.save(null, {useMasterKey:true})
                })
            }

            await avatarToDelete.destroy({useMasterKey:true})
            

        return {
            deleted: true,
            message: 'Avatar Deleted'
        }


    } catch (error) {
        return {
            deleted: false,
            message: error.message
        }
    }

},{
    fields:{
        avatar_id: {
            ...validation_id,
            error: "avatar_id is not passed or has an error"
        }
    }
});