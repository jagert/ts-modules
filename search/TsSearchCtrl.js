define(['./module'], function (module) {
    'use strict';
    module.controller('TsSearchCtrl', function($scope, $http, $rootScope, $q, $stateParams, $state, $translate, $window, $location, $log) {
        var setLoaderParams = function (params) {
            angular.forEach(params, function (value, key) {
                $scope.loaderParams[key] = value;
            });
        };

        $scope.repo = {selected: null};
        $scope.repositoryList = [];
        
        $scope.options = [{
            name: 'all',
            selected: false
        }, {
            name: 'trackstudio',
            selected: false
        }, {
            name: 'confluence',
            selected: false
        }, {
            name: 'mercurial',
            selected: false
        }];

        $scope.loaderParams = {};

        var selectOption = function (option) {
            _.each($scope.options, function (el) {
                if (el.selected) {
                    el.selected = false;
                }
            });

            option.selected = true;
            $scope.selectedOption = option;
        };

        var setQueryParam = function (name, value) {
            var params = $location.search();
            params[name] = value;

            $location.search(params);
        };

        var initScope = function (cb) {
            var queryParams = $location.search();
            $scope.searchExpression = queryParams.expression;
            
            if (queryParams.where === undefined || _.find($scope.options, function (el) { return el.name == queryParams.where }) === undefined) {
                selectOption($scope.options[0]);
            } else {
                selectOption(_.find($scope.options, function (el) { return el.name == queryParams.where }));
            }

            // if (queryParams.where != 'mercurial') {
            //     queryParams.repo = undefined;
            // }

            if (queryParams.repo !== undefined) {
                $scope.repo.selected = _.find($scope.repositoryList, function (item) { return item.id == queryParams.repo; });
            }

            cb && cb();
        };

        var performSearch = function () {
            if ($scope.searchExpression !== undefined && $scope.searchExpression !== null && 
                $scope.searchExpression != "" && (
                $scope.selectedOption.name != 'mercurial' || 
                $scope.selectedOption.name == 'mercurial' && $scope.repo.selected)) {

                // показываем результаты поиска только после первого запроса
                $scope.showResults = true;
                switch ($scope.selectedOption.name) {
                    case 'all':
                        $rootScope.$broadcast('refresh.search', 
                                              {data: {expression: $scope.searchExpression, repo: $scope.repo.selected ? $scope.repo.selected.id : null}, 
                                               refresh: {trackstudio: true, confluence: true, mercurial: true}});
                        break;
                    case 'trackstudio': 
                        $rootScope.$broadcast('refresh.search', 
                                              {data: {expression: $scope.searchExpression}, 
                                               refresh: {trackstudio: true}});
                        break;
                    case 'confluence':
                        $rootScope.$broadcast('refresh.search', 
                                              {data: {expression: $scope.searchExpression}, 
                                               refresh: {confluence: true}});
                        break; 
                    case 'mercurial':
                        $rootScope.$broadcast('refresh.search', 
                                              {data: {expression: $scope.searchExpression, repo: $scope.repo.selected ? $scope.repo.selected.id : null}, 
                                               refresh: {mercurial: true}});
                        break;
                    default:
                        null;
                        break; 
                }                
            }
        };

        $scope.$on('$locationChangeSuccess', function() {
            var queryParams = $location.search();

            // set local values from query params
            if (queryParams.expression !== $scope.searchExpression) {
                $scope.searchExpression = queryParams.expression;
            }

            if (queryParams.where === undefined || _.find($scope.options, function (el) { return el.name == queryParams.where }) === undefined) {
                selectOption($scope.options[0]);
            } else if (!$scope.selectedOption || queryParams.where !== $scope.selectedOption.name) {
                selectOption(_.find($scope.options, function (el) { return el.name == queryParams.where }));
            }

            if (queryParams.repo !== undefined && (!$scope.repo.selected || queryParams.repo !== $scope.repo.selected.id)) {
                $scope.repo.selected = _.find($scope.repositoryList, function (item) { return item.id == queryParams.repo; });
            }

            performSearch();
        });

        $scope.$watch('selectedOption', function () {
            if ($scope.selectedOption) {
                setQueryParam('where', $scope.selectedOption.name);
            }
        });

        $scope.$watch('repo.selected', function () {
            if ($scope.repo.selected) {
                setQueryParam('repo', $scope.repo.selected.id);
            }
        });

        $scope.submit = function () {
            setQueryParam('expression', $scope.searchExpression);
        };

        $scope.clickOption = function (option) {
            !option.selected && selectOption(option);
        };

        $scope.showHint = function () {
            // console.log('showHint');
        };

        $scope.getOptionName = function (optionName) {
            var sourceMap = {
                'all': $translate.instant('ALL_CONTENT'),
                'trackstudio': 'TrackStudio',
                'confluence': 'Confluence',
                'mercurial': 'Mercurial'
            };

            return sourceMap[optionName];
        };

        $scope.isShown = function (contentName) {
            if ($scope.selectedOption && ($scope.selectedOption.name == 'all' || $scope.selectedOption.name == contentName)) {
                return true;
            } else {
                return false;
            }
        };

        $scope.showSelect = function (option) {
            return option.name == 'mercurial' && option.selected;
        };

        // загрузка списка репозиториев
        setLoaderParams({status: true, placeholder: $translate.instant('SEARCH_PREPARING')});
        $http({
            method: 'GET',
            url: $rootScope.apiEndpoint + "/rest/search/hgrepos"
        }).then(function (res) {
            _.each(res.data, function (elem) {
                $scope.repositoryList.push({id: elem});
            });

            initScope(function () {
                performSearch();
            });

            setLoaderParams({status: false});
        }).catch(function (res) {
            $log.error('Cannot load hg repos: ', res.data);
            setLoaderParams({status: false, message: $translate.instant('ERROR_OCCURED') + res.data});
        });
    });
});