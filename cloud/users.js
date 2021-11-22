//req.user.id ID DEL USUARIO
//Date.now manda unix en UTC
const logger = Moralis.Cloud.getLogger();
logger.info("get_login");

Moralis.Cloud.define("get_login", async (req) =>{
    
    const query = new Moralis.Query(Moralis.User);
    query.equalTo("objectId", req.user.id)
    const results = await query.find({useMasterKey:true});
    
    return results
})
