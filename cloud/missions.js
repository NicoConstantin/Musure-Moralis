const Mission = Moralis.Object.extend('MISSION_MASTER');
//NOT REQUIRE VALIDATION
Moralis.Cloud.define('get_missions', async (req) => {

    const query_mission_master = new Moralis.Query('MISSION_MASTER');

    try {
        query_mission_master.ascending('reqPower')
        query_mission_master.ascending('location')
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
//VALIDATED
Moralis.Cloud.define('do_creator_quest', async (req) => {

    const query_economy = new Moralis.Query('ECONOMY');

    try {
        const user = req.user;

        if(!user.attributes.isValidated){
            return "You must be validated as a creator to do this quest"
        }
        if(!user.attributes.partyOwn || user.attributes.timeContract < getDate() ){
            return "You must have a party to do this quest"
        }
        if( user.attributes.timeQuest > getDate()){
            return `You have to wait ${Math.round((user.attributes.timeQuest - getDate())/60)} minutes to do this mission`
        }

        query_economy.equalTo('reference','reward_per_avatar_party')
        let price_per_avatar = await query_economy.first()

        let amountWon = price_per_avatar.attributes.price * req.params.qty_avatars

        user.set('balanceClaim', user.attributes.balanceClaim + amountWon)
        user.set('timeQuest', getDate(cooldown_set_time, cooldown_set_type))
        await user.save(null, { useMasterKey:true })

        return {
            newBalance: user.attributes.balanceClaim,
            message: "Creator quest done"
        }
        
    } catch (error) {

        return {
            newBalance: false,
            message: error.message
        }
        
    }
},{
    fields:{
        qty_avatars:{
            required: true,
            type: Number,
            options: (val)=>{
                return val>0
            },
            error: "You must have avatars on your party"
        }
    }
});

//VALIDATED
Moralis.Cloud.define('do_crew_quest', async (req) => {

    const query_mission = new Moralis.Query('MISSION_MASTER');
    const query_avatar = new Moralis.Query('Avatar');
    
    try {
        
        const user = req.user
        let mission = await query_mission.get(req.params.mission_id, {useMasterKey:true})
        let avatar = await query_avatar.get(req.params.avatar_id, {useMasterKey:true})

        if(avatar.attributes.timeMine > getDate()){
            return `You must wait ${Math.round((avatar.attributes.timeMine < getDate())/60)} minutes to do this quest`
        }

        if(!avatar.attributes.belongParty){
            return 'You must be in a party to do this quest :('
        }

        let generated = getRandomNumber(mission.attributes.successRate)

        avatar.set('timeMine',getDate(cooldown_set_time, cooldown_set_type))
        await avatar.save(null, { useMasterKey:true })
    
        if(generated.result){
            user.set('balanceClaim', user.attributes.balanceClaim + mission.attributes.reward)
            await user.save(null, { useMasterKey:true })

            return {
                results:{
                    result: generated.result,
                    roll: generated.roll,
                    reward: mission.attributes.reward,
                    successRate: mission.attributes.successRate,
                    newBalance: user.attributes.balanceClaim
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
                    newBalance: user.attributes.balanceClaim
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
},{
    fields:{
        avatar_id:{
            ...validation_id,
            error:"avatar_id is not passed or has an error"
        },
        mission_id:{
            ...validation_id,
            error:"mission_id is not passed or has an error"
        }
    }
});