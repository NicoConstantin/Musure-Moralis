const room = Moralis.Object.extend('Room');
const movements = Moralis.Object.extend('Movements');

Moralis.Cloud.define('get_room', async (req) => {

    const {avatar_id, mission_number, reward} = req.params;
    const avatarToPoint = new Moralis.Query('Avatar')
    const query_existent_room = new Moralis.Query('Room')

    try {

        query_existent_room.equalTo('playerTwo', null)
        query_existent_room.equalTo('rewardTwo', null)
        query_existent_room.equalTo('missionTwo', null)
        query_existent_room.equalTo('arePlaying', false)
        query_existent_room.equalTo('areWaiting', true)
        const roomFound = await query_existent_room.first({useMasterKey: true})

        if(roomFound){
            //UNIRLO
            const avatar = await avatarToPoint.get(avatar_id, {useMasterKey: true})
            roomFound.set('playerTwo', avatar)
            roomFound.set('rewardTwo', reward)
            roomFound.set('missionTwo', mission_number)
            roomFound.set('arePlaying', true)
            roomFound.set('areWaiting', false)
            roomFound.set('nextMovementTime', getDate(cooldown_game_time, cooldown_game_type))
            await roomFound.save(null,{useMasterKey: true})

            return {
                found: true,
                room: roomFound,
                message: 'Avatar joined'
            }
        }

        else{
            return {
                found: false,
                message: 'No room available'
            }
        }

        
    } catch (error) {
        return error.message;
    }

},{
    fields:{
        avatar_id:{
            ...validation_id,
            error: "avatar_id is not passed or has an error"
        },
        reward:{
            required: true,
            type: Number,
            options: val=>{
                return val > 0
            },
            error: 'reward must be a number greater than 0'
        },
        mission_number:{
            required: true,
            type: Number,
            options: val=>{
                return val >= 1
            },
            error: 'mission_number must be a number greater or equal than 1'
        }
    },
    requireUser: true
});

Moralis.Cloud.define('create_room', async (req) => {
    const { avatar_id, reward, mission_number } = req.params;
    const query_player = new Moralis.Query('Avatar')

    try {
        
        const avatarOne = await query_player.get(avatar_id, {useMasterKey: true})
        
        const newRoom = new room();
        newRoom.set('playerOne', avatarOne);
        newRoom.set('rewardOne', reward);
        newRoom.set('missionOne', mission_number);
        newRoom.set('lifeOne', 3);
        newRoom.set('snowballsOne', 1);
        newRoom.set('defendLeftOne', 5);

        newRoom.set('playerTwo', null);
        newRoom.set('rewardTwo', null);
        newRoom.set('missionTwo', null);
        newRoom.set('lifeTwo', 3);
        newRoom.set('snowballsTwo', 1);
        newRoom.set('defendLeftTwo', 5);

        newRoom.set('arePlaying', false)
        newRoom.set('areWaiting', true)

        await newRoom.save(null, {useMasterKey: true})
        logger.info(JSON.stringify('room created'))

        return {
            room: newRoom,
            message: 'Room created'
        }

    } catch (error) {
        return error.message
    }
    
},{
    fields:{
        avatar_id:{
            ...validation_id,
            error: "avatar_id is not passed or has an error"
        },
        reward:{
            required: true,
            type: Number,
            options: val=>{
                return val > 0
            },
            error: 'reward must be a number greater than 0'
        },
        mission_number:{
            required: true,
            type: Number,
            options: val=>{
                return val >= 1
            },
            error: 'mission_number must be a number greater or equal than 1'
        }
    },
    requireUser: true
});

Moralis.Cloud.define('get_data_room', async (req) => {

    const room_id = req.params.room_id;
    const query_room = new Moralis.Query('Room')

    try {
        query_room.include('playerOne')
        query_room.include('playerTwo')
        const roomData = await query_room.get(room_id, {useMasterKey: true})

        return {
            room: roomData,
            message: 'Room data'
        }

    } catch (error) {
        return error.message
    }
    
},{
    fields:{
        room_id:{
            ...validation_id,
            error: "room_id is not passed or has an error"
        },
    },
    requireUser: true
});

Moralis.Cloud.define('do_movement', async (req) => {

    const { avatar_id, movement, room_id, turn } = req.params;
    const avatar_query = new Moralis.Query('Avatar');
    const room_query = new Moralis.Query('Room');

    try {
        
        const avatar = await avatar_query.get(avatar_id, {useMasterKey: true});
        const roomFound = await room_query.get(room_id, {useMasterKey: true});

        const number = ''
        if(roomFound.attributes.playerOne === avatar_id) {
            number = 'One'
        }
        if(roomFound.attributes.playerTwo === avatar_id) {
            number = 'Two'
        }

        //VALIDATIONS
        if(roomFound.attributes.nextMovementTime < getDate()){
            return 'Turn time has been passed'
        }
        
        if(roomFound.attributes[`snowballs${number}`] === 0 && movement === 'attack') {
            return "You don't have any snowball"
        }
        if(roomFound.attributes[`defendLeft${number}`] === 0 && movement === 'defend') {
            return "You don't have more shields on this game"
        }
        if(roomFound.attributes[`snowballs${number}`] === 3 && movement === 'create') {
            return "You can't have more than 3 snowballs"
        }
        if(roomFound.attributes.lifeOne === 0 || roomFound.attributes.lifeTwo === 0) {
            return "This game is done"
        }

        const new_movement = new movements();
        new_movement.set('room', roomFound);
        new_movement.set('avatar', avatar);
        new_movement.set('movement', movement);
        new_movement.set('turn', turn);
        await new_movement.save(null, {useMasterKey: true});

        return {
            movement: true,
            message: 'Movement added'
        }

    } catch (error) {
        return error.message
    }
    
},{
    fields:{
        avatar_id:{
            ...validation_id,
            error: "avatar_id is not passed or has an error"
        },
        movement:{
            required: true,
            type: String,
            options: val=>{
                const options = ['attack', 'defend', 'create', 'none']
                return options.includes(val)
            },
            error: 'movement must be one in specific'
        },
        room_id:{
            ...validation_id,
            error: "room_id is not passed or has an error"
        },
        turn:{
            required: true,
            type: Number,
            options: val=>{
                return val >= 1
            },
            error: 'turn must be a number greater or equal than 1'
        }
    },
    requireUser: true
});