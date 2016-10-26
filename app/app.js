(function() {
  'use strict';

  angular
    .module('app', ['ui.router', 'angular-svg-round-progressbar'])
    .config(config);

  function config($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/views/timer.html',
        controller: 'Timer.IndexController'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'app/views/login.html',
        controller: 'Login.IndexController',
        controllerAs: 'vm'
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'app/views/settings.html',
        controller: 'Settings.IndexController',
        controllerAs: 'vm',
        params: { department: null, role: null }
      });
  }

})();