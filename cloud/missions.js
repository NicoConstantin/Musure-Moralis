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
        let amountWon = price_per_avatar[0].attributes.price * req.params.qty_avatars

        const actualUser = await query_user.get(req.user.id, { useMasterKey:true })
        actualUser.set('balanceClaim', actualUser.attributes.balanceClaim + amountWon)
        actualUser.set('timeQuest', getDate(cooldown_set_time, cooldown_set_type))
        await actualUser.save(null, { useMasterKey:true })

        return {
            newBalance: actualUser.attributes.balanceClaim,
            message: "Creator quest done"
        }
        
    } catch (error) {

        return {
            newBalance: false,
            message: error.message
        }
        
    }
});

Moralis.Cloud.define('do_crew_quest', async (req) => {

    const query_mission = new Moralis.Query('MISSION_MASTER');
    const query_avatar = new Moralis.Query('Avatar');
    const query_user = new Moralis.Query(Moralis.User);
    
    try {
        let mission = await query_mission.get(req.params.mission_id)
        let avatar = await query_avatar.get(req.params.avatar_id)
        let actualUser = await query_user.get(req.user.id, { useMasterKey:true })

        let generated = rarityGenerator(null, mission.attributes.successRate)

        avatar.set('timeMine',getDate(2,'hours'))
        await avatar.save()
    
        if(generated.result){
            //acreditar al user
            actualUser.set('balanceClaim', actualUser.attributes.balanceClaim + mission.attributes.reward)
            let userUpdated = await actualUser.save(null, { useMasterKey:true })

            return {
                results:{
                    result: generated.result,
                    roll: generated.roll,
                    reward: mission.attributes.reward,
                    successRate: mission.attributes.successRate,
                    newBalance: userUpdated.attributes.balanceClaim
                },
                message: 'Mission successfully completed'
            }
        }

        if(!generated.result){
            return {
                results:{
                    result: generated.result,
                    roll: generated.roll,
                    reward: mission.attributes.reward,
                    successRate: mission.attributes.successRate,
                    newBalance: actualUser.attributes.balanceClaim
                },
                message: 'Mission failed'
            }
        }
        
        
    } catch (error) {
        return {
            results:false,
            message: error.message
        }
    }
});