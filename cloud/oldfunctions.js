
//----------------------------ITEMS----------------------------
Moralis.Cloud.define('equip_item', async(req) => {
    
    const { avatar_id, item_id, item_kind } = req.params;
    
    const query_avatar = new Moralis.Query('Avatar');
    const query_item = new Moralis.Query(item_kind);

    try {
        
        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});
        let item = await query_item.get(item_id, {useMasterKey:true});
        
        let type_item = item.attributes.type.toLowerCase()

        //VALIDATING CONTEXT
        if(avatar.attributes.owner.id !== item.attributes.owner.id) {
            return "Not allowed"
        }
        if(avatar.attributes[type_item]){
            return {
                equipped:false,
                message: "Avatar already have that kind of item equipped"
            }
        }
        if(item.attributes.equippedOn){
            return {
                equipped:false,
                message: 'That item is equipped in another avatar'
            }
        }
        if(avatar.attributes.onSale){
            return 'Your avatar is on sale, you cannot equip any item'
        }
        if(avatar.attributes.playsLeft === 0){
            return 'Your cannot equip items if your avatar is tired'
        }
        if(item.attributes.rarityNumber > avatar.attributes.rarityNumber){
            return 'You cannot equip an item whose power is greater than the avatar'
        }

        //EQUIPPING ITEM
        else{
            item.set('equippedOn', avatar)
            await item.save(null, {useMasterKey:true})
            avatar.set(type_item, item)
            avatar.set('power', avatar.attributes.power + item.attributes.power)
            await avatar.save(null, {useMasterKey:true})
    
            return {
               equipped: true,
               avatar: avatar,
               message: "Item equipped"
            }
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
        item_id:{
            ...validation_id,
            error: "item_id is not passed or has an error"
        },
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Accessory' || val === 'AccessoryNFT' 
            },
            error:"item_kind must be equal to 'Accessory' or 'AccessoryNFT'"
        },
    },
    requireUser: true
});
Moralis.Cloud.define('unequip_item', async (req) => {

    const { avatar_id, item_id, item_kind } = req.params;
    
    const query_avatar = new Moralis.Query('Avatar');
    let query_item = new Moralis.Query(item_kind);

    try {
        
        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});
        let item = await query_item.get(item_id, {useMasterKey:true});
        
        let type_item = item.attributes.type.toLowerCase()

        //VALIDATING CONTEXT
        if(avatar.attributes.owner.id !== item.attributes.owner.id) {
            return "Not allowed"
        }
        if(!item.attributes.equippedOn){
            return "You cannot unequip something that is not equipped :)"
        }
        if(avatar.attributes.onSale){
            return 'Your avatar is on sale, you cannot unequip any item'
        }
        //REVISAR
        if(avatar.attributes.playsLeft === 0){
            return 'Your cannot unequip items if your avatar is tired'
        }

        //UNEQUIPPING ITEM
        else{
            item.set('equippedOn', null)
            await item.save(null, {useMasterKey:true})

            avatar.set(type_item, null)
            avatar.set('power', avatar.attributes.power - item.attributes.power)
            await avatar.save(null, {useMasterKey:true})
    
            return {
               unequipped: true,
               avatar: avatar,
               message: "Item unequipped"
            }
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
        item_id:{
            ...validation_id,
            error: "item_id is not passed or has an error"
        },
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Accessory' || val === 'AccessoryNFT' 
            },
            error:"item_kind must be equal to 'Accessory' or 'AccessoryNFT'"
        },
    },
    requireUser: true 
});
Moralis.Cloud.define('put_onsale_item', async (req) => {

    const { price, item_id, item_kind } = req.params;
    
    const query_avatar = new Moralis.Query('Avatar');
    const query_item = new Moralis.Query(item_kind);
    
    try {
        let item = await query_item.get(item_id, {useMasterKey:true});

        //VALIDATING CONTEXT
        if(item.attributes.equippedOn){
            let avatar_to_unequip = await query_avatar.get(item.attributes.equippedOn, {useMasterKey:true})

            //UNEQUIPPING ITEM FROM AVATAR
            avatar_to_unequip.set(item.attributes.type.toLowerCase(), null)
            avatar_to_unequip.set('power', avatar_to_unequip.attributes.power - item.attributes.power)
            await avatar_to_unequip.save(null, {useMasterKey:true})
        }

        //SETTING ACCESORY FIELDS
        item.set('price', price)
        item.set('onSale', true)
        item.set('publishedTime', getDate())
        await item.save(null, {useMasterKey:true})

        return {
            onSale: true,
            message: 'Item was successfully put on sale'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        price: validation_price,
        item_id:{
            ...validation_id,
            error: "item_id is not passed or has an error"
        },
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Accessory' || val === 'AccessoryNFT'
            },
            error:"item_kind must be equal to 'Accessory' or 'AccessoryNFT'"
        }
    },
    requireUser: true 
});
Moralis.Cloud.define('kick_onsale_item', async (req) => {

    const { item_id, item_kind } = req.params;
    
    let query_item = new Moralis.Query(item_kind);

    try {
        let item = await query_item.get(item_id, {useMasterKey:true});

        //SETTING ITEM FIELDS
        item.set('price', null)
        item.set('onSale', false)
        item.set('publishedTime', -1)
        await item.save(null, {useMasterKey:true})

        return {
            removed: true,
            message: 'Item was successfully removed from sale'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        item_id:{
            ...validation_id,
            error: "item_id is not passed or has an error"
        },
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Accessory' || val === 'AccessoryNFT'
            },
            error:"item_kind must be equal to 'Accessory' or 'AccessoryNFT'"
        }
    },
    requireUser: true
});
//----------------------------AVATARS----------------------------
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
Moralis.Cloud.define('get_avatar', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');

    const avatar_id = req.params.avatar_id;

    try {
        const typesItems = ['head', 'pet', 'sneaker', 'aura', 'wing', 'vehicle', 'skin', 'bazooka', 'dance', 'graffiti'];

        for (let i = 0; i < typesItems.length; i++) {
            query_avatar.include(typesItems[i])
        }

        let avatar = await query_avatar.get(avatar_id, {useMasterKey:true});

        const itemsAvatar = [];

        for (const key in avatar.attributes) {
            if (typesItems.includes(key)) {
                itemsAvatar.push(avatar.attributes[key])
            }
        }

        return {
            avatar: avatar,
            avatarItems: itemsAvatar,
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
Moralis.Cloud.define('put_onsale_avatar', async (req) => {

    const query_avatar = new Moralis.Query('Avatar');
    const query_accessories = new Moralis.Query('Accessory');
    const query_nfts = new Moralis.Query('AccessoryNFT');


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

        //FINDING IF AVATAR HAS ITEMS EQUIPPED
        query_accessories.equalTo('equippedOn', avatarToSell)
        query_nfts.equalTo('equippedOn', avatarToSell)
        let accessoriesEquipped = await query_accessories.find({useMasterKey:true})
        let nftsEquipped = await query_nfts.find({useMasterKey:true})

        //UNEQUIPPING ITEMS
        if(accessoriesEquipped.length > 0){
            accessoriesEquipped.forEach(async (acc)=>{
                acc.set('equippedOn', null)
                await acc.save(null, {useMasterKey:true})
                avatarToSell.set(acc.attributes.type.toLowerCase(), null)
                avatarToSell.set('power', avatarToSell.attributes.power - acc.attributes.power)
                await avatarToSell.save(null, {useMasterKey:true})
            })
        }
        if(nftsEquipped.length > 0){
            nftsEquipped.forEach(async (nft)=>{
                nft.set('equippedOn', null)
                await nft.save(null, {useMasterKey:true})
                avatarToSell.set(nft.attributes.type.toLowerCase(), null)
                avatarToSell.set('power', avatarToSell.attributes.power - nft.attributes.power)
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
Moralis.Cloud.define('delete_avatar', async (req) => {
    const query_avatar = new Moralis.Query('Avatar');
    const query_accessories = new Moralis.Query('Accessory');
    const query_nfts = new Moralis.Query('AccessoryNFT');

    try {
        let avatarToDelete = await query_avatar.get(req.params.avatar_id, {useMasterKey:true})

        if(avatarToDelete.attributes.belongParty){
            let party = avatarToDelete.attributes.belongParty

            party.remove('avatarsIn', avatarToDelete)
            await party.save(null, {useMasterKey:true})

        }

        query_accessories.equalTo('equippedOn', avatarToDelete)
        let accessoriesEquipped = await query_accessories.find({useMasterKey:true})

        query_nfts.equalTo('equippedOn', avatarToDelete)
        let nftsEquipped = await query_nfts.find({useMasterKey:true})

        if(accessoriesEquipped.length>0){
            accessoriesEquipped.forEach(async acc=>{
                acc.set('equippedOn', null)
                await acc.save(null, {useMasterKey:true})
            })
        }
        if(nftsEquipped.length>0){
            nftsEquipped.forEach(async nft=>{
                nft.set('equippedOn', null)
                await nft.save(null, {useMasterKey:true})
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
    },
    requireUser: true
});
//----------------------------ECONOMY----------------------------
Moralis.Cloud.define('get_economy', async () => {

    const query_economy = new Moralis.Query('ECONOMY');

    try {
        let result = await query_economy.find()
        return {
            economy: result,
            message: 'Economy data'
        }
        
    } catch (error) {
        return error.message
    }
});
//----------------------------EGGS----------------------------
Moralis.Cloud.define('get_master_egg', async () => {

    const query_egg_master = new Moralis.Query('EGG_MASTER');
    const query_economy = new Moralis.Query('ECONOMY');

    try {

        query_economy.equalTo('reference','mint_avatar')
        let price_egg = await query_economy.first()
        query_egg_master.descending('dropRate')
        let mastereggs = await query_egg_master.find()
        
        return {
            master_eggs : mastereggs,
            price_egg: price_egg.attributes.price,
            message: 'Egg master info'
        }
    } catch (error) {
        return error.message
    }
});
//----------------------------GET_MIXED_CREW----------------------------
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
});
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
});
//----------------------------JOBS----------------------------
Moralis.Cloud.job("kick_avatars_expired", async (req) =>  {

    req.message("Looking for avatars with contract expired");

    const query_avatars = new Moralis.Query('Avatar');
    const dateNow = getDate()

    try {
        
        query_avatars.lessThan('timeContract', dateNow)
        query_avatars.greaterThan('timeContract', -1)
        query_avatars.exists('belongParty')
        query_avatars.include('belongParty')
        let avatarsExpired = await query_avatars.find({useMasterKey: true})
        
        for (let i = 0; i < avatarsExpired.length; i++) {
            let avatar = avatarsExpired[i]
            let party = avatar.attributes.belongParty

            party.remove('avatarsIn', avatar)
            await party.save(null, {useMasterKey: true})
            avatar.set('belongParty', null)
            avatar.set('timeContract', -1)
            avatar.set('playsLeft', -1)
            await avatar.save(null, {useMasterKey: true})
            
        }
        req.message('Avatars kicked')
        return 'Avatars kicked'


    } catch (error) {
        return error.message
    }
});
Moralis.Cloud.job("renew_playsLeft", async (req) =>  {

    req.message("Looking for avatars");

    const query_avatars = new Moralis.Query('Avatar');

    try {
        
        let allAvatars = await query_avatars.find({useMasterKey: true})
        
        for (let i = 0; i < allAvatars.length; i++) {
            let avatar = allAvatars[i]
            if(avatar.attributes.timeContract > 0){
                avatar.set('playsLeft', 5)
                await avatar.save(null, {useMasterKey: true})
            }
            
        }
        req.message('Avatars playsLeft renewed')
        return 'Avatars playsLeft renewed'


    } catch (error) {
        return error.message
    }
});
//----------------------------MARKETPLACE----------------------------
Moralis.Cloud.define('fill_marketplace', async (req) => {
    const Avatar = Moralis.Object.extend("Avatar");
    const Accessory = Moralis.Object.extend("Accessory");

    const userId = req.params.userId;

    const avatarsData = [
        {
            name: 'Mythic',
            number: 5,
            priceMin: 50,
            priceMax: 50,
        },
    ];

    const accessoriesData = [
        {
            name: 'Common',
            number: 1,
            priceMin: 56.25,
            priceMax: 116.25,
            powerMin: 200,
            powerMax: 250,
        },
        {
            name: 'Rare',
            number: 2,
            priceMin: 99.38,
            priceMax: 159.38,
            powerMin: 300,
            powerMax: 350,
        },
        {
            name: 'Epic',
            number: 3,
            priceMin: 142.5,
            priceMax: 202.5,
            powerMin: 400,
            powerMax: 450,
        },
        {
            name: 'Legendary',
            number: 4,
            priceMin: 185.63,
            priceMax: 245.63,
            powerMin: 500,
            powerMax: 550,
        },
        {
            name: 'Mythic',
            number: 5,
            priceMin: 228.75,
            priceMax: 288.75,
            powerMin: 600,
            powerMax: 650,
        },
    ];
    const accessoriesType = ['Graffiti', 'Dance', 'Bazooka', 'Wing', 'Aura', 'Sneaker', 'Head', 'Skin', 'Vehicle', 'Pet']

    try {
        const user_query = new Moralis.Query('User');
        const user_pointer = await user_query.get(userId, {useMasterKey: true})
        let pointerAv = 0
    
        for (let i = 0; i < 50; i++) {
            logger.info(`creatingAvatar${i}`)
            // if(i % 10 === 0 && i !== 0) {
            //     pointerAv = pointerAv + 1
            // }
    
            const newAvatar = new Avatar();
            newAvatar.setACL(new Moralis.ACL(userId))
            newAvatar.set('rarity', avatarsData[pointerAv].name)
            newAvatar.set('rarityNumber', avatarsData[pointerAv].number)
            newAvatar.set('power', 0)
            newAvatar.set('playsLeft', -1)
            newAvatar.set('timeContract', -1)
            newAvatar.set('owner', user_pointer)
            // newAvatar.set('price', getRandomPower(avatarsData[pointerAv].priceMax, avatarsData[pointerAv].priceMin))
            newAvatar.set('price', 50)
            newAvatar.set('onSale', true)
            newAvatar.set('publishedTime', getDate())
            await newAvatar.save(null, {useMasterKey: true})
        }
    
        let pointerAcc = 0;
        let pointerRarity = 0;
    
        for (let j = 0; j < 500; j++) {
            logger.info(`creatingAccessory${j}`)
            if(j % 10 === 0 && j !== 0){
                pointerRarity = pointerRarity + 1
            }
            if(j % 50 === 0 && j !== 0){
                pointerAcc = pointerAcc + 1
                pointerRarity = 0
            }
    
            const newAccessory = new Accessory();
            newAccessory.setACL(new Moralis.ACL(userId))
            newAccessory.set('type', accessoriesType[pointerAcc])
            newAccessory.set('rarity', accessoriesData[pointerRarity].name)
            newAccessory.set('rarityNumber', accessoriesData[pointerRarity].number)
            newAccessory.set('power', getRandomPower(accessoriesData[pointerRarity].powerMax, accessoriesData[pointerRarity].powerMin))
            newAccessory.set('owner', user_pointer)
            newAccessory.set('durationLeft', 150)
            newAccessory.set('price', getRandomPower(accessoriesData[pointerRarity].priceMax, accessoriesData[pointerRarity].priceMin))
            newAccessory.set('onSale', true)
            newAccessory.set('publishedTime', getDate())
            await newAccessory.save(null, {useMasterKey: true})
        }
    
        return 'Market fullfilled'

    } catch (error) {
        logger.info(JSON.stringify(error.message))
        return error.message
    }
    
});
//----------------------------MISSIONS----------------------------
Moralis.Cloud.define('get_missions', async () => {

    const query_mission_master = new Moralis.Query('MISSION_MASTER');

    try {
        query_mission_master.ascending('reqPower')
        query_mission_master.ascending('location')
        let missions = await query_mission_master.find()

        return{
            missions: missions,
            message:"Missions info"
        }

    } catch (error) {
        return error.message
    }

});
Moralis.Cloud.define('do_creator_quest', async (req) => {

    const query_economy = new Moralis.Query('ECONOMY');

    const qty_avatars = req.params.qty_avatars
    const user = req.user;

    try {

        //VALIDATING CONTEXT
        if(!user.attributes.isValidated){
            return "You must be validated as a creator to do this quest"
        }
        if(!user.attributes.partyOwn || user.attributes.timeContract < getDate() ){
            return "You must have a party to do this quest"
        }
        if( user.attributes.timeQuest > getDate()){
            return `You have to wait ${Math.round((user.attributes.timeQuest - getDate())/60)} minutes to do this mission`
        }

        //SEARCHING REWARD
        query_economy.equalTo('reference','reward_per_avatar_party')
        let price_per_avatar = await query_economy.first()

        let amountWon = price_per_avatar.attributes.price * qty_avatars

        //SETTING FIELDS
        user.set('balanceClaim', user.attributes.balanceClaim + amountWon)
        user.set('timeQuest', getDate(cooldown_set_time, cooldown_set_type))
        await user.save(null, { useMasterKey:true })

        return {
            newBalance: user.attributes.balanceClaim,
            message: "Creator quest done"
        }
        
    } catch (error) {
        return error.message
    }
},{
    fields:{
        qty_avatars:{
            required: true,
            type: Number,
            options: (val)=>{
                return val > 0
            },
            error: "You must have avatars on your party"
        }
    },
    requireUser: true
});
//----------------------------PARTIES----------------------------
Moralis.Cloud.define('patch_party_data', async (req) => {

    const {name, bio, image} = req.params;
    const actualUser = req.user
    let newParty = ""

    try {
        //VALIDATING NOT REQUIRED FIELDS
        if(name.length < min_length_names || name.length > max_length_names){
            return `name must be a string and must be between ${min_length_names} and ${max_length_names} long`
        }
        if(bio.length < min_length_bio || bio.length > max_length_bio){
            return `bio must be a string and must be between ${min_length_bio} and ${max_length_bio} long`
        }
        //MISSING VALIDATION OF IMAGE, NEED TO LOGG typeof(image)

        //VALIDATING CONTEXT
        if(!req.user.attributes.isValidated){
            return "You must be validated to create a party"
        }
        if(actualUser.attributes.partyOwn){
            newParty = actualUser.attributes.partyOwn
        }

        //CREATING A NEW PARTY
        else{
            newParty = new Party()
            actualUser.set('partyOwn', newParty)
            await actualUser.save(null, { useMasterKey:true })
        }

        //SETTING FIELDS
        newParty.set('name', name);
        newParty.set('bio', bio);
        newParty.set('image', image);
        newParty.set('owner', actualUser);
        newParty.setACL(new Moralis.ACL(actualUser))
        await newParty.save(null, { useMasterKey:true })

        return {
            updated:true,
            party: newParty,
            message: "Party Updated"
        }

    } catch (error) {
        return error.message
    }
});
Moralis.Cloud.define('get_all_parties', async () => {

    const query_party = new Moralis.Query('Party');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        query_party.include('owner')
        let allParties = await query_party.find({ useMasterKey:true })
        let economy = await query_economy.find()
        let prices_to_join = economy.filter(el=>el.attributes.reference.slice(0,4) === "join")

        return {
            parties: allParties,
            pricesToJoin: prices_to_join,
            message: "All parties info"
        }
        
    } catch (error) {
        return error.message
    }
});
Moralis.Cloud.define('get_party_data', async (req) => {

    const {party_id, price} = req.params;
    const query_party = new Moralis.Query('Party');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        query_party.include('owner')
        query_party.include('avatarsIn')
        let party = await query_party.get(party_id, { useMasterKey:true } )

        if(price){
            query_economy.equalTo('reference','reward_per_avatar_party')
            let price_per_avatar = await query_economy.first()

            return {
                party: party,
                price: price_per_avatar.attributes.price,
                message: "Party info"
            }
        }

        else{
            
            return {
                party: party,
                message: "Party info"
            }
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        party_id:{
            ...validation_id,
            error:"party_id is not passed or has an error"
        }
    },
    requireUser: true
});
//----------------------------SNOWBALL----------------------------
Moralis.Cloud.define('get_room', async (req) => {

    const {avatar_id, mission_number, reward} = req.params;
    logger.info(JSON.stringify(mission_number))
    logger.info(JSON.stringify(reward))
    logger.info(JSON.stringify(avatar_id))
    const query_avatar_one = new Moralis.Query('Avatar')
    const query_avatar_two = new Moralis.Query('Avatar')
    const query_existent_room = new Moralis.Query('Room')
    
    
    try {
        query_existent_room.equalTo('playerTwo', null)
        query_existent_room.equalTo('rewardTwo', null)
        query_existent_room.equalTo('missionTwo', null)
        query_existent_room.equalTo('arePlaying', false)
        query_existent_room.equalTo('areWaiting', true)
        query_existent_room.include('playerOne')
        const roomFound = await query_existent_room.first({useMasterKey: true})
        
        //JOIN - START GAME - REST PLAYSLEFT, ACC DURATION
        if(roomFound){
            const typesAccessories = ['head', 'pet', 'sneaker', 'aura', 'wing', 'vehicle', 'skin', 'bazooka', 'dance', 'graffiti'];
            for (let i = 0; i < typesAccessories.length; i++) {
                query_avatar_one.include(typesAccessories[i])
                query_avatar_two.include(typesAccessories[i])
            }
            const avatarOne = await  query_avatar_one.get(roomFound.attributes.playerOne.id, {useMasterKey: true}) 
            const avatarTwo = await query_avatar_two.get(avatar_id, {useMasterKey: true})
            if(avatarTwo.attributes.playsLeft <= 0) {
                return "You don't have more plays left, wait till tomorrow"
            }

            //SETTING AVATAR ONE AND OWNER ONE THINGS
            //ONE
            for (const key in avatarOne.attributes) {
                if (typesAccessories.includes(key)) {
                    avatarOne.attributes[key].set('durationLeft', avatarOne.attributes[key].attributes.durationLeft - 1)
                    await avatarOne.attributes[key].save(null, {useMasterKey: true})
                }
            }
            avatarOne.set('playsLeft', avatarOne.attributes.playsLeft - 1)
            await avatarOne.save(null, {useMasterKey: true})

            //TWO
            for (const key in avatarTwo.attributes) {
                if (typesAccessories.includes(key)) {
                    avatarTwo.attributes[key].set('durationLeft', avatarTwo.attributes[key].attributes.durationLeft - 1)
                    await avatarTwo.attributes[key].save(null, {useMasterKey: true})
                }
            }
            avatarTwo.set('playsLeft', avatarTwo.attributes.playsLeft - 1)
            await avatarTwo.save(null, {useMasterKey: true})

            roomFound.set('playerTwo', avatarTwo)
            roomFound.set('rewardTwo', reward)
            roomFound.set('missionTwo', mission_number)
            roomFound.set('arePlaying', true)
            roomFound.set('areWaiting', false)
            roomFound.set('turn', 1)
            roomFound.set('nextMovementTime', getDate(cooldown_game_time, cooldown_game_type))
            await roomFound.save(null,{useMasterKey: true})

            return {
                found: true,
                room: roomFound,
                message: 'Avatar joined'
            }
        }

        else{
            return {
                found: false,
                message: 'No room available'
            }
        }

        
    } catch (error) {
        return error.message;
    }

},{
    fields:{
        avatar_id:{
            ...validation_id,
            error: "avatar_id is not passed or has an error"
        },
        reward:{
            required: true,
            type: Number,
            options: val=>{
                return val > 0
            },
            error: 'reward must be a number greater than 0'
        },
        mission_number:{
            required: true,
            type: Number,
            options: val=>{
                return val >= 1
            },
            error: 'mission_number must be a number greater or equal than 1'
        }
    },
    requireUser: true
});
Moralis.Cloud.define('create_room', async (req) => {
    const { avatar_id, reward, mission_number } = req.params;
    const query_player = new Moralis.Query('Avatar')

    try {
        
        const avatarOne = await query_player.get(avatar_id, {useMasterKey: true})
        if(avatarOne.attributes.playsLeft <= 0) {
            return "You don't have more plays left, wait till tomorrow"
        }
        
        const newRoom = new room();
        newRoom.set('playerOne', avatarOne);
        newRoom.set('rewardOne', reward);
        newRoom.set('missionOne', mission_number);
        newRoom.set('lifeOne', 3);
        newRoom.set('snowballsOne', 1);
        newRoom.set('defendLeftOne', 5);

        newRoom.set('playerTwo', null);
        newRoom.set('rewardTwo', null);
        newRoom.set('missionTwo', null);
        newRoom.set('lifeTwo', 3);
        newRoom.set('snowballsTwo', 1);
        newRoom.set('defendLeftTwo', 5);

        newRoom.set('arePlaying', false)
        newRoom.set('areWaiting', true)

        await newRoom.save(null, {useMasterKey: true})
        logger.info(JSON.stringify('room created'))

        return {
            room: newRoom,
            message: 'Room created'
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
        reward:{
            required: true,
            type: Number,
            options: val=>{
                return val > 0
            },
            error: 'reward must be a number greater than 0'
        },
        mission_number:{
            required: true,
            type: Number,
            options: val=>{
                return val >= 1
            },
            error: 'mission_number must be a number greater or equal than 1'
        }
    },
    requireUser: true
});
Moralis.Cloud.define('get_data_room', async (req) => {

    const room_id = req.params.room_id;
    const query_room = new Moralis.Query('Room')

    try {
        query_room.include('playerOne')
        query_room.include('playerTwo')
        const roomData = await query_room.get(room_id, {useMasterKey: true})

        return {
            room: roomData,
            message: 'Room data'
        }

    } catch (error) {
        return error.message
    }
    
},{
    fields:{
        room_id:{
            ...validation_id,
            error: "room_id is not passed or has an error"
        },
    },
    requireUser: true
});
Moralis.Cloud.define('do_movement', async (req) => {

    const { avatar_id, movement, room_id, turn } = req.params;
    const avatar_query = new Moralis.Query('Avatar');
    const room_query = new Moralis.Query('Room');
    const movement_query = new Moralis.Query('Movements')

    try {
        const avatar = await avatar_query.get(avatar_id, {useMasterKey: true});
        room_query.include('playerOne')
        room_query.include('playerTwo')
        const roomFound = await room_query.get(room_id, {useMasterKey: true});
        
        movement_query.equalTo('avatar', avatar)
        movement_query.equalTo('turn', turn)
        movement_query.equalTo('room', roomFound)
        const otherMovementSameTurn = await movement_query.first({useMasterKey: true})


        let number = ''
        if(roomFound.attributes.playerOne.id === avatar_id) {
            number = 'One'
        }
        if(roomFound.attributes.playerTwo.id === avatar_id) {
            number = 'Two'
        }

        //VALIDATIONS
        if(otherMovementSameTurn){
            return 'You already move on this turn'
        }
        if(roomFound.attributes[`snowballs${number}`] <= 0 && movement === 'attack') {
            return "You don't have any snowball"
        }
        if(roomFound.attributes[`defendLeft${number}`] <= 0 && movement === 'defend') {
            return "You don't have more shields on this game"
        }
        if(roomFound.attributes[`snowballs${number}`] >= 3 && movement === 'create') {
            return "You can't have more than 3 snowballs"
        }
        if(roomFound.attributes.lifeOne <= 0 || roomFound.attributes.lifeTwo <= 0) {
            return "This game is done"
        }

        const new_movement = new movements();
        new_movement.set('room', roomFound);
        new_movement.set('avatar', avatar);
        new_movement.set('movement', movement);
        new_movement.set('turn', turn);
        await new_movement.save(null, {useMasterKey: true});

        return {
            movement: true,
            message: 'Movement added'
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
        movement:{
            required: true,
            type: String,
            options: val=>{
                const options = ['attack', 'defend', 'create', 'none']
                return options.includes(val)
            },
            error: 'movement must be one in specific'
        },
        room_id:{
            ...validation_id,
            error: "room_id is not passed or has an error"
        },
        turn:{
            required: true,
            type: Number,
            options: val=>{
                return val >= 1
            },
            error: 'turn must be a number greater or equal than 1'
        }
    },
    requireUser: true
});
Moralis.Cloud.define('delete_room', async (req) => {
    
    const room_id = req.params.room_id;
    const query_room = new Moralis.Query('Room')

    try {
        const roomFound = await query_room.get(room_id, {useMasterKey: true})

        await roomFound.destroy({useMasterKey: true})

        return {
            deleted: true,
            message: 'Room deleted'
        }

    } catch (error) {
        return error.message
    }
    
},{
    fields:{
        room_id:{
            ...validation_id,
            error: "room_id is not passed or has an error"
        },
    },
    requireUser: true
});
Moralis.Cloud.define('get_movements', async (req) => {

    const {avatar_one_id, avatar_two_id, turn, room_id} = req.params;

    const query_room = new Moralis.Query('Room')
    const query_avatar_one = new Moralis.Query('Avatar')
    const query_avatar_two = new Moralis.Query('Avatar')

    const movement_one_query = new Moralis.Query('Movements')
    const movement_two_query = new Moralis.Query('Movements')

    try {
        
        const room = await query_room.get(room_id, {useMasterKey: true})
        const avatarOne = await query_avatar_one.get(avatar_one_id, {useMasterKey: true})
        const avatarTwo = await query_avatar_two.get(avatar_two_id, {useMasterKey: true})

        //MOVEMENT PLAYER ONE
        movement_one_query.equalTo('turn', turn)
        movement_one_query.equalTo('room', room)
        movement_one_query.equalTo('avatar', avatarOne)
        const movementOne = await movement_one_query.first({useMasterKey: true})

        //MOVEMENT PLAYER TWO
        movement_two_query.equalTo('turn', turn)
        movement_two_query.equalTo('room', room)
        movement_two_query.equalTo('avatar', avatarTwo)
        const movementTwo = await movement_two_query.first({useMasterKey: true})

        return {
            movementOne: movementOne,
            movementTwo: movementTwo,
            message: `Both movements required from turn ${turn}`
        }

    } catch (error) {
        return error.message
    }

},{
    fields:{
        room_id:{
            ...validation_id,
            error: "room_id is not passed or has an error"
        },
        avatar_one_id:{
            ...validation_id,
            error: "avatar_one_id is not passed or has an error"
        },
        avatar_two_id:{
            ...validation_id,
            error: "avatar_two_id is not passed or has an error"
        },
        turn:{
            required: true,
            type: Number,
            options: val=>{
                return val >= 1
            },
            error: 'turn must be a number greater or equal than 1'
        }
    }
});
//----------------------------SNOWBALL TRIGGERS----------------------------
Moralis.Cloud.afterSave("Movements", async (req) => {
    const query_room = new Moralis.Query('Room')
    const query_other_movement = new Moralis.Query('Movements')
    
    //Datos del movement que activa la logica
    const movement = req.object.get('movement')
    const turn = req.object.get('turn')
    const room = req.object.get('room')
    const avatar = req.object.get('avatar')

    query_room.include('playerTwo')
    query_room.include('playerOne')
    const roomPlaying = await query_room.get(room.id,{useMasterKey: true})

    //datos de un movement anterior en el mismo turno y sala
    query_other_movement.equalTo('room', room)
    query_other_movement.equalTo('turn', turn)
    query_other_movement.notEqualTo('avatar', avatar)
    const movement_from_other = await query_other_movement.first({useMasterKey: true})

    if(roomPlaying.attributes.arePlaying && movement_from_other){

        logger.info(JSON.stringify('ENTRE'))
        //IDENTIFICO PLAYER1 Y PLAYER2
        let movementPlayerOne = '';
        let movementPlayerTwo = '';
        
        if(roomPlaying.attributes.playerOne.id === avatar.id){
            movementPlayerOne = movement
            movementPlayerTwo = movement_from_other.attributes.movement
        }
        if(roomPlaying.attributes.playerTwo.id === avatar.id){
            movementPlayerTwo = movement
            movementPlayerOne = movement_from_other.attributes.movement
        }

        roomPlaying.set('turn', roomPlaying.attributes.turn + 1)

        //CASE 1
        if(movementPlayerOne === 'attack' ){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('lifeOne', roomPlaying.attributes.lifeOne - 1)
                roomPlaying.set('lifeTwo', roomPlaying.attributes.lifeTwo - 1)
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
                roomPlaying.set('lifeTwo', roomPlaying.attributes.lifeTwo - 1)
            }
            if(movementPlayerTwo === 'none'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('lifeTwo', roomPlaying.attributes.lifeTwo - 1)
            }
        }
        //CASE 2
        if(movementPlayerOne === 'defend'){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
                
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
            }
            if(movementPlayerTwo === 'none'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
            }
        }
        //CASE 3
        if(movementPlayerOne === 'create'){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                roomPlaying.set('lifeOne', roomPlaying.attributes.lifeOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
            }
            if(movementPlayerTwo === 'none'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
            }
        }
        //CASE 4
        if(movementPlayerOne === 'none'){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('lifeOne', roomPlaying.attributes.lifeOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
            }
            if(movementPlayerTwo === 'none'){
                logger.info(JSON.stringify('Anyone did anything'))
            }
        }
        //CHECKING IF IS NEED TO CLOSE THE ROOM
        if(roomPlaying.attributes.lifeOne <= 0 && roomPlaying.attributes.lifeTwo <= 0){
            //CASO DE EMPATE
            roomPlaying.set('nextMovementTime', -1)
            roomPlaying.set('arePlaying', false)
            logger.info(JSON.stringify('EMPATARON'))
            await roomPlaying.save(null,{useMasterKey: true})
            return;
        }

        if(roomPlaying.attributes.lifeOne <= 0){
            //PAY TO PLAYER2
            const owner_query = new Moralis.Query('User')
            let ownerToPay = await owner_query.get(roomPlaying.attributes.playerTwo.attributes.owner.id,{useMasterKey: true})
            ownerToPay.set('balanceClaim', ownerToPay.attributes.balanceClaim + roomPlaying.attributes.rewardTwo)
            await ownerToPay.save(null, {useMasterKey: true})

            roomPlaying.set('nextMovementTime', -1)
            roomPlaying.set('arePlaying', false)
            await roomPlaying.save(null,{useMasterKey: true})
            return;
        }
        if(roomPlaying.attributes.lifeTwo <= 0){
            //PAY TO PLAYER1
            const owner_query = new Moralis.Query('User')
            let ownerToPay = await owner_query.get(roomPlaying.attributes.playerOne.attributes.owner.id,{useMasterKey: true})
            ownerToPay.set('balanceClaim', ownerToPay.attributes.balanceClaim + roomPlaying.attributes.rewardOne)
            await ownerToPay.save(null, {useMasterKey: true})

            roomPlaying.set('nextMovementTime', -1)
            roomPlaying.set('arePlaying', false)
            await roomPlaying.save(null,{useMasterKey: true})
            return;
        }
        else{
            roomPlaying.set('nextMovementTime', getDate(cooldown_game_time, cooldown_game_type))
            await roomPlaying.save(null, {useMasterKey: true})
            return;
        }
    }

});
//----------------------------USER----------------------------
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
})
Moralis.Cloud.define("get_creators", async (req) =>{

    const query_user = new Moralis.Query(Moralis.User)

    try {

        let users = await query_user.find({ useMasterKey:true })
        let users_clean_data = users.map(e=>{
            const obj = {
                id: e.id,
                isValidated: e.attributes.isValidated,
                creatorName: e.attributes.creatorName,
                creatorTwitter: e.attributes.creatorTwitter,
                twitterFollowers: e.attributes.twitterFollowers,
                creatorInstagram: e.attributes.creatorInstagram? `https://www.instagram.com/${e.attributes.creatorInstagram}/?__a=1`: null,
                instagramFollowers: e.attributes.instagramFollowers,
                creatorEmail: e.attributes.creatorEmail,
                profileImage: e.attributes.creatorImage
            }
            return obj
        })
        return users_clean_data

    } catch (error) {
        return error.message
    }
})
Moralis.Cloud.define('patch_creator_data', async (req) => {

    let {name, bio, image, imageData, twitter, instagram, email} = req.params;
    
    const user = req.user;
    
    try {
        const query_user = new Moralis.Query('User')
        const actualUser = await query_user.get(user.id, { useMasterKey:true })
        
        //IF USER CHANGE HIS NETWORKS LOSE HIS VALIDATION
        
        if(twitter){
            twitter = twitter.toLowerCase();
            //VALIDATING IF SAME TWITTER EXIST
            const query_same_twitter = new Moralis.Query('User')
            query_same_twitter.equalTo('creatorTwitter', twitter)
            query_same_twitter.notEqualTo('objectId', user.id)
            const sameTwitterExist = await query_same_twitter.find({useMasterKey: true})

            if(sameTwitterExist.length>0){
                return {
                    updated: false,
                    message:'That twitter is already on use'
                }
            }
            
            //HITTING TWITTER API
            const query_key_twitter = new Moralis.Query('EnviromentVariable')
            query_key_twitter.equalTo('reference', 'bearer_twitter')
            const bearer = await query_key_twitter.first({useMasterKey: true})
            
            const twitterData = await Moralis.Cloud.httpRequest({
                url: `https://api.twitter.com/2/users/by/username/${twitter}?user.fields=public_metrics`,
                headers: {
                    'Authorization': `Bearer ${bearer.attributes.key}`,
                    'Content-Type': 'application/json;charset=utf-8'
                }
            })
            
            //SETTING TWITTER FIELDS
            actualUser.set('twitterFollowers', twitterData.data.data.public_metrics.followers_count) 
            actualUser.set('creatorTwitter', twitter);
        }
        
        if(instagram){
            instagram = instagram.toLowerCase();
            //VALIDATING IF SAME INSTAGRAM EXIST
            const query_same_instagram = new Moralis.Query('User')
            query_same_instagram.equalTo('creatorInstagram', instagram)
            query_same_instagram.notEqualTo('objectId', user.id)
            const sameInstagramExist = await query_same_instagram.find({useMasterKey: true})
            if(sameInstagramExist.length>0){
                return {
                    updated: false,
                    message:'That instagram is already on use'
                }
            }
            
            //SETTING INSTAGRAM FIELDS
            actualUser.set('creatorInstagram', instagram);
            // const instagramData = await Moralis.Cloud.httpRequest({
                //     url: `https://www.instagram.com/${instagram}/?__a=1`,
                //     method: 'GET',
                //     followRedirects: true,
                //     headers: {
                    //         'Access-Control-Allow-Origin': '*',
                    //         'Access-Control-Allow-Origin': 'http://127.0.0.1:3000',
                    //         'Access-Control-Request-Headers': 'Content-Type, Authorization',
                    //         'Access-Control-Request-Method': 'GET'
                    //     }
                    // })
                    // return instagramData
                    // logger.info(JSON.stringify(instagramData.data))
                    // actualUser.set('instagramFollowers', instagramData.data.graphql.user.edge_followed_by.count);
            }
            
        if((twitter && twitter !== actualUser.attributes.creatorTwitter) || (instagram && instagram !== actualUser.attributes.creatorInstagram)){
            actualUser.set('isValidated', false)
        }
                
        //SETTING OTHER FIELDS
        if(name) actualUser.set('creatorName', name);
        if(bio) actualUser.set('creatorBio', bio);
        if(image) actualUser.set('creatorImage', image);
        if(imageData) actualUser.set('imageData', imageData);
        if(email) actualUser.set('creatorEmail', email)
        
        await actualUser.save(null, { useMasterKey:true });
                
        return {
            updated: true,
            message: "Creator info updated"
        }
        
    } catch (error) {
        return error.message
    }
    
});
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
});