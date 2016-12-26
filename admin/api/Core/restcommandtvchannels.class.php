<?php
namespace stalker_portal\admin\api;

use Stalker\Lib\Core\Mysql;
use stalker_portal\admin\api\Lib\TvChannels as TvChannels;

class RESTCommandTvchannels extends RESTCommand {
    private $manager;

    public function __construct() {
        $this->manager = TvChannels::getInstance();
    }

    public function get(RESTRequest $request) {
        return $this->manager->setRequest($request)->getCollection()->getResult();
    }

    public function create(RESTRequest $request) {

        $data = $request->getData();

        if (empty($data)) {
            throw new RESTCommandException('HTTP POST data is empty');
        }

        $data['modified'] = date("Y-m-d H:i:s");
        $data['base_ch'] = 1;
        $data['cmd'] = $url = $data['url'];
        unset ($data['url']);

        Mysql::getInstance()->delete('ch_links', array('ch_id' => $data['id']));

        $link = array(
            'ch_id' => $data['id'],
            'url' => $url,
            'status' => $data['status']
        );
        Mysql::getInstance()->insert('ch_links', $link);
        return Mysql::getInstance()->insert('itv', $data)->insert_id();
    }

    public function delete(RESTRequest $request) {
        return $this->manager->setRequest($request)->deleteCollection()->getResult();
    }

    public function update(RESTRequest $request) {

        $put = $request->getPut();

        if (empty($put)) {
            throw new RESTCommandException('HTTP PUT data is empty');
        }

        return $this->manager->setRequest($request)->updateCollection()->getResult();
    }
}

?>