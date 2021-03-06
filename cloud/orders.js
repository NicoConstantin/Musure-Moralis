Moralis.Cloud.define('order_design', async (req) => {
    
    const {color_primary, color_secondary, color_details, logo, name, lore, style, phrase, inspiration_images} = req.params;
    const user = req.user;

    try {
        //VALIDATIONS
        if(inspiration_images){
            if(inspiration_images.length > 3){
                return 'You should upload 3 images at maximum'
            }
            const checkIpfsRegex = inspiration_images.filter(img => !regex_ipfs_moralis.test(img))
            if(checkIpfsRegex.length > 0){
                return "At least one image doesn't satisfy the required ipfs regex"
            }
        }
        const new_design_order = new design_order();
        new_design_order.set('colorPrimary', color_primary)
        new_design_order.set('colorSecondary', color_secondary)
        new_design_order.set('colorDetails', color_details)
        new_design_order.set('logo', logo)
        new_design_order.set('name', name)
        new_design_order.set('lore', lore)
        new_design_order.set('style', style)
        new_design_order.set('phrase', phrase)
        new_design_order.set('done', false)
        new_design_order.set('userValidated', user.attributes.isValidated)
        new_design_order.set('requester', user)
        if(inspiration_images){
            new_design_order.set('inspirationImages', inspiration_images)
        }
        await new_design_order.save(null,{useMasterKey: true})

        return {
            orderCreated: true,
            message: 'Design order created'
        }

    } catch (error) {

        return {
            orderCreated: false,
            message: error.message
        }
    }
},{
    fields:{
        color_primary: {
            ...validation_color,
            error: 'Color_primary must satisfy hex color regex'
        },
        color_secondary: {
            ...validation_color,
            error: 'Color_secondary must satisfy hex color regex'
        },
        color_details: {
            ...validation_color,
            error: 'Color_details must satisfy hex color regex'
        },
        logo:{
            ...validation_moralis_url,
            error: 'Logo must satisfy ipfs regex'
        },
        name: validation_name,
        lore: validation_lore_bio,
        style: {
            required: true,
            type: Object,
            options: style => {
                let aux = ['Realista','Fotogr??fico','Geometrico','Psicod??lico','Lineal','Monocrom??tico','Tipogr??fico','Minimalista','Grunge','Trash','Vintage']
                let check_includes = style.filter(s => !aux.includes(s))
                return check_includes.length === 0 && style.length <= 2 && style.length >= 1
            },
            error: 'Style must be an array of the specified styles and 2 length maximum'
        },
        phrase:{
            required: true,
            type: String,
            options: val => {
                let aux = val.split(" ")
                return aux.length <= 15 && val.length <= max_length_phrase
            },
            error: 'Phrase must have 15 words at maximum and 120 max characters length'
        }
    },
    requireUser: true
});

Moralis.Cloud.define('order_media', async (req) => {
    
    const { email, order_kind, nft_id } = req.params;
    const user = req.user;

    try {
        //VALIDATION NFT ALREADY HAVE AR
        const query_nft = new Moralis.Query('AccessoryNFT')
        query_nft.equalTo('idNFT', nft_id)
        const nft = await query_nft.first({useMasterKey:true})
        
        if(order_kind === 'OrderAR' && nft.attributes.filterAR){
            return 'You already have an AR filter'
        }
        if(order_kind === 'OrderTeaser' && nft.attributes.teaser){
            return 'You already have a teaser'
        }

        //VALIDATION USER ALREADY HAVE EMAIL
        if(!user.attributes.creatorEmail && email){
            user.set('creatorEmail', email)
            await user.save(null,{useMasterKey: true})
        }

        //VALIDATION ORDER ALREADY EXIST
        const query_order = new Moralis.Query(order_kind)
        query_order.equalTo('requester', user)
        query_order.equalTo('idNFT', nft_id)
        query_order.equalTo('done', false)
        const exist_order = await query_order.first({useMasterKey:true})

        if(exist_order){
            return 'You already requested that media file'
        } 
        else {
            let new_order;
            if(order_kind === 'OrderAR'){
                new_order = new order_AR();
            }
            if(order_kind === 'OrderTeaser'){
                new_order = new order_teaser();
            }
            new_order.set('idNFT', nft_id)
            new_order.set('requester', user)
            new_order.set('done', false)
            await new_order.save(null,{useMasterKey: true})
        }

        return {
            saved:true,
            message: 'Request saved'
        }

    } catch (error) {
        return {
            saved: false,
            message: error.message
        }
    }
},{
    fields:{
        order_kind:{
            required: true,
            type: String,
            options: val => {
                return val === 'OrderAR' || val === 'OrderTeaser'
            },
            error: 'Order_kind must be equal to OrderAR or OrderTeaser'
        },
        nft_id:{
            ...validation_id,
            message: 'NFT_id is not passed or it has an error'
        }
    },
    requireUser: true
});

Moralis.Cloud.define('ask_for_orders', async (req) => {

    const nft_id = req.params.nft_id;
    const user = req.user;

    try {
        //query all filterAr orders
        const query_order_AR = new Moralis.Query('OrderAR')
        query_order_AR.ascending('createdAt')
        const all_orders_AR = await query_order_AR.find({useMasterKey: true})

        //query all teaser orders
        const query_order_teaser = new Moralis.Query('OrderTeaser')
        query_order_teaser.ascending('createdAt')
        const all_orders_teaser = await query_order_teaser.find({useMasterKey: true})

        //finding index queue
        const position_order_ar = all_orders_AR.findIndex(e => e.attributes?.idNFT === nft_id && e.attributes?.requester.id === user.id)
        const position_order_teaser = all_orders_teaser.findIndex(e => e.attributes?.idNFT === nft_id && e.attributes?.requester.id === user.id)
        logger.info(JSON.stringify(position_order_ar))
        logger.info(JSON.stringify(position_order_teaser))

        return {
            //SE LE SUMA 1 PORQUE LA PRIMER POSICION ES 0 y #0 en la cola no tiene sentido
            requestedTeaser: position_order_teaser === -1 ? false: position_order_teaser + 1,
            requestedAR: position_order_ar === -1 ? false: position_order_ar + 1,
            message: 'Orders requested'
        }
        
    } catch (error) {
        return {
            requested: false,
            message: error.message
        }
    }
    
},{
    fields:{
        nft_id:{
            ...validation_id,
            error: 'NFT_id is not passed or it has an error'
        }
    },
    requireUser: true
});

Moralis.Cloud.define('ask_for_design', async (req) => {
    
    try {
        const query_designs = new Moralis.Query('OrderDesign')
        query_designs.include('requester')
        query_designs.equalTo('userValidated', true)
        const designs_validated = await query_designs.find({useMasterKey: true})

        const results = designs_validated.map(e=>{
            return {
                colorPrimary: e.attributes.colorPrimary,
                colorSecondary: e.attributes.colorSecondary,
                colorDetails: e.attributes.colorDetails,
                logo: e.attributes.logo,
                name: e.attributes.name,
                lore: e.attributes.lore,
                styles: e.attributes.style.join(", "),
                phrase: e.attributes.phrase? e.attributes.phrase : "-",
                inspirationImages: e.attributes.inspirationImages.length > 0 ? e.attributes.inspirationImages : "-",
                requesterName: e.attributes.requester.attributes.creatorName? e.attributes.requester.attributes.creatorName : "NO TIENE",
                requesterImageProfile: e.attributes.requester.attributes.creatorImage ? e.attributes.requester.attributes.creatorImage : "NO TIENE",
                requesterEmail: e.attributes.requester.attributes.creatorEmail? e.attributes.requester.attributes.creatorEmail : "NO TIENE"
            }
        })

        return {
            orders: results,
            message: 'Design orders of validated creators'
        }
        
    } catch (error) {
        return error.message
    }
});