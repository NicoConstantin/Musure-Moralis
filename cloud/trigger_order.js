Moralis.Cloud.beforeSave('OrderAR', async (req) => {
    
    const done = req.object.get("done");
    const order = req.object;
    if(done){
        await order.destroy({useMasterKey: true})
    }
});

Moralis.Cloud.beforeSave('OrderTeaser', async (req) => {
    
    const done = req.object.get("done");
    const order = req.object;
    if(done){
        await order.destroy({useMasterKey: true})
    }
});