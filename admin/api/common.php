<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

define('PROJECT_PATH', dirname(__FILE__). '/../../server');
define('API_PATH', dirname(__FILE__));

require_once(PROJECT_PATH . '/lib/core/config.class.php');
require_once(PROJECT_PATH . '/lib/core/mysql.class.php');
require_once(PROJECT_PATH . '/lib/core/databaseresult.class.php');
require_once(PROJECT_PATH . '/lib/core/mysqlresult.class.php');

function __autoload($class_name) {
    $short_class_name = explode('\\', $class_name);
    $short_class_name = end($short_class_name);

    $class = API_PATH . '/' . (strpos($short_class_name, 'API') === 0 || strpos($short_class_name, 'REST') === 0 ? 'Core' : 'Lib') . '/' . strtolower($short_class_name) . '.class.php';
    if (!file_exists($class)) {
        throw new Exception('Class file for "' . $short_class_name . '" not found ' . $class);
    }

    require_once $class;
}

?>