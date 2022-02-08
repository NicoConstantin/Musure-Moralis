Moralis.Cloud.afterSave("MusureTransfers", async function (req) {

    const confirmed = req.object.get("confirmed");
    const hash = req.object.get('transaction_hash')
    const account = req.object.get('from')

    
    if (confirmed) {
        // find the pending transaction
      const query_avatar = new Moralis.Query('Avatar')
      const query_party = new Moralis.Query('Party');
      const query_accessory_type = new Moralis.Query('ACCESSORY_TYPE_MASTER');
      const query_accessory_rarity = new Moralis.Query('ACCESSORY_RARITY_MASTER');
      const query_accessory = new Moralis.Query('Accessory')

      const query_transfer_pending = new Moralis.Query('MusureTransfersPending')
      query_transfer_pending.equalTo('account', account)
      query_transfer_pending.equalTo('hash', hash)
      const transferToProcess = await query_transfer_pending.first({useMasterKey:true})

      const user = transferToProcess.attributes.payer
      let primary_id = ""
      let secondary_id = ""
      let extra_data = ""

      if(transferToProcess.attributes.data){
          primary_id = transferToProcess.attributes.data[0]
          secondary_id = transferToProcess.attributes.data[1]
          extra_data = transferToProcess.attributes.data[2]
      }

      switch (transferToProcess.attributes.reference) {

        case 'egg':
           
            const newEgg = new Egg();
            newEgg.set('timeHatch', getDate(cooldown_set_time, cooldown_set_type))
            newEgg.set('isHatched', false)
            newEgg.set('owner', user)
            newEgg.setACL(new Moralis.ACL(user))
            await newEgg.save(null, { useMasterKey:true })

            logger.info(JSON.stringify('EGG CREATED'))
            break;

        case 'accessory':

            let accessoriesTypes = await query_accessory_type.find();
            let accessoriesRate = await query_accessory_rarity.find();

            //GETTING RANDOMIZERS
            let typeAcc = getRandomType(accessoriesTypes)
            let rarityAcc = getRandomRarity(accessoriesRate)
            let power = getRandomPower(rarityAcc.attributes.maxPower, rarityAcc.attributes.minPower)

            //SETTING ACCESSORY FIELDS
            const newAccessory = new Accesory();
            newAccessory.set('type', typeAcc.attributes.type)
            newAccessory.set('rarity', rarityAcc.attributes.rarity)
            newAccessory.set('rarityNumber', rarityAcc.attributes.rarityNumber)
            newAccessory.set('durationLeft', rarityAcc.attributes.maxDuration)
            newAccessory.set('power', power)
            newAccessory.set('owner', user)
            newAccessory.set('onSale', false)
            newAccessory.set('publishedTime', -1)
            newAccessory.setACL(new Moralis.ACL(user))
            await newAccessory.save(null, { useMasterKey:true })

            logger.info(JSON.stringify('ACCESSORY CREATED'))
            break;

        case 'party':

            let avatarToJoin = await query_avatar.get(primary_id, {useMasterKey:true});
            
            //VALIDATING CONTEXT
            if(avatarToJoin.attributes.timeContract>-1 || avatarToJoin.attributes.belongParty){
                logger.info(JSON.stringify('That avatar already has a party'))
                break;
            }
            if(extra_data < 7){
                logger.info(JSON.stringify('time_contract must be a number greater or equal to 7'))
                break;
            }
            
            //SETTING PARTY FIELDS
            let partyToJoin = await query_party.get(secondary_id, {useMasterKey:true});
            partyToJoin.addUnique('avatarsIn',avatarToJoin)
            await partyToJoin.save(null, {useMasterKey:true})

            //SETTING AVATAR FIELDS
            avatarToJoin.set('playsLeft', 5)
            avatarToJoin.set('timeContract', getDate(extra_data, 'hour'))
            avatarToJoin.set('belongParty', partyToJoin)
            await avatarToJoin.save(null, {useMasterKey:true})

            logger.info(JSON.stringify('AVATAR JOINED TO PARTY'))
            break;

        case 'marketAvatar':
        
            let avatar = await query_avatar.get(primary_id, {useMasterKey: true})
    
            //VALIDATING CONTEXT
            if(avatar.attributes.owner.id === user.id){
                logger.info(JSON.stringify('You cannot buy your own avatar'))
                break;
            }
            if(!avatar.attributes.onSale){
                logger.info(JSON.stringify('this avatar is not on sale'))
                break;
            }
            else{
                //TRANSFERING AVATAR
                avatar.set('price', null)
                avatar.set('onSale', false)
                avatar.set('publishedTime', -1)
                avatar.set('owner', user)
                avatar.setACL(new Moralis.ACL(user))
                await avatar.save(null, {useMasterKey:true})
            }

            logger.info(JSON.stringify('AVATAR TRANSFERED'))
            break;

        case 'marketAccessory':
        
            let accessory = await query_accessory.get(primary_id, {useMasterKey: true})
    
            //VALIDATING CONTEXT
            if(accessory.attributes.owner.id === user.id){
                return 'you cannot buy your own accessory'
            }
            if(!accessory.attributes.onSale){
                return 'this accessory is not on sale'
            }
            else{
                //TRANSFERING ACCESSORY
                accessory.set('price', null)
                accessory.set('onSale', false)
                accessory.set('publishedTime', -1)
                accessory.set('owner', user)
                accessory.setACL(new Moralis.ACL(user))
                await accessory.save(null, {useMasterKey:true})
        
            }

            logger.info(JSON.stringify('ACCESSORY TRANSFERED'))
            break;

        case 'nftCreation':
        const AccesoryNFT = Moralis.Object.extend('Accessory');
        const name = transferToProcess.attributes.data[0];
        const lore = transferToProcess.attributes.data[1];
        const rarity = transferToProcess.attributes.data[2];
        const amountEmit = transferToProcess.attributes.data[3];
        const price = transferToProcess.attributes.data[4];
        const file = transferToProcess.attributes.data[5];
        const type = transferToProcess.attributes.data[6];

        // const newNFT = new toolkitObj();
        // newNFT.set('name', name)
        // newNFT.set('lore', lore)
        // newNFT.set('rarity', rarity)
        // newNFT.set('type', type)
        // newNFT.set('amountEmit', Number(amountEmit))
        // newNFT.set('price', Number(price))
        // newNFT.set('file', file)
        // newNFT.set('owner', user)
        // newNFT.set('validated', false)
        // await newNFT.save(null, { useMasterKey: true})
        
        // logger.info(JSON.stringify('NFT Data saved'))
        const query_rarities_accessories = new Moralis.Query ('ACCESSORY_RARITY_MASTER')
        let accessoriesData = await query_rarities_accessories.find();

        const rarityChosen = accessoriesData.find(e=>e.attributes.rarity === rarity)

        for (let i = 0; i < amountEmit; i++) {
            const newNFT = new AccesoryNFT();
            newNFT.setACL(new Moralis.ACL(user))
            newNFT.set('name', name);
            newNFT.set('lore', lore);
            newNFT.set('type', type);
            newNFT.set('rarity', rarity);
            newNFT.set('rarityNumber', rarityChosen.attributes.rarityNumber);
            newNFT.set('power', 0);
            newNFT.set('owner', user);
            newNFT.set('durationLeft', null);
            logger.info(JSON.stringify(price))
            newNFT.set('price', Number(price));
            newNFT.set('onSale', true);
            newNFT.set('publishedTime', getDate());
            newNFT.set('image', 'https://ipfs.moralis.io:2053/ipfs/Qmdm9RLrYcJKirY7kjRLH4yxnwzWUfw3dKZUTBvrNrP64H')
            // newNFT.set('image', file)
            await newNFT.save(null,{useMasterKey: true})
            logger.info(JSON.stringify(`NFT number ${i} from ${user.id} created`))
        }

        logger.info(JSON.stringify("All NFT's created"))

        break;

        default:
        break;
    }

      await transferToProcess.destroy({useMasterKey:true})
    }

    else{
        return;
    }

  });