const Mission = Moralis.Object.extend('MISSION_MASTER');

//VALIDATED
Moralis.Cloud.define('get_missions', async () => {

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
        return error.message
    }

},{
    requireUser: true
});

//VALIDATED
Moralis.Cloud.define('do_creator_quest', async (req) => {

    const query_economy = new Moralis.Query('ECONOMY');

    const qty_avatars = req.params.qty_avatars
    const user = req.user;

    try {

        //VALIDATING CONTEXT
        if(!user.attributes.isValidated){
            return "You must be validated as a creator to do this quest"
        }
        if(!user.attributes.partyOwn || user.attributes.timeContract < getDate() ){
            return "You must have a party to do this quest"
        }
        if( user.attributes.timeQuest > getDate()){
            return `You have to wait ${Math.round((user.attributes.timeQuest - getDate())/60)} minutes to do this mission`
        }

        //SEARCHING REWARD
        query_economy.equalTo('reference','reward_per_avatar_party')
        let price_per_avatar = await query_economy.first()

        let amountWon = price_per_avatar.attributes.price * qty_avatars

        //SETTING FIELDS
        user.set('balanceClaim', user.attributes.balanceClaim + amountWon)
        user.set('timeQuest', getDate(cooldown_set_time, cooldown_set_type))
        await user.save(null, { useMasterKey:true })

        return {
            newBalance: user.attributes.balanceClaim,
            message: "Creator quest done"
        }
        
    } catch (error) {
        return error.message
    }
},{
    fields:{
        qty_avatars:{
            required: true,
            type: Number,
            options: (val)=>{
                return val > 0
            },
            error: "You must have avatars on your party"
        }
    },
    requireUser: true
});