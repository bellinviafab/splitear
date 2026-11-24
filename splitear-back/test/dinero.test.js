const { test, describe } = require('node:test')
const assert = require('node:assert/strict')
const { aCentavos, repartirEnCentavos, liquidar } = require('../src/utils/dinero')

const suma = (arr) => arr.reduce((acc, n) => acc + n, 0)

// Aplica los pagos a los saldos y devuelve cómo quedó cada uno: tiene que dar todo cero
function aplicarPagos(saldos, pagos) {
    const resultado = new Map(saldos.map((s) => [s.id, s.saldo]))
    for (const p of pagos) {
        resultado.set(p.idA, resultado.get(p.idA) + p.montoCentavos)
        resultado.set(p.idB, resultado.get(p.idB) - p.montoCentavos)
    }
    return [...resultado.values()]
}

describe('aCentavos', () => {
    test('convierte sin errores de punto flotante', () => {
        assert.equal(aCentavos(0.1 + 0.2), 30)
        assert.equal(aCentavos('1234.56'), 123456)
        assert.equal(aCentavos(19.99), 1999)
    })
})

describe('repartirEnCentavos', () => {
    test('monto que no divide exacto: la suma da el monto y las cuotas difieren a lo sumo en un centavo', () => {
        const cuotas = repartirEnCentavos(10000, 3)
        assert.deepEqual(cuotas, [3334, 3333, 3333])
        assert.equal(suma(cuotas), 10000)
    })

    test('un solo participante se lleva todo', () => {
        assert.deepEqual(repartirEnCentavos(1999, 1), [1999])
    })

    test('menos centavos que participantes', () => {
        const cuotas = repartirEnCentavos(2, 5)
        assert.deepEqual(cuotas, [1, 1, 0, 0, 0])
    })

    test('la suma siempre cierra para muchos casos', () => {
        for (let monto = 1; monto <= 2000; monto += 7)
            for (let n = 1; n <= 12; n++)
                assert.equal(suma(repartirEnCentavos(monto, n)), monto)
    })
})

describe('liquidar', () => {
    test('caso del algoritmo documentado', () => {
        const saldos = [
            { id: 'A', saldo: -1000 }, { id: 'B', saldo: -500 }, { id: 'C', saldo: -400 },
            { id: 'D', saldo: 200 }, { id: 'E', saldo: 800 }, { id: 'F', saldo: 900 },
        ]
        const pagos = liquidar(saldos)
        assert.deepEqual(pagos, [
            { idA: 'A', idB: 'F', montoCentavos: 900 },
            { idA: 'A', idB: 'E', montoCentavos: 100 },
            { idA: 'B', idB: 'E', montoCentavos: 500 },
            { idA: 'C', idB: 'E', montoCentavos: 200 },
            { idA: 'C', idB: 'D', montoCentavos: 200 },
        ])
        assert.ok(aplicarPagos(saldos, pagos).every((s) => s === 0))
    })

    test('grupo sin gastos o con todos al día no genera pagos', () => {
        assert.deepEqual(liquidar([]), [])
        assert.deepEqual(liquidar([{ id: 1, saldo: 0 }, { id: 2, saldo: 0 }]), [])
    })

    test('a lo sumo n − 1 pagos y todos los saldos quedan en cero', () => {
        let semilla = 42
        const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647
        for (let caso = 0; caso < 200; caso++) {
            const n = 2 + Math.floor(azar() * 10)
            const saldos = Array.from({ length: n - 1 }, (_, i) => ({ id: i, saldo: Math.round((azar() - 0.5) * 100000) }))
            saldos.push({ id: n - 1, saldo: -suma(saldos.map((s) => s.saldo)) }) // El último compensa para que sumen cero
            const pagos = liquidar(saldos)
            assert.ok(pagos.length <= n - 1)
            assert.ok(pagos.every((p) => p.montoCentavos > 0))
            assert.ok(aplicarPagos(saldos, pagos).every((s) => s === 0))
        }
    })

    test('no modifica el arreglo recibido', () => {
        const saldos = [{ id: 1, saldo: -500 }, { id: 2, saldo: 500 }]
        liquidar(saldos)
        assert.deepEqual(saldos, [{ id: 1, saldo: -500 }, { id: 2, saldo: 500 }])
    })

    test('si los saldos no suman cero no inventa pagos entre dos del mismo signo', () => {
        const pagos = liquidar([{ id: 1, saldo: -300 }, { id: 2, saldo: -200 }, { id: 3, saldo: 100 }])
        assert.deepEqual(pagos, [{ idA: 1, idB: 3, montoCentavos: 100 }])
    })
})
