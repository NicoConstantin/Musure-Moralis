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