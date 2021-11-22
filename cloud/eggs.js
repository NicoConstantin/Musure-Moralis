Moralis.Cloud.define('mint_egg', async (req) => {
    const Egg = Moralis.Object.extend('Egg');
    const query = new Moralis.Query(Moralis.User);
    
    try{
        let actualUser = await query.get( req.user.id, { useMasterKey:true } )
        const newEgg = new Egg();
        newEgg.set('timeHatch', getDate(2,"hours"))
        newEgg.set('isHatched', false)
        newEgg.set('owner', actualUser)
        await newEgg.save()
        return "egg created"
    }

    catch(error){
        return error.message
    }
    
    
});