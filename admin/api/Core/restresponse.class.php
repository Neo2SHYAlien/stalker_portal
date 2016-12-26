<?php
namespace stalker_portal\admin\api;

class RESTResponse {

    protected $body = array(
        'status' => 'OK',
        'results' => ''
    );
    /** @var  RESTRequest */
    private $request;
    private $content_type = 'application/json';

    public function __construct() {
        ob_start();
    }

    public function setError($text) {
        $this->body['error'] = $text;
        $this->body['status'] = 'ERROR';
    }

    public function setBody($body) {
        $this->body['results'] = $body;
    }

    private function setOutput() {
        $output = ob_get_contents();
        ob_end_clean();
        if ($output) {
            $this->body['output'] = $output;
        }
        $this->body['params'] = $this->request->getParams();
    }

    public function setRequest($request) {
        $this->request = $request;
    }

    public function sendAuthRequest() {
        header('WWW-Authenticate: Basic realm="Stalker API"');
        header($_SERVER['SERVER_PROTOCOL'] . ' 401 Unauthorized');
        $this->setError("401 Unauthorized request");
        $this->send();
        exit;
    }

    public function setContentType($content_type) {
        $this->content_type = $content_type;
    }

    public function send() {

        header("Content-Type: " . $this->content_type);

        $this->setOutput();
        $response = json_encode($this->body);
        echo $response;
        ob_end_flush();

    }
}