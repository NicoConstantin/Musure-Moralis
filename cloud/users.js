Moralis.Cloud.define("get_login", async (req) =>{
    try {
        const query_user = new Moralis.Query(Moralis.User)
        // query_user.exclude('ACL')
        // query_user.exclude('authData')
        // query_user.exclude('sessionToken')
        query_user.equalTo('objectId', req.user.id)
        let actualUser = await query_user.find({ useMasterKey:true })
        return {
            user: actualUser[0],
            message: "User Info"
        }
        //FALTA MANDAR TOKENS
    } catch (error) {
        return {
            user: actualUser,
            message: error.message
        }
    }
})
