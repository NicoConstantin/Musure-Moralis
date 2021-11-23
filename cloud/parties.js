const Party = Moralis.Object.extend('Party');


Moralis.Cloud.define('patch_party_data', async (req) => {
    const query_user = new Moralis.Query(Moralis.User);
    const newParty = new Party();

    try {
        const actualUser = await query_user.get(req.user.id, { useMasterKey:true });
        newParty.set('name', req.params.name);
        newParty.set('bio', req.params.bio);
        newParty.set('image',req.params.image);
        newParty.set('owner', actualUser);
        await newParty.save()

        return {
            updated:true,
            message: "Party Updated"
        }

    } catch (error) {
        return {
            updated:true,
            message: error.message
        }
    }
});

Moralis.Cloud.define('get_all_parties', async (req) => {
    const query_party = new Moralis.Query('Party');
    try {
        let allParties = await query_party.find( { useMasterKey:true } )
        return {
            parties: allParties,
            message: "All parties info"
        }
        
    } catch (error) {
        return {
            parties: false,
            message: error.message
        }
    }
});

Moralis.Cloud.define('get_party_data', async (req) => {
    const query_party = new Moralis.Query('Party');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        let party = await query_party.get(req.params.party_id, { useMasterKey:true } )
        
        if(req.params.price){
            query_economy.equalTo('reference','reward_per_avatar_party')
            let price_per_avatar = await query_economy.find()
            return {
                party: party,
                price: price_per_avatar[0].attributes.price,
                message: "Party info"
            }
        }

        else{
            return {
                party: party,
                message: "Party info"
            }
        }

    } catch (error) {
        return {
            party: false,
            message: error.message
        }
    }
});