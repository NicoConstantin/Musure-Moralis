const Egg = Moralis.Object.extend('Egg');

Moralis.Cloud.define('mint_egg', async (req) => {
    
    try{
        let actualUser = await query_user.get( req.user.id, { useMasterKey:true } )
        const newEgg = new Egg();
        newEgg.set('timeHatch', getDate(2,"hours"))
        newEgg.set('isHatched', false)
        newEgg.set('owner', actualUser)
        await newEgg.save()
        return {
            created:true,
            messsage:"Egg created"
        }
    }
    
    catch(error){
        return {
            created: false,
            messsage: error.message
        }
    }

    //LUEGO MANEJAR EL TEMA DINERO DEL USUARIO 
});