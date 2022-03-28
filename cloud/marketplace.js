//VALIDATED
Moralis.Cloud.define('get_marketplace', async (req) => {

    const { filter, sort, myListing } = req.params;    
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

    let query_nfts = new Moralis.Query('AccessoryNFT');
    
    try {

        query_nfts.equalTo('onSale', true)
        query_nfts.include('owner')
        //DEFINING IF NEEDED TO SEARCH ONLY ON USER'S ITEMS
        if (myListing){
            query_nfts.equalTo('owner', user)
        }
        //FILTERING
        if (filter){
            if (filter.rarity) {
                query_nfts.equalTo('rarityNumber', filter.rarity)
            }
            if (filter.priceMin) {
                query_nfts.greaterThanOrEqualTo('price', filter.priceMin)
            }
            if (filter.priceMax) {
                query_nfts.lessThanOrEqualTo('price', filter.priceMax)
            }
            if (filter.typeItem){
                query_nfts.equalTo('type', filter.typeItem)
            }
        }
        //SORTING
        if (sort){
            if(sort.rarity){
                query_nfts[sort.rarity]('rarityNumber')
            }
            if(sort.price){
                query_nfts[sort.price]('price')
            }
            if(sort.publishedTime){
                query_nfts[sort.publishedTime]('publishedTime')
            }
        }
        query_nfts.limit(1000)

        const results = await query_nfts.find({useMasterKey:true})

        let nfts_ids_aux = []
        let nfts = []

        for (let i = 0; i < results.length; i++) {
            if(!nfts_ids_aux.includes(results[i].attributes.idNFT)){
                nfts_ids_aux.push(results[i].attributes.idNFT)
                nfts.push(results[i])
            }
            else{
                continue;
            }
        }


        return {
            results: nfts,
            count: nfts.length,
            message: 'Items that were ordered'
        }

    } catch (error) {
        return error.message
    }
});
