const AccesoryNFT = Moralis.Object.extend('Accessory');

Moralis.Cloud.afterSave('ToolkitValidating', async (req) => {

    //DONT MODIFY DATA ON THE ROW IF VALIDATED IS ON TRUE, BECAUSE IT WILL TRIGGER NFT MINTING TWICE
    if(req.object.get('validated')){

        logger.info(JSON.stringify('SE VALIDO LA CREACION DE UNOS NFT'))

        try {
            
            const name = req.object.get('name');
            const lore = req.object.get('lore');
            const type = req.object.get('type');
            const rarity = req.object.get('rarity');
            const amountEmit = req.object.get('amountEmit');
            const price = req.object.get('price');
            const owner = req.object.get('owner');
            const file = req.object.get('file');
    
            const query_rarities_accessories = new Moralis.Query ('ACCESSORY_RARITY_MASTER')
            let accessoriesData = await query_rarities_accessories.find();
    
            const rarityChosen = accessoriesData.find(e=>e.attributes.rarity === rarity)
    
            for (let i = 0; i < amountEmit; i++) {
                const newNFT = new AccesoryNFT();
                newNFT.setACL(new Moralis.ACL(owner))
                newNFT.set('name', name);
                newNFT.set('lore', lore);
                newNFT.set('type', type);
                newNFT.set('rarity', rarity);
                newNFT.set('rarityNumber', rarityChosen.attributes.rarityNumber);
                newNFT.set('power', 0);
                newNFT.set('owner', owner);
                newNFT.set('durationLeft', rarityChosen.attributes.maxDuration);
                newNFT.set('price', price);
                newNFT.set('onSale', true);
                newNFT.set('publishedTime', getDate());
                newNFT.set('image', file)
                await newNFT.save(null,{useMasterKey: true})
                logger.info(JSON.stringify(`NFT number ${i} from ${owner.id} created`))
            }

            logger.info(JSON.stringify("All NFT's created"))

        } catch (error) {
            logger.info(JSON.stringify(error.message))
        }

    }

});