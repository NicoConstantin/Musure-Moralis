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
      const transfer_to_process = await query_transfer_pending.first({useMasterKey:true})

      const user = transfer_to_process.attributes.payer
      const data = transfer_to_process.attributes.data

      switch (transfer_to_process.attributes.reference) {

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

            let accessories_types = await query_accessory_type.find();
            let accessories_rate = await query_accessory_rarity.find();

            //GETTING RANDOMIZERS
            let type_acc = getRandomType(accessories_types)
            let rarity_acc = getRandomRarity(accessories_rate)
            let power = getRandomPower(rarity_acc.attributes.maxPower, rarity_acc.attributes.minPower)

            //SETTING ACCESSORY FIELDS
            const new_accessory = new Accesory();
            new_accessory.set('type', type_acc.attributes.type)
            new_accessory.set('rarity', rarity_acc.attributes.rarity)
            new_accessory.set('rarityNumber', rarity_acc.attributes.rarityNumber)
            new_accessory.set('durationLeft', rarity_acc.attributes.maxDuration)
            new_accessory.set('power', power)
            new_accessory.set('owner', user)
            new_accessory.set('onSale', false)
            new_accessory.set('publishedTime', -1)
            new_accessory.setACL(new Moralis.ACL(user))
            await new_accessory.save(null, { useMasterKey:true })
            logger.info(JSON.stringify('ACCESSORY CREATED'))

            break;

        case 'party':

            let avatar_to_join = await query_avatar.get(data.avatar_id, {useMasterKey:true});
            
            //VALIDATING CONTEXT
            if(avatar_to_join.attributes.timeContract>-1 || avatar_to_join.attributes.belongParty){
                logger.info(JSON.stringify('That avatar already has a party'))
                break;
            }
            //SETTING PARTY FIELDS
            let party_to_join = await query_party.get(data.party_id, {useMasterKey:true});
            party_to_join.addUnique('avatarsIn',avatar_to_join)
            await party_to_join.save(null, {useMasterKey:true})

            //SETTING AVATAR FIELDS
            avatar_to_join.set('playsLeft', 5)
            avatar_to_join.set('timeContract', getDate(data.time_contract, 'hour'))
            avatar_to_join.set('belongParty', party_to_join)
            await avatar_to_join.save(null, {useMasterKey:true})
            logger.info(JSON.stringify('AVATAR JOINED TO PARTY'))

            break;

        case 'marketAvatar':
        
            let avatar = await query_avatar.get(data.avatar_id, {useMasterKey: true})
    
            //VALIDATING CONTEXT
            if(avatar.attributes.owner.id === user.id){
                logger.info(JSON.stringify('You cannot buy your own avatar'))
                break;
            }
            if(!avatar.attributes.onSale){
                logger.info(JSON.stringify('this avatar is not on sale'))
                break;
            }

            //TRANSFERING AVATAR
            avatar.set('price', null)
            avatar.set('onSale', false)
            avatar.set('publishedTime', -1)
            avatar.set('owner', user)
            avatar.setACL(new Moralis.ACL(user))
            await avatar.save(null, {useMasterKey:true})
            logger.info(JSON.stringify('AVATAR TRANSFERED'))

            break;

        case 'marketAccessory':
        
            let accessory = await query_accessory.get(data.accessory_id, {useMasterKey: true})
    
            //VALIDATING CONTEXT
            if(accessory.attributes.owner.id === user.id){
                return 'you cannot buy your own accessory'
            }
            if(!accessory.attributes.onSale){
                return 'this accessory is not on sale'
            }

            //TRANSFERING ACCESSORY
            accessory.set('price', null)
            accessory.set('onSale', false)
            accessory.set('publishedTime', -1)
            accessory.set('owner', user)
            accessory.setACL(new Moralis.ACL(user))
            await accessory.save(null, {useMasterKey:true})
            logger.info(JSON.stringify('ACCESSORY TRANSFERED'))

            break;

        case 'nftCreation':

        const accessory_NFT = Moralis.Object.extend('AccessoryNFT');
        const query_rarities_accessories = new Moralis.Query ('ACCESSORY_RARITY_MASTER')
        let accessories_data = await query_rarities_accessories.find();
        
        const rarity_chosen = accessories_data.find(e=>e.attributes.rarity === data.rarity)

        for (let i = 0; i < data.amount_emit; i++) {
            const new_NFT = new accessory_NFT();
            new_NFT.setACL(new Moralis.ACL(user))
            new_NFT.set('name', data.name);
            new_NFT.set('lore', data.lore);
            new_NFT.set('type', data.type);
            new_NFT.set('rarity', data.rarity);
            new_NFT.set('rarityNumber', rarity_chosen.attributes.rarityNumber);
            new_NFT.set('power', 0);
            new_NFT.set('owner', user);
            new_NFT.set('price', Number(data.price));
            new_NFT.set('onSale', true);
            new_NFT.set('publishedTime', getDate());
            new_NFT.set('textureLeft', data.texture_left)
            new_NFT.set('textureRight', data.texture_right)
            await new_NFT.save(null,{useMasterKey: true})
            logger.info(JSON.stringify(`NFT number ${i} from ${user.id} created`))
        }
        logger.info(JSON.stringify("All NFT's created"))


        break;

        default:
        break;
    }

      await transfer_to_process.destroy({useMasterKey:true})
    }

    else{
        return;
    }

  });