Moralis.Cloud.define('get_gallery', async (req) => {

    const { filter, sort, user_name } = req.params

    const query_user_NFT = new Moralis.Query('AccessoryNFT');
    const query_user = new Moralis.Query('User');

    try {

        for (const prop in filter) {
            if(prop && prop !== "type" && typeof(filter[prop]) !== 'number' ){
                return 'a filter property is not a number'
            }
            if(prop && prop === "type" && typeof(filter[prop]) !== 'string' ){
                return 'filter type must be a string'
            }
        }
        for (const prop in sort) {
            if(prop && sort[prop] !== 'ascending' && sort[prop] !== 'descending'){
                return 'sort properties must be equal to ascending or descending'
            }
        }
        query_user.equalTo('creatorName', user_name)
        const user_asked = await query_user.first({useMasterKey: true})
        query_user_NFT.equalTo('owner', user_asked)
        query_user_NFT.equalTo("onSale", true);

        //FILTERING
        if (filter){
            if (filter.rarity) {
                query_user_NFT.equalTo('rarityNumber', filter.rarity)
            }
            if (filter.type){
                query_user_NFT.equalTo('type', filter.type)
            }
            if (filter.priceMin) {
                query_user_NFT.greaterThanOrEqualTo('price', filter.priceMin)
            }
            if (filter.priceMax) {
                query_user_NFT.lessThanOrEqualTo('price', filter.priceMax)
            }
        }
        //SORTING
        if (sort){
            if(sort.type){
                query_user_NFT[sort.type]('type')
            }
            if(sort.rarity){
                query_user_NFT[sort.rarity]('rarityNumber')
            }
            if(sort.price){
                query_user_NFT[sort.price]('price')
            }
            if(sort.publishedTime){
                query_user_NFT[sort.publishedTime]('publishedTime')
            }
        }
        query_user_NFT.limit(1000)
        query_user_NFT.withCount()

        let resultAccessories = await query_user_NFT.find({useMasterKey:true})
        
        const query_NFT_asset = new Moralis.Query ('NFT_ASSETS_MAIN')
        let nft_asset_uids = await query_NFT_asset.find({useMasterKey: true});

        let uids = {}

        nft_asset_uids.forEach(item => {
            uids = {
                ...uids,
                [item.attributes.type] : item.attributes.idSketchfab
            }
        })

        let NFTs = resultAccessories.results.map(nft=>{
            return {
                ...nft,
                attributes: nft.attributes,
                uidSketchfab: uids[nft.attributes.type]
            }
        })

        return {
            results: NFTs,
            count : resultAccessories.count,
            creator: user_asked,
            message: 'Items that were ordered'
        }

    } catch (error) {
        return error.message
    }
});