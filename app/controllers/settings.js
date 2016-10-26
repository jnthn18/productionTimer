(function() {
  'use strict';

  angular
    .module('app')
    .controller('Settings.IndexController', Controller);

  function Controller($stateParams, $window, $state, $http) {
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
    vm.addBreak = addBreak;
    vm.openDatePicker = openDatePicker;
    vm.deleteBreak = deleteBreak;

    if (!vm.department || !vm.role) {
      $state.go('login');
    }

    init();

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

      $http.post('api/deleteBreak', data).then(function(resp) {
        if (resp.status == 200) {
          $http.post('api/getBreaks', { department: vm.department }).then(function(resp) {
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

      if (checkDays()) {
        $http.post('api/addBreak', data).then(function(resp) {
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
        });
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
      
      $http.post('api/addDept', data).then(function(resp) {
        if (resp.status == 202) {
          formToggle(data);
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
        $http.get('api/allDept').then(function(resp) {
          vm.departments = resp.data;
          vm.selectedDept = vm.departments[0];
          setDept(vm.departments[0]);
        });
      } else {
        var data = {
          department: 2
        }
        $http.post('api/getDept', data).then(function(resp) {
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
      $http.post('api/getBreaks', { department: department.id }).then(function(resp) {
        vm.breaks = resp.data.breaks;
      });
    }

  }
})();