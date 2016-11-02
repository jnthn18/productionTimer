(function() {
  'use strict';

  angular
    .module('app')
    .filter('millSecondsToTimeString', function() {
      return function (millseconds) {
        var oneSecond = 1000;
        var oneMinute = oneSecond * 60;
        var oneHour = oneMinute * 60;
        var oneDay = oneHour * 24;

        var seconds = Math.floor((millseconds % oneMinute) / oneSecond);
        var minutes = Math.floor((millseconds % oneHour) / oneMinute);
        var hours = Math.floor((millseconds % oneDay) / oneHour);
        var days = Math.floor(millseconds / oneDay);

        var timeString = '';
        if (days !== 0) {
            timeString += (days !== 1) ? (days + ' days ') : (days + ' day ');
        }
        if (hours !== 0) {
            timeString += (hours !== 1) ? (hours + ' hours ') : (hours + ' hour ');
        }
        if (minutes !== 0) {
            timeString += (minutes !== 1) ? (minutes + ' minutes ') : (minutes + ' minute ');
        }
        if (seconds !== 0 && minutes < 10 || millseconds < 1000) {
          timeString += (seconds !== 1) ? (seconds + ' seconds ') : (seconds + ' second ');
      }

        return timeString;
      };
    })
    .controller('Timer.IndexController', Controller);

  function Controller($interval, $scope, $http, $stateParams) {
    var vm = this;

    $scope.max = 100;

    $scope.departments = [];
    $scope.selectedDept = null;

    //5 min
    var cycle = 1 * 60 * 1000;
    var refreshBreaks = true;
    $scope.timer = cycle;

    $scope.progress = $scope.timer / cycle;

    $scope.date = new Date();
    $scope.currentTime = Date.now();
    $scope.startTime = $scope.date.setHours(9,30,0);
    $scope.endTime = $scope.date.setHours(19,0,0);

    $scope.message = '';
    $scope.workingHours = true;
    $scope.color = '#2ecc71';

    var breaksToday = [];
    var newBreaksToday = [];

    function updateTimer() {
      workStatus();

      $scope.timer = $scope.timer - 1000;
      $scope.progress = $scope.timer / cycle * 100;

      if ($scope.timer <= 0) {
        $scope.timer = cycle;
      }

      $scope.currentTime = Date.now();

      // check if break needs to be added
      angular.forEach(breaksToday, function(b) {
        b.startTime = new Date(b.startTime);
        b.startTime = new Date().setHours(b.startTime.getHours(), b.startTime.getMinutes(), 0);
        if ($scope.currentTime >= b.startTime && b.active == 1) {
          $scope.timer = $scope.timer + parseInt(b.addedTime, 10);
          b.active = 0;
        }
      });
      $scope.color = timerColor();
    }

    $scope.loadTimer = function() {
      breaksToday = [];
      $scope.currentTime = Date.now();
      
      //set some local variables
      var breaks = $scope.selectedDept.breaks;
      var settings = $scope.selectedDept.settings;

      //convert to local time
      settings.start = new Date(settings.start);
      settings.end = new Date(settings.end);
      cycle = parseInt(settings.cycle, 10);

      //get hours and minutes from start/end
      $scope.startTime = new Date().setHours(settings.start.getHours(), settings.start.getMinutes(), 0);
      $scope.endTime = new Date().setHours(settings.end.getHours(), settings.end.getMinutes(), 0);

      //calculate how far into the current cycle
      var diff = $scope.currentTime - $scope.startTime;

      updateBreaks();

      //check for breaks that will be applied today
      todaysBreaks(breaks, breaksToday);

      //check for any breaks that have occured and add time to diff
      angular.forEach(breaksToday, function(b) {
        b.startTime = new Date(b.startTime);
        b.startTime = new Date().setHours(b.startTime.getHours(), b.startTime.getMinutes(), 0);
        //make sure all breaks are active before being checked
        b.active = 1;
        if ($scope.currentTime >= b.startTime && b.active == 1) {
          diff = diff + parseInt(b.addedTime, 10);
          b.active = 0;
        }
      });

      var timeIntoCycle = diff % cycle;
      $scope.timer = cycle - timeIntoCycle;
      $scope.progress = $scope.timer / cycle;

      $scope.color = timerColor();
      workStatus();
    }

    function initialize() {
      $http.get('api/index.php/loadDepts').then(function(resp) {
        $scope.departments = resp.data;
        angular.forEach(resp.data, function (d) {
          if (d.settings.id == $stateParams.id) { $scope.selectedDept = d; }
        });
        $scope.loadTimer();
      });
    }

    function checkWeekly(b) {
      switch ($scope.date.getDay()) {
        case 1:
          return b.monday == "1" ? true : false;
          break;
        case 2:
          return b.tuesday == "1" ? true : false;
          break;
        case 3:
          return b.wednesday == "1" ? true : false;
          break;
        case 4:
          return b.thursday == "1" ? true : false;
          break;
        case 5:
          return b.friday == "1" ? true : false;
          break;
      }
    }

    function updateBreaks() {
      var afterHours = $scope.currentTime > $scope.endTime ? true : false;
      var beforeHours = $scope.currentTime < $scope.startTime ? true : false;

      var refreshCheck = new Date();
      
      //refresh all breaks at 6 am this removes deleted breaks
      if (refreshCheck.getHours == 6 && refreshCheck.getMinutes() == 0 && refreshBreaks == true) {
        breaksToday = [];
        refreshBreaks = false;
      }
      //next pass reset refreshBreaks
      if (refreshCheck.getHours == 6 && refreshCheck.getMinutes() > 0) {
        refreshBreaks = true;
      }
      $http.post('api/index.php/getBreaks', { department: $scope.selectedDept.settings.id }).then(function(resp) {
        var newBreaks = resp.data.breaks;
        newBreaksToday = [];

        todaysBreaks(newBreaks, newBreaksToday);

        // check breaksToday vs newBreaksToday
        angular.forEach(newBreaksToday, function(b) {
          var inArr = false;
          for (var i = 0; i < breaksToday.length; i++) {
            if (breaksToday[i].id === b.id) { inArr = true; }
          }
          //not in breaksToday so add it, timer will be updated next cycle
          if (!inArr) { breaksToday.push(b); }
        });

      });
    }

    function todaysBreaks(breaks, arr) {
      angular.forEach(breaks, function(b) {

        if (b.breakInterval == "weekly") {
          if (checkWeekly(b)) { arr.push(b) }
        } else if (b.breakInterval == "bi-weekly" || b.breakInterval == "monthly") {
          if (checkWeekly(b)) {
            if (checkActiveWeek(b)) { arr.push(b) }
          }
        } else {
          //this is scheduled dates
          b.startWeek = new Date(b.startWeek);
          if ($scope.date.getDate() == b.startWeek.getDate() && $scope.date.getMonth() == b.startWeek.getMonth() && $scope.date.getFullYear() == b.startWeek.getFullYear()) {
            arr.push(b);
          }

          //disable old dates
          if ($scope.date.getDate() > b.startWeek.getDate() && $scope.date.getMonth() >= b.startWeek.getMonth() && $scope.date.getFullYear() == b.startWeek.getFullYear() ) {
            $http.post('api/index.php/disableDate', { breakID: b.id }).then(function(resp) {
              if (resp.status == 202) { console.log("date disabled") }
            });
          }
        }
        
      });
    }

    function checkActiveWeek(b) {
      var week = 7 * 24 * 60 * 60 * 1000;
      var start = new Date(b.startWeek);

      var thisWeek = Date.parse($scope.date) - Date.parse(start);
      var weekComparison = null;
      b.timeInterval == "bi-weekly" ? weekComparison = 2 : weekComparison = 4;

      var activeWeek = Math.floor(thisWeek / week) % weekComparison;
      return thisWeek > 0 && activeWeek == 0 ? true : false;

    }

    function workStatus() {
      if (Date.now() < $scope.startTime) {
        $scope.message = "Get ready for a great day!";
        $scope.workingHours = false;
      } else if (Date.now() > $scope.endTime) {
        $scope.message = "Have a good night!";
        $scope.workingHours = false;
      } else {
        $scope.workingHours = true;
        $scope.message = null;
      }
    }

    function timerColor() {
      var percent = $scope.progress / 100;
      if (percent <= 0.15) {
        return '#e74c3c';
      } else if (percent > 0.15 && percent <= 0.5) {
        return '#f39c12';
      } else {
        return '#2ecc71';
      }
    }

    $interval(function() {
      updateTimer();
      $scope.date = new Date();
      // every 5 minutes get new breaks
      if ($scope.date.getMinutes() % 5 == 0 && $scope.date.getSeconds() < 2) {
        updateBreaks();
      }
    }, 1000);

    initialize();

  }
})();