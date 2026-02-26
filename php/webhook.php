<?php
/**
 * webhook.php (Versão Kirvano)
 * -------------------------------------------------------
 * Endpoint chamado pelo KIRVANO quando um pagamento é aprovado.
 * Varre o JSON em busca do sessionId e altera o status no 
 * Firebase para liberar o acesso ao usuário em tempo real.
 * -------------------------------------------------------
 */

define('FIREBASE_DB_URL', 'https://face-page-49adb-default-rtdb.firebaseio.com');
define('FIREBASE_API_KEY', 'AIzaSyBa3hkDcMKYnrK4cDJpGz5C6o1KG4VQVsg');
define('DEBUG', true);

// Lê os dados do Kirvano
$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody, true);

if (DEBUG) {
    file_put_contents(__DIR__ . '/webhook_log.txt', date('Y-m-d H:i:s') . " | KIRVANO PAYLOAD: " . $rawBody . PHP_EOL, FILE_APPEND);
}

if (!$payload) {
    http_response_code(400); exit(json_encode(['error' => 'No payload']));
}

// -------------------------------------------------------
//  Função inteligente para procurar "sess_" no JSON do Kirvano
// -------------------------------------------------------
function encontrarSessionId($array) {
    foreach ($array as $key => $value) {
        if (is_string($value) && strpos($value, 'sess_') === 0) {
            return $value; // Achou! ex: sess_12345_6789
        }
        if (is_array($value)) {
            $found = encontrarSessionId($value);
            if ($found) return $found;
        }
    }
    return null;
}

// Procura o sessionId que enviamos no ?src= do link
$sessionId = encontrarSessionId($payload);

if (!$sessionId) {
    http_response_code(200);
    exit(json_encode(['message' => 'Nenhum sessionId encontrado neste payload. Ignorado.']));
}

// -------------------------------------------------------
// Atualiza o Firebase via REST API (Libera o acesso na tela!)
// -------------------------------------------------------
$firebaseUrl = FIREBASE_DB_URL . '/payments/' . urlencode($sessionId) . '.json?key=' . FIREBASE_API_KEY;

$ch = curl_init($firebaseUrl);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => 'PATCH',
    CURLOPT_POSTFIELDS     => json_encode([
        'status'      => 'paid',
        'confirmedAt' => date('c'),
        'gateway'     => 'Kirvano'
    ]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (DEBUG) {
    file_put_contents(__DIR__ . '/webhook_log.txt', date('Y-m-d H:i:s') . " | FIREBASE PATCH -> " . $httpCode . PHP_EOL, FILE_APPEND);
}

// Responde 200 pro Kirvano saber que deu tudo certo
http_response_code(200);
echo json_encode(['success' => true, 'session' => $sessionId, 'firebase_statusCode' => $httpCode]);
