const logger = Moralis.Cloud.getLogger();

Moralis.Cloud.define('mint_egg', async (request) => {
    const Egg = Moralis.Object.extend('Egg');
    const newEgg = new Egg();
    newEgg.set('timeHatch', getDate(2,"hours"))
    newEgg.set('isHatched', false)
    return newEgg.save()
    
});