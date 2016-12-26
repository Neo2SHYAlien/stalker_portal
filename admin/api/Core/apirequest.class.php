<?php
namespace stalker_portal\admin\api;

abstract class APIRequest {
    abstract function getAction();

    abstract function getResource();

    abstract function shiftDependents();
}

?>