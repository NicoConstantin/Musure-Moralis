Moralis.Cloud.define('create_collection', async (req) => {

    const name = req.params.name;

    try {

        const new_collection = new collection();
        new_collection.set('name', name)
        await new_collection.save(null, {useMasterKey: true})

        return{
            created:true,
            message: 'Collection created'
        }

    } catch (error) {

        return{
            created: false,
            error: error.message
        }
    }
    
});

Moralis.Cloud.define('delete_collection', async (req) => {

    const collection_id = req.params.name;

    try {

        const query_collection = new Moralis.Query('Collection')
        let collection_found = await query_collection.get(collection_id, {useMasterKey: true})
        await collection_found.destroy({useMasterKey: true})

        return{
            deleted:true,
            message: 'Collection deleted'
        }

    } catch (error) {

        return{
            deleted: false,
            error: error.message
        }
    }
    
});

Moralis.Cloud.define('edit_collection', async (req) => {

    const {collection_id, name }= req.params;

    try {

        const query_collection = new Moralis.Query('Collection')
        let collection_found = await query_collection.get(collection_id, {useMasterKey: true})
        collection_found.set('name', name)
        await collection_found.save(null, {useMasterKey: true})

        return{
            deleted:true,
            message: 'Collection deleted'
        }

    } catch (error) {

        return{
            deleted: false,
            error: error.message
        }
    }
    
});