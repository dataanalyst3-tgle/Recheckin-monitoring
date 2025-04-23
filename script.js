document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let jsonDataGlobal = [];
    let datosFiltradosGlobal = [];
    let filtrosActivos = {
        excedido: false,
        recheck: false
    };

    // Constantes
    const SALAS = {
        'aifa': 'AIFA',
        'haven': 'HAVEN',
        'tgle': 'TGLE',
        'l19': 'L 19',
        'terraza': 'TERRAZA'
    };

    const CAPACIDADES = {
        'AIFA': 189,
        'HAVEN': 122,
        'TGLE': 121,
        'L 19': 70,
        'TERRAZA': 74
    };
    
    const MINUTOS_LIMITE_VISA = 120;
    const MINUTOS_LIMITE_NORMAL = 180;
    const INTERVALO_ACTUALIZACION = 60 * 1000; // 1 minuto

    // Elementos del DOM
    const btnCargar = document.getElementById('btnCargar');
    const btnActualizar = document.getElementById('btnActualizar');
    const btnLimpiarFiltro = document.getElementById('btnLimpiarFiltro');
    const btnSubir = document.getElementById('btnSubir');
    const horaActualizacion = document.getElementById('horaActualizacion');
    const tablaGeneral = document.getElementById('tablaGeneral');
    const cardsContainer = document.getElementById('cardsContainer');
    const salaTotal = document.getElementById('salaTotal');
    const nombreSala = document.getElementById('nombreSala');
    const btnVolver = document.getElementById('btnVolver');

    // Cambiar la detección de páginas
    const esPaginaPrincipal = window.location.pathname.endsWith('index.php') || 
                             window.location.pathname.endsWith('index.html') || 
                             window.location.pathname.endsWith('/');

    let salaActual = determinarSalaActual();

    // Inicialización
    init();

    function init() {
        if (!esPaginaPrincipal) {
            salaActual = determinarSalaActual(); // Asegurarse de tener la sala actual
            if (!salaActual) {
                console.error('No se pudo determinar la sala actual');
                return;
            }
        }

        setupEventListeners();
        configurarInterfazSegunContexto();
        cargarDatos();
        setInterval(cargarDatos, INTERVALO_ACTUALIZACION);
    }

    function determinarSalaActual() {
        if (esPaginaPrincipal) return null;

        const path = window.location.pathname;
        const nombreArchivo = path.split('/').pop().replace('.html', '').replace('.php', '').toLowerCase();

        // Si estamos en la página principal, devolver null
        if (nombreArchivo === 'index' || nombreArchivo === '') return null;

        // Mapeo especial para L19
        if (nombreArchivo === 'l19') return 'L 19';

        return SALAS[nombreArchivo] || nombreArchivo.toUpperCase();
    }

    function configurarInterfazSegunContexto() {
        if (!esPaginaPrincipal) {
            // Configuración para páginas de sala
            document.title = `Recheck-in - ${salaActual}`;
            if (nombreSala) nombreSala.textContent = salaActual;
            if (btnVolver) btnVolver.href = 'index.php';
        }
    }

    function setupEventListeners() {
        if (btnCargar) btnCargar.addEventListener('click', cargarDatos);
        if (btnActualizar) btnActualizar.addEventListener('click', actualizarContenido);
        if (btnLimpiarFiltro) btnLimpiarFiltro.addEventListener('click', limpiarFiltro);
        if (btnSubir) btnSubir.addEventListener('click', scrollArriba);

        window.addEventListener('scroll', () => {
            if (btnSubir) {
                btnSubir.style.display = document.documentElement.scrollTop > 300 ? 'flex' : 'none';
            }
        });
    }

    // ===== FUNCIONES PRINCIPALES =====

    async function cargarDatos() {
        mostrarCargando(true);

        try {
            // En cargarDatos(), asegurar que siempre use la ruta correcta:
            const response = await fetch('api.php'); // Todas las páginas usan la misma ruta

            if (!response.ok) {
                if (typeof datosIniciales !== 'undefined') {
                    return procesarDatos(datosIniciales);
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            procesarDatos(data);

        } catch (error) {
            console.error('Error al cargar datos:', error);
            mostrarError('Error al cargar datos. Intente nuevamente.');
        } finally {
            mostrarCargando(false);
        }
    }

    function procesarDatos(datos) {
        jsonDataGlobal = datos;

        if (esPaginaPrincipal) {
            datosFiltradosGlobal = [...datos];
            generarCardsResumen();
        } else {
            // Depuración: verificar salaActual
            console.log('Filtrando para sala:', salaActual);

            const salaBuscada = salaActual === 'L 19' ? ['L 19', 'L19'] : [salaActual.toUpperCase()];
            datosFiltradosGlobal = datos.filter(item => {
                const salaItem = (item.Sala || '').toUpperCase();
                console.log('Comparando:', salaItem, 'con', salaBuscada);
                return salaBuscada.includes(salaItem);
            });

            // Depuración: verificar resultados del filtrado
            console.log('Datos filtrados:', datosFiltradosGlobal);

            if (salaTotal) {
                const total = datosFiltradosGlobal.reduce((sum, item) => 
                    sum + (parseInt(item.Total) || 0), 0);
                console.log('Total calculado:', total);
                salaTotal.querySelector('.total-value').textContent = total;
            }
        }

        actualizarTabla(datosFiltradosGlobal);
        actualizarHora();
    }

    // ===== FUNCIONES DE VISUALIZACIÓN =====

    function generarCardsResumen() {
        if (!cardsContainer) return;

        cardsContainer.innerHTML = '';
        const totales = calcularTotalesPorSala();

        Object.entries(SALAS).forEach(([key, sala]) => {
            const card = document.createElement('div');
            card.className = `summary-card ${key}-card`;

            const total = totales[sala].toFixed(0);
            const capacidad = CAPACIDADES[sala] || 100;
            const porcentaje = Math.min(Math.round((totales[sala] / capacidad) * 100), 100);

            // Sistema de color compacto
            const colorBarra = porcentaje >= 80 ? '#e63946' : porcentaje >= 50 ? '#ffbe0b' : '#2a9d8f';
            const icono = porcentaje >= 90 ? '⚠️' : porcentaje >= 70 ? '🔔' : '';

            card.innerHTML = `
                <div class="card-header">
                    <h2>${sala} ${icono}</h2>
                    <div class="total">${total}<small>/${capacidad}</small></div>
                </div>
                <div class="progress-bar" title="${porcentaje}% ocupado">
                    <div class="progress-fill" style="width: ${porcentaje}%; background: ${colorBarra};"></div>
                </div>
                <a href="${key}.html" class="btn-detalles"> Ver detalles →</a>
            `;

            cardsContainer.appendChild(card);
        });
    }

    function calcularTotalesPorSala() {
        const totales = {};
        Object.values(SALAS).forEach(sala => totales[sala] = 0);

        jsonDataGlobal.forEach(item => {
            let sala = (item.Sala || "").toUpperCase();
            if (sala === 'L19') sala = 'L 19';

            const total = parseInt(item.Total) || 0;
            if (Object.values(SALAS).includes(sala)) totales[sala] += total;
        });

        return totales;
    }

    function actualizarTabla(datos) {
        if (!tablaGeneral) return;

        // Limpiar tabla existente
        tablaGeneral.innerHTML = `
            <thead>
                <tr>
                    <th>FECHA</th>
                    <th>ENTRADA</th>
                    <th>FOLIO</th>
                    <th>SALA</th>
                    <th>HUÉSPED</th>
                    <th>TIPO</th>
                    <th>SUBTIPO</th>
                    <th>CHECK OUT</th>
                    <th>RECEPCIONISTA</th>
                    <th>TOTAL</th>
                    <th>ESTADÍA</th>
                    <th>ESTADO</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = tablaGeneral.querySelector('tbody');

        if (!datos || datos.length === 0) {
            mostrarMensajeSinDatos();
            return;
        }

        // Filtrar y procesar datos
        datos
            .filter(item => {
                const tipo = (item.Tipo || "").toUpperCase();
                return tipo.includes('VISA') || tipo.includes('PRIORITY PASS') || tipo.startsWith('WIN');
            })
            .forEach(item => {
                const tiempos = calcularTiempos(item);
                const tr = document.createElement('tr');

                // Añadir clases según estado
                if (tiempos.esExcedido) {
                    tr.classList.add('fila-excedida');
                    tr.title = "Tiempo excedido - requiere atención inmediata";
                } else if (tiempos.esRecheck) {
                    tr.classList.add('fila-recheck');
                    tr.title = "Próximo a hacer checkout";
                }

                // Mapeo de datos básicos
                const campos = [
                    'Fecha', 'Entrada', 'Folio_visita', 'Sala', 'Huesped',
                    'Tipo', 'Subtipo', 'Check_out', 'Recepcionista', 'Total'
                ];

                // Crear celdas normales
                campos.forEach(campo => {
                    const td = document.createElement('td');
                    td.textContent = item[campo] || '-';
                    tr.appendChild(td);
                });

                // Celda de estadía con tooltip
                const tdEstadia = document.createElement('td');
                tdEstadia.textContent = `${tiempos.estadia.horas}h ${tiempos.estadia.minutos}m`;
                tdEstadia.title = `Tiempo en sala: ${tiempos.estadia.horas} horas y ${tiempos.estadia.minutos} minutos`;
                tr.appendChild(tdEstadia);

                // Celda de estado con icono y estilo
                const tdEstado = document.createElement('td');
                let estadoHTML = '';

                if (tiempos.esExcedido) {
                    const tiempoExcedido = Math.abs(tiempos.minutosRestantes);
                    estadoHTML = `
                        <div class="estado-alerta critico">
                            <span class="icono">⚠️</span>
                            <div class="detalle">
                                <strong>EXCEDIDO</strong>
                                <small>${Math.floor(tiempoExcedido/60)}h ${tiempoExcedido%60}m</small>
                            </div>
                        </div>
                    `;
                } else if (tiempos.esRecheck) {
                    estadoHTML = `
                        <div class="estado-alerta aviso">
                            <span class="icono">⏱️</span>
                            <div class="detalle">
                                <strong>CHECKOUT</strong>
                                <small>en ${tiempos.minutosRestantes}m</small>
                            </div>
                        </div>
                    `;
                } else {
                    estadoHTML = `
                        <div class="estado-normal">
                            ${tiempos.minutosRestantes}m restantes
                        </div>
                    `;
                }

                tdEstado.innerHTML = estadoHTML;
                tr.appendChild(tdEstado);

                tbody.appendChild(tr);
            });
    }

    function calcularTiempos(item) {
        const fechaHora = convertirAMPMaDate(item.Entrada);
        const estadia = calcularEstadia(fechaHora);

        // Detección mejorada de Visa (case insensitive y permite variaciones)
        const tipo = (item.Tipo || "").toUpperCase();
        const esVisa = tipo.includes('VISA'); // Ahora detectará "VISA", "visa", "Visa Gold", etc.

        const minutosLimite = esVisa ? MINUTOS_LIMITE_VISA : MINUTOS_LIMITE_NORMAL;
        const minutosRestantes = minutosLimite - (estadia.horas * 60 + estadia.minutos);

        return {
            estadia,
            minutosRestantes,
            esExcedido: minutosRestantes <= 0,
            esRecheck: minutosRestantes > 0 && minutosRestantes < 15
        };
    }

    // ===== FUNCIONES AUXILIARES =====

    function mostrarCargando(mostrar) {
        const loader = document.getElementById('loader') || document.createElement('div');

        if (mostrar) {
            loader.id = 'loader';
            loader.innerHTML = '<div class="spinner"></div><p>Cargando datos...</p>';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.8);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;
            document.body.appendChild(loader);
        } else if (document.getElementById('loader')) {
            document.body.removeChild(loader);
        }
    }

    function mostrarError(mensaje) {
        const errorElement = document.getElementById('error-message') || document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.textContent = mensaje;
        errorElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            background: #f1666d;
            color: white;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(errorElement);

        setTimeout(() => {
            if (document.getElementById('error-message')) {
                document.body.removeChild(errorElement);
            }
        }, 5000);
    }

    function mostrarMensajeSinDatos() {
        if (tablaGeneral) {
            const tbody = tablaGeneral.querySelector('tbody');
            tbody.innerHTML = '';

            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 12;
            td.textContent = 'No hay datos disponibles';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
    }

    function obtenerHoraActual() {
        const ahora = new Date();
        const opciones = { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        return ahora.toLocaleString('es-MX', opciones);
    }

    function actualizarHora() {
        if (horaActualizacion) {
            horaActualizacion.textContent = `Última actualización: ${obtenerHoraActual()} | `;
        }
    }

    function convertirAMPMaDate(horaTexto) {
        if (!horaTexto) return null;
        const [hora, minuto, segundo] = horaTexto.split(':');
        const date = new Date();
        date.setHours(parseInt(hora), parseInt(minuto), parseInt(segundo || 0));
        return date;
    }

    function calcularEstadia(fechaHora) {
        if (!fechaHora) return { horas: 0, minutos: 0, diferencia: 0 };
        const diferencia = new Date() - new Date(fechaHora);
        return {
            horas: Math.floor(diferencia / (1000 * 60 * 60)),
            minutos: Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60)),
            diferencia
        };
    }

    // ===== FILTROS Y UTILIDADES =====

    function filtrarPorSala(sala) {
        if (!sala || !jsonDataGlobal.length) return;

        const salaBuscada = sala === 'L 19' ? ['L 19', 'L19'] : [sala.toUpperCase()];

        datosFiltradosGlobal = jsonDataGlobal.filter(item => {
            const salaItem = (item.Sala || '').toUpperCase();
            const coincide = salaBuscada.includes(salaItem);
            if (!coincide) console.log('Item no coincide:', item);
            return coincide;
        });

        console.log('Resultados filtrados para', sala, ':', datosFiltradosGlobal);

        actualizarTabla(datosFiltradosGlobal);

        if (salaTotal) {
            const total = datosFiltradosGlobal.reduce((sum, item) => 
                sum + (parseInt(item.Total) || 0), 0);
            console.log('Total para', sala, ':', total);
            salaTotal.querySelector('.total-value').textContent = total;
        }
    }


    function aplicarFiltros() {
        if (!tablaGeneral) return;

        const tbody = tablaGeneral.querySelector('tbody');
        const filas = tablaGeneral.querySelectorAll('tbody tr');
        let filasVisibles = 0;
        let mensaje = '';

        filas.forEach(fila => {
            const esExcedido = fila.classList.contains('fila-excedida');
            const esRecheck = fila.classList.contains('fila-recheck');

            const mostrarFila = (
                (!filtrosActivos.excedido && !filtrosActivos.recheck) || // Sin filtros
                (filtrosActivos.excedido && esExcedido) ||               // Solo excedidos
                (filtrosActivos.recheck && esRecheck) ||                // Solo rechecks
                (filtrosActivos.excedido && filtrosActivos.recheck && (esExcedido || esRecheck)) // Ambos
            );

            if (mostrarFila) filasVisibles++;
            fila.style.display = mostrarFila ? "" : "none";
        });

        // Mostrar mensaje cuando no hay resultados
        if (filasVisibles === 0) {
            if (filtrosActivos.excedido && filtrosActivos.recheck) {
                mensaje = 'No hay registros que coincidan con ambos filtros';
            } else if (filtrosActivos.excedido) {
                mensaje = 'No hay registros excedidos';
            } else if (filtrosActivos.recheck) {
                mensaje = 'No hay rechecks pendientes';
            } else {
                mensaje = 'No hay datos disponibles';
            }

            tbody.innerHTML = `
                <tr>
                    <td colspan="12" style="text-align: center; padding: 20px; color: #666;">
                        ${mensaje}
                    </td>
                </tr>
            `;
        }
    }
    
    function actualizarEstilosBotones() {
        const btnExcedido = document.querySelector("button[onclick*='excedido']");
        const btnRecheck = document.querySelector("button[onclick*='recheck']");
        const btnLimpiar = document.getElementById('btnLimpiarFiltro');

        const actualizarBoton = (boton, estaActivo) => {
            if (!boton) return;

            boton.style.backgroundColor = estaActivo ? '#2a9d8f' : '#f8f9fa';
            boton.style.color = estaActivo ? 'white' : '#333';
            boton.style.fontWeight = estaActivo ? 'bold' : 'normal';
            boton.style.border = estaActivo ? '1px solid #21867a' : '1px solid #ddd';
        };

        actualizarBoton(btnExcedido, filtrosActivos.excedido);
        actualizarBoton(btnRecheck, filtrosActivos.recheck);

        // Activar botón limpiar si algún filtro está activo
        if (btnLimpiar) {
            btnLimpiar.style.display = (filtrosActivos.excedido || filtrosActivos.recheck) ? 'inline-block' : 'none';
        }
    }

    function filtrarPorEstado(estado) {
        filtrosActivos[estado] = !filtrosActivos[estado];
        actualizarEstilosBotones();
        aplicarFiltros();
    }

    function limpiarFiltro() {
        // 1. Reiniciar solo los filtros de estado
        filtrosActivos = {
            excedido: false,
            recheck: false
        };

        // 2. Actualizar UI de botones
        actualizarEstilosBotones();

        // 3. Si estamos en una página de sala, mantener el filtro por sala
        if (!esPaginaPrincipal && salaActual) {
            filtrarPorSala(salaActual); // ← Aplica filtro de sala nuevamente
        } else {
            // Si estamos en la página principal, recargar todos los datos sin filtros
            datosFiltradosGlobal = [...jsonDataGlobal];
            actualizarTabla(datosFiltradosGlobal);
        }
    }

    actualizarEstilosBotones();
    aplicarFiltros();

    function actualizarContenido() {
        cargarDatos();
        limpiarFiltro();
    }

    function scrollArriba() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Hacer funciones accesibles globalmente
    window.filtrarPorEstado = filtrarPorEstado;
    window.filtrarPorSala = filtrarPorSala;
});