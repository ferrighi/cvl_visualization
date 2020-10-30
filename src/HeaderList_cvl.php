<?php

namespace Drupal\cvl_visualization;
use GuzzleHttp\Exception\RequestException;

/**
 * should be moved out to its own file
 */
class HeaderList_cvl {

    private $headers;
    private $response_code;
    private $linebreak;

    public function __construct($headers = array(), $linebreak = "\n") {

        $this->linebreak = $linebreak;

        $this->headers = $headers;

        if (is_string($this->headers)) {

            $this->parse_headers_string();
        }
    }

    public function to_s() {

        $headers = '';

        foreach ($this->headers as $header => $value) {

            $headers .= "$header: $value{$this->linebreak}";
        }

        return $headers;
    }

    public function to_a() {

        return $this->headers;
    }

    public function __toString() {

        return $this->to_s();
    }

    public function add($headers) {

        $this->headers = array_merge($this->headers, $headers);
    }

    public function get($header) {

        return $this->headers[$header];
    }

    public function get_response_code() {

        return $this->response_code;
    }

    private function parse_headers_string() {

        $replace = ($this->linebreak == "\n" ? "\r\n" : "\n");

        $headers = str_replace($replace, $this->linebreak, trim($this->headers));

        $headers = explode($this->linebreak, $headers);

        $this->headers = array();

        if (preg_match('/^HTTP\/\d\.\d (\d{3})/', $headers[0], $matches)) {

            $this->response_code = $matches[1];

            array_shift($headers);
        }

        foreach ($headers as $string) {

            list($header, $value) = explode(': ', $string, 2);

            $this->headers[$header] = $value;
        }
    }

}
