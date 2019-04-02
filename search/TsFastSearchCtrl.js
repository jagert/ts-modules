define(['./module'], function (module) {
    'use strict';
    module.controller('TsFastSearchCtrl', function($scope, $http, $rootScope, $q, $translate, $state, $window) {
        var TRACKSTUDIO_RESULTS_COUNT = 10,
            CONFLUENCE_RESULTS_COUNT = 5;

        var canceller;

        var selectResult = function(step) {
            var selected = false;
            
            if ($scope.trackstudioUsersResults.length > 0 && !selected) {
                _.each($scope.trackstudioUsersResults, function (result, index) {
                    if (result.selected && !selected) {
                        if ((index == $scope.trackstudioUsersResults.length - 1) && (step > 0)) {
                            if ($scope.trackstudioTasksResults.length > 0) {
                                $scope.trackstudioTasksResults[0].selected = true;
                                selected = true;
                            } else if ($scope.confluenceResults.length > 0) {
                                $scope.confluenceResults[0].selected = true;
                                selected = true;
                            } else if (index != 0) {
                                $scope.trackstudioUsersResults[0].selected = true;
                                selected = true;
                            }
                        } else if ((index == 0) && (step < 0)) {
                            if ($scope.confluenceResults.length > 0) {
                                $scope.confluenceResults[$scope.confluenceResults.length - 1].selected = true;
                                selected = true;
                            } else if ($scope.trackstudioTasksResults.length > 0) {
                                $scope.confluenceResults[$scope.trackstudioTasksResults.length - 1].selected = true;
                                selected = true;
                            } else if ($scope.trackstudioUsersResults.length > 1) {
                                $scope.trackstudioUsersResults[0].selected = true;
                                selected = true;
                            }
                        } else {
                            $scope.trackstudioUsersResults[index].selected = false;
                            $scope.trackstudioUsersResults[index + step].selected = true;
                            selected = true;
                        }

                        if (selected) {
                            result.selected = false;
                        }
                    };
                });
            };
            if ($scope.trackstudioTasksResults.length > 0 && !selected) {
                _.each($scope.trackstudioTasksResults, function (result, index) {
                    if (result.selected && !selected) {
                        if ((index == $scope.trackstudioTasksResults.length - 1) && (step > 0)) {
                            if ($scope.confluenceResults.length > 0) {
                                $scope.confluenceResults[0].selected = true;
                                selected = true;
                            } else if ($scope.trackstudioUsersResults.length > 0) {
                                $scope.trackstudioUsersResults[0].selected = true;
                                selected = true;
                            } else if (index != 0) {
                                $scope.trackstudioTasksResults[0].selected = true;
                                selected = true;
                            }
                        } else if ((index == 0) && (step < 0)) {
                            if ($scope.trackstudioUsersResults.length > 0) {
                                $scope.trackstudioUsersResults[$scope.trackstudioUsersResults.length - 1].selected = true;
                                selected = true;
                            } else if ($scope.confluenceResults.length > 0) {
                                $scope.confluenceResults[$scope.confluenceResults.length - 1].selected = true;
                                selected = true;
                            } else if ($scope.trackstudioTasksResults.length > 1) {
                                $scope.trackstudioTasksResults[$scope.trackstudioTasksResults.length - 1].selected = true;
                                selected = true;
                            }
                        } else {
                            $scope.trackstudioTasksResults[index].selected = false;
                            $scope.trackstudioTasksResults[index + step].selected = true;
                            selected = true;
                        }

                        if (selected) {
                            result.selected = false;
                        }
                    };
                });
            };
            if ($scope.confluenceResults.length > 0 && !selected) {
                _.each($scope.confluenceResults, function (result, index) {
                    if (result.selected && !selected) {
                        if ((index == $scope.confluenceResults.length - 1) && (step > 0)) {
                            if ($scope.trackstudioUsersResults.length > 0) {
                                $scope.trackstudioUsersResults[0].selected = true;
                                selected = true;
                            } else if ($scope.trackstudioTasksResults.length > 0) {
                                $scope.trackstudioTasksResults[0].selected = true;
                                selected = true;
                            } else if (index != 0) {
                                $scope.confluenceResults[0].selected = true;
                                selected = true;
                            }
                        } else if ((index == 0) && (step < 0)) {
                            if ($scope.trackstudioTasksResults.length > 0) {
                                $scope.trackstudioTasksResults[$scope.trackstudioTasksResults.length - 1].selected = true;
                                selected = true;
                            } else if ($scope.trackstudioUsersResults.length > 0) {
                                $scope.trackstudioUsersResults[$scope.trackstudioUsersResults.length - 1].selected = true;
                                selected = true;
                            } else if ($scope.confluenceResults.length > 1) {
                                $scope.confluenceResults[$scope.confluenceResults.length - 1].selected = true;
                                selected = true;
                            }
                        } else {
                            $scope.confluenceResults[index].selected = false;
                            $scope.confluenceResults[index + step].selected = true;
                            selected = true;
                        }

                        if (selected) {
                            result.selected = false;
                        }  
                    };
                });
            };

            if (!selected) {
                if ($scope.trackstudioUsersResults.length > 0) {
                    $scope.trackstudioUsersResults[0].selected = true;
                } else if ($scope.trackstudioTasksResults.length > 0) {
                    $scope.trackstudioTasksResults[0].selected = true;
                } else if ($scope.confluenceResults.length > 0) {
                    $scope.confluenceResults[0].selected = true;
                }
            }
        };

        $scope.searchExpression = "";
        
        $scope.loadingResults = false;
        $scope.loadedResults = [];
        $scope.showResults = false;

        $scope.trackstudioUsersResults = [];
        $scope.trackstudioTasksResults = [];
        $scope.confluenceResults = [];

        $scope.refreshHandler = function (term) {
            if (canceller) {
                canceller.resolve({cancel: true});
            }
            
            canceller = $q.defer();

            $scope.loadedResults = [];
            if (!term) {
                $scope.trackstudioUsersResults = [];
                $scope.trackstudioTasksResults = [];
                $scope.confluenceResults = [];
                return $scope.loadedResults;
            }

            if (!isNaN(parseInt(term)) && angular.isNumber(parseInt(term))) {
                $scope.loadingResults = true;
                $http({
                    method: 'GET',
                    url: $rootScope.apiEndpoint + "/rest/task/info/" + parseInt(term) + "/context",
                    timeout: canceller.promise
                }).then(function (data) {
                    $scope.loadingResults = false;
                    $scope.loadedResults.unshift({
                        type: 'goto-task',
                        group: 'TASKS',
                        title: 'Перейти к задаче #'+parseInt(term),
                        value: parseInt(term),
                        link: $state.href("top.task.view", {taskNumber: parseInt(term)}, {inherit: false})
                    });
                }, function(res) {
                    // прекращаем показывать loading, если этот запрос был не отменен
                    if (res.config.timeout && res.config.timeout.$$state.status == 0) {
                        $scope.loadingResults = false;
                    }
                });
            }

            $scope.loadedResults.push({
                type: 'search-trackstudio',
                group: 'SEARCH',
                title: 'Искать в TrackStudio "'+ term + '"',
                link: $state.href("top.search", {where: "trackstudio", expression: term}, {inherit: false}),
                value: term
            });

            $scope.loadedResults.push({
                type: 'search-confluence',
                group: 'SEARCH',
                title: 'Искать в Confluence "'+ term + '"',
                link: $state.href("top.search", {where: "confluence", expression: term}, {inherit: false}),
                value: term
            });

            if (term && term.length > 3) {
                $http.get($rootScope.apiEndpoint + "/rest/user/all/search?term=" + term).success(function (data) {
                    _.each(data, function(user) {
                        $scope.loadedResults.push({
                            type: 'goto-user',
                            group: 'USERS',
                            title: 'Перейти к пользователю ' + user.name +' '+ '@'+ user.login + '&nbsp;<a href="'+$state.href("top.user.view", {username: user.login}, {inherit: false})+'" target="_blank"><span class="glyphicon glyphicon-new-window"></span></a>',
                            link: $state.href("top.user.view", {username: user.login}, {inherit: false}),
                            value: user.login
                        });
                    })
                });
            }

            return $scope.loadedResults;
        };

        $scope.$watch("searchExpression", function(val) {
            $scope.refreshHandler(val);
        });

        $scope.$on('globalSearchTypeahead.select', function(evt, value, index, $typeahead) {
            console.log(evt);
            var term = value.value;
            $scope.searchExpression = "";
            switch (value.type) {
                case 'goto-task':
                    $state.go("top.task.view", {taskNumber: parseInt(term)}, {inherit: false, reload: true});
                    break;
                case 'goto-user':
                    $state.go("top.user.view", {username: value.value}, {inherit: false, reload: true});
                    break;
                case 'search-trackstudio':
                    $state.go("top.search", {where: "trackstudio", expression: term}, {inherit: false, reload: true});
                    break;
                case 'search-confluence':
                    $state.go("top.search", {where: "confluence", expression: term}, {inherit: false, reload: true});
                    break;
            }
        });

    });
});