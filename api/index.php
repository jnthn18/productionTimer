<?php
require 'vendor/autoload.php';
use Zend\Config\Config;
use Zend\Config\Factory;

$app = new \Slim\App;

$app->post('/login', 'loginUser');
$app->post('/addDept', 'addDept');
$app->get('/allDept', 'allDept');
$app->post('/getDept', 'getDept');
$app->post('/addBreak', 'addBreak');
$app->post('/getBreaks', 'getBreaks');
$app->post('/deleteBreak', 'deleteBreak');
$app->post('/updateDept', 'updateDept');
$app->get('/loadDepts', 'loadDepts');
$app->post('/disableDate', 'disableDate');


$app->run();

function disableDate($request, $response) {
  $breakID = (int) $request->getParam('breakID');

  $sql = "DELETE FROM breaks WHERE id = :breakID";
  try {
    $db = getConnection();
    $stmt = $db->prepare($sql);
    $stmt->bindParam(":breakID", $breakID);
    $stmt->execute();
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
  }

  return $response->withStatus(202);
}

function loadDepts() {
  $sqlDepts = "SELECT * FROM settings";
  try {
    $db = getConnection();
    $stmt = $db->prepare($sqlDepts);
    $stmt->execute();
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
  }

  $resultsDept = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $allDepts = array();

  try{
    $sqlBreaks = "SELECT * FROM breaks WHERE department = :department && active = 1";

    $stmtBreaks = $db->prepare($sqlBreaks);
    foreach($resultsDept as $dept) {
      $stmtBreaks->bindParam(":department", $dept["id"]);
      $stmtBreaks->execute();

      $breaks = $stmtBreaks->fetchAll(PDO::FETCH_ASSOC);

      $fullDept = array("settings" => $dept, "breaks" => $breaks);

      array_push($allDepts, $fullDept);

    }
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
  }

  echo json_encode($allDepts);

}

function updateDept($request, $response) {
  $department = (int) $request->getParam('department');
  $startTime = $request->getParam('start');
  $endTime = $request->getParam('end');
  $cycle = $request->getParam('cycle');

  $sql = "UPDATE settings SET start = :start, cycle = :cycle, end = :end WHERE id = :department";
  try {
    $db = getConnection();
    $stmt = $db->prepare($sql);
    $stmt->bindParam(":department", $department);
    $stmt->bindParam(":cycle", $cycle);
    $stmt->bindParam(":start", $startTime);
    $stmt->bindParam(":end", $endTime);
    $stmt->execute();
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
    $response->withStatus(406);
  }

}

function deleteBreak($request, $response) {
  $breakID = (int) $request->getParam('breakID');

  $sql = "DELETE FROM breaks WHERE id = :breakID";
  try {
    $db = getConnection();
    $stmt = $db->prepare($sql);
    $stmt->bindParam(":breakID", $breakID);
    $stmt->execute();
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
  }

  return $response->withStatus(200);
}

function getBreaks($request, $response) {
  $department = (int) $request->getParam('department');

  $sql = "SELECT * FROM breaks WHERE department = :department AND active = 1";
  try {
    $db = getConnection();
    $stmt = $db->prepare($sql);
    $stmt->bindParam(":department", $department);
    $stmt->execute();
  } catch (PDOException $e) {
    echo json_encode($e->getMessage());
  }

  $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

  return $response->withJson(array("breaks" => $result), 200);
}

function addBreak($request, $response) {
  $department = $request->getParam('department');
  $startTime = $request->getParam('startTime');
  $addedTime = $request->getParam('breakTime');
  $interval = $request->getParam('interval');
  $days = $request->getParam('days');
  $startWeek = $request->getParam('startWeek');
  $monday = $days['monday'];
  $tuesday = $days['tuesday'];
  $wednesday = $days['wednesday'];
  $thursday = $days['thursday'];
  $friday = $days['friday'];

  $sql = "INSERT INTO breaks (department, startTime, addedTime, breakInterval, monday, tuesday, wednesday, thursday, friday, startWeek) VALUES (:department, :startTime, :addedTime, :breakInterval, :monday, :tuesday, :wednesday, :thursday, :friday, :startWeek)";
  try {
    $db = getConnection();
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':department', $department);
    $stmt->bindParam(':startTime', $startTime);
    $stmt->bindParam(':addedTime', $addedTime);
    $stmt->bindParam(':breakInterval', $interval);
    $stmt->bindParam(':monday', $monday);
    $stmt->bindParam(':tuesday', $tuesday);
    $stmt->bindParam(':wednesday', $wednesday);
    $stmt->bindParam(':thursday', $thursday);
    $stmt->bindParam(':friday', $friday);
    $stmt->bindParam(':startWeek', $startWeek);
    $stmt->execute();
  } catch (PDOException $e) {
    echo $e->getMessage();
    return $response->withStatus(406);
  }

  return $response->withStatus(202);
}

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