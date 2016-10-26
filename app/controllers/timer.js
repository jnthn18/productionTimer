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

  function Controller($interval, $scope) {
    var vm = this;

    $scope.max = 100;

    //5 min
    var cycle = 35 * 60 * 1000;

    $scope.timer = cycle;

    $scope.progress = $scope.timer / cycle;

    $scope.date = new Date();
    $scope.currentTime = Date.now();
    $scope.startTime = $scope.date.setHours(9,30,0);
    $scope.endTime = $scope.date.setHours(19,0,0);
    $scope.message = '';
    $scope.workingHours = true;
    $scope.color = '#2ecc71';

    var break1 = {
      startTime: $scope.date.setHours(14,38,55),
      addedTime: 4.5 * 60 * 1000,
      active: 1
    }

    var break2 = {
      startTime: $scope.date.setHours(16,40,25),
      addedTime: 30 * 1000,
      active: 1
    }

    var breaks = [break1, break2];

    function updateTimer() {
      workStatus();

      $scope.timer = $scope.timer - 1000;
      $scope.progress = $scope.timer / cycle * 100;

      if ($scope.timer <= 0) {
        $scope.timer = cycle;
      }

      $scope.currentTime = Date.now();

      // check if break needs to be added
      angular.forEach(breaks, function(b) {
        if (Date.now() >= b.startTime && b.active == 1) {
          $scope.timer = $scope.timer + b.addedTime;
          b.active = 0;
        }
      });
      $scope.color = timerColor();
    }

    function initialize() {
      //calculate how far into the current cycle
      var diff = $scope.currentTime - $scope.startTime;

      //check for any breaks that have occured and add time to diff
      angular.forEach(breaks, function(b) {
        if (Date.now() >= b.startTime && b.active == 1) {
          diff = diff + b.addedTime;
          b.active = 0;
        }
      });

      var timeIntoCycle = diff % cycle;
      $scope.timer = $scope.timer - timeIntoCycle;

      $scope.color = timerColor();
      workStatus();
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
    }, 1000);

    initialize();

  }
})();