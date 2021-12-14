Moralis.Cloud.define('get_marketplace', async (req) => {

    let query_items = ""

    if (request.type === 'avatar'){
        query_items = new Moralis.Query('Avatar');
    }
    if (request.type === 'accessory'){
        query_items = new Moralis.Query('Accessory');
    }

    const request = req.params

    try {
        //ONLY ON SALE
        query_items.equalTo('onSale', true)
        //ONLY USER ITEMS
        if (request.myListing){
            query_items.equalTo('owner', req.user)
        }
        //FILTERING
        if (request.filterRarity) {
            query_items.equalTo('rarityNumber', request.filterRarity)
        }
        if (request.filterPowerMin) {
            query_items.greaterThanOrEqualTo('power', request.filterPowerMin)
        }
        if (request.filterPowerMax) {
            query_items.lessThanOrEqualTo('power', request.filterPowerMax)
        }
        if (request.filterPriceMin) {
            query_items.greaterThanOrEqualTo('price', request.filterPriceMin)
        }
        if (request.filterPriceMax) {
            query_items.lessThanOrEqualTo('price', request.filterPriceMax)
        }
        //SORTING
        if(request.sortRarity){
            query_items[request.sortRarity]('rarityNumber')
        }
        if(request.sortPrice){
            query_items[request.sortPrice]('price')
        }
        if(request.sortPower){
            query_items[request.sortPower]('power')
        }
        if(request.sortPublishedTime){
            query_items[request.sortPublishedTime]('publishedTime')
        }
        //PAGINATING
        if(request.page){
            query_items.skip( request.page * 60 )
        }

        query_items.limit(60)
        query_items.withCount()

        let resultAvatars = await query_items.find({useMasterKey:true})

        return {
            ...resultAvatars,
            message: 'Items that were ordered'
        }

    } catch (error) {
        return {
            results:false,
            message:error.message
        }
    }
},{
    fields:{
        filterRarity: validation_number,
        filterPowerMin: validation_number,
        filterPowerMax: validation_number,
        filterPriceMin: validation_number,
        filterPriceMax: validation_number,
        sortRarity: validation_sort,
        sortPrice: validation_sort,
        sortPower: validation_sort,
        sortPublishedTime: validation_sort,
        page:{
            required: false,
            type: Number,
            options: val=>{
                return val >= 1
            },
            error: 'page must be a number greater than one'
        },
        type:{
            required: true,
            type: String,
            options: val=>{
                return val === 'avatar' || val === 'accessory'
            },
            error: 'type is required and must be equal to avatar or accessory'
        },
        myListing:{
            required: false,
            type: Boolean,
            error: 'mylisting must be a boolean'
        }

    }
});
