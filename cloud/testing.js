let pepe = ''
let pointerRarity = 0;
for (let i = 0; i < 50; i++) {
    if (i % 10 === 0 && i !== 0) {
        pointerRarity = pointerRarity + 1
        console.log ('cambio de rareza', i, pointerRarity)
    }
    pepe = pepe + 'a'

}

console.log(pepe.length)