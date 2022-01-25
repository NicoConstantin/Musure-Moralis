const avatarToLobby = Moralis.Object.extend('Lobby');
const room = Moralis.Object.extend('Room');
const movements = Moralis.Object.extend('Movements');

Moralis.Cloud.define('join_lobby', async (req) => {

    const { avatar_id, mission_number } = req.params;
    const avatarToPoint = new Moralis.Query ('Avatar')

    try {
        
        const avatar = await avatarToPoint.get(avatar_id, {useMasterKey: true})
        const newAvatarToLobby = new avatarToLobby();
    
        newAvatarToLobby.set('avatar', avatar);
        newAvatarToLobby.set('missionNumber', mission_number)
        newAvatarToLobby.set('isWaiting', true)
        await newAvatarToLobby.save(null, {useMasterKey: true})
        
        //hacemos el destroy en el backend ? 
        // setTimeout(async() => {
        //     await newAvatarToLobby.destroy({useMasterKey: true})
        // }, 30000);

        return {
            waiting: true,
            message:`${avatar.attributes.name} waiting to play`
        }

    } catch (error) {
        return error.message
    }
    
});

Moralis.Cloud.define('get_competitor', async (req) => {

    const {avatar_id, mission_number} = req.params;

    try {

        const query_competitor = new Moralis.Query('Lobby')
        query_competitor.notEqualTo('avatar', avatar_id)
        query_competitor.equalTo('missionNumber', mission_number)
        query_competitor.equalTo('isWaiting', true)
        const competitiorFound = await query_competitor.first({useMasterKey: true})

        return {
            found: !!competitiorFound,
            competitor: competitiorFound.attributes.avatar
        }
        
    } catch (error) {
        return error.message;
    }

});

Moralis.Cloud.define('create_room', async (req) => {
    //tengo que chequear que ambos avatar esten en busqueda
    const { avatar_one_id, avatar_two_id, reward, mission_number } = req.params;
    const query_player_one = new Moralis.Query('Avatar')
    const query_player_two = new Moralis.Query('Avatar')
    const query_lobby_one = new Moralis.Query('Lobby')
    const query_lobby_two = new Moralis.Query('Lobby')

    try {
        
        const avatarOne = await query_player_one.get(avatar_one_id, {useMasterKey: true})
        const avatarTwo = await query_player_two.get(avatar_two_id, {useMasterKey: true})

        query_lobby_one.equalTo('avatar', avatarOne)
        query_lobby_two.equalTo('avatar', avatarTwo)
        const lobbyOne = await query_lobby_one.first({useMasterKey: true})
        const lobbyTwo = await query_lobby_two.first({useMasterKey: true})
        
        const newRoom = new room();
        newRoom.set('playerOne', avatarOne);
        newRoom.set('lifeOne', 3);
        newRoom.set('snowballsOne', 1);
        newRoom.set('defendLeftOne', 5);

        newRoom.set('playerTwo', avatarTwo);
        newRoom.set('lifeTwo', 3);
        newRoom.set('snowballsTwo', 1);
        newRoom.set('defendLeftTwo', 5);

        newRoom.set('reward', reward)
        newRoom.set('missionNumber', mission_number)
        await newRoom.save(null, {useMasterKey: true})
        lobbyOne.set('isWaiting', false)
        await lobbyOne.save(null, {useMasterKey: true})
        lobbyTwo.set('isWaiting', false)
        await lobbyTwo.save(null, {useMasterKey: true})
        logger.info(JSON.stringify('room created'))

        return {
            room: newRoom,
            message: 'Room created'
        }

    } catch (error) {
        return error.message
    }
    
});

Moralis.Cloud.define('do_movement', async (req) => {
    //FALTA COMPROBAR QUE SI ATACA TENGA BOLAS Y BLA BLA
    const { avatar_id, movement, room } = req.params;
    const avatar_query = new Moralis.Query('Avatar');
    const room_query = new Moralis.Query('Room');

    try {
        
        const avatar = await avatar_query.get(avatar_id, {useMasterKey: true});
        const roomFound = await room_query.get(room, {useMasterKey: true});
        const new_movement = new movements();

        new_movement.set('room', roomFound);
        new_movement.set('avatar', avatar);
        new_movement.set('movement', movement);
        await new_movement.save(null, {useMasterKey: true});

        return {
            movement: true,
            message: 'Movement added'
        }

    } catch (error) {
        return error.message
    }
    
});