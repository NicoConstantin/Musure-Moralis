const cooldown_set_time = 2
const cooldown_set_type = 'hours'

function getDate (time, time_type) {
    switch (time_type) {
        case 'days':
            return Math.floor( Date.now() / 1000) + (time * 86400);

        case 'hours':
            return Math.floor( Date.now() / 1000) + (time * 3600)

        case 'minutes':
            return Math.floor( Date.now() / 1000) + (time * 60)
    
        default:
            return Math.floor( Date.now() / 1000)
    }
    
}
//ARRAY ORDENADO POR MAYOR DropRate PRIMERO
function getRandomRarity (array) {
    let roll = Math.floor(Math.random() * (100 + 0 + 1) )
    let prevDropRate = 0

    for (let i = 0; i < array.length; i++) {

        if(roll <= array[i].attributes.dropRate + prevDropRate){
            return array[i]
        }

        else{
            prevDropRate = prevDropRate + array[i].attributes.dropRate
        }
        
    }
}

function getRandomNumber (sucessRate){
    let roll = Math.floor(Math.random() * (100 + 0 + 1) )
    return {
        result: roll <= sucessRate,
        roll
    }
}

function getRandomPower (max, min){
    let roll = Math.floor(Math.random() * (max - min + 1) + min)
    return roll
}

function getRandomType (array) {
    let position = Math.floor(Math.random() * (9 + 0 + 1) )
    return array[position]
}