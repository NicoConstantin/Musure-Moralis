const musure_transfer_pending = Moralis.Object.extend('MusureTransfersPending');

Moralis.Cloud.define('payment', async (req) => {

    const { hash, reference, data } = req.params;
    const user = req.user;
    
    try {
        //GETTING INFO REQUIRED TO VALIDATE
        let rarities_availables;
        let types_availables;
        let regex_ipfs_moralis = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?(ipfs.moralis.io)(:[0-9]{1,5})?(\/.*)?$/
        
        if(reference === 'nftCreation'){
            let query_rarities = new Moralis.Query('ACCESSORY_RARITY_MASTER')
            let raw_rarities = await query_rarities.find({useMasterKey:true})
            rarities_availables = raw_rarities.map(rar=> rar.attributes.rarity)
            
            let query_types = new Moralis.Query('ACCESSORY_TYPE_MASTER')
            let raw_types = await query_types.find({useMasterKey:true})
            types_availables = raw_types.map(rar=> rar.attributes.type)
        }
        
        //VALIDATIONS
        if(data){
            const { name, lore, rarity, amount_emit, price, type, texture_left, texture_right, avatar_id, party_id, time_contract, accessory_id } = data;
            logger.info(JSON.stringify(data))
            if(avatar_id && typeof(avatar_id) !== 'string' && !avatar_id?.length === 24){
                return "data.avatar_id does not satisfy the required conditions"
            }
            if(accessory_id && typeof(accessory_id) !== 'string' && !accessory_id?.length === 24){
                return "data.accessory_id does not satisfy the required conditions"
            }
            if(party_id && typeof(party_id) !== 'string' && !party_id?.length === 24){
                return "data.party_id does not satisfy the required conditions"
            }
            if(time_contract && time_contract < 7 || time_contract > 150){
                return "data.time_contract does not satisfy the required conditions"
            }
    
            if(name && typeof(name) !== 'string' || name?.length > max_length_names || name?.length < min_length_names){
                return "data.name does not satisfy the required conditions"
            }
            if(lore && typeof(lore) !== 'string' || name?.length > max_length_bio || name?.length < min_length_bio){
                return "data.lore does not satisfy the required conditions"
            }
            if(rarity && !rarities_availables.includes(rarity)){
                return "data.rarity does not satisfy the required conditions"
            }
            if(amount_emit && typeof(amount_emit) !== 'number'){
                return "data.amount_emit does not satisfy the required conditions"
            }
            if(price && typeof(price) !== 'number'){
                return "data.price does not satisfy the required conditions"
            }
            if(type && !types_availables.includes(type)){
                return "data.type does not satisfy the required conditions"
            }
            if(texture_left && !regex_ipfs_moralis.test(texture_left)){
                return "data.texture_left does not satisfy the required conditions"
            }
            if(texture_right && !regex_ipfs_moralis.test(texture_right)){
                return "data.texture_right does not satisfy the required conditions"
            }
        }

        //SETTING FIELDS
        const new_transfer_pending = new musure_transfer_pending();
        new_transfer_pending.set('account', user.attributes.accounts[0])
        new_transfer_pending.set('payer', user)
        new_transfer_pending.set('hash', hash)
        new_transfer_pending.set('data', data)
        new_transfer_pending.set('reference', reference)
        await new_transfer_pending.save(null,{ useMasterKey: true })

        return {
            transferPending:true,
            message:"Tranfer pending"
        }
        
    } catch (error) {
        return error.message
    }
    
},{
    fields:{
        hash:{
            required: true,
            type: String,
            options: val=>{
                return /^0x([A-Fa-f0-9]{64})$/.test(val)
            },
            error:'Hash have an error'
        },
        reference:{
            required: true,
            type: String,
            options: val=>{
                const options = ['egg', 'party', 'accessory', 'marketAvatar', 'marketAccessory', 'nftCreation']
                return options.includes(val)
            },
            error: 'reference must be specific'
        }
    }
});