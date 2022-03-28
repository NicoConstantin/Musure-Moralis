let validation_id = {
    required: true,
    type: String,
    options: val=>{
        return val.length === 24
    },
}

let validation_name = {
    required: true,
    type: String,
    options: val=>{
        return val.length >= min_length_names && val.length <= max_length_names
    },
    error: `Name must be between ${min_length_names} and ${max_length_names} characters length`
}

let validation_price = {
    required: true,
    type: Number,
    options: val=>{
        return val > 0
    },
    error: "price is not passed or it's not a valid number"
}

let validation_rarity = {
    required: true,
    type: String,
    options: async(val)=>{
        let query_rarities = new Moralis.Query('ACCESSORY_RARITY_MASTER')
        let raw_rarities = await query_rarities.find({useMasterKey:true})
        rarities_availables = raw_rarities.map(rar=> rar.attributes.rarity)
        return rarities_availables.includes(val)
    },
    error: `Rarity must be one of the rarities declared`
}

let validation_type = {
    required: true,
    type: String,
    options: async(val)=>{
        let query_types = new Moralis.Query('ACCESSORY_TYPE_MASTER')
        let raw_types = await query_types.find({useMasterKey:true})
        types_availables = raw_types.map(rar=> rar.attributes.type)
        return types_availables.includes(val)
    },
    error: `Type must be one of the types declared`
}

let validation_moralis_url = {
    required: true,
    type: String,
    options: val=>{
        return regex_ipfs_moralis.test(val)
    }
}

let validation_email = {
    required:true,
    type: String,
    options: val=>{
        return regex_email.test(val)
    },
    error: `Email must satisfy regex`
}