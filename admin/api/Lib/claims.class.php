<?php
namespace stalker_portal\admin\api\Lib;

use Stalker\Lib\Core\Config as Config;
use Stalker\Lib\Core\Mysql as Mysql;
use Stalker\Lib\Core\Cache;
use Stalker\Lib\Core\Stb;

class Claims extends LibBase{
    private static $instance = null;
    protected static $collection_fields = array(
        'id', 'media_type', 'media_id', 'type', 'uid', 'added'
    );

    protected static $exemplar_fields = array(
        'id', 'media_type', 'media_id', 'type', 'uid', 'added'
    );

    protected static $dependents = array();

    /**
     * @static
     * @return TvChannels
     */
    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new self;
        }
        return self::$instance;
    }

    public function __construct() {
        parent::__construct();
        $this->db = Mysql::getInstance();
    }

    public function getCollection(){
        $this->getClaims()->setApiLinks();
        return $this;
    }

    private function getClaims(){
        Mysql::getInstance()->from('media_claims_log');
        if ($this->request->getAgent()) {
            $fields = $this->request->getAction() == 'get' ? self::$exemplar_fields: array('id', 'type', 'media_id', 'media_type');
            $this->setQueryExemplarParams();
        } else {
            $fields = $this->request->getAction() == 'get' ? self::$collection_fields: array('id', 'type', 'media_id', 'media_type');
            $this->setQueryCollectionParams($fields);
            if (($parent = $this->getParentAgent())) {
                $media_type = '';
                switch ($parent['parent']) {
                    case 'tvchannels':{
                        $media_type = 'itv';
                        break;
                    }
                    case 'karaoke':{
                        $media_type = 'karaoke';
                        break;
                    }
                    case '':{
                        $media_type = 'vclub';
                        break;
                    }
                }
                Mysql::getInstance()->where(array('media_type' => $media_type));
                if (!empty($parent['id'])) {
                    Mysql::getInstance()->where(array('media_id' => $parent['id']));
                }
            }
        }

        Mysql::getInstance()->select($fields);
        $this->setResult(Mysql::getInstance()->get()->all());
        Mysql::getInstance()->reset();
        return $this;
    }

    public function deleteCollection(){
        $deleted = 0;
        if (($collection = $this->getClaims()->getResult())) {
            while(($exemplar = array_shift($collection))){
                $deleted += Mysql::getInstance()->delete('media_claims_log', array('id' => $exemplar['id']))->total_rows();
                if ($exemplar['type'] == 'video' || $exemplar['type'] == 'sound') {
                    $exemplar['type'] .= '_counter';
                }
                $parent_params = array('media_type' => $exemplar['media_type'], 'media_id' => $exemplar['media_id']);
                Mysql::getInstance()->update('media_claims', array($exemplar['type'] . ' = ' . $exemplar['type'] . ' - 1 and 1' => 1 ), $parent_params);
            }
            Mysql::getInstance()->delete('media_claims', array('sound_counter' => 0, 'video_counter' => 0, 'no_epg' => 0,'wrong_epg' =>0));
        }

        $this->setResult(array('deleted' => $deleted));

        return $this;
    }
}