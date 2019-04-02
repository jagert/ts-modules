define(['./module'], function (module) {
    'use strict';
    module.register.controller('ReportCtrl', function ($scope, $http, $rootScope, $q, $stateParams, $window, $modal, $log, $interval, ReportData, ReportConfig, FilterResource) {
        var setLoading = function(params, type) {
            angular.forEach(params, function (value, key) {
                $scope.loaderParams[type][key] = value;
            });
        };

        var loadData = function () {
            setLoading({status: true}, 'report');
            ReportData.get({report: $stateParams.reportId, taskNumber: $stateParams.taskNumber}, function (report) {
                setLoading({status: true}, 'filter');
                FilterResource.get({filterId: report.filter.id}, function (filter) {
                    report.filter = filter;
                    $scope.report = report;
                    setLoading({status: false}, 'filter');

                    ReportConfig.getValues({taskNumber: $stateParams.taskNumber}).then(function (values) {
                        _.each($scope.report.parameters, function (param, key) {
                            if (typeof _.first(values[key]) === 'object') {
                                $scope.report.parameters[key] = _.find(values[key], function (value) { return param == value.key; });
                            }
                        });
                    });
                });

                // TODO: Нужны базовые настройки формирования отчета
                // report.format = (report.rtype == 'Tree') ? {code: 'MSProject', name: 'MS Project'} : {code: "html", name: "HTML"};
                // report.encoding = "UTF-8";
                $scope.formats = ReportConfig.getReportFormats(report.type.id);
                $scope.encodings = ReportConfig.getEncodings();

                $scope.canManage = false;

                $http.get($rootScope.apiEndpoint + '/rest/report/canmanage/task/' + $stateParams.taskNumber)
                    .then(function (res) {
                        $scope.canManage = res;

                        setLoading({status: false}, 'report');
                    });
            });
        };

        var updateReport = function (params) {
            var deffered = $q.defer();

            // Переводим parameters в необходимый формат
            _.each(params.report.parameters, function (value, key) {
                if (typeof value === 'object') {
                    params.report.parameters[key] = value.key;
                }
            });

            ReportData.update({taskNumber: $stateParams.taskNumber}, params.report, function (data) {
                deffered.resolve(data);
            }, function (data) {
                deffered.reject(data);
            });

            return deffered.promise;
        };

        $scope.loaderParams = {report: {}, filter: {}};

        $scope.editReport = function () {
            var modalInstance = $modal.open({
                templateUrl: 'report/report.edit.tpl.html',
                size: 'lg',
                keyboard: false,
                backdrop: 'static',
                resolve: {
                    report: function () {
                        return angular.copy($scope.report);
                    },
                    updateReport: function () {
                        return updateReport;
                    },
                    taskNumber: function () {
                        return $stateParams.taskNumber;
                    }
                },
                controller: function ($scope, report, updateReport, taskNumber, $modalInstance) {
                    // hide opened select
                    // $('#edit-report-modal-body').on('scroll', function() {
                    //     $scope.$broadcast('hide.scroll');
                    // });

                    var setLoading = function (params) {
                        angular.forEach(params, function (value, key) {
                            $scope.loaderParams[key] = value;
                        });
                    };

                    var loadData = function () {
                        setLoading({status: true});
                    
                        $scope.report = report;
                        $scope.report.originalName = $scope.report.name;

                        ReportConfig.getValues({taskNumber: taskNumber}).then(function (values) {
                            $scope.values = values;

                            setLoading({status: false});
                        });

                        $scope.canBeShared = false;
                        $http.get($rootScope.apiEndpoint + '/rest/report/canmakepublic/task/' + $stateParams.taskNumber)
                            .then(function (res) {
                                $scope.canBeShared = res.data;
                            });
                    };

                    $scope.reportTypes = ReportConfig.getReportTypes();
                    
                    $scope.loaderParams = {};

                    $scope.save = function () {
                        setLoading({status: true});
                        updateReport({report: $scope.report}).then(function (data) {
                            setLoading({status: false});
                            $scope.submit();
                        }).catch(function (res) {
                            setLoading({status: false, message: res.data ? res.data.message : res.data});
                        });
                    }

                    // Закрыть диалог и сохранить отчет
                    $scope.submit = function () {
                        $modalInstance.close({action: "save"});
                    };

                    // Закрыть диалог без изменений
                    $scope.cancel = function () {
                        $modalInstance.dismiss("cancel");
                    };

                    loadData();
                }
            });

            modalInstance.result.then(
                function (result) {
                    if (result.action == 'save') {
                        loadData();
                    }
                }, function (result) {
                    $log.info('Modal dismissed ' + result );
                }
            );
        };

        // TODO: валидатор построение отчета. Валидаторы создания
        $scope.buildReport = function () {
            var url = "",
                filter = { // отправляем только необходимые поля
                    deepSearchFl: $scope.report.filter.deepSearchFl,
                    filterParameters: _.map($scope.report.filter.filterParameters, function(el) { return _.omit(el, '$$hashKey'); }),
                    id: $scope.report.filter.id,
                    view: _.map($scope.report.filter.view, function(el) { return _.omit(el, '$$hashKey') })
                };

            var parameters = {
                taskId: $rootScope.currentTaskContext.task.id,
                filterParameters: filter,
                delimiter: ';',
                encoding: $scope.report.encoding,
                repType: $scope.report.format.code,
                chart: $scope.report.chart,
                compressed: $scope.report.format.code == 'xml' ? !!$scope.report.compressed : false
            };

            $http.post($rootScope.apiEndpoint + '/rest/report/' + $scope.report.id + '/build', parameters).then(function (resBuild) {
                console.log('RES', resBuild);

                var getFile = function () {
                    var url = $rootScope.apiEndpoint + '/rest/report/' + $scope.report.id + '/download/' + resBuild.data.reportFileName + '?compressed=' +
                        ($scope.report.format.code == 'xml' ? !!$scope.report.compressed : false);

                    $http.get(url).then(function (resGet) {
                        console.log('RES f suc', resGet);

                        $interval.cancel(getFileInterval);

                        $window.open(url, '_blank');
                    }, function (resGet) {
                        console.log('RES f err', resGet);
                    });
                }
                // запрашиваем файл каждые 5 секунд
                var getFileInterval = $interval(function () {
                    getFile();
                }, 5000);
                getFile();
            })
        };

        loadData();
    });
});