function getDate (time, time_type) {
    switch (time_type) {
        case 'days':
            return Math.floor( Date.now() / 1000) + (time * 86400);

        case 'hours':
            return Math.floor( Date.now() / 1000) + (time * 3600)

        case 'minutes':
            return Math.floor( Date.now() / 1000) + (time * 60)
    
        default:
            return Math.floor( Date.now() / 1000)
    }
    
}
//ARRAY ORDENADO POR MAYOR DropRate PRIMERO
function rarityGenerator (array, sucessRate) {
    let roll = Math.random() * 100 
    if(array){
        let prevDropRate = 0
        for (let i = 0; i < array.length; i++) {
            if(roll <= array[i].dropRate + prevDropRate){
                return {
                    found: array[i],
                    roll
                }
            }
            else{
                prevDropRate = prevDropRate + array[i].dropRate
            }
            
        }
    }
    else{
        return {
            result: roll <= sucessRate,
            roll
        }
    }
}