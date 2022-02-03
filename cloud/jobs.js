

Moralis.Cloud.job("kick_avatars_expired", async (req) =>  {

    req.message("Looking for avatars with contract expired");

    const query_avatars = new Moralis.Query('Avatar');
    const dateNow = getDate()

    try {
        
        query_avatars.lessThan('timeContract', dateNow)
        query_avatars.greaterThan('timeContract', -1)
        query_avatars.exists('belongParty')
        query_avatars.include('belongParty')
        let avatarsExpired = await query_avatars.find({useMasterKey: true})
        
        for (let i = 0; i < avatarsExpired.length; i++) {
            let avatar = avatarsExpired[i]
            let party = avatar.attributes.belongParty

            party.remove('avatarsIn', avatar)
            await party.save(null, {useMasterKey: true})
            avatar.set('belongParty', null)
            avatar.set('timeContract', -1)
            avatar.set('playsLeft', -1)
            await avatar.save(null, {useMasterKey: true})
            
        }
        req.message('Avatars kicked')
        return 'Avatars kicked'


    } catch (error) {
        return error.message
    }
});


Moralis.Cloud.job("renew_playsLeft", async (req) =>  {

    req.message("Looking for avatars");

    const query_avatars = new Moralis.Query('Avatar');

    try {
        
        let allAvatars = await query_avatars.find({useMasterKey: true})
        
        for (let i = 0; i < allAvatars.length; i++) {
            let avatar = allAvatars[i]
            if(avatar.attributes.timeContract > 0){
                avatar.set('playsLeft', 5)
                await avatar.save(null, {useMasterKey: true})
            }
            
        }
        req.message('Avatars playsLeft renewed')
        return 'Avatars playsLeft renewed'


    } catch (error) {
        return error.message
    }
});