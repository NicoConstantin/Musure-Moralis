const cooldown_set_time = 10
const cooldown_set_type = 'seconds'

const min_length_names = 3;
const max_length_names = 12;

const min_length_bio = 1;
const max_length_bio = 70;

let validation_id = {
    required: true,
    type: String,
    options: val=>{
        return val.length === 24
    },
}

let validation_length_word = {
    required:true,
    type:String,
    options: (val) => {
        return val.length >= min_length_names && val.length <= max_length_names
    },
    error:"name doesn’t have the required length. Must be from 3 to 12 characters."
}

function getDate (time, time_type) {
    switch (time_type) {
        case 'days':
            return Math.floor( Date.now() / 1000) + (time * 86400);

        case 'hours':
            return Math.floor( Date.now() / 1000) + (time * 3600)

        case 'minutes':
            return Math.floor( Date.now() / 1000) + (time * 60)

        case 'seconds':
            return Math.floor( Date.now() / 1000) + time
        
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