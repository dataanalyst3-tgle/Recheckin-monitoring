<?php
require_once 'config.php';

// Obtener datos solo para la carga inicial
try {
    $sql = "
SELECT 
  DATE(dc.created_date) AS Fecha,
  TIME(dc.created_date) AS Entrada,
  dv.folio AS Folio_visita,
  IF(l.folio_prefix = 'TERR', 'TERRAZA', l.folio_prefix) AS Sala,
  CONCAT_WS(' ', g.name, g.pat_last_name) AS Huesped,
  IF(lam.folio_prefix = 'PP', 'PRIORITY PASS', lam.folio_prefix) AS Tipo,
  lam.name AS Subtipo,
  dc.check_out_date AS Check_out,
  CONCAT_WS(' ', e.name, e.pat_last_name, e.mat_last_name) AS Recepcionista,
  (dc.adults_number + dc.kids_number) AS Total
FROM davinci_checkin dc
LEFT JOIN lounge_access_method lam ON dc.lounge_access_method_id = lam.id
LEFT JOIN lounge l ON dc.initial_lounge_id = l.id
LEFT JOIN davinci_visit dv ON dc.visit_id = dv.id
LEFT JOIN guest g ON dv.guest_id = g.id
LEFT JOIN user u ON dc.created_by = u.id
LEFT JOIN employee e ON u.employee_id = e.id
WHERE dc.created_date >= CURDATE()
  AND dc.created_date < CURDATE() + INTERVAL 1 DAY
  AND dc.check_out_date IS NULL
ORDER BY dc.created_date ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch(PDOException $e) {
    $resultados = [];
    // Opcional: registrar el error en un log
}
?>
    
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recheck-in - Resumen</title>
    <link rel="icon" type="image/x-icon" href="/img/TGLE_logo.ico?v=2">
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <style>
        
        /* Nuevo estilo para el título principal */
        .main-title {
            position: relative;
            font-size: 2.5rem;
            color: #2b2d42;
            margin: 0 0 25px 0;
            padding-bottom: 15px;
            font-weight: 700;
            display: inline-block;
        }
        
        .main-title::after {
            content: "";
            position: absolute;
            left: 0;
            bottom: 0;
            width: 60px;
            height: 4px;
            background: linear-gradient(90deg, #2a9d8f, #4cc9f0);
            border-radius: 2px;
        }
        
        .title-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f0f0f0;
            width: 100%;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .title-decoration {
            font-size: 1.2rem;
            color: #6c757d;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .title-decoration::before {
            content: "";
            display: inline-block;
            width: 20px;
            height: 2px;
            background-color: #dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title-container">
            <h1 class="main-title">🏢 Resumen de Salas</h1>
        </div>
        
        <!-- El resto de tu contenido permanece igual -->
        <section class="compact-filters">
            <div class="filter-controls">
                <div class="left-group">
                    <p class="update-time" id="horaActualizacion">Últ. actualización: Nunca</p>
                    <button id="btnCargar" title="Cargar datos">↻</button>
                </div>
                <div class="right-group">
                    <div class="dropdown-filter">
                        <button class="filter-toggle">Filtrar ▿</button>
                        <div class="filter-options">
                            <button onclick="filtrarPorEstado('excedido')">Excedidos</button>
                            <button onclick="filtrarPorEstado('recheck')">Rechecks</button>
                            <button id="btnLimpiarFiltro">Limpiar</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
            <!-- Sección de resumen con cards -->
            <section class="summary-cards">
                <div class="cards-container" id="cardsContainer">
                    <!-- Las cards se generarán dinámicamente -->
                </div>
            </section>

            <!-- Sección de la tabla general -->
            <section class="report">
                <div class="table-container">
                    <table id="tablaGeneral">
                        <thead></thead>
                        <tbody></tbody>
                    </table>
                </div>
            </section>
        </div>

        <!-- Botón flotante para subir -->
        <button id="btnSubir" class="btn-subir">↑</button>


        <script>
            // Pasar solo los datos iniciales
            const datosIniciales = <?php echo json_encode($resultados ?: []); ?>;
        </script>

        <script src="script.js"></script>
    </div>
</body>
</html>