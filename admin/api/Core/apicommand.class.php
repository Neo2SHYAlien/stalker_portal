<?php
namespace stalker_portal\admin\api;

abstract class APICommand {

    public function execute(APIRequest $request) {

        return $this->doExecute($request);
    }

    abstract function doExecute(APIRequest $request);
}

?>