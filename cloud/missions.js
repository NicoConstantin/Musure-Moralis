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

//VALIDATED
// Moralis.Cloud.define('do_crew_quest', async (req) => {


//     const logger = Moralis.Cloud.getLogger();
//     const query_mission = new Moralis.Query('MISSION_MASTER');
//     const query_avatar = new Moralis.Query('Avatar');
//     const query_accessories = new Moralis.Query('Accessory');

//     const { mission_id, avatar_id} = req.params
//     const user = req.user
//     const typesAccessories = ['head', 'pet', 'sneaker', 'aura', 'wing', 'vehicle', 'skin', 'bazooka', 'dance', 'graffiti']
    
//     try {
//         for (let i = 0; i < typesAccessories.length; i++) {
//             query_avatar.include(typesAccessories[i])
//         }
//         let avatar = await query_avatar.get(avatar_id, {useMasterKey:true})
        
//         //VALIDATING CONTEXT
//         if(avatar.attributes.timeMine > getDate()){
//             return `You must wait ${Math.round((avatar.attributes.timeMine < getDate())/60)} minutes to do this quest`
//         }
//         if(!avatar.attributes.belongParty){
//             return 'You must be in a party to do this quest :('
//         }
//         if(avatar.attributes.onSale){
//             return 'You cannot do quest if your avatar is on sale'
//         }
        
//         let mission = await query_mission.get(mission_id, {useMasterKey:true})
//         query_accessories.equalTo('equippedOn', avatar)
//         let accessoriesEquipped = await query_accessories.find({useMasterKey:true})
//         //GENERATING RANDOM NUMBER
//         let generated = getRandomNumber(mission.attributes.successRate)

//         //SETTING FIELDS
//         avatar.set('timeMine',getDate(cooldown_set_time, cooldown_set_type))
//         await avatar.save(null, { useMasterKey:true })

//         //LOWERING DURABILITY OF ACCESSORIES, IF REACH 0 , LOWS AVATAR POWER
//         for (let i = 0; i < accessoriesEquipped.length; i++) {
//             let acc = accessoriesEquipped[i]
//             if(acc.attributes.durationLeft > 0){
                
//                 let newDuration = acc.attributes.durationLeft - 1 
    
//                 if(newDuration === 0){
//                     avatar.set('power', avatar.attributes.power - accessory.attributes.power)
//                     await avatar.save(null, { useMasterKey:true })
//                     acc.set('power', 0)
//                 }
                
//                 acc.set('durationLeft', newDuration)
//                 await acc.save(null, { useMasterKey:true })
//             }
            
//         }
//         //SETTING ARRAY WITH AVATAR ACCESSORIES
//         let temp = typesAccessories.map(type=>{
//             if(avatar.attributes[type] !== undefined){
//                 return {
//                     durationLeft: avatar.attributes[type].attributes.durationLeft - 1,
//                     type: type
//                 }
//             }
//         })
//         let accessories = temp.filter(n=> typeof(n) === 'object')
        
//         //MISSION PASSED
//         if(generated.result){
//             user.set('balanceClaim', user.attributes.balanceClaim + mission.attributes.reward)
//             await user.save(null, { useMasterKey:true })

//             return {
//                 results:{
//                     accessories: accessories,
//                     result: generated.result,
//                     roll: generated.roll,
//                     reward: mission.attributes.reward,
//                     successRate: mission.attributes.successRate,
//                     newBalance: user.attributes.balanceClaim
//                 },
//                 message: 'Mission successfully completed'
//             }
//         }

//         //MISSION FAILED
//         if(!generated.result){
//             return {
//                 results:{
//                     accessories: accessories,
//                     result: generated.result,
//                     roll: generated.roll,
//                     reward: mission.attributes.reward,
//                     successRate: mission.attributes.successRate,
//                     newBalance: user.attributes.balanceClaim
//                 },
//                 message: 'Mission failed'
//             }
//         }
        
        
//     } catch (error) {
//         return error.message
//     }

// },{
//     fields:{
//         avatar_id:{
//             ...validation_id,
//             error:"avatar_id is not passed or has an error"
//         },
//         mission_id:{
//             ...validation_id,
//             error:"mission_id is not passed or has an error"
//         }
//     },
//     requireUser: true
// });