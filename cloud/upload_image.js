Moralis.Cloud.define('upload_image', async (req) => {
    const data = req.params.data;
    logger.info(JSON.stringify(data))

    try {
        const file = new Moralis.File(data.name, data)
        await file.saveIPFS({useMasterKey: true});

        return {
            file: file.ipfs(),
            message: 'File IPFS URL'
        }

    } catch (error) {

        return {
            file: false,
            message: error.message
        }
    }
});