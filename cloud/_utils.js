const logger = Moralis.Cloud.getLogger()
const NFT = Moralis.Object.extend('AccessoryNFT');
const collection = Moralis.Object.extend('Collection');
const order = Moralis.Object.extend('PendingOrder');

const min_length_names = 3;
const max_length_names = 15;

const min_length_bio = 1;
const max_length_bio = 70;

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