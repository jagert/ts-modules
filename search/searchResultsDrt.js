define(['./module'], function (module) {
	'use strict',
	module.directive('searchResults', function ($http, $rootScope, $log, $translate, $q, $window, $state) {
		return {
			restrict: 'E',
			templateUrl: $rootScope.baseUrl + '/search/searchResults.tpl.html',
            replace: true,
			scope: {
				type: '='
			},
			controller: function ($scope) {
				var canceller;

				var RESULTS_ON_PAGE = 100;
        
        		var setLoaderParams = function (params) {
					angular.forEach(params, function (value, key) {
		                $scope.loaderParams[key] = value;
					});
				};

				$scope.loaderParams = {};
				$scope.resultsOnPage = RESULTS_ON_PAGE;
        		$scope.searchResults = {currentPage: 1, data: []};

				var searchPromise = function (params, canceller) {
		            var deferred = $q.defer();

		            var sourceMap = {
		                'trackstudio': 'trackstudio',
		                'confluence': 'confluence',
		                'mercurial': 'hg'
		            };

		            var requestParams = {};

		            requestParams.source = sourceMap[params.where];
		            requestParams.repo = params.repo ? params.repo : null;
		            requestParams.start = (params.page -1) * RESULTS_ON_PAGE;
		            requestParams.expression = params.expression;

		            $http({
		                method: 'GET',
		                url: $rootScope.apiEndpoint + "/rest/search/" + requestParams.source + "?repo=" + $window.encodeURIComponent(requestParams.repo) + "&start=" + requestParams.start + "&limit=" + RESULTS_ON_PAGE + "&keyword=" + params.expression,
		                timeout: canceller.promise
		            }).then(function (res) {
		                deferred.resolve(res.data);
		            }).catch(function (res) {
		                deferred.reject(res.data);
		            });

		            return deferred.promise;
		        };

				var search = function (params) {
		            if (canceller) {
		                canceller.resolve("Cancel prev loading");
		            }
		            
		            canceller = $q.defer();
		                        
		            var searchParams = {
		                expression: $scope.expression,
		                page: $scope.searchResults.currentPage,
		                where: $scope.type,
		                repo: $scope.repo
		            };

		            // обнуляем результаты при смене типа
		            if (params.refresh) {
		            	$scope.searchResults.data = [];
		            }

		            // сохранить $scope.searchExpression на случай пустых результатов
		            $scope.searchResults.expression = $scope.expression;
		            
		            // скроллим к тайтлу результатов
		            $scope.isScrollTo = params.refresh != true;

		            // показываем loader
		            setLoaderParams({status: true, placeholder: $translate.instant('SEARCHING')});

		            searchPromise(searchParams, canceller)
		                .then(function (data) {
		                    if ($scope.type == 'trackstudio') { 
			                    _.each(data.data, function (elem) {
			                        if (elem.id.indexOf('u-') == -1) {
			                            elem.link = $state.href("top.task.view", {taskNumber: elem.value})
			                        } else {
			                            elem.link = $state.href("top.user.view", {username: elem.value})
			                        }

			                        // if (elem.description.length > 256) {
			                        //     elem.showFull = false;
			                        // }
			                    });
		                    }
		                    
		                    $scope.searchResults.data = data.data;
		                    $scope.searchResults.total = data.total;

		                    setLoaderParams({status: false});
		                })
		                .catch(function (data) {
		                    setLoaderParams({status: false, message: data ? data : null});
		                })
		        }

        		$scope.getResultsType = function () {
		            var sourceMap = {
		                'trackstudio': 'TrackStudio',
		                'confluence': 'Confluence',
		                'mercurial': 'Mercurial'
		            };

		            return sourceMap[$scope.type];
		        };

				$scope.toggleDescription = function (element) {
		            element.showFull = !element.showFull;
		        };

		        $scope.isToLong = function (string) {
		            return string.length > 256;
		        };

				$scope.changePage = function () {
					search({});
				};

		        $scope.$on('refresh.search', function ($event, data) {
					$scope.expression = data.data.expression;
					$scope.repo = data.data.repo;

					data.refresh[$scope.type] && search({refresh: true});
				});
			}
		};
	});
});