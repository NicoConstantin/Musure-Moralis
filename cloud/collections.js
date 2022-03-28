Moralis.Cloud.define('create_collection', async (req) => {

    const name = req.params.name;
    const user = req.user;

    try {

        const new_collection = new collection();
        new_collection.set('name', name)
        new_collection.set('owner', user)
        const collection_created = await new_collection.save(null, {useMasterKey: true})

        return{
            created: collection_created,
            message: 'Collection created'
        }

    } catch (error) {

        return{
            created: false,
            error: error.message
        }
    }
    
},{
    fields:{
        name: validation_name
    }
});

Moralis.Cloud.define('edit_collection', async (req) => {

    const {collection_id, name } = req.params;

    try {

        const query_collection = new Moralis.Query('Collection')
        let collection_found = await query_collection.get(collection_id, {useMasterKey: true})
        collection_found.set('name', name)
        await collection_found.save(null, {useMasterKey: true})

        return{
            edited:true,
            message: 'Collection edited'
        }

    } catch (error) {

        return{
            edited: false,
            error: error.message
        }
    }
    
},{
    fields:{
        collection_id:{
            ...validation_id,
            error: 'Collection_id is not passed or it has an error'
        },
        name: validation_name
    }
});