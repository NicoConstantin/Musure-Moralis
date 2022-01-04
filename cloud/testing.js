const MusureTransferPending = Moralis.Object.extend('MusureTransfersPending');

Moralis.Cloud.define('testing', async (req) => {

    const { hash, reference, data } = req.params;
    const user = req.user

    try {
        const newTransferPending = new MusureTransferPending();
        newTransferPending.set('account', user.attributes.accounts[0])
        newTransferPending.set('payer', user)
        newTransferPending.set('hash', hash)
        newTransferPending.set('data', data)
        newTransferPending.set('reference', reference)
        await newTransferPending.save(null,{ useMasterKey: true })

        return {
            transferPending:true,
            message:"Tranfer pending"
        }
        
    } catch (error) {
        return error.message
    }
    
});