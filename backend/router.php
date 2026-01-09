<?php
// Router for PHP built-in server
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Define base path for includes
define('BASE_PATH', __DIR__);

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve static files
if (preg_match('/\.(?:png|jpg|jpeg|gif|css|js)$/', $uri)) {
    return false;
}

// Route API requests
if (strpos($uri, '/api/') === 0) {
    $path = __DIR__ . $uri;
    
    // Check for index.php in directory
    if (is_dir($path)) {
        $path = rtrim($path, '/') . '/index.php';
    }
    
    // Add .php extension if needed
    if (!file_exists($path) && file_exists($path . '.php')) {
        $path .= '.php';
    }
    
    if (file_exists($path)) {
        // Change to the directory of the file being executed
        chdir(dirname($path));
        require $path;
        return true;
    }
}

// Serve uploads
if (strpos($uri, '/uploads/') === 0) {
    $path = __DIR__ . $uri;
    if (file_exists($path)) {
        return false;
    }
}

http_response_code(404);
echo json_encode(["error" => "Not found"]);
