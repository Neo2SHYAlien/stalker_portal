<?php
namespace stalker_portal\admin\api;

class RESTRequest extends APIRequest {
    private $action;
    private $resource;
    private $agent;
    private $dependents = array();
    private $params = array();
    private $data;
    private $parent = '';
    private $content_type = array();

    public function __construct() {
        $this->init();
    }

    protected function init() {

        if (empty($_SERVER['REQUEST_METHOD'])) {
            throw new RESTRequestException("Empty request method");
        }

        if (empty($_GET['q'])) {
            throw new RESTRequestException("Empty resource");
        }

        $requested_uri = $_GET['q'];

        $params = explode("/", trim($requested_uri, '/'));

        if (count($params) == 0) {
            throw new RESTRequestException("Empty resource");
        }

        $this->resource = array_shift($params);

        $this->agent =(!empty($params)) ? array_shift($params): NULL;

        while(!empty($params)){
            $this->dependents[array_shift($params)] = array_shift($params);
        }

        $this->params = array_merge(array('limit' => 100, 'page' => 0), array_diff_key($_GET, array('q'=>'')));

        $method = strtolower($_SERVER['REQUEST_METHOD']);

        $methods_map = array(
            'get' => 'get',
            'post' => 'create',
            'put' => 'update',
            'delete' => 'delete'
        );

        if (empty($methods_map[$method])) {
            throw new RESTRequestException("Not supported method");
        }

        $this->action = $methods_map[$method];

        $this->setContentType();
        if (($ctype = $this->getContentType('multipart/form-data'))) {
            $boundary = !empty($ctype['boundary']) ? $ctype['boundary']: '--';
            $putdata = fopen("php://input", "r");
            $field_name = '';
            $skip = FALSE;
            while ($row = fgets($putdata)) {
                if (strpos($row, $boundary) === 0 || $row === PHP_EOL || $skip) {
                    if ($skip && trim($row) === '') {
                        $skip = FALSE;
                    }
                    continue;
                } elseif (preg_match("/^Content-Disposition.*\\bname\\=[\\'\"]([^\\'\"]*)/", $row, $find) && !empty($find)) {
                    $field_name = $find[1];
                    $this->data[$field_name] = '';
                    $skip = TRUE;
                    continue;
                } elseif (!empty($field_name)) {
                    $this->data[$field_name] .= $row;
                    $skip = FALSE;
                }
            }
            fclose($putdata);
        } else {
            parse_str(file_get_contents("php://input"), $this->data);
        }
    }

    public function getAction() {
        return $this->action;
    }

    public function getResource() {
        return $this->resource;
    }

    public function setResource($resource) {
        $this->resource = $resource;
    }

    public function getAgent() {
        return $this->agent;
    }

    public function setAgent($agent) {
        $this->agent = $agent;
    }

    public function getParams() {
        return $this->params;
    }

    public function getParent() {
        return $this->parent;
    }

    public function setParent($parent) {
        $this->parent .= $parent;
    }

    public function shiftDependents(){
        if (!empty($this->dependents)) {
            reset($this->dependents);
            list($dep_resource, $dep_agent) = each($this->dependents);
            $this->setParent('/' . $this->getResource() . '/' . $this->getAgent());
            $this->setResource($dep_resource);
            $this->setAgent($dep_agent);
        }
        return array_shift($this->dependents);
    }

    public function getAccept() {
        return empty($_SERVER['HTTP_ACCEPT']) ? 'application/json' : $_SERVER['HTTP_ACCEPT'];
    }

    public function getPut() {
        return $this->data;
    }

    public function getData($key = '') {

        if (!empty($key)) {
            if (!array_key_exists($key, $this->data)) {
                return null;
            }
            return $this->data[$key];
        }

        return $this->data;
    }

    private function parseMultipartData($data){

    }

    private function setContentType() {
        if (!empty($_SERVER['CONTENT_TYPE'])) {
            $parse_str = explode(', ', $_SERVER['CONTENT_TYPE']);
            while (($block = array_shift($parse_str))) {
                $parse_block = explode(';', $block);
                $type = trim(array_shift($parse_block));
                $sub_type = trim(array_shift($parse_block));
                if (!empty($sub_type) && strpos($sub_type, '=') !== FALSE) {
                    $sub_type_str = explode('=', $sub_type);
                    $sub_type = array(array_shift($sub_type_str) => array_shift($sub_type_str));
                }
                $this->content_type[$type] = $sub_type;
            }
        }
    }

    public function getContentType($key = NULL) {
        if (!empty($this->content_type)) {
            if ($key === NULL) {
                return $this->content_type;
            } elseif (array_key_exists($key, $this->content_type)) {
                return !empty($this->content_type[$key]) ? $this->content_type[$key]: TRUE;
            }
        }
        return FALSE;
    }
}

class RESTRequestException extends \Exception {
}
