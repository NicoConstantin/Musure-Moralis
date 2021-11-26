const Party = Moralis.Object.extend('Party');

//VALIDATED
Moralis.Cloud.define('patch_party_data', async (req) => {

    try {

        let newParty = ""
        const actualUser = req.user
        
        if(actualUser.attributes.partyOwn){
            newParty = actualUser.attributes.partyOwn
        }
        else{
            newParty = new Party()
            actualUser.set('partyOwn', newParty)
            await actualUser.save(null, { useMasterKey:true })
        }

        newParty.set('name', req.params.name);
        newParty.set('bio', req.params.bio);
        newParty.set('image',req.params.image);
        newParty.set('owner', actualUser);
        newParty.setACL(new Moralis.ACL(actualUser))
        await newParty.save(null, { useMasterKey:true })

        return {
            updated:true,
            message: "Party Updated"
        }

    } catch (error) {
        return {
            updated:false,
            message: error.message
        }
    }
},{
    fields:{
        name: {
            required:false,
            options: (val)=> {
                return val.length >= min_length_names && val.length <= max_length_names
            }
        },
        bio: {
            required:false,
            options: (val)=> {
                return val.length >= min_length_bio && val.length <= max_length_bio
            }
        }
    }
});

//NOT REQUIRE VALIDATION
Moralis.Cloud.define('get_all_parties', async (req) => {

    const query_party = new Moralis.Query('Party');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        query_party.include('owner')
        let allParties = await query_party.find( null, { useMasterKey:true })
        let economy = await query_economy.find()
        let prices_to_join = economy.filter(el=>el.attributes.reference.slice(0,4) === "join")

        return {
            parties: allParties,
            pricesToJoin: prices_to_join,
            message: "All parties info"
        }
        
    } catch (error) {
        return {
            parties: false,
            message: error.message
        }
    }
});
//VALIDATED
Moralis.Cloud.define('get_party_data', async (req) => {

    const query_party = new Moralis.Query('Party');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        query_party.include('owner')
        query_party.include('avatarsIn')
        let party = await query_party.get(req.params.party_id, { useMasterKey:true } )

        if(req.params.price){
            query_economy.equalTo('reference','reward_per_avatar_party')
            let price_per_avatar = await query_economy.first()

            return {
                party: party,
                price: price_per_avatar.attributes.price,
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
},{
    fields:{
        party_id:{
            ...validation_id,
            error:"party_id is not passed or has an error"
        }
    }
});
