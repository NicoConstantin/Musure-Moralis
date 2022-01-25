const avatarToLobby = Moralis.Object.extend('Lobby');
const room = Moralis.Object.extend('Room');

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
            message:`${avatar.attributes.name} Waiting to play`
        }

    } catch (error) {
        return error.message
    }
    
});

Moralis.Cloud.define('create_room', async (req) => {

    const { avatar_one, avatar_two, reward } = req.params;
    const query_player_one = new Moralis.Query('Avatar')
    const query_player_two = new Moralis.Query('Avatar')

    try {
        
        const avatarOne = await query_player_one.get(avatar_one, {useMasterKey: true})
        const avatarTwo = await query_player_two.get(avatar_two, {useMasterKey: true})

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
        await newRoom.save(null, {useMasterKey: true})

        return {
            room: true,
            message: 'Room created'
        }

    } catch (error) {
        return error.message
    }
    
});