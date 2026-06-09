<?php
/**
 * Copy to mail-relay.config.php on IONOS (same folder as mail-relay.php).
 * Do not commit mail-relay.config.php — it contains your mailbox password.
 */
return [
    // Must match MAIL_RELAY_SECRET on Render
    'secret' => 'change-me-to-a-long-random-string',

    'smtp_host' => 'smtp.ionos.com',
    'smtp_port' => 587,
    'smtp_user' => 'tickets@grabithot.com',
    'smtp_pass' => 'your-ionos-mailbox-password',

    'from_email' => 'tickets@grabithot.com',
    'from_name' => 'Grab It Hot',
];
