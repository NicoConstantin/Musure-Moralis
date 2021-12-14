const Party = Moralis.Object.extend('Party');

//VALIDATED
Moralis.Cloud.define('patch_party_data', async (req) => {

    const {name, bio, image} = req.params;
    const actualUser = req.user
    let newParty = ""

    try {
        //VALIDATING NOT REQUIRED FIELDS
        if(name.length < min_length_names || name.length > max_length_names){
            return `name must be a string and must be between ${min_length_names} and ${max_length_names} long`
        }
        if(bio.length < min_length_bio || bio.length > max_length_bio){
            return `bio must be a string and must be between ${min_length_bio} and ${max_length_bio} long`
        }
        //MISSING VALIDATION OF IMAGE, NEED TO LOGG typeof(image)

        //VALIDATING CONTEXT
        if(!req.user.attributes.isValidated){
            return "You must be validated to create a party"
        }
        if(actualUser.attributes.partyOwn){
            newParty = actualUser.attributes.partyOwn
        }

        //CREATING A NEW PARTY
        else{
            newParty = new Party()
            actualUser.set('partyOwn', newParty)
            await actualUser.save(null, { useMasterKey:true })
        }

        //SETTING FIELDS
        newParty.set('name', name);
        newParty.set('bio', bio);
        newParty.set('image', image);
        newParty.set('owner', actualUser);
        newParty.setACL(new Moralis.ACL(actualUser))
        await newParty.save(null, { useMasterKey:true })

        return {
            updated:true,
            party: newParty,
            message: "Party Updated"
        }

    } catch (error) {
        return error.message
    }
},{
    requireUser: true
});

//NOT REQUIRE VALIDATION
Moralis.Cloud.define('get_all_parties', async () => {

    const query_party = new Moralis.Query('Party');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        query_party.include('owner')
        let allParties = await query_party.find({ useMasterKey:true })
        let economy = await query_economy.find()
        let prices_to_join = economy.filter(el=>el.attributes.reference.slice(0,4) === "join")

        return {
            parties: allParties,
            pricesToJoin: prices_to_join,
            message: "All parties info"
        }
        
    } catch (error) {
        return error.message
    }
},{
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('get_party_data', async (req) => {

    const {party_id, price} = req.params;
    const query_party = new Moralis.Query('Party');
    const query_economy = new Moralis.Query('ECONOMY');

    try {
        query_party.include('owner')
        query_party.include('avatarsIn')
        let party = await query_party.get(party_id, { useMasterKey:true } )

        if(price){
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
        return error.message
    }
},{
    fields:{
        party_id:{
            ...validation_id,
            error:"party_id is not passed or has an error"
        }
    },
    requireUser: true
});
