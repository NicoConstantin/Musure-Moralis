const logger = Moralis.Cloud.getLogger()
const NFT = Moralis.Object.extend('AccessoryNFT');
const collection = Moralis.Object.extend('Collection');
const order_AR = Moralis.Object.extend('OrderAR');
const order_teaser = Moralis.Object.extend('OrderTeaser');
const design_order = Moralis.Object.extend('OrderDesign');

const min_length_names = 3;
const max_length_names = 15;

const min_length_bio = 1;
const max_length_bio = 70;
const max_length_phrase = 120;

const size_QR = 150; /*px*/

let regex_ipfs_moralis = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?(ipfs.moralis.io)(:[0-9]{1,5})?(\/.*)?$/
let regex_email = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
let regex_time = /^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/
let regex_date = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/
let regex_timezone = /^-?([0-1][0-9]|[2][0-3]):([0-5][0-9])$/
let regex_hex_color = /^#(?:[0-9a-fA-F]{3}){1,2}$/

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

function generateIdNFT (user, name) {
    let userID= user.id
    const nameTrimmed = name.split(" ").join("")
    let nftID = ""
    for (let j = 0; j < nameTrimmed.length; j++) {
        
        nftID= nftID + userID[j] + nameTrimmed[j] + Math.floor(Math.random() * 10)
        
        if(j+1 >= nameTrimmed.length){
            nftID = nftID + userID.slice(j+1)
            break;
        }

        if(j+1 >= userID.length){
            nftID = nftID + nameTrimmed.slice(j+1)
            break;
        }
    }

    nftID = nftID.slice(0,24).split("").reverse().join("")

    return nftID
}

function timeParser (date, time, timezone) {
    let unixstamp = 0
    //PROCESSING DATE
    unixstamp = Math.floor(Date.parse(date) / 1000 )

    //PROCESSING TIME
    let arrayTime = time.split(':')
    let hourTime = Number(arrayTime[0])
    let minutesTime = Number(arrayTime[1])

    //PROCESSING TIMEZONE
    let arrayTimezone = timezone.split(':')
    let hourTimezone = Number(arrayTimezone[0])
    let minutesTimezone = Number(arrayTimezone[1])

    //JOINING ALL DATE INFO
    unixstamp = unixstamp + ((hourTime - hourTimezone) * 3600)
    unixstamp = unixstamp + ((minutesTime + minutesTimezone) * 60)

    return unixstamp
}