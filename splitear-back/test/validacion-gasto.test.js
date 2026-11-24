const { test } = require('node:test')
const assert = require('node:assert/strict')
const { validarDatosGasto } = require('../src/controllers/gastos.controller')

const valido = { monto: 1000, descripcion: ' Pizza ', participantes: [{ id: 1 }, { id: 2 }] }

test('datos válidos se normalizan', () => {
    assert.deepEqual(validarDatosGasto(valido), { montoCentavos: 100000, idsParticipantes: [1, 2], descripcion: 'Pizza' })
    assert.equal(validarDatosGasto({ ...valido, monto: '10.005' }).montoCentavos, 1001)
    assert.equal(validarDatosGasto({ ...valido, descripcion: '   ' }).descripcion, null)
})

test('montos inválidos', () => {
    for (const monto of [undefined, null, 0, -5, '', 'abc', true, [5], Infinity, 0.001, 100000000])
        assert.ok(validarDatosGasto({ ...valido, monto }).error, `debería rechazar ${JSON.stringify(monto)}`)
})

test('participantes inválidos', () => {
    for (const participantes of [undefined, [], 'x', [{}], [{ id: 'a' }], [{ id: 1.5 }], [{ id: -1 }], [null], [{ id: 1 }, { id: 1 }]])
        assert.ok(validarDatosGasto({ ...valido, participantes }).error, `debería rechazar ${JSON.stringify(participantes)}`)
})

test('descripción inválida', () => {
    assert.ok(validarDatosGasto({ ...valido, descripcion: 42 }).error)
    assert.ok(validarDatosGasto({ ...valido, descripcion: 'x'.repeat(256) }).error)
})
