<?php
// ⚠️ ¡ADVERTENCIA! Hardcodear credenciales NO es recomendable en producción.
// Usa este enfoque SOLO para entornos locales o si no hay otra opción.

// 1. Protección de acceso (evita ejecución directa o inclusión no autorizada)
if (!defined('PROTECTED_CONFIG_ACCESS') || PROTECTED_CONFIG_ACCESS !== true || 
    basename(__FILE__) == basename($_SERVER["SCRIPT_FILENAME"])) {
    header('HTTP/1.1 403 Forbidden');
    exit('Acceso prohibido');
}

// 2. Headers de seguridad (protección contra ataques comunes)
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');

// 3. Credenciales directas (🔴 ¡Modifica estos valores!)
define('DB_HOST', 'pepogg.tgle.mx');       // Ejemplo: 'localhost'
define('DB_PORT', 3306);                   // Puerto estándar de MySQL
define('DB_NAME', 'trnjifd.tgle');         // Nombre de tu base de datos
define('DB_USER', 'ffwdhjnfwdsm');         // Usuario de la DB
define('DB_PASS', '_nfirwnfids44,');       // Contraseña

// 4. Conexión segura con SSL (requiere certificado válido)
try {
    $conn = new PDO(
        "mysql:host=".DB_HOST.";port=".DB_PORT.";dbname=".DB_NAME.";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_SSL_CA => '/etc/ssl/certs/ca-certificates.crt', // Ruta real
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true
        ]
    );
} catch(PDOException $e) {
    error_log("[" . date('Y-m-d H:i:s') . "] Error de conexión a BD (sin detalles)");
    die("Error en el sistema. Contacte al administrador.");
}

// 5. Cierre seguro de la conexión al terminar
register_shutdown_function(function() use (&$conn) {
    if (isset($conn) && $conn instanceof PDO) {
        $conn = null;
    }
});
