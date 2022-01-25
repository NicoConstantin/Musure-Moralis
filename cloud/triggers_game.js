Moralis.Cloud.afterSave("Movements", async (req) => {
    const movement = req.object.get('movement')
    const turn = req.object.get('turn')
    const room = req.object.get('room')
    const avatar = req.object.get('avatar')

    const query_room = new Moralis.Query('Room')
    const roomPlaying = await query_room.get(room.id,{useMasterKey: true})

    const query_other_movement = new Moralis.Query('Movements')
    query_other_movement.equalTo('room', room)
    query_other_movement.equalTo('turn', turn)
    query_other_movement.notEqualTo('avatar', avatar)
    const movement_from_other = await query_other_movement.first({useMasterKey: true})

    if(roomPlaying.attributes.arePlaying && movement_from_other){
        logger.info(JSON.stringify('SI ENTRO OTRO MOVIMIENTO'))
        switch (roomPlaying) {
            case 'asd':
                
                break;
        
            default:
                break;
        }
    }
});