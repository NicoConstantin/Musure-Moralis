//VALIDATED
Moralis.Cloud.define('get_marketplace', async (req) => {

    const { filter, sort, page, myListing, type } = req.params

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
        //PAGINATING
        // if(page){
        //     query_items.skip( page * 60 )
        // }
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