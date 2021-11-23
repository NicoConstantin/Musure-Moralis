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