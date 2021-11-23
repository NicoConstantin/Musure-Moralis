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