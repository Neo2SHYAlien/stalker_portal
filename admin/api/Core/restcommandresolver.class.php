<?php
namespace stalker_portal\admin\api;

class RESTCommandResolver {

    public function __construct() {
    }

    /**
     * @throws RESTCommandResolverException
     * @param RESTRequest $request
     * @return RESTCommand
     */
    public function getCommand(RESTRequest $request) {
        while($request->shiftDependents()){}
        $resource = implode("", array_map(function ($part) {
            return ucfirst($part);
        }, explode('_', $request->getResource())));

        $class = __NAMESPACE__ . '\RESTCommand' . ucfirst($resource);

        if (!class_exists($class)) {
            throw new RESTCommandResolverException('Resource "' . $resource . '" does not exist ' . $class);
        }

        return new $class;
    }
}

class RESTCommandResolverException extends \Exception {
}

?>