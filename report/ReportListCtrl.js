define(['./module'], function (module) {
    'use strict';
    module.register.controller('ReportListCtrl', function ($rootScope, $scope, $translate, $stateParams, $http, $modal, $log, $q, ReportData, ReportConfig) {
        var setLoading = function(params) {
            angular.forEach(params, function (value, key) {
                $scope.loaderParams[key] = value;
            });
        };

        var loadData = function () {
            var promise = [];

            promise.push(ReportData.list({taskNumber: $stateParams.taskNumber}));

            // TODO: whut?!
            // !$scope.loaderParams.status && setLoading({status: true});
            setLoading({status: true});

            // запрашиваем canmanage при первом запуске
            if($scope.canManage === null || $scope.canManage === undefined) {
                $scope.canManage = false;
                promise.push($http.get($rootScope.apiEndpoint + '/rest/report/canmanage/task/' + $stateParams.taskNumber));
            };

            $q.all(promise)
                .then(function (res) {
                    $scope.reports = res[0];

                    if(res[1]) {
                        $scope.canManage = res[1].data;
                    };

                    setLoading({status: false});
                });
        };

        var deleteReport = function () {
            var deffered = $q.defer();

            var promise = [];

            _.each($scope.gridApi.selection.getSelectedRows(), function (el) {
                promise.push(ReportData.remove({taskNumber: $stateParams.taskNumber, reportId: el.id}));
            });

            $q.all(promise).then(function (res) {
                deffered.resolve(res);
            }, function (data) {
                deffered.reject(data);
            });
            
            return deffered.promise;
        };

        var saveReport = function (params) {
            var deffered = $q.defer();

            // Переводим parameters в необходимый формат
            // var parameters = [];
            _.each(params.report.parameters, function (value, key) {
                if (typeof value === 'object') {
                    params.report.parameters[key] = value.key ? value.key : value.name;
                }
            });

            // params.report.rtype = params.report.type.rtype;
            // params.report.rtypeName = params.report.type.rtypeName;
            // params.report.parameters = parameters;
            // params.report.parameters.linkXsl = params.report.parameters.linkXsl.name;

            ReportData.save({taskNumber: $stateParams.taskNumber}, params.report, function (data) {
                deffered.resolve(data);
            }, function (data) {
                deffered.reject(data);
            });

            return deffered.promise;
        };

        $scope.loaderParams = {};
        
        $scope.gridOptions = {
            data: 'reports',
            enableRowSelection: true,
            enableSelectAll: true,
            multiSelect: true,
            enableCellSelection: true,
            enableCellEdit: true,
            enableHighlighting: true,
            columnDefs: [{
                field: 'name', 
                displayName: $translate.instant('REPORT.NAME'), 
                cellTemplate:'<div class="ngCellText"><span class="glyphicon glyphicon-pencil"></span><a class="info" ng-cell-text ui-sref="top.task.report.info({ reportId: row.entity.id})">{{row.entity[col.field]}}</a></div>'
            },
            {
                field: 'type.name', 
                displayName: $translate.instant('REPORT.TYPE'),
                width: 150
            },
            {
                field: 'filter.name', 
                displayName: $translate.instant('REPORT.FILTER'), 
                cellTemplate:'<div class="ui-grid-cell-contents"><span>{{row.entity.filter.name}}</span></div>'
            },
            {
                field: 'priv', 
                displayName: $translate.instant('REPORT.PRIVATE'), 
                cellTemplate:'<div><input type="checkbox" ng-model="row.entity.priv" disabled="true"/></div>',
                width: 100
            },
            {
                field: 'owner.name', 
                displayName: $translate.instant('REPORT.OWNER'), 
                cellTemplate:'<div class="ui-grid-cell-contents"><trackstudio-user user="row.entity.owner"></trackstudio-user></div>',
                width: 150
            }],
            onRegisterApi: function (gridApi) {
                $scope.gridApi = gridApi;
            }
        };

        $scope.isSelected = function () {
            return $scope.gridApi.selection.getSelectedRows().length > 0;
        };

        $scope.cloneReports = function () {
            var promise = [];

            _.each($scope.gridApi.selection.getSelectedRows(), function (el) {
                promise.push($http.post($rootScope.apiEndpoint + "/rest/report/" + el.id + "/clone"));
            });
            
            setLoading({status: true, placeholder: 'Клонирование отчетов..'});
            $q.all(promise)
                .then(function (res) {
                    loadData();
                    // setLoading({status: false});
                });
        };

        $scope.deleteReports = function () {
            var modalInstance = $modal.open({
                templateUrl: 'report/report.delete.tpl.html',
                windowClass: 'modal-wrapper',
                size: 'sm',
                keyboard: false,
                resolve: {
                    deleteReport: function () {
                        return deleteReport;
                    }
                },
                controller: function ($scope, deleteReport, $modalInstance) {
                    var setLoading = function (params) {
                        angular.forEach(params, function (value, key) {
                            $scope.loaderParams[key] = value;
                        });
                    };

                    $scope.loaderParams = {};

                    $scope.accept = function () {
                        setLoading({status: true});
                        deleteReport({}).then(function (data) {
                            setLoading({status: false});
                            $scope.close();
                        }).catch(function (res) {
                            // TODO: обработать ошибки для нескольких удаленных отчетов
                            setLoading({status: false, message: res.data.message ? res.data.message : res.data});
                            $scope.cancel();
                        });
                    }

                    // Закрыть диалог и удалить отчет
                    $scope.close = function () {
                        $modalInstance.close({action: "delete"});
                    };

                    // Закрыть диалог без изменений
                    $scope.cancel = function () {
                        $modalInstance.dismiss("cancel");
                    };
                }
            });

            modalInstance.result.then(
                function (result) {
                    if (result.action == 'delete') {
                        loadData();
                    }
                }, function (result) {
                    $log.info('Modal dismissed ' + result);
                }
            );
        };

        $scope.createReport = function () {
            var modalInstance = $modal.open({
                templateUrl: 'report/report.create.tpl.html',
                size: 'lg',
                keyboard: false,
                backdrop: 'static',
                resolve: {
                    saveReport: function () {
                        return saveReport;
                    },
                    taskNumber: function () {
                        return $stateParams.taskNumber;
                    }
                },
                controller: function ($scope, saveReport, taskNumber, $modalInstance) {
                    // hide opened select
                    // $('#create-report-modal-body').on('scroll', function() {
                    //     $scope.$broadcast('hide.scroll');
                    // });
                    
                    var setLoading = function (params) {
                        angular.forEach(params, function (value, key) {
                            $scope.loaderParams[key] = value;
                        });
                    };

                    var loadData = function () {
                        setLoading({status: true});
                    
                        ReportConfig.getValues({taskNumber: taskNumber}).then(function (data) {
                            $scope.values = data;

                            setLoading({status: false});
                        });

                        $scope.canBeShared = false;
                        $http.get($rootScope.apiEndpoint + '/rest/report/canmakepublic/task/' + $stateParams.taskNumber)
                            .then(function (res) {
                                $scope.canBeShared = res.data;
                            });
                    };

                    $scope.report = {
                        name: "",
                        priv: false,
                        filter: null,
                        type: {
                            code: "",
                            name: ""
                        },
                        owner: null,
                        id: "",
                        parameters: {},
                        task: {
                            number: taskNumber
                        }
                    };

                    $scope.reportTypes = ReportConfig.getReportTypes();
                    
                    $scope.loaderParams = {};

                    $scope.save = function () {
                        setLoading({status: true});
                        saveReport({report: $scope.report}).then(function (data) {
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

        loadData();
    });
});