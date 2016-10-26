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

    vm.createDept = createDept;
    vm.formToggle = formToggle;
    vm.setDept = setDept;

    if (!vm.department || !vm.role) {
      $state.go('login');
    }

    init();

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
    }

  }
})();