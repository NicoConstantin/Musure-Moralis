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
