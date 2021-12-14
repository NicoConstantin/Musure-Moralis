Moralis.Cloud.define('get_marketplace', async (req) => {

    let query_items = ""

    if (req.params.type === 'avatar'){
        query_items = new Moralis.Query('Avatar');
    }
    if (req.params.type === 'accessory'){
        query_items = new Moralis.Query('Accessory');
    }

    const filter = req.params.filter;
    const sort = req.params.sort;
    const page = req.params.page;
    const my_listing = req.params.myListing;

    try {

        query_items.equalTo('onSale', true)

        if (my_listing){
            query_items.equalTo('owner', req.user)
        }

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
        }

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

        if(page){
            query_items.skip( page * 60 )
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
});
