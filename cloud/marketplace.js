//VALIDATED
Moralis.Cloud.define('get_marketplace', async (req) => {

    const { filter, sort, myListing, item_kind } = req.params;
    const user = req.user;

    //VALIDATIONS OF NON REQUIRED FIELDS
    for (const prop in filter) {
        if(prop !== "typeAccessory" && typeof(filter[prop]) !== 'number' ){
            return 'a filter property is not a number'
        }
        if(prop === "typeAccessory" && typeof(filter[prop]) !== 'string' ){
            return 'filter typeAccessory must be a string'
        }
    }
    for (const prop in sort) {
        if(sort[prop] !== 'ascending' && sort[prop] !== 'descending'){
            return 'sort properties must be equal to ascending or descending'
        }
    }

    let query_items = new Moralis.Query(item_kind);
    
    try {

        query_items.equalTo('onSale', true)
        query_items.include('owner')
        //DEFINING IF NEEDED TO SEARCH ONLY ON USER'S ITEMS
        if (myListing){
            query_items.equalTo('owner', user)
        }
        //FILTERING
        if (filter){
            if (filter.rarity) {
                query_items.equalTo('rarityNumber', filter.rarity)
            }
            if (filter.powerMin) {
                query_items.greaterThanOrEqualTo('power', filter.powerMin)
            }
            if (filter.powerMax) {
                query_items.lessThanOrEqualTo('power', filter.powerMax)
            }
            if (filter.priceMin) {
                query_items.greaterThanOrEqualTo('price', filter.priceMin)
            }
            if (filter.priceMax) {
                query_items.lessThanOrEqualTo('price', filter.priceMax)
            }
            if (filter.typeItem && item_kind === 'accessory' || item_kind === 'nft'){
                query_items.equalTo('type', filter.typeItem)
            }
        }
        //SORTING
        if (sort){
            if(sort.rarity){
                query_items[sort.rarity]('rarityNumber')
            }
            if(sort.price){
                query_items[sort.price]('price')
            }
            if(sort.power){
                query_items[sort.power]('power')
            }
            if(sort.publishedTime){
                query_items[sort.publishedTime]('publishedTime')
            }
        }
        query_items.limit(1000)
        query_items.withCount()

        let results = await query_items.find({useMasterKey:true})

        return {
            ...results,
            message: 'Items that were ordered'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        item_kind:{
            required: true,
            type: String,
            options: val=>{
                return val === 'Avatar' || val === 'Accessory' || val === 'AccessoryNFT'
            },
            error: 'item_kind is required and must be equal to Avatar, Accessory or AccessoryNFT'
        }
    },
    requireUser: true
});

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