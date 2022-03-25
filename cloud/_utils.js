const logger = Moralis.Cloud.getLogger()
const Accesory = Moralis.Object.extend('Accessory');
const NFT = Moralis.Object.extend('AccessoryNFT');
const Avatar = Moralis.Object.extend('Avatar');
const Egg = Moralis.Object.extend('Egg');
const Mission = Moralis.Object.extend('MISSION_MASTER');
const Party = Moralis.Object.extend('Party');
const room = Moralis.Object.extend('Room');
const movements = Moralis.Object.extend('Movements');
const collection = Moralis.Object.extend('Collection');
const order = Moralis.Object.extend('PendingOrder');

const cooldown_set_time = 1;
const cooldown_set_type = 'hour';

const cooldown_game_time = 30;
const cooldown_game_type = 'second';

const min_length_names = 3;
const max_length_names = 15;

const min_length_bio = 1;
const max_length_bio = 70;

let regex_ipfs_moralis = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?(ipfs.moralis.io)(:[0-9]{1,5})?(\/.*)?$/
let regex_email = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

let validation_id = {
    required: true,
    type: String,
    options: val=>{
        return val.length === 24
    },
}

let validation_price = {
    required: true,
    type: Number,
    options: val=>{
        return val > 0
    },
    error: "price is not passed or it's not a valid number"
}

function getDate (time, time_type) {
    switch (time_type) {
        case 'day':
            return Math.floor( Date.now() / 1000) + (time * 86400);

        case 'hour':
            return Math.floor( Date.now() / 1000) + (time * 3600)

        case 'minute':
            return Math.floor( Date.now() / 1000) + (time * 60)

        case 'second':
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

async function getItems (kind, filter, sort, user) {
    const query_user_items = new Moralis.Query(kind);
    query_user_items.equalTo('owner', user)
    query_user_items.equalTo("onSale", false);
    query_user_items.equalTo("equippedOn", null);

    //FILTERING
    if (filter){
        if (filter.rarity) {
            query_user_items.equalTo('rarityNumber', filter.rarity)
        }
        if (filter.powerMin) {
            query_user_items.greaterThanOrEqualTo('power', filter.powerMin)
        }
        if (filter.powerMax) {
            query_user_items.lessThanOrEqualTo('power', filter.powerMax)
        }
        if (filter.type){
            query_user_items.equalTo('type', filter.type)
        }
    }
    
    //SORTING
    if (sort){
        if(sort.type){
            query_user_items[sort.type]('type')
        }
        if(sort.rarity){
            query_user_items[sort.rarity]('rarityNumber')
        }
        if(sort.power){
            query_user_items[sort.power]('power')
        }
        if(sort.durationLeft){
            query_user_items[sort.durationLeft]('durationLeft')
        }
    }
    query_user_items.limit(1000)

    let result = await query_user_items.find({useMasterKey:true})
    return result
}