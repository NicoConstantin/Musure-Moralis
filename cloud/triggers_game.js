Moralis.Cloud.afterSave("Movements", async (req) => {
    //Datos del movement que activa la logica
    const movement = req.object.get('movement')
    const turn = req.object.get('turn')
    const room = req.object.get('room')
    const avatar = req.object.get('avatar')
    
    const query_room = new Moralis.Query('Room')
    const roomPlaying = await query_room.get(room.id,{useMasterKey: true})
    //datos de un movement anterior en el mismo turno y sala
    const query_other_movement = new Moralis.Query('Movements')
    query_other_movement.equalTo('room', room)
    query_other_movement.equalTo('turn', turn)
    query_other_movement.notEqualTo('avatar', avatar)
    const movement_from_other = await query_other_movement.first({useMasterKey: true})

    if(roomPlaying.attributes.arePlaying && movement_from_other){
        //IDENTIFICO PLAYER1 Y PLAYER2
        let movementPlayerOne = '';
        let movementPlayerTwo = '';
        
        if(roomPlaying.attributes.playerOne.id === avatar.id){
            movementPlayerOne = movement
            movementPlayerTwo = movement_from_other.attributes.movement
        }
        if(roomPlaying.attributes.playerTwo.id === avatar.id){
            movementPlayerTwo = movement
            movementPlayerOne = movement_from_other.attributes.movement
        }

        //CASE 1 TENGO QUE IDENTIFICAR CUAL ES PLAYERONE Y CUAL PLAYER TWO
        if(movementPlayerOne === 'attack' ){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('lifeOne', roomPlaying.attributes.lifeOne - 1)
                roomPlaying.set('lifeTwo', roomPlaying.attributes.lifeTwo - 1)
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.defendLeftTwo + 1)
                roomPlaying.set('lifeTwo', roomPlaying.attributes.lifeTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'none'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('lifeTwo', roomPlaying.attributes.lifeTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
        }
        //CASE 2
        if(movementPlayerOne === 'defend'){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
                
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'none'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
        }
        //CASE 3
        if(movementPlayerOne === 'create'){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                roomPlaying.set('lifeOne', roomPlaying.attributes.lifeOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'none'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
        }
        //CASE 4
        if(movementPlayerOne === 'none'){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('lifeOne', roomPlaying.attributes.lifeOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
                await roomPlaying.save(null,{useMasterKey: true})
            }
            if(movementPlayerTwo === 'none'){
                logger.info(JSON.stringify('Anyone did anything'))
            }
        }
        //CHECKING IF IS NEED TO CLOSE THE ROOM
        if(roomPlaying.attributes.lifeOne === 0 || roomPlaying.attributes.lifeTwo === 0){
            roomPlaying.set('nextMovementTime', -1)
            roomPlaying.set('arePlaying', false)
            await roomPlaying.save(null,{useMasterKey: true})
        }
        else{
            roomPlaying.set('nextMovementTime', getDate(cooldown_game_time, cooldown_game_type))
            await roomPlaying.save(null, {useMasterKey: true})
        }
    }

});