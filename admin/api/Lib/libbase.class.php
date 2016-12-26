<?php
namespace stalker_portal\admin\api\Lib;

use stalker_portal\admin\api\RESTRequest;
use Stalker\Lib\Core\Mysql as Mysql;
use Stalker\Lib\Core\Config as Config;

class LibBase {

    private $result;
    protected $request;
    protected static $collection_fields = array();
    protected static $exemplar_fields = array();
    protected static $dependents = array();

    public function __construct() {

    }

    public function setRequest(RESTRequest $request) {
        $this->request = $request;
        return $this;
    }

    public function getResult() {
        return $this->result;
    }

    protected function setResult(Array $result) {
        $this->result = $result;
    }

    protected function getParentAgent() {
        if ($this->request && ($parent = $this->request->getParent())) {
            $parent = explode('/', trim($parent, '/'));
            $id = $name = NULL;
            while (!empty($parent)) {
                $name = array_shift($parent);
                $id = array_shift($parent);
                if (($name || $id) && empty($parent)) {
                    return array(
                        'id' => $id,
                        'parent' => $name
                    );
                }
            }
        }
        return array();
    }

    protected function setQueryCollectionParams($fields) {
        $params = $this->request->getParams();

        if (!empty($params['searchby']) && in_array($params['searchby'], $fields)) {
            Mysql::getInstance()->where(array($params['searchby'] => array_key_exists('search', $params) ? $params['search'] : NULL));
        }

        if (!empty($params['orderby']) && in_array($params['orderby'], $fields)) {
            Mysql::getInstance()->orderby($params['orderby'], !empty($params['orderdir']) && in_array($params['orderdir'], array(
                'ASC',
                'DESC'
            )) ? $params['orderdir'] : NULL);
        }

        if (intval($params['limit'])) {
            Mysql::getInstance()->limit($params['limit'], $params['limit'] * $params['page']);
        }
    }

    protected function setQueryExemplarParams() {
        Mysql::getInstance()->where(array('id' => $this->request->getAgent()))->limit(1);
    }

    public static function getDependents(){
        return property_exists(__CLASS__, 'dependents') ? self::dependents: array();
    }

    protected function setApiLinks(Array $dependents = array()){
        $base_url = Config::get('portal_url') . 'admin/api/';
        $parent_url = $base_url . ($this->request->getParent() ? trim($this->request->getParent(), '/') . '/' : '') . trim($this->request->getResource(), '/');
        $self_url = $base_url . trim($this->request->getResource(), '/');
        $agent = trim($this->request->getAgent(), '/');
        $this->setResult(array_map(function($row) use ($parent_url, $self_url, $agent, $dependents){
            $self_url .= rtrim('/' . (!array_key_exists('id', $row) ? $agent: $row['id']));
            $row['api_links'] = array(
                'self_url' => $self_url,
                'parent_url' => $parent_url,
                'dependents' => array_combine($dependents, array_map(function($row_2) use ($self_url){
                    return $self_url . '/' . $row_2;
                }, $dependents))
            );

            return $row;
        }, $this->getResult()));
        return $this;
    }

}