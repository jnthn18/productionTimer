(function() {
  'use strict';

  angular
    .module('app')
    .controller('Login.IndexController', Controller);

  function Controller($http, $state, $window) {
    var vm = this;

    vm.user = null;
    vm.password = null;

    vm.login = login;

    function login() {
      var data = {
        'username': vm.user,
        'password': vm.password
      }

      $http.post('api/index.php/login', data).then(function(resp) {
        if (resp.status == 202) {
          $window.localStorage.setItem("timerRole", resp.data.role);
          $window.localStorage.setItem("atDepartment", resp.data.department);
          $state.go('settings', { department: resp.data.department, role: resp.data.role });
        }
      });
    }
  }
})();