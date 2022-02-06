Moralis.Cloud.afterSave("Movements", async (req) => {
    const query_room = new Moralis.Query('Room')
    const query_other_movement = new Moralis.Query('Movements')
    
    //Datos del movement que activa la logica
    const movement = req.object.get('movement')
    const turn = req.object.get('turn')
    const room = req.object.get('room')
    const avatar = req.object.get('avatar')

    query_room.include('playerTwo')
    query_room.include('playerOne')
    const roomPlaying = await query_room.get(room.id,{useMasterKey: true})

    //datos de un movement anterior en el mismo turno y sala
    query_other_movement.equalTo('room', room)
    query_other_movement.equalTo('turn', turn)
    query_other_movement.notEqualTo('avatar', avatar)
    const movement_from_other = await query_other_movement.first({useMasterKey: true})

    if(roomPlaying.attributes.arePlaying && movement_from_other){

        logger.info(JSON.stringify('ENTRE'))
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

        roomPlaying.set('turn', roomPlaying.attributes.turn + 1)

        //CASE 1
        if(movementPlayerOne === 'attack' ){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('lifeOne', roomPlaying.attributes.lifeOne - 1)
                roomPlaying.set('lifeTwo', roomPlaying.attributes.lifeTwo - 1)
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
                roomPlaying.set('lifeTwo', roomPlaying.attributes.lifeTwo - 1)
            }
            if(movementPlayerTwo === 'none'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne - 1)
                roomPlaying.set('lifeTwo', roomPlaying.attributes.lifeTwo - 1)
            }
        }
        //CASE 2
        if(movementPlayerOne === 'defend'){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
                
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
            }
            if(movementPlayerTwo === 'none'){
                roomPlaying.set('defendLeftOne', roomPlaying.attributes.defendLeftOne - 1)
            }
        }
        //CASE 3
        if(movementPlayerOne === 'create'){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                roomPlaying.set('lifeOne', roomPlaying.attributes.lifeOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
            }
            if(movementPlayerTwo === 'none'){
                roomPlaying.set('snowballsOne', roomPlaying.attributes.snowballsOne + 1)
            }
        }
        //CASE 4
        if(movementPlayerOne === 'none'){
            if(movementPlayerTwo === 'attack'){
                roomPlaying.set('lifeOne', roomPlaying.attributes.lifeOne - 1)
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo - 1)
            }
            if(movementPlayerTwo === 'defend'){
                roomPlaying.set('defendLeftTwo', roomPlaying.attributes.defendLeftTwo - 1)
            }
            if(movementPlayerTwo === 'create'){
                roomPlaying.set('snowballsTwo', roomPlaying.attributes.snowballsTwo + 1)
            }
            if(movementPlayerTwo === 'none'){
                logger.info(JSON.stringify('Anyone did anything'))
            }
        }
        //CHECKING IF IS NEED TO CLOSE THE ROOM
        if(roomPlaying.attributes.lifeOne <= 0 && roomPlaying.attributes.lifeTwo <= 0){
            //CASO DE EMPATE
            logger.info(JSON.stringify('EMPATARON'))
            return;
        }

        if(roomPlaying.attributes.lifeOne <= 0){
            //PAY TO PLAYER2
            const owner_query = new Moralis.Query('User')
            let ownerToPay = await owner_query.get(roomPlaying.attributes.playerTwo.attributes.owner.id,{useMasterKey: true})
            ownerToPay.set('balanceClaim', ownerToPay.attributes.balanceClaim + roomPlaying.attributes.rewardTwo)
            await ownerToPay.save(null, {useMasterKey: true})

            roomPlaying.set('nextMovementTime', -1)
            roomPlaying.set('arePlaying', false)
            await roomPlaying.save(null,{useMasterKey: true})
            return;
        }
        if(roomPlaying.attributes.lifeTwo <= 0){
            //PAY TO PLAYER1
            const owner_query = new Moralis.Query('User')
            let ownerToPay = await owner_query.get(roomPlaying.attributes.playerOne.attributes.owner.id,{useMasterKey: true})
            ownerToPay.set('balanceClaim', ownerToPay.attributes.balanceClaim + roomPlaying.attributes.rewardOne)
            await ownerToPay.save(null, {useMasterKey: true})

            roomPlaying.set('nextMovementTime', -1)
            roomPlaying.set('arePlaying', false)
            await roomPlaying.save(null,{useMasterKey: true})
            return;
        }
        else{
            roomPlaying.set('nextMovementTime', getDate(cooldown_game_time, cooldown_game_type))
            await roomPlaying.save(null, {useMasterKey: true})
            return;
        }
    }

});