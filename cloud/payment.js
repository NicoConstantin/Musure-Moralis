const MusureTransferPending = Moralis.Object.extend('MusureTransfersPending');

Moralis.Cloud.define('payment', async (req) => {

    const { hash, reference, data } = req.params;
    const user = req.user

    
    try {
        if(data.length > 3 || !Array.isArray(data)) {
            return 'data must be an array and have a maximum of 3 positions'
        }
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
    
},{
    fields:{
        requireUser: true,
        hash:{
            required: true,
            type: String,
            options: val=>{
                return /^0x([A-Fa-f0-9]{64})$/.test(val)
            },
            error:'Hash have an error'
        },
        reference:{
            required: true,
            type: String,
            options: val=>{
                const options = ['egg', 'party', 'accessory', 'marketAvatar', 'marketAccessory']
                return options.includes(val)
            },
            error: 'reference must be specific'
        }
    }
});