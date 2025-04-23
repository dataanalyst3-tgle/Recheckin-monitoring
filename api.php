<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $sql = "SELECT 
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

    echo json_encode($resultados ?: []);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>