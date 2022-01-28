const toolkitObj = Moralis.Object.extend('ToolkitValidating')

Moralis.Cloud.define('get_economy_data', async (req) => {
    
    const query_economy = new Moralis.Query('ECONOMY')

    try {
        query_economy.containedIn("reference", ["commission_marketplace_nft_toolkit", "commission_nft_toolkit", "cost_nft_toolkit",'commission_future_sales'])
        const economyData = await query_economy.find({useMasterKey: true})
        logger.info(JSON.stringify(economyData))
        let economyObj = {};

        for (let i = 0; i < economyData.length; i++) {
            economyObj[economyData[i].attributes.reference] = economyData[i].attributes.price
        }
        logger.info(JSON.stringify(economyObj))
        return {
            economy: economyObj,
            message: 'Economy Data'
        }

    } catch (error) {
        return error.message
    }
});

//VALIDAR FIELDS
Moralis.Cloud.define('save_temporary_toolkit', async (req) => {
    
    const { name, lore, rarity, amountEmit, price, file, type } = req.params;
    const user = req.user;

    try {

        const newNFT = new toolkitObj();
        newNFT.set('name', name)
        newNFT.set('lore', lore)
        newNFT.set('rarity', rarity)
        newNFT.set('type', type)
        newNFT.set('amountEmit', amountEmit)
        newNFT.set('price', price)
        newNFT.set('file', file)
        newNFT.set('owner', user)
        newNFT.set('validated', false)
        await newNFT.save(null, { useMasterKey: true})
        
        return {
            NFT: true,
            message: 'NFT Data saved'
        }

    } catch (error) {
        return error.message
    }
},{
    fields:{
        name:{
            required: true,
            type: String,
            options: (val)=>{
                return val.length >= min_length_names && val.length <= max_length_names
            },
            error: `Name must have ${min_length_names} characters at least and ${max_length_names} maximum.`
        },
        lore:{
            required: true,
            type: String,
            options: (val)=>{
                return val.length >= min_length_bio && val.length <= max_length_bio
            },
            error: `Lore must have ${min_length_bio} characters at least and ${max_length_bio} maximum.`
        },
        rarity:{
            required: true,
            type: String,
            options: (val)=>{
                const array = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic']
                return array.includes(val)
            },
            error: `rarity must be equal to Common, Rare, Epic, Legendary or Mythic.`
        },
        type:{
            required: true,
            type: String,
            options: (val)=>{
                const array = ['Sneaker', 'Head', 'Aura', 'Wing', 'Bazooka', 'Pet', 'Vehicle', 'Dance', 'Skin', 'Graffiti']
                return array.includes(val)
            },
            error: `type must be one of the availables.`
        },
        price:{
            required: true,
            type: Number,
            options: (val)=>{
                return val >= 5
            },
            error: `Price must be greater or equal than $5.`
        },
        file:{
            required: true,
            type: String,
            options: (val)=>{
                
                return val.slice(0,34) === 'https://ipfs.moralis.io:2053/ipfs/'
            },
            error: `File must be a valid IPFS Url.`
        }
    },
    requireUser: true
});
