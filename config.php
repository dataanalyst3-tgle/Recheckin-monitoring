<?php
// Protección múltiple
if (!defined('PROTECTED_CONFIG_ACCESS') || PROTECTED_CONFIG_ACCESS !== true || 
    basename(__FILE__) == basename($_SERVER["SCRIPT_FILENAME"])) {
    header('HTTP/1.1 403 Forbidden');
    exit('Acceso prohibido');
}

// Headers de seguridad
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');

// Validar variables de entorno
$requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS'];
foreach ($requiredEnvVars as $var) {
    if (empty(getenv($var))) {
        error_log("Error: Variable de entorno $var no definida.");
        die("Error de configuración. Contacte al administrador.");
    }
}

// Configuración desde variables de entorno
define('DB_HOST', getenv('DB_HOST'));
define('DB_PORT', getenv('DB_PORT') ?: 3306);
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));

// Conexión segura con SSL
try {
    $conn = new PDO(
        "mysql:host=".DB_HOST.";port=".DB_PORT.";dbname=".DB_NAME,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_SSL_CA => '/path/to/ca.pem',
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true
        ]
    );
} catch(PDOException $e) {
    error_log("[" . date('Y-m-d H:i:s') . "] Error de conexión (no se muestran detalles)");
    die("Error en el sistema. Contacte al administrador.");
}

// Cierre seguro al terminar
register_shutdown_function(function() use (&$conn) {
    if (isset($conn) && $conn instanceof PDO) {
        $conn = null;
    }
});