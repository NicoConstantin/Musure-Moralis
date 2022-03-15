//VALIDATED
Moralis.Cloud.define('get_marketplace', async (req) => {

    const { filter, sort, myListing, item_kind } = req.params;    
    const user = req.user;

    //VALIDATIONS OF NON REQUIRED FIELDS
    for (const prop in filter) {
        if(prop !== "typeItem" && typeof(filter[prop]) !== 'number' ){
            return 'a filter property is not a number'
        }
        if(prop === "typeItem" && typeof(filter[prop]) !== 'string' ){
            return 'filter typeItem must be a string'
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
            if (filter.typeItem && item_kind.includes('Accessory')){
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
