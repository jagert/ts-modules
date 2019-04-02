define(['angular', '../app'], function (angular, app) {
    'use strict';
    var module =  angular.module('app.report', []);
    module.register = app.register;
    return module;
});