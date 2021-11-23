const Mission = Moralis.Object.extend('MISSION_MASTER');

Moralis.Cloud.define('get_missions', async (req) => {
    const query_mission_master = new Moralis.Query('MISSION_MASTER');
    try {
        let missions = await query_mission_master.find()
        return{
            missions: missions,
            message:"Missions info"
        }
    } catch (error) {
        return{
            missions: false,
            message:error.message
        }
    }
});

Moralis.Cloud.define('do_creator_quest', async (req) => {
    const query_economy = new Moralis.Query('ECONOMY');
    const query_user = new Moralis.Query(Moralis.User);

    try {
        query_economy.equalTo('reference','reward_per_avatar_party')
        let price_per_avatar = await query_economy.find()
        const actualUser = await query_user.get(req.user.id, { useMasterKey:true })
        let amountWon = price_per_avatar[0].attributes.price * req.params.qty_avatars
        actualUser.set('balanceClaim', actualUser.attributes.balanceClaim + amountWon)
        actualUser.set('timeQuest', getDate(1,'days'))
        let userUpdated = await actualUser.save(null, { useMasterKey:true })

        return {
            new_balance: userUpdated.attributes.balanceClaim,
            message: "Creator quest done"
        }
        
    } catch (error) {

        return {
            new_balance: false,
            message: error.message
        }
        
    }
});