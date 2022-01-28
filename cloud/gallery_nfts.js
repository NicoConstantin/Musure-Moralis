Moralis.Cloud.define('get_gallery', async (req) => {

    const { filter, sort, user_id } = req.params

    const query_user_accessories = new Moralis.Query('Accessory');

    try {

        query_user_accessories.equalTo('owner', user_id)
        query_user_accessories.doesNotExist("durationLeft");
        query_user_accessories.equalTo("power", 0);
        query_user_accessories.equalTo("onSale", true);

        for (const prop in filter) {
            if(prop !== "type" && typeof(filter[prop]) !== 'number' ){
                return 'a filter property is not a number'
            }
            if(prop === "type" && typeof(filter[prop]) !== 'string' ){
                return 'filter type must be a string'
            }
        }
        for (const prop in sort) {
            if(sort[prop] !== 'ascending' && sort[prop] !== 'descending'){
                return 'sort properties must be equal to ascending or descending'
            }
        }

        //FILTERING
        if (filter){
            if (filter.rarity) {
                query_user_accessories.equalTo('rarityNumber', filter.rarity)
            }
            if (filter.type){
                query_user_accessories.equalTo('type', filter.type)
            }
            if (filter.priceMin) {
                query_user_accessories.greaterThanOrEqualTo('price', filter.priceMin)
            }
            if (filter.priceMax) {
                query_user_accessories.lessThanOrEqualTo('price', filter.priceMax)
            }
        }
        //SORTING
        if (sort){
            if(sort.type){
                query_user_accessories[sort.type]('type')
            }
            if(sort.rarity){
                query_user_accessories[sort.rarity]('rarityNumber')
            }
            if(sort.price){
                query_user_accessories[sort.price]('price')
            }
            if(sort.publishedTime){
                query_user_accessories[sort.publishedTime]('publishedTime')
            }
        }
        query_user_accessories.limit(1000)
        query_user_accessories.withCount()

        let resultAccessories = await query_user_accessories.find({useMasterKey:true})

        return {
            ...resultAccessories,
            message: 'Items that were ordered'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        user_id:{
            ...validation_id,
            error: "user_id is not passed or has an error"
        },
    },
    requireUser: true
});