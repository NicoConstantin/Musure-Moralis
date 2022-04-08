Moralis.Cloud.job("release_nfts", async (req) =>  {

    req.message("Looking for nfts to release!");

    const query_nfts = new Moralis.Query('AccessoryNFT');
    const dateNow = getDate()

    try {
        
        query_nfts.equalTo('onSale', false)
        query_nfts.lessThan('releaseTime', dateNow)
        let nfts_found = await query_nfts.find({useMasterKey: true})
        
        for (let i = 0; i < nfts_found.length; i++) {
            let nft = nfts_found[i]

            nft.set('onSale', true)
            nft.set('publishedTime', dateNow)
            nft.set('releaseTime', null)
            await nft.save(null, {useMasterKey: true})
            
        }
        req.message("NFT's released")
        return "NFT's released"


    } catch (error) {
        return error.message
    }
});

Moralis.Cloud.job('validate_orders', async (req) => {

    req.message("Looking for design orders to validate!");

    try {
        const query_designs = new Moralis.Query('OrderDesign')
        query_designs.include('requester')
        query_designs.notEqualTo('userValidated', true)
        const designs_validated = await query_designs.find({useMasterKey: true})
        let status_validation_order;
        let user_validation;
        for (let i = 0; i < designs_validated.length; i++) {

            status_validation_order = !!designs_validated[i].attributes.userValidated;
            user_validation = !!designs_validated[i].attributes.requester.attributes.isValidated;

            if(user_validation && !status_validation_order){
                designs_validated[i].set('userValidated', user_validation)
                await designs_validated[i].save(null, {useMasterKey: true})
            }
        }
        req.message("Design orders processed")
        return 'Design orders processed'

    } catch (error) {
        return 'ERROR on validate orders'
    }
});