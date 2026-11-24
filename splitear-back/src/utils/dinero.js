// Toda la aritmética de plata se hace en centavos enteros: sumar y restar decimales con Number
// pierde o inventa centavos (0.1 + 0.2 !== 0.3). Los montos vuelven a pesos solo al responder.

const MONTO_MAXIMO_CENTAVOS = 9999999999 // DECIMAL(10, 2) admite hasta 99.999.999,99

const aCentavos = (monto) => Math.round(Number(monto) * 100)

const aPesos = (centavos) => centavos / 100

// Reparte un monto en partes iguales. Los centavos que sobran se asignan de a uno a los primeros,
// así la suma de las cuotas siempre da el monto exacto ($100 entre 3 → 33,34 + 33,33 + 33,33).
function repartirEnCentavos(montoCentavos, cantidad) {
    const base = Math.floor(montoCentavos / cantidad)
    const resto = montoCentavos % cantidad
    return Array.from({ length: cantidad }, (_, i) => base + (i < resto ? 1 : 0))
}

// Recibe [{ id, saldo }] en centavos (saldo = lo que pagó − lo que consumió) y devuelve los pagos
// que dejan todo en cero: [{ idA, idB, montoCentavos }], donde idA le paga a idB.
// Dos punteros: el que más debe le paga al que más puso; en cada paso al menos uno queda en cero.
function liquidar(saldos) {
    const lista = saldos
        .filter((s) => s.saldo !== 0)
        .map((s) => ({ ...s })) // Copia para no modificar el arreglo recibido
        .sort((a, b) => a.saldo - b.saldo)

    const pagos = []
    let izq = 0
    let der = lista.length - 1

    while (izq < der) {
        const deudor = lista[izq]
        const acreedor = lista[der]
        if (deudor.saldo >= 0 || acreedor.saldo <= 0) break // Solo pasa si los saldos no suman cero: no se inventan pagos

        const monto = Math.min(-deudor.saldo, acreedor.saldo)
        deudor.saldo += monto
        acreedor.saldo -= monto
        pagos.push({ idA: deudor.id, idB: acreedor.id, montoCentavos: monto })

        if (deudor.saldo === 0) izq++
        if (acreedor.saldo === 0) der--
    }

    return pagos
}

module.exports = { MONTO_MAXIMO_CENTAVOS, aCentavos, aPesos, repartirEnCentavos, liquidar }
