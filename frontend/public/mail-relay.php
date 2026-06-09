<?php
/**
 * IONOS mail relay — keeps API on Render, sends mail via IONOS SMTP (HTTPS in, SMTP out).
 *
 * Setup:
 * 1. IONOS → Email → create mailbox e.g. tickets@grabithot.com
 * 2. Copy mail-relay.config.example.php → mail-relay.config.php (same folder)
 * 3. Fill in secret + SMTP password (do not commit mail-relay.config.php)
 * 4. On Render set MAIL_RELAY_URL=https://grabithot.com/mail-relay.php
 *    and MAIL_RELAY_SECRET to the same secret
 */
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$configPath = __DIR__ . '/mail-relay.config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'missing_config']);
    exit;
}

$config = require $configPath;
$secret = (string)($config['secret'] ?? '');
$headerSecret = (string)($_SERVER['HTTP_X_MAIL_RELAY_SECRET'] ?? '');

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '{}', true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json']);
    exit;
}

$bodySecret = (string)($body['secret'] ?? '');
if ($secret === '' || ($headerSecret !== $secret && $bodySecret !== $secret)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthorized']);
    exit;
}

$to = trim((string)($body['to'] ?? ''));
$subject = trim((string)($body['subject'] ?? ''));
$html = (string)($body['html'] ?? '');
$text = (string)($body['text'] ?? '');

if ($to === '' || $subject === '' || ($html === '' && $text === '')) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_fields']);
    exit;
}

if ($text === '') {
    $text = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $html));
}

$smtpHost = (string)($config['smtp_host'] ?? 'smtp.ionos.com');
$smtpPort = (int)($config['smtp_port'] ?? 587);
$smtpUser = (string)($config['smtp_user'] ?? '');
$smtpPass = (string)($config['smtp_pass'] ?? '');
$fromEmail = (string)($config['from_email'] ?? $smtpUser);
$fromName = (string)($config['from_name'] ?? 'Grab It Hot');

if ($smtpUser === '' || $smtpPass === '' || $fromEmail === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'incomplete_smtp_config']);
    exit;
}

try {
  $ok = ionos_smtp_send($smtpHost, $smtpPort, $smtpUser, $smtpPass, $fromEmail, $fromName, $to, $subject, $html, $text);
  if ($ok) {
    echo json_encode(['ok' => true]);
  } else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'send_failed']);
  }
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}

function ionos_smtp_send($host, $port, $user, $pass, $fromEmail, $fromName, $to, $subject, $html, $text) {
    $secure = $port === 465;
    $remote = ($secure ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 20, STREAM_CLIENT_CONNECT);
    if (!$fp) {
        throw new RuntimeException("connect_failed: $errstr ($errno)");
    }
    stream_set_timeout($fp, 20);

    $read = function () use ($fp) {
        $data = '';
        while ($line = fgets($fp, 515)) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $data;
    };
    $write = function ($cmd) use ($fp) {
        fwrite($fp, $cmd . "\r\n");
    };
    $expect = function ($resp, $codes) use ($read) {
        $code = (int)substr($resp, 0, 3);
        if (!in_array($code, $codes, true)) {
            throw new RuntimeException('smtp_error: ' . trim($resp));
        }
    };

    $expect($read(), [220]);

    $write('EHLO grabithot.com');
    $ehlo = $read();
    $expect($ehlo, [250]);

    if (!$secure && stripos($ehlo, 'STARTTLS') !== false) {
        $write('STARTTLS');
        $expect($read(), [220]);
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new RuntimeException('starttls_failed');
        }
        $write('EHLO grabithot.com');
        $expect($read(), [250]);
    }

    $write('AUTH LOGIN');
    $expect($read(), [334]);
    $write(base64_encode($user));
    $expect($read(), [334]);
    $write(base64_encode($pass));
    $expect($read(), [235]);

    $write('MAIL FROM:<' . $fromEmail . '>');
    $expect($read(), [250]);
    $write('RCPT TO:<' . $to . '>');
    $expect($read(), [250, 251]);

    $write('DATA');
    $expect($read(), [354]);

    $boundary = 'gh_' . bin2hex(random_bytes(8));
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $fromHeader = '=?UTF-8?B?' . base64_encode($fromName) . '?= <' . $fromEmail . '>';

    $headers = [
        'From: ' . $fromHeader,
        'To: <' . $to . '>',
        'Subject: ' . $encodedSubject,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];

    $message = implode("\r\n", $headers) . "\r\n\r\n";
    $message .= '--' . $boundary . "\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $message .= chunk_split(base64_encode($text)) . "\r\n";
    $message .= '--' . $boundary . "\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $message .= chunk_split(base64_encode($html)) . "\r\n";
    $message .= '--' . $boundary . "--\r\n";
    $message = str_replace("\n.", "\n..", $message);

    fwrite($fp, $message . "\r\n.\r\n");
    $expect($read(), [250]);

    $write('QUIT');
    fclose($fp);
    return true;
}
