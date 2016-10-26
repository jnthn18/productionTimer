<?php
require 'vendor/autoload.php';
use Zend\Config\Config;
use Zend\Config\Factory;

$app = new \Slim\App;

$app->post('/login', 'loginUser');
$app->post('/addDept', 'addDept');
$app->get('/allDept', 'allDept');
$app->post('/getDept', 'getDept');

$app->run();

function getDept($request, $response) {
  $department = (int) $request->getParam('department');

  $sql = "SELECT * FROM settings WHERE id = :department";
  try {
    $db = getConnection();
    $stmt = $db->prepare($sql);
    $stmt->bindParam(":department", $department);
    $stmt->execute();
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
  }

  $result = $stmt->fetch(PDO::FETCH_ASSOC);

  return $response->withJson(array("department" => $result), 200);
}

function allDept() {
  $sql = "SELECT * FROM settings";

  try {
    $db = getConnection();
    $stmt = $db->prepare($sql);
    $stmt->execute();
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
  }

  $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($results);
}

function addDept($request, $response) {
  $name = $request->getParam('name');
  $startTime = $request->getParam('start');
  $endTime = $request->getParam('end');
  $cycle = $request->getParam('cycle');

  $sql = "INSERT INTO settings (cycle, start, end, name) VALUES (:cycle, :startTime, :endTime, :name)";

  try {
    $db = getConnection();
    $stmt = $db->prepare($sql);
    $stmt->bindParam(":cycle", $cycle);
    $stmt->bindParam(":startTime", $startTime);
    $stmt->bindParam(":endTime", $endTime);
    $stmt->bindParam(":name", $name);
    $stmt->execute();
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
  }

  return $response->withStatus(202);
}

function loginUser($request, $response) {
  $username = $request->getParam('username');
  $password = $request->getParam('password');

  $sql = "SELECT * FROM users WHERE username = :username";
  try {
    $db = getConnection();
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':username', $username);
    $stmt->execute();
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
  }

  if ($stmt->rowCount() > 0) {
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    return $response->withJson(array("role" => $result['role'], "department" => $result['department']), 202);
  } else {
    return $response->withStatus(401);
  }
  
}

function getConnection() {
  $config = Factory::fromFile('config.php', true);
  $db = $config->get('database')->get('params');
  $dbh = new PDO("mysql:host=$db[host];dbname=$db[dbname]", $db['username'], $db['password']);
  $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  return $dbh;
}
?>