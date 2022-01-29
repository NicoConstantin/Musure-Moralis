//VALIDATED
Moralis.Cloud.define('get_marketplace', async (req) => {

    const { filter, sort, myListing, type } = req.params

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

    let query_items = ""
    
    //DEFINING WHERE TO SEARCH
    if (type === 'avatar'){
        query_items = new Moralis.Query('Avatar');
    }
    if (type === 'accessory'){
        query_items = new Moralis.Query('Accessory');
        query_items.doesNotExist("name");
        query_items.doesNotExist("lore");
    }


    try {

        query_items.equalTo('onSale', true)
        query_items.include('owner')
        //DEFINING IF NEEDED TO SEARCH ONLY ON USER'S ITEMS
        if (myListing){
            query_items.equalTo('owner', req.user)
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
            if (filter.typeAccessory && type === 'accessory'){
                query_items.equalTo('type', filter.typeAccessory)
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

        let resultAvatars = await query_items.find({useMasterKey:true})

        return {
            ...resultAvatars,
            message: 'Items that were ordered'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        type:{
            required: true,
            type: String,
            options: val=>{
                return val === 'avatar' || val === 'accessory'
            },
            error: 'type is required and must be equal to avatar or accessory'
        }
    },
    requireUser: true
});

Moralis.Cloud.define('fill_marketplace', async (req) => {
    const Avatar = Moralis.Object.extend("Avatar");
    const Accessory = Moralis.Object.extend("Accessory");

    const user = req.user;

    const avatarsData = [
        {
            name: 'Common',
            number: 1,
            priceMin: 40,
            priceMax: 45,
        },
        {
            name: 'Rare',
            number: 2,
            priceMin: 60,
            priceMax: 70,
        },
        {
            name: 'Epic',
            number: 3,
            priceMin: 100,
            priceMax: 120,
        },
        {
            name: 'Legendary',
            number: 4,
            priceMin: 150,
            priceMax: 180,
        },
        {
            name: 'Mythic',
            number: 5,
            priceMin: 230,
            priceMax: 250,
        },
    ];

    const accessoriesData = [
        {
            name: 'Common',
            number: 1,
            priceMin: 130,
            priceMax: 140,
            powerMin: 78,
            powerMax: 260,
        },
        {
            name: 'Rare',
            number: 2,
            priceMin: 160,
            priceMax: 170,
            powerMin: 261,
            powerMax: 520,
        },
        {
            name: 'Epic',
            number: 3,
            priceMin: 210,
            priceMax: 230,
            powerMin: 521,
            powerMax: 780,
        },
        {
            name: 'Legendary',
            number: 4,
            priceMin: 300,
            priceMax: 350,
            powerMin: 781,
            powerMax: 1040,
        },
        {
            name: 'Mythic',
            number: 5,
            priceMin: 500,
            priceMax: 550,
            powerMin: 1041,
            powerMax: 1326,
        },
    ];
    const accessoriesType = ['Graffiti', 'Dance', 'Bazooka', 'Wing', 'Aura', 'Sneaker', 'Head', 'Skin', 'Vehicle', 'Pet']

    try {
        
        let pointerAv = 0
    
        for (let i = 0; i < 50; i++) {
            logger.info(`creatingAvatar${i}`)
            if(i % 10 === 0 && i !== 0) {
                pointerAv = pointerAv + 1
            }
    
            const newAvatar = new Avatar();
            newAvatar.setACL(new Moralis.ACL(user))
            newAvatar.set('rarity', avatarsData[pointerAv].name)
            newAvatar.set('rarityNumber', avatarsData[pointerAv].number)
            newAvatar.set('power', 0)
            newAvatar.set('playsLeft', -1)
            newAvatar.set('timeContract', -1)
            newAvatar.set('owner', user)
            newAvatar.set('price', getRandomPower(avatarsData[pointerAv].priceMax, avatarsData[pointerAv].priceMin))
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
            newAccessory.setACL(new Moralis.ACL(user))
            newAccessory.set('type', accessoriesType[pointerAcc])
            newAccessory.set('rarity', accessoriesData[pointerRarity].name)
            newAccessory.set('rarityNumber', accessoriesData[pointerRarity].number)
            newAccessory.set('power', getRandomPower(accessoriesData[pointerRarity].powerMax, accessoriesData[pointerRarity].powerMin))
            newAccessory.set('owner', user)
            newAccessory.set('durationLeft', 130)
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