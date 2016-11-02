(function() {
  'use strict';

  angular
    .module('app')
    .controller('Settings.IndexController', Controller);

  function Controller($stateParams, $window, $state, $http, $timeout) {
    var vm = this;

    vm.department = $stateParams.department || $window.localStorage.getItem('atDepartment');
    vm.role = $stateParams.role || $window.localStorage.getItem('timerRole');

    vm.departmentName = null;
    vm.startTime = null;
    vm.endTime = null;
    vm.cycle = null;
    vm.admin = true;
    vm.addDept = false;
    vm.departments = [];
    vm.selectedDept = null;
    vm.submitted = false;
    vm.breaks = [];
    vm.updateSuccess = false;
    vm.notMonday = false;

    //for adding breaks
    vm.breakStart = null;
    vm.breakTime = null;
    vm.selectedInterval = "weekly";
    vm.checkboxDays = {
      monday : false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false
    };
    vm.breakStartDate = null;
    vm.popup = {
      opened: false
    };

    vm.createDept = createDept;
    vm.formToggle = formToggle;
    vm.setDept = setDept;
    vm.updateDept = updateDept;
    vm.addBreak = addBreak;
    vm.openDatePicker = openDatePicker;
    vm.deleteBreak = deleteBreak;
    vm.checkActiveWeek = checkActiveWeek;
    vm.weekRemainder = weekRemainder;

    if (!vm.department || !vm.role) {
      $state.go('login');
    }

    init();

    function updateDept() {
      var cycleTime = vm.cycle * 60 * 1000;

      var data = {
        department: vm.department,
        start: vm.startTime,
        end: vm.endTime,
        cycle: cycleTime
      }

      $http.post('api/index.php/updateDept', data).then(function(resp) {
        if (resp.status == 200) {
          vm.updateSuccess = true;
          $timeout(function() {
            vm.updateSuccess = false
          }, 1500);
        }
      });

    }

    function checkDays() {
      if (vm.checkboxDays.monday == true || vm.checkboxDays.tuesday == true || vm.checkboxDays.wednesday == true || vm.checkboxDays.thursday == true || vm.checkboxDays.friday == true) {
        return true;
      } else {
        return false;
      }
    }

    function deleteBreak(id) {
      var data = {
        breakID: id
      };

      $http.post('api/index.php/deleteBreak', data).then(function(resp) {
        if (resp.status == 200) {
          $http.post('api/index.php/getBreaks', { department: vm.department }).then(function(resp) {
            vm.breaks = resp.data.breaks;
          });
        }
      });
    }

    function openDatePicker() {
      vm.popup.opened = true;
    }

    function addBreak() {
      //convert minutes to milliseconds
      var breakTime = vm.breakTime * 60 * 1000;
      vm.submitted = true;

      var data = {
        startTime: vm.breakStart,
        breakTime: breakTime,
        days: vm.checkboxDays,
        department: vm.department,
        interval: vm.selectedInterval,
        startWeek: vm.selectedInterval == 'weekly' ? null : vm.breakStartDate
      }

      if ( data.startWeek == null ) {
        var mondayCheck = true;
      } else {
        var mondayCheck = vm.breakStartDate.getDay() == 1 ? true : false;
      }

      if (checkDays() && mondayCheck || vm.selectedInterval == 'date') {
        vm.notMonday = false;
        $http.post('api/index.php/addBreak', data).then(function(resp) {
          if (resp.status == 202) {
            vm.submitted = false;
            vm.breakStart = null;
            vm.breakTime = null;
            vm.checkboxDays = {
              monday : false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false
            };
            vm.selectedInterval = 'weekly';
            vm.breakStartDate = null;
          }
          $http.post('api/index.php/getBreaks', { department: vm.selectedDept.id }).then(function(resp) {
            vm.breaks = resp.data.breaks;
          });
        });
      } else {
        if (!mondayCheck) {
          vm.notMonday = true;
        }
      }
    }

    function createDept() {
      //convert minutes to milliseconds
      var cycleTime = vm.cycle * 60 * 1000;

      var data = {
        name: vm.departmentName,
        start: vm.startTime,
        end: vm.endTime,
        cycle: cycleTime
      }
      
      $http.post('api/index.php/addDept', data).then(function(resp) {
        if (resp.status == 202) {
          formToggle(data);
          $http.get('api/index.php/allDept').then(function(resp) {
            //set to newest department
            vm.departments = resp.data;
            vm.selectedDept = vm.departments[vm.departments.length-1];
            setDept(vm.departments[vm.departments.length-1]);
          });
        } else {
          console.log("check error");
        }
      });
    }

    function formToggle() {
      if (vm.addDept) {
        vm.startTime = null;
        vm.endTime = null;
        vm.cycle = null;
        vm.departmentName = null;
      } else {
        setDept(vm.departments[0]);
      }
    }

    function init() {

      if (vm.role == 1) {
        vm.admin = true;
        $http.get('api/index.php/allDept').then(function(resp) {
          vm.departments = resp.data;
          vm.selectedDept = vm.departments[0];
          setDept(vm.departments[0]);
        });
      } else {
        var data = {
          department: 2
        }
        $http.post('api/index.php/getDept', data).then(function(resp) {
          var department = resp.data.department;
          vm.departments[0] = department;
          setDept(department);
        });
      }
    }

    function setDept(department) {
      vm.startTime = new Date(department.start);
      vm.endTime = new Date(department.end);
      vm.cycle = department.cycle / 60 / 1000;
      vm.departmentName = department.name;
      vm.department = department.id;
      $http.post('api/index.php/getBreaks', { department: department.id }).then(function(resp) {
        vm.breaks = resp.data.breaks;
      });
    }

    function checkActiveWeek(b) {
      var week = 7 * 24 * 60 * 60 * 1000;
      var currentDate = new Date();
      if (b.breakInterval == "bi-weekly" || b.breakInterval == "monthly") {
        var start = new Date(b.startWeek);

        var thisWeek = Date.parse(currentDate) - Date.parse(start);
        var weekComparison = null;
        b.timeInterval == "bi-weekly" ? weekComparison = 2 : weekComparison = 4;

        var activeWeek = Math.floor(thisWeek / week) % weekComparison;
        return thisWeek > 0 && activeWeek == 0 ? 'text-success' : 'text-danger';
      } else {
        return "";
      }
    }

    function weekRemainder(b) {
      var week = 7 * 24 * 60 * 60 * 1000;
      var currentDate = new Date();
      if (b.breakInterval == "bi-weekly" || b.breakInterval == "monthly") {
        var start = new Date(b.startWeek);

        var thisWeek = Date.parse(currentDate) - Date.parse(start);
        var weekComparison = null;
        b.timeInterval == "bi-weekly" ? weekComparison = 2 : weekComparison = 4;

        var activeWeek = Math.floor(thisWeek / week) % weekComparison;
        return activeWeek == 0 ? "" : activeWeek;
      } else {
        return "";
      }
    }

  }
})();