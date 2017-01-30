<?php

use Symfony\Component\Translation\Loader\PoFileLoader;

require_once __DIR__ . '/vendor/autoload.php';
define('PROJECT_PATH', realpath(dirname(__FILE__) . '/../server/'));

require_once PROJECT_PATH . '/../storage/config.php';
require_once PROJECT_PATH . '/../server/lib/core/config.class.php';
require_once PROJECT_PATH . '/../server/lib/core/mysql.class.php';
require_once PROJECT_PATH . '/../server/lib/core/databaseresult.class.php';
require_once PROJECT_PATH . '/../server/lib/core/mysqlresult.class.php';
require_once PROJECT_PATH . '/../server/lib/core/middleware.class.php';
require_once PROJECT_PATH . '/../server/lib/core/stb.class.php';
require_once PROJECT_PATH . '/../server/lib/core/cacheresult.class.php';
require_once PROJECT_PATH . '/../server/lib/core/cache.class.php';
require_once PROJECT_PATH . '/../server/lib/core/licensemanager.class.php';
require_once PROJECT_PATH . '/../server/lib/oauth/authaccesshandler.class.php';
require_once PROJECT_PATH . '/../server/lib/core/advertising.class.php';

use Stalker\Lib\Core\Config;

$_SERVER['TARGET'] = 'ADM';

$locales = array();

$allowed_locales = Config::get("allowed_locales");

foreach ($allowed_locales as $lang => $locale){
    $locales[substr($locale, 0, 2)] = $locale;
}

$accept_language = !empty($_SERVER["HTTP_ACCEPT_LANGUAGE"]) ? $_SERVER["HTTP_ACCEPT_LANGUAGE"] : null;

if (!empty($_COOKIE['language']) && (array_key_exists($_COOKIE['language'], $locales) || in_array($_COOKIE['language'], $locales))){
    $language = substr($_COOKIE['language'], 0, 2);
}else if ($accept_language && array_key_exists(substr($accept_language, 0, 2), $locales)){
    $language = substr($accept_language, 0, 2);
}else{
    $language = key($locales);
}
$locale = $locales[$language];

setcookie("debug_key", "", time() - 3600, "/");

setlocale(LC_MESSAGES, $locale);
setlocale(LC_TIME, $locale);
putenv('LC_MESSAGES='.$locale);
bindtextdomain('stb', PROJECT_PATH.'/locale');
textdomain('stb');
bind_textdomain_codeset('stb', 'UTF-8');

$app = new Silex\Application();
$app['debug'] = Config::getSafe('admin_panel_debug', FALSE);

if (Config::getSafe('admin_panel_debug_log', FALSE)) {
    $log_date = new \DateTime();
    $log_dir = __DIR__ . "/logs";
    if (!is_dir($log_dir)) {
        mkdir($log_dir);
    }
    if (is_dir($log_dir)) {
        $log_file = "$log_dir/development_" . $log_date->format('Y-m-d') . ".log";
        if (!is_file($log_file) && ($log_file_h = fopen($log_file, "a+")) !== FALSE) {
            fclose($log_file_h);
        }
        if (is_file($log_file)) {
            $app->register(new Silex\Provider\MonologServiceProvider(), array(
                'monolog.logfile' => $log_file
            ));

            $app['monolog']->addInfo(str_pad('', 80, '-') . PHP_EOL);
            $app['monolog']->addInfo(sprintf("Script begin timestamp - '%s'", $start_script_time) . PHP_EOL);
        }
    }
}

$app->register(new Silex\Provider\SessionServiceProvider());
$app->register(new Silex\Provider\ValidatorServiceProvider());
$app->register(new Silex\Provider\FormServiceProvider());
$app->register(new \nymo\Silex\Provider\BreadCrumbServiceProvider());
$app->register(new Silex\Provider\RoutingServiceProvider());
$app->register(new Silex\Provider\LocaleServiceProvider());
$app->register(new Silex\Provider\TranslationServiceProvider(), array(
    'locale' => $language,
    'locale_fallbacks' => array($language),
));

$app['allowed_locales'] = $allowed_locales;

$app['twig.options.cache'] = __DIR__ . '/resources/cache/twig';

$base_twig_path = __DIR__ . '/resources/views';
$theme = array();
foreach(array_diff(scandir($base_twig_path), array('..', '.')) as $theme_dir){
    $theme_dir_path = $base_twig_path . '/' . $theme_dir;
    if (is_dir($theme_dir_path)) {
        $theme[$theme_dir] = $theme_dir_path . '/';
    }
}

$app["themes"] = $theme;

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.options' => array(
        'cache' => isset($app['twig.options.cache']) && is_dir($app['twig.options.cache']) && is_writable($app['twig.options.cache']) ? $app['twig.options.cache'] : false,
        'strict_variables' => true,
        'auto_reload' => true
    ),
    'twig.path' => $base_twig_path,
));

$app->register(new \W6\Service\Provider\ImagineServiceProvider());

$app["language"] = $language;
$app["js_validator_language"] = in_array($language, array('pt', 'ro', 'dk', 'no', 'nl', 'cz', 'ca', 'ru', 'it', 'fr', 'de', 'se', 'en', 'pt')) ? $language: 'en';
$app['lang']=$lang=array($language);
$app["locale"] = $locale;

$app->extend('translator', function($translator, $app){
            $lang = (!empty($app["language"])? $app["language"]: "ru");
            $translator->addLoader('po', new PoFileLoader());
            $translator->addResource('po', __DIR__."/../server/locale/$lang/LC_MESSAGES/stb.po", $lang);
            $translator->setLocale($lang);
            return $translator;
        });

$app["breadcrumbs.separator"] = "";
$app->extend('twig', function ($twig, $app) {
    $twig->addExtension(new \nymo\Twig\Extension\BreadCrumbExtension($app));
    $twig->addExtension(new Twig_Extension_Optimizer());
    return $twig;
});

$auto_dump_assets = (getenv('STALKER_ENV') && !(!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest' ));
$app->register(new SilexAssetic\AsseticServiceProvider(),
    array(
        'assetic.path_to_web' => __DIR__ . '/../server/adm',
        'assetic.options' => array(
            'auto_dump_assets' => true,//$auto_dump_assets,                        // ручное управление минимизацией на лету true - включить, false - отключить
            'debug' => false
        ),
        'assetic.filters' => $app->protect(function($fm) {
            $fm->set('yui_css', new Assetic\Filter\Yui\CssCompressorFilter( // sudo apt-get install yui-compressor
                '/usr/share/yui-compressor/yui-compressor.jar'
            ));
            $fm->set('yui_js', new Assetic\Filter\Yui\JsCompressorFilter(
                '/usr/share/yui-compressor/yui-compressor.jar'
            ));
            $fm->set('uglifyjs2', new \Assetic\Filter\UglifyJs2Filter(
                '/usr/local/bin/uglifyjs'
            ));
            $fm->set('uglifycss', new \Assetic\Filter\UglifyCssFilter(
                '/usr/local/bin/uglifycss'
            ));
            $fm->set('cssmin', new \Assetic\Filter\CssMinFilter());
        })
    ));

$app['twig']->addFunction(new \Twig_SimpleFunction('compressor', function ( $option ) use ($app){
    if (getenv('STALKER_ENV')) {
        ini_set('memory_limit', '1024M');
    }

    $filters = array(
        'yui_css' => new \Assetic\Filter\Yui\CssCompressorFilter('/usr/share/yui-compressor/yui-compressor.jar'),
        'yui_js' => new \Assetic\Filter\Yui\JsCompressorFilter('/usr/share/yui-compressor/yui-compressor.jar'),
        'uglifyjs2' => new \Assetic\Filter\UglifyJs2Filter('/usr/local/bin/uglifyjs'),
        'uglifycss' => new \Assetic\Filter\UglifyCssFilter('/usr/local/bin/uglifycss'),
        'cssmin' => new \Assetic\Filter\CssMinFilter(),
        'jsmin' => new \Assetic\Filter\JSMinFilter()
    );

    $compressor = new \Assetic\Asset\AssetCollection(array(
        /*new \Assetic\Asset\FileAsset($option['additional_path']),*/
        new \Assetic\Asset\GlobAsset($option['source_path']),
    ), array($filters[$option['filter']]));

    $compressor->setTargetPath(rtrim($option['dest_path'], '/'));

    $writer = new Assetic\AssetWriter('');


    $writer->writeAsset($compressor);
    exit;
}));

return require_once 'controllers.php';
