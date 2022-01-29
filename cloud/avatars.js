const Avatar = Moralis.Object.extend('Avatar');
const logger = Moralis.Cloud.getLogger()

//VALIDATED
Moralis.Cloud.define('mint_avatar', async (req) => {

    const query_egg = new Moralis.Query('Egg')
    const query_egg_master = new Moralis.Query('EGG_MASTER')

    const egg_id = req.params.egg_id;
    const user = req.user

    try {
        //VALIDATING CONTEXT
        let eggToHatch = await query_egg.get( egg_id, {useMasterKey:true})
        if(eggToHatch.attributes.isHatched){
            return 'That egg is already hatched'
        }
        
        //SETTING EGG FIELDS
        eggToHatch.set('isHatched', true )
        await eggToHatch.save(null, {useMasterKey:true})
        
        //GETTING DATA TO SET ON AVATAR FIELDS
        const newAvatar = new Avatar();
        query_egg_master.descending('dropRate')
        let dataToRandomizer = await query_egg_master.find()
        let rarityFound = getRandomRarity( dataToRandomizer )
        
        //SETTING AVATAR FIELDS
        newAvatar.set('rarity', rarityFound.attributes.rarity)
        newAvatar.set('rarityNumber', rarityFound.attributes.rarityNumber)
        newAvatar.set('power', 0)
        newAvatar.set('playsLeft', -1)
        newAvatar.set('timeContract', -1)
        newAvatar.set('owner', eggToHatch.attributes.owner)
        newAvatar.set('onSale', false)
        newAvatar.set('publishedTime', -1)

        const newACL = new Moralis.ACL()
        newACL.setWriteAccess(user, true)
        newACL.setPublicReadAccess(true)
        newAvatar.setACL(newACL)
        await newAvatar.save(null, { useMasterKey:true })
    
        return {
            created:true,
            avatar: newAvatar,
            message:"Avatar created"
        }
        
    } catch (error) {
        return error.message
    }
},{
    fields:{
        egg_id:{
            ...validation_id,
            error: "egg_id is not passed or has an error"
        }
    },
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('put_rename', async (req) => {
    
    const query_avatar = new Moralis.Query('Avatar')
    
    const { avatar_id, new_name } = req.params
    
    try {
        let avatarToRename = await query_avatar.get(avatar_id, {useMasterKey:true})
        avatarToRename.set('name', new_name)
        await avatarToRename.save(null, {useMasterKey:true})
    
        return {
            avatar: avatarToRename,
            message: "Name Changed"
        }

    } catch (error) {
        return error.message
    }
    
},{
    fields:{
        avatar_id:{
            ...validation_id,
            error:"avatar_id is not passed or has an error"
        },
        new_name:{
            required:true,
            type:String,
            options: (val) => {
                return val.length >= min_length_names && val.length <= max_length_names
            },
            error:`name doesn’t have the required length. Must be from ${min_length_names} to ${max_length_names} characters.`
        }
    },
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('get_avatar', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');

    const avatar_id = req.params.avatar_id;

    try {
        const typesAccessories = ['head', 'pet', 'sneaker', 'aura', 'wing', 'vehicle', 'skin', 'bazooka', 'dance', 'graffiti'];

        for (let i = 0; i < typesAccessories.length; i++) {
            query_avatar.include(typesAccessories[i])
        }

        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});

        const accessoriesAvatar = [];

        for (const key in avatar.attributes) {
            if (typesAccessories.includes(key)) {
                accessoriesAvatar.push(avatar.attributes[key])
            }
        }

        return {
            avatar: avatar,
            avatarAccessories: accessoriesAvatar,
            message: "Avatar info"
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        avatar_id:{
            ...validation_id,
            error:"avatar_id is not passed or has an error"
        },
    },
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('kick_avatar_party', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');

    const avatar_id = req.params.avatar_id

    try {
        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true})
        
        //VALIDATING CONTEXT
        if(avatar.attributes.timeContract > getDate()){
            return 'Why you want to kick an avatar before his time expire ? :('
        }
        
        if(avatar.attributes.timeContract <= getDate() && avatar.attributes.belongParty){
            //SETTING PARTY FIELDS
            let party = avatar.attributes.belongParty
            party.remove('avatarsIn', avatar)
            await party.save(null, {useMasterKey:true})

            //SETTING AVATAR FIELDS
            avatar.set('belongParty', null)
            avatar.set('timeContract', -1)
            avatar.set('playsLeft', -1)
            await avatar.save(null, {useMasterKey:true})

        }

        return {
            kicked: true,
            message: 'Avatar Kicked'
        }


    } catch (error) {
        return error.message
    }

},{
    fields:{
        avatar_id:{
            ...validation_id,
            error:"avatar_id is not passed or has an error"
        },
    },
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('put_onsale_avatar', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');
    const query_accessories = new Moralis.Query('Accessory');

    const { avatar_id, price } = req.params;

    try {
        let avatarToSell = await query_avatar.get(avatar_id, {useMasterKey:true})

        //VALIDATING CONTEXT
        if(avatarToSell.attributes.onSale){
            return 'that avatar is already on sale'
        }
        if(avatarToSell.attributes.playsLeft === 0){
            return 'your avatar is tired, you should wait until it rests to put it up for sale'
        }

        //FINDING IF AVATAR HAS ACCESSORIES EQUIPPED
        query_accessories.equalTo('equippedOn', avatarToSell)
        let accessoriesEquiped = await query_accessories.find({useMasterKey:true})

        //UNEQUIPPING ACCESSORIES
        if(accessoriesEquiped.length > 0){
            accessoriesEquiped.forEach(async (acc)=>{
                acc.set('equippedOn', null)
                await acc.save(null, {useMasterKey:true})
                avatarToSell.set(acc.attributes.type.toLowerCase(), null)
                avatarToSell.set('power', avatarToSell.attributes.power - acc.attributes.power)
                await avatarToSell.save(null, {useMasterKey:true})
            })
        }

        //SETTING AVATAR FIELDS
        avatarToSell.set('price', price)
        avatarToSell.set('onSale', true)
        avatarToSell.set('publishedTime', getDate())
        await avatarToSell.save(null, {useMasterKey:true})

        return {
            onSale: true,
            message: 'Avatar was successfully put on sale'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        price: validation_price,
        avatar_id: {
            ...validation_id,
            error: "avatar_id is not passed or has an error"
        },
    },
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('kick_onsale_avatar', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');

    const avatar_id = req.params.avatar_id

    try {
        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true})

        //VALIDATING
        if(!avatar.attributes.onSale){
            return 'you cannot remove from sale an avatar that is not being sold'
        }
        //SETTING AVATAR FIELDS
        else{
            avatar.set('price', null)
            avatar.set('onSale', false)
            avatar.set('publishedTime', -1)
            await avatar.save(null, {useMasterKey:true})
        }

        return {
            removed: true,
            message: 'Avatar was successfully removed from sale'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        avatar_id:{
            ...validation_id,
            error: "avatar_id is not passed or has an error"
        },
    },
    requireUser: true 
});

//REMOVE THIS ENDPOINT ON PRODUCTION
// Moralis.Cloud.define('delete_avatar', async (req) => {
//     const query_avatar = new Moralis.Query('Avatar');
//     const query_accessories = new Moralis.Query('Accessory');

//     try {
//         let avatarToDelete = await query_avatar.get(req.params.avatar_id, {useMasterKey:true})
//         query_accessories.equalTo('equippedOn', avatarToDelete)
//         let accessoriesEquiped = await query_accessories.find({useMasterKey:true})

//             if(avatarToDelete.attributes.belongParty){
//                 let party = avatarToDelete.attributes.belongParty
    
//                 party.remove('avatarsIn', avatarToDelete)
//                 await party.save(null, {useMasterKey:true})

//             }

//             if(accessoriesEquiped.length>0){
//                 accessoriesEquiped.forEach(async acc=>{
//                     acc.set('equippedOn', null)
//                     await acc.save(null, {useMasterKey:true})
//                 })
//             }

//             await avatarToDelete.destroy({useMasterKey:true})
            

//         return {
//             deleted: true,
//             message: 'Avatar Deleted'
//         }


//     } catch (error) {
//         return {
//             deleted: false,
//             message: error.message
//         }
//     }

// },{
//     fields:{
//         avatar_id: {
//             ...validation_id,
//             error: "avatar_id is not passed or has an error"
//         }
//     },
//     requireUser: true
// });