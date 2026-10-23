Parte Liquidacion de deudas

Obtengo la lista de participantes del Grupo según Pertenencia y almaceno en una ED
Obtengo una lista de Gasto con  fk al Grupo (que no hayan sido soft-deleted)
    -Podría pensar en sumar los gastos que tengan la misma idIntegrante

Por cada participante necesito
    -Suma total de lo que aportó
    -Suma total de los detalle_gasto (osea las participaciones en gastos, incluyendo los propios)

Por cada participante de un grupo, obtengo;
    -Su participacion en gastos del grupo (que no hayan sido soft-deleted)
    -Su Gasto total en el grupo si es que erogó dinero
Por cada participante, calculo su Saldo Neto como:  -->Debería validar que si su Gasto es 0 y su detalle gasto es 0 entonces nunca participo pero ya es evaluado
    Sn = Total Erogado - (Total de participaciones)
    Aquellos con Sn negativo se van a un nuevo Map de deudores
    Aquellos con Sn =0

[ A(-10), B(-5), C(-4), D(2), E(8), F(9) ]


            Evalúo A con F, guardo el valor en un arreglo de objeto tipo {A,B,monto}, actualizo saldos, si alguno de los dos da cero avanzo o retrocedo, sino me quedo
    
A --> F = 9  --> F sale de la lista

A--> E = 1 --> A sale de la lista

B--> E = 5 --> B sale de la lista

C --> E = 2 --> E sale de la lista

C-->D = 2 --> Ambos salen de la lista
 
