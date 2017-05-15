angular.module('app.grid', ['ui.grid', 'ui.grid.pinning', 'ui.grid.resizeColumns', 'ui.grid.moveColumns',
    'ui.grid.selection', 'ui.grid.saveState', 'ui.grid.autoResize', 'cs.loading-indicator', 'angular-logger'])
    .constant('GRID_EVENT', {
        CREATE_ITEM: 'grid:event:create:item',
        UPDATE_ITEM: 'grid:event:update:item',
        DELETE_ITEM: 'grid:event:delete:item',
        VIEW_ITEM: 'grid:event:view:item',
        DATA_LOADED: 'grid:event:data:loaded'
    })
    .run(['$rootScope', 'LoadingService', function($rootScope, LoadingService) {
        function shouldNotifyLoading(fromState, toState) {
            if(!fromState || !toState || !fromState.url || !toState.url) {
                return false;
            }

            if(_.startsWith(toState.url, '/list') && (_.startsWith(fromState.url, '/view') || _.startsWith(fromState.url, '/edit'))) {
                return false;
            }

            return true;
        }

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            if(shouldNotifyLoading(fromState, toState)) {
                LoadingService.start();
            }
        });

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            if(shouldNotifyLoading(fromState, toState)) {
                LoadingService.stop();
            }
        });
    }])
    .controller('DatagridController', [
        '$scope', '$element', '$attrs', '$rootScope', '$log', 'ClientStatusService', '$state', '$filter',
        'uiGridConstants', '$timeout', 'gridUtil', 'GridStatusPersistenceService', 'Restangular',
        'GRID_EVENT', 'LoadingService',
        function($scope, $element, $attrs, $rootScope, $log, ClientStatusService, $state, $filter,
                 uiGridConstants, $timeout, gridUtil, GridStatusPersistenceService, Restangular,
                 GRID_EVENT, LoadingService) {
            var logger = $log.getInstance('components.DatagridController');
            var gridId = $scope.$eval($attrs.gridId);

            if(_.isNil(gridId) || _.isNaN(gridId)) {
                gridId = $attrs.gridId;
            }

            $scope.gridId = gridId;
            $scope.hidePagingFooter = $attrs.hidePagingFooter ? $scope.$eval($attrs.hidePagingFooter) : false;
            $scope.gridConfig = $scope.$eval($attrs.gridConfig);
            $scope.entityName = $attrs.entityName;
            $scope.hideCreateBtn = $attrs.hideCreateBtn ? $scope.$eval($attrs.hideCreateBtn) : false;
            $scope.maxSize = $attrs.maxSize;
            $scope.showExportBtn = $attrs.showExportBtn ? $scope.$eval($attrs.showExportBtn) : false;
            $scope.emptyMessage = $attrs.emptyMessage;

            $scope.gridProcessing = false;
            $scope.keepState = $attrs.keepState ? $scope.$eval($attrs.keepState) : false;
            var gridSavedStatus = $scope.keepState ? ClientStatusService.getStatus($scope.gridId, {}) : {};
            var gridConfig = $scope.gridConfig;
            $scope.datagrid = gridConfig;
            $scope.datagrid.data = [];
            var datasourceService = gridConfig.dataSource;
            var pagingOptions = gridConfig.pagingOptions || {
                    pageSizes: [10, 20, 30, 50],
                    pageSize: 10,
                    currentPage: 1,
                    totalItems: null
                };
            gridConfig.pagingOptions = pagingOptions;
            var fillExtraParamsFunc = gridConfig.fillExtraParamsFunc;
            var localFilterHandler = gridConfig.localFilterHandler;

            logger.trace('Initializing grid - gridSavedStatus', gridSavedStatus);

            // Restore saved status
            if(gridSavedStatus.pagingOptions) {
                pagingOptions.currentPage = gridSavedStatus.pagingOptions.currentPage;
                pagingOptions.pageSize = gridSavedStatus.pagingOptions.pageSize;
            }
            if(gridSavedStatus.sortingInfo) {
                $scope.lastSorting = gridSavedStatus.sortingInfo;
            }

            if(!pagingOptions) {
                logger.error('No paging options found attached to \'pagingOptions\' attribute');
                return;
            }

            var getPagedDataAsyncDebouncedFunc;

            if(angular.isArray(datasourceService)) {
                getPagedDataAsyncDebouncedFunc = _.debounce(function(params) {
                    $timeout(function() {
                        logger.info('Retrieving data from array datasource with params', params);
                        var offset = (params.pageNbr - 1) * params.pageSize;
                        var topLimit = offset + params.pageSize;

                        if(!params.sortInfo && gridSavedStatus.sortingInfo) {
                            params.sortInfo = gridSavedStatus.sortingInfo;
                        }

                        if(params.sortInfo) {
                            // We have to sort data
                            var sortBy = params.sortInfo.sortBy;
                            var sortDir = params.sortInfo.sortDir;
                            var sortedData = $filter('orderBy')(datasourceService, sortBy, 'desc' == sortDir);
                            datasourceService.length = 0;
                            _.forEach(sortedData, function(i) {datasourceService.push(i)});

                            gridSavedStatus.sortingInfo = {
                                sortBy: sortBy,
                                sortDir: sortDir
                            };
                        }

                        var filteredData = localFilterHandler ? localFilterHandler(datasourceService) : datasourceService.concat();
                        var pagedData = filteredData.length > params.pageSize ? filteredData.slice(offset, topLimit) : filteredData;
                        $scope.gridConfig.data = pagedData;

                        if(filteredData.length <= params.pageSize) {
                            pagingOptions.currentPage = 1;
                        }
                        pagingOptions.totalItems = filteredData.length;
                        pagingOptions.firstItem = offset + 1;
                        pagingOptions.lastItem = filteredData.length > offset + params.pageSize ? topLimit : filteredData.length;
                        computeGridHeight();

                        if(params.callback) {
                            params.callback($scope.gridOptions, pagedData);
                        }
                        $rootScope.$broadcast(GRID_EVENT.DATA_LOADED);
                    });
                }, 200);
            } else {
                getPagedDataAsyncDebouncedFunc = _.debounce(function(reqParams) {
                    var params = reqParams.lastRequestParams || {offset: (reqParams.pageNbr - 1) * reqParams.pageSize, max: reqParams.pageSize};
                    var sortInfo = $scope.lastSorting;

                    if(fillExtraParamsFunc) {
                        params = fillExtraParamsFunc(params);
                    }

                    if(sortInfo) {
                        params.sortBy = sortInfo.sortBy;
                        params.sortDir = sortInfo.sortDir;
                    }

                    LoadingService.start();
                    $scope.gridProcessing = true;
                    logger.info('Retrieving data from remote datasource with params', params);
                    var defer = datasourceService(params);
                    defer.then(
                        function(resp) {
                            var result = {};

                            if(gridConfig.responseHandler) {
                                gridConfig.responseHandler(resp);
                            }

                            if(gridConfig.resultHandler) {
                                result = gridConfig.resultHandler(resp);
                            } else {
                                result = {
                                    totalCount: resp.total,
                                    data: resp.data
                                }
                            }

                            $scope.gridConfig.data = result.data;
                            pagingOptions.totalItems = result.totalCount;
                            pagingOptions.firstItem = params.offset + 1;
                            pagingOptions.lastItem = params.offset + result.data.length;

                            // Compute grid status for last request
                            gridSavedStatus.pagingOptions = {
                                currentPage: pagingOptions.currentPage,
                                pageSize: pagingOptions.pageSize,
                                totalItems: result.totalCount
                            };

                            gridSavedStatus.sortingInfo = {
                                sortBy: params.sortBy,
                                sortDir: params.sortDir
                            };

                            gridSavedStatus.lastRequestParams = params;

                            if(reqParams.callback) {
                                reqParams.callback($scope.gridOptions, $scope.datagrid.data);
                            }
                            LoadingService.stop();
                            $scope.gridProcessing = false;
                            computeGridHeight();
                            $rootScope.$broadcast(GRID_EVENT.DATA_LOADED);
                        },
                        function() {
                            LoadingService.stop();
                            $scope.gridProcessing = false;
                        });
                }, 200);
            }

            $scope.getPagedDataAsync = function(reqParams) {
                getPagedDataAsyncDebouncedFunc(reqParams);
            };

            this.getSavedStatus = function() {
                return gridSavedStatus;
            };

            this.getData = function() {
                return $scope.gridConfig.data;
            };

            $scope.$watch('gridConfig.pagingOptions', function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    if (newVal.currentPage !== oldVal.currentPage) {
                        $scope.getPagedDataAsync({pageSize: pagingOptions.pageSize, pageNbr: pagingOptions.currentPage});
                    } else if (newVal.pageSize !== oldVal.pageSize) {
                        pagingOptions.currentPage = 1;
                        $scope.getPagedDataAsync({pageSize: pagingOptions.pageSize, pageNbr: pagingOptions.currentPage});
                    }
                }
            }, true);

            var lastGridHeight = null;

            function computeGridHeight() {
                var newLength = $scope.gridConfig.data && $scope.gridConfig.data.length || 0;
                var newHeight = (newLength + 1) * 30 + 2;

                if($scope.gridApi) {
                    $scope.gridApi.grid.gridHeight = newHeight;

                    if(newHeight != lastGridHeight) {
                        $scope.gridApi.grid.refresh();
                        lastGridHeight = newHeight;
                    }

                    $scope.gridApi.grid.element.css('height', newHeight);
                }
            }

            $scope.scrollerElement = null;

            var canvasContainerWidthCanceler = null, bodyViewPort = null, rightViewPort = null, leftViewPort = null,
                canvasContainer = null;

            var canvasContainersWidthCalc = _.debounce(function() {
                bodyViewPort = !bodyViewPort || !bodyViewPort.length ? $($scope.gridElement).find('.ui-grid-render-container-body .ui-grid-viewport') : bodyViewPort;
                rightViewPort = !rightViewPort || !rightViewPort.length ? $($scope.gridElement).find('.ui-grid-render-container-right .ui-grid-viewport') : rightViewPort;
                leftViewPort = !leftViewPort || !leftViewPort.length ? $($scope.gridElement).find('.ui-grid-render-container-left .ui-grid-viewport') : leftViewPort;
                canvasContainer = bodyViewPort.find('.ui-grid-canvas');
                var canvasContainerWidth = canvasContainer.width();
                var rightViewportWidth = rightViewPort.width() || 0;
                var leftViewportWidth = leftViewPort.width() || 0;
                var totalCanvasContainerWidths = canvasContainerWidth + rightViewportWidth + leftViewportWidth;

                logger.debug('Computing totalCanvasContainerWidths: ', totalCanvasContainerWidths);

                return totalCanvasContainerWidths;
            }, 200);

            var buildHorizontalScrollbar = function () {
                if(!canvasContainerWidthCanceler && $scope.datagrid.data && $scope.datagrid.data.length) {
                    canvasContainerWidthCanceler = $scope.$watch(function() {
                        return canvasContainersWidthCalc();
                    }, function(newWidth, oldWidth) {
                        if(newWidth == oldWidth) {
                            return
                        }

                        if($scope.scrollerElement) {
                            $scope.scrollerElement.mCustomScrollbar('destroy');
                            $scope.scrollerElement = null;
                        }

                        bodyViewPort = !bodyViewPort || !bodyViewPort.length ? $($scope.gridElement).find('.ui-grid-render-container-body .ui-grid-viewport') : bodyViewPort;
                        var slider = $($scope.gridElement).find('.grid-slider');
                        var sliderContent = slider.children(0);

                        logger.info('Canvas containers width changed redrawing scroll-bar', {newWidth: newWidth, oldWidth: oldWidth});

                        sliderContent.css('width', newWidth);
                        slider.mCustomScrollbar({
                            axis: "x",
                            theme: "dark",
                            horizontalScroll: true,
                            scrollInertia: 0,
                            scrollEasing: 'linear',
                            callbacks: {
                                whileScrolling: function(ev){
                                    var leftVal = ev.left * -1;
                                    bodyViewPort[0].scrollLeft = leftVal;
                                }
                            }
                        });
                        var onWindowResizeHandler = function() {
                            var noScrollbar = slider.find('.mCS_no_scrollbar').length;

                            if(noScrollbar) {
                                slider.css('height', '0px');
                                slider.css('margin-bottom', '0');
                            } else {
                                slider.css('height', '10px');
                                slider.css('margin-bottom', '10px');
                            }
                        };
                        onWindowResizeHandler();
                        var debounceWindowResizeHandler = _.debounce(onWindowResizeHandler, 200);

                        $(window).on('resize', debounceWindowResizeHandler);

                        $scope.$on('$destroy', function() {
                            $(window).off('resize', debounceWindowResizeHandler);
                        });

                        $scope.scrollerElement = slider;
                    });

                    $scope.$on('$destroy', function() {
                        logger.info('Running canvasContainerWidthCanceler');
                        canvasContainerWidthCanceler();
                        canvasContainerWidthCanceler = null;
                    })
                }
            };

            $scope.$watch('datagrid.data', function(newVal, oldVal) {
                if($scope.gridApi) {
                    computeGridHeight();

                    if(_.isEmpty(oldVal) && !_.isEmpty(newVal)) {
                        buildHorizontalScrollbar();
                    }
                } else {
                    var unregisterGridApiWatch = $scope.$watch('gridApi', function(v1) {
                        if(v1) {
                            computeGridHeight();
                            if(_.isEmpty(oldVal) && !_.isEmpty(newVal)) {
                                buildHorizontalScrollbar();
                            }
                            unregisterGridApiWatch();
                        }
                    });
                }
            });

            // Remove every mouse wheel event
            gridUtil.on.mousewheel = function() {
                // Nothing
            };

            var gridOptions = {
                data: 'datagrid.data',
                enableRowSelection: true,
                enableHighlighting: true,
                useExternalSorting: !angular.isArray(datasourceService),
                enableSorting: true,
                enableColumnMenus: true,
                enableColumnResize: true,
                enableColumnMoving: true,
                enableGridMenu: true,
                showColumnMenu: true,
                enablePinning: true,
                enableRowHeaderSelection: false,
                multiSelect: false,
                enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                minRowsToShow: 1,
                saveScroll: false,
                saveFocus: false,
                saveSort: true,
                saveFilter: false,
                onRegisterApi: function(gridApi) {
                    $scope.gridApi = gridApi;
                    $scope.datagrid.gridApi = gridApi;

                    if(!$scope.statusRestored) {
                        $timeout(function() {
                            $scope.restoringStatus = true;
                            GridStatusPersistenceService.restoreStatus($scope);
                            $scope.statusRestored = true;
                            $scope.restoringStatus = false;

                            if(!gridOptions.skipInitialLoad) {
                                if(gridSavedStatus.lastRequestParams) {
                                    $scope.getPagedDataAsync({lastRequestParams: gridSavedStatus.lastRequestParams});
                                } else {
                                    $scope.lastSorting = extractSortInfo($scope.gridApi.grid.columns);
                                    $scope.getPagedDataAsync({pageSize: pagingOptions.pageSize, pageNbr: pagingOptions.currentPage});
                                }
                            }
                        });
                    }

                    $scope.gridApi.core.on.sortChanged( $scope, function() {
                        if($scope.restoringStatus) {
                            return
                        }

                        $scope.sortRequested();
                        saveGridState();
                    });

                    $scope.gridApi.colResizable.on.columnSizeChanged($scope, function() {
                        buildHorizontalScrollbar();
                        saveGridState();
                    });

                    $scope.gridApi.core.on.columnVisibilityChanged($scope, function() {
                        buildHorizontalScrollbar();
                        saveGridState();
                    });

                    $scope.gridApi.colMovable.on.columnPositionChanged($scope,function(){
                        saveGridState();
                    });

                    $scope.gridApi.pinning.on.columnPinned($scope, function() {
                        saveGridState();
                    });

                    if($scope.datagrid.onApiReady) {
                        $timeout(function() {
                            $scope.datagrid.onApiReady();
                        });
                    }
                },
                gridMenuCustomItems: [
                    {
                        title: 'Restore Columns',
                        action: function () {
                            $scope.restoringStatus = true;
                            GridStatusPersistenceService.resetStatus($scope);
                            $scope.restoringStatus = false;
                        }
                    }
                ]
            };

            if($scope.gridConfig.gridOptions) {
                gridOptions = angular.extend(gridOptions, $scope.gridConfig.gridOptions);

                // If we have previous sort info set them
                if($scope.lastSorting) {
                    _.forEach(gridOptions.columnDefs, function(colDef) {
                        if(colDef.field == $scope.lastSorting.sortBy) {
                            // Add saved sort info
                            colDef.sort = {
                                direction: $scope.lastSorting.sortDir,
                                priority: 0
                            };
                        } else {
                            // Remove sort configuration
                            delete colDef.sort;
                        }
                    });
                } else {
                    // Else build lastSorting
                    var sortedColDef = _.find(gridOptions.columnDefs, function(colDef) {
                        return colDef.sort;
                    });

                    if(sortedColDef) {
                        $scope.lastSorting = extractSortInfo([sortedColDef]);
                    }
                }
            }

            function extractSortInfo(sortColumns) {
                if(_.isEmpty(sortColumns)) return null;

                var sortedCol = _.find(sortColumns, function(col) {return col.sort && col.sort.direction});

                if(sortedCol) {
                    return {
                        sortBy: sortedCol.field,
                        sortDir: sortedCol.sort.direction
                    }
                }

                return null;
            }

            $scope.gridOptions = gridOptions;

            $scope.$on('load-data', function(ev, param) {
                var reqParams = {
                    pageSize: pagingOptions.pageSize,
                    pageNbr: (param && param.pageNbr) ? param.pageNbr : pagingOptions.currentPage,
                    callback: param ? param.callback : null
                };
                $scope.getPagedDataAsync(reqParams);
            });

            $scope.sortRequested = function() {
                $scope.lastSorting = extractSortInfo($scope.gridApi.grid.columns);
                $scope.getPagedDataAsync({pageSize: pagingOptions.pageSize, pageNbr: pagingOptions.currentPage, sortInfo: $scope.lastSorting});
            };

            $scope.createNewItem = function() {
                $state.go('^.new');
            };

            // Append reload function to gridConfig
            $scope.gridConfig.reload = function(pageNbr) {
                if(pageNbr && pageNbr != pagingOptions.currentPage) {
                    // This will automatically reload the grid
                    pagingOptions.currentPage = pageNbr;
                } else {
                    $scope.getPagedDataAsync({pageSize: pagingOptions.pageSize, pageNbr: pagingOptions.currentPage});
                }
            };

            // Append refresh function to gridConfig
            $scope.gridConfig.refresh = function() {
                if($scope.gridApi) {
                    $timeout(function() {
                        $scope.gridApi.grid.refresh(true);
                        buildHorizontalScrollbar();
                    }, 100);
                }
            };

            $scope.gridConfig.addControl = function(element) {
                $element.find('.page-size-selection').append(element);
            };

            $scope.export = function() {
                var exportParams = _.assign({gridId: $scope.gridId}, gridSavedStatus.lastRequestParams);
                Restangular.oneUrl('export/grid').post('', exportParams).then(function(resp) {
                    window.open(resp.data.link);
                });
            };

            // Grid status save/restore

            var saveGridState = _.debounce(function() {
                GridStatusPersistenceService.saveStatus($scope);
            }, 200);
        }
    ]).directive('appGrid', [
        '$timeout',
        function($timeout) {
            return {
                restrict : "E",
                replace: true,
                transclude: true,
                scope: true,
                controller: 'DatagridController',
                templateUrl: 'views/cs/directives/grid/datagrid.html',
                link: function($scope, $elem, $attrs) {
                    $scope.gridElement = $elem;
                    $scope.hasInnerContent = $elem.find('ng-transclude').children().length > 0;
                    $scope.canInitGrid = false;

                    var delay = $attrs.initialDelay || 0;

                    $timeout(function(){
                        $scope.canInitGrid = true;
                    }, delay);
                }
            };
        }
    ]).factory('GridColumnConfigBuilder', ['uiGridConstants', function(uiGridConstants) {
        var GridColumnConfigBuilder = function() {
            this.reset();
        };

        GridColumnConfigBuilder.prototype.reset = function() {
            this.config = {
                enableColumnMenu: true,
                enableSorting: true
            };
        };

        var commonProperties = ['width', 'displayName', 'cellTemplate', 'minWidth', 'maxWidth', 'cellFilter'];

        _.forEach(commonProperties, function(prop) {
            GridColumnConfigBuilder.prototype[prop] = function(val) {
                this.config[prop] = val;
                return this;
            };
        });

        GridColumnConfigBuilder.prototype.field = function(field) {
            this.config.field = field;
            if(_.isUndefined(this.config.displayName)) {
                this.config.displayName = field.replace(/\./g, ' ');
            }
            return this;
        };

        GridColumnConfigBuilder.prototype.cellClass = function(cellClass) {
            this.config.cellClass = cellClass;
            this.config.headerCellClass = cellClass;
            return this;
        };

        GridColumnConfigBuilder.prototype.alignRight = function() {
            return this.cellClass('right-aligned');
        };

        GridColumnConfigBuilder.prototype.alignCenter = function() {
            return this.cellClass('center-aligned');
        };

        GridColumnConfigBuilder.prototype.pinLeft = function() {
            this.config.pinnedLeft = true;
            return this;
        };

        GridColumnConfigBuilder.prototype.pinRight = function() {
            this.config.pinnedRight = true;
            return this;
        };

        GridColumnConfigBuilder.prototype.sortable = function(val) {
            this.config.enableSorting = val;
            return this;
        };

        GridColumnConfigBuilder.prototype.build = function() {
            var config = this.config;
            config.width = config.width || config.minWidth || config.maxWidth || 300;
            this.reset();
            return config;
        };

        GridColumnConfigBuilder.prototype.sorted = function(val) {
            this.config.sort = {
                direction: 'desc' == val ? uiGridConstants.DESC : uiGridConstants.ASC,
                priority: 1
            };
            return this;
        };

        GridColumnConfigBuilder.prototype.toolbar = function(conf) {
            this.alignCenter();
            angular.extend(this.config, {
                displayName: '',
                field: 'id',
                width: '80',
                sortable: false,
                cellTemplate: '<grid-item-crud-toolbar item="row.entity"/>',
                pinnedRight: true,
                enableHiding: false,
                enableColumnMenu: false
            }, conf || {});
            return this;
        };

        return new GridColumnConfigBuilder();
    }]).factory('GridStatusPersistenceService', [
        '$rootScope', 'localStorageService', '$log',
        function($rootScope, localStorageService, $log) {
            var logger = $log.getInstance('components.GridStatusPersistenceService');

            // This is a custom service as the default service doesn't save pin information
            function getId(gridScope) {
                var gridVersion = gridScope.gridConfig.gridOptions.version || 1;
                return gridScope.gridId + '/' + 'demo-user' + '/' + gridVersion;
            }

            return {
                version: 1,

                saveStatus: function(gridScope) {
                    var savedState = gridScope.gridApi.saveState.save();
                    savedState.version = this.version;
                    var gridId = getId(gridScope);

                    logger.trace('Saving grid status for grid id %s', [gridId], savedState);

                    localStorageService.set(gridId, savedState);
                },

                restoreStatus: function(gridScope) {
                    var cacheKey = getId(gridScope);
                    var savedState = localStorageService.get(cacheKey);

                    logger.trace('Retrieved status for grid id %s', [cacheKey], savedState);

                    if(savedState) {
                        if(savedState.version == this.version) {
                            logger.trace('Before restoring grid state', _.cloneDeep(gridScope.gridOptions));
                            gridScope.gridApi.saveState.restore(gridScope, savedState);
                            logger.trace('After restoring grid state', _.cloneDeep(gridScope.gridOptions));
                        } else {
                            localStorageService.remove(cacheKey);
                        }
                    }
                },

                resetStatus: function(gridScope) {
                    var gridStatusKey = getId(gridScope);
                    var initialState = {
                        columns: _.map(gridScope.datagrid.gridOptions.columnDefs, function(colDef) {
                            var newWidth = null;

                            if(colDef.width) {
                                if(_.isNumber(colDef.width)) {
                                    newWidth = colDef.width;
                                } else if((/\d+/).test(colDef.width)) {
                                    newWidth = parseInt(colDef.width);
                                } else {
                                    newWidth = colDef.width;
                                }
                            }

                            return {
                                name: colDef.name,
                                visible: colDef.visible,
                                width: newWidth,
                                sort: colDef.sort ? _.clone(colDef.sort) : {},
                                pinned: colDef.pinnedRight ? 'right' : (colDef.pinnedLeft ? 'left' : '')
                            }
                        })
                    };

                    localStorageService.remove(gridStatusKey);
                    gridScope.gridApi.saveState.restore(gridScope, initialState);
                }
            }
        }
    ]).factory('ClientStatusService',
    function() {
        return {
            savedStatus: {},
            getStatus: function(key, defaultStatus) {
                var savedStatus = this.savedStatus[key];

                if(!savedStatus) {
                    savedStatus = defaultStatus;
                    this.savedStatus[key] = savedStatus;
                }

                return savedStatus;
            },
            hasStatus: function(key) {
                return null != this.savedStatus[key];
            }
        };
    }
).directive('gridToolbarActionItem',
    function() {
        return {
            restrict: 'E',
            replace: true,
            require: '^gridItemCrudToolbar',
            scope: {
                actionCfg: '='
            },
            link: function(scope, elem, attrs, ctrl) {
                ctrl.addAction(scope.actionCfg);
            }
        }
    }
).directive('gridItemCrudToolbar',
    function() {
        return {
            restrict : "E",
            replace: true,
            transclude: true,
            scope: {
                item: '=',
                deleteTemplate: '@',
                checkUsageOnDelete: '@',
                onViewItem: '&',
                onEditItem: '&',
                onDeleteItem: '&'
            },
            controller: 'GridItemCrudToolbarController',
            templateUrl: 'views/common/grid-item-crud-toolbar.html',
            link: function($scope, $elem, $attrs) {
                function updateValues() {
                    _.each($scope.actionsCfg, function(cfg) {
                        cfg.condition = cfg.conditionClosure($attrs, $scope.$parent);
                    });
                }

                $scope.eventHandlers = {
                    onViewItem: null != $attrs.onViewItem,
                    onEditItem: null != $attrs.onEditItem,
                    onDeleteItem: null != $attrs.onDeleteItem
                };

                $scope.$watch('item', function(newItem, oldItem) {
                    if(newItem && newItem != oldItem) {
                        updateValues();
                    }
                });
                updateValues();
            }
        };
    }
).directive('crudItemToolbar',
    function() {
        return {
            restrict : "E",
            replace: true,
            templateUrl: 'views/common/crud-item-toolbar.html',
            controller: 'CrudItemToolbarController',
            scope: {
                item: '=',
                mode: '@',
                onSaveItem: '&',
                onDeleteItem: '&',
                formRef: '=',
                saving: '=',
                disableSave: '=',
                deleteTemplate: '@',
                checkUsageOnDelete: '@',
                checkUsageId: '='
            },
            link: function($scope, $elem, $attrs) {
                $scope.editable = $attrs.editable ? $scope.$parent.$eval($attrs.editable) : true;
                $scope.deletable = $attrs.deletable ? $scope.$parent.$eval($attrs.deletable) : true;
            }
        };
    }
).controller('GridItemCrudToolbarController', [
        '$scope', 'GRID_EVENT', '$uibModal',
        function($scope, GRID_EVENT, $uibModal) {
            $scope.viewItem = function() {
                if($scope.eventHandlers.onViewItem) {
                    $scope.onViewItem({$item: $scope.item});
                } else {
                    $scope.$emit(GRID_EVENT.VIEW_ITEM, $scope.item);
                }
            };

            $scope.updateItem = function() {
                if($scope.eventHandlers.onEditItem) {
                    $scope.onEditItem({$item: $scope.item});
                } else {
                    $scope.$emit(GRID_EVENT.UPDATE_ITEM, $scope.item);
                }
            };

            $scope.deleteItem = function() {
                var modalCfg = {
                    templateUrl: $scope.deleteTemplate || 'views/modal/grid-delete-item-confirmation.html',
                    controller: DeleteConfirmationModalCtrl,
                    windowClass: "hmodal-danger",
                    scope: $scope
                };

                if($scope.checkUsageOnDelete) {
                    modalCfg.resolve = {
                        usageCheck: ['Restangular', function(Restangular) {
                            return Restangular.one('entity/usage/' + $scope.checkUsageOnDelete, $scope.item.id).get();
                        }]
                    }
                } else {
                    modalCfg.resolve = {
                        usageCheck: function() {
                            return {};
                        }
                    }
                }

                $uibModal.open(modalCfg);
            };

            function DeleteConfirmationModalCtrl ($scope, $uibModalInstance, $timeout, usageCheck) {
                var checkRes = usageCheck.data && usageCheck.data.plain && usageCheck.data.plain();
                _.defaults($scope, checkRes);
                $scope.hasCheckWarnings = _.find(_.values(checkRes), function(count) {return count > 0});

                $scope.ok = function () {
                    $timeout(function() {
                        if($scope.eventHandlers.onDeleteItem) {
                            $scope.onDeleteItem({$item: $scope.item});
                        } else {
                            $scope.$emit(GRID_EVENT.DELETE_ITEM, $scope.item);
                        }

                        $uibModalInstance.close();
                    }, 500);
                };

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            }

            $scope.actionsCfg = [
                {
                    id: 'search',
                    iconClass: 'fa fa-search',
                    action: $scope.viewItem,
                    tooltip: 'View Item',
                    condition: false,
                    conditionClosure: function(attrs, parentScope) {
                        return attrs.visible ? parentScope.$eval(attrs.visible) : true;
                    }
                }, {
                    id: 'update',
                    iconClass: 'fa fa-pencil',
                    action: $scope.updateItem,
                    tooltip: 'Edit Item',
                    condition: false,
                    conditionClosure: function(attrs, parentScope) {
                        return attrs.editable ? parentScope.$eval(attrs.editable) : true;
                    }
                }, {
                    id: 'delete',
                    iconClass: 'fa fa-trash',
                    action: $scope.deleteItem,
                    tooltip: 'Delete Item',
                    condition: false,
                    conditionClosure: function(attrs, parentScope) {
                        return attrs.deletable ? parentScope.$eval(attrs.deletable) : true;
                    }
                }
            ];

            this.addAction = function(cfg) {
                if(cfg) {
                    if(cfg.position) {
                        $scope.actionsCfg.splice(cfg.position, 0, cfg);
                    } else {
                        $scope.actionsCfg.push(cfg);
                    }
                }
            }
        }
    ]).controller('CrudItemToolbarController', [
        '$scope', '$state', '$uibModal', '$attrs',
        function($scope, $state, $uibModal, $attrs) {
            $scope.back = function() {
                if($scope.mode == 'read' && !$state.params.nativeBack) {
                    $state.go('^.list');
                } else {
                    history.back();
                }
            };

            $scope.updateItem = function() {
                $state.go('^.edit', {id: $scope.item.id});
            };

            $scope.deleteItem = function() {
                var modalCfg = {
                    templateUrl: $scope.deleteTemplate || 'views/modal/grid-delete-item-confirmation.html',
                    controller: DeleteConfirmationModalCtrl,
                    windowClass: "hmodal-danger",
                    scope: $scope
                };

                if($scope.checkUsageOnDelete) {
                    modalCfg.resolve = {
                        usageCheck: ['Restangular', function(Restangular) {
                            return Restangular.one('entity/usage/' + $scope.checkUsageOnDelete, $scope.checkUsageId || $scope.item.id).get();
                        }]
                    }
                } else {
                    modalCfg.resolve = {
                        usageCheck: function() {
                            return {};
                        }
                    }
                }

                $uibModal.open(modalCfg);
            };

            $scope.saveItem = function() {
                $scope.onSaveItem({$item: $scope.item, $successCallback: function() {
                }});
            };

            function DeleteConfirmationModalCtrl ($scope, $uibModalInstance, $timeout, $state, usageCheck) {
                var checkRes = usageCheck.data && usageCheck.data.plain && usageCheck.data.plain();
                _.defaults($scope, checkRes);
                $scope.hasCheckWarnings = _.find(_.values(checkRes), function(count) {return count > 0});

                $scope.ok = function () {
                    var callback = function() {
                        $timeout(function() {
                            $state.go('^.list');
                        }, 500);
                    };

                    if($attrs.onDeleteItem) {
                        $scope.onDeleteItem({$callback: callback, $item: $scope.item});
                    } else {
                        $scope.item.remove().then(callback);
                    }

                    $uibModalInstance.close();
                };

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            }
        }
    ]).directive('gridItemCheckbox',
    function() {
        return {
            restrict : "E",
            replace: true,
            scope: {
                modelPath: '=',
                row: '=',
                prefix: '@',
                onDataChange: '&',
                disabled: '='
            },
            template: '<div class="checkbox checkbox-success">' +
            '<input type="checkbox" ng-model="modelPath" id="{{prefix}}_{{$id}}" ng-change="dataChangeEvaluator()" ng-disabled="disabled">' +
            '<label for="{{prefix}}_{{$id}}"></label>' +
            '</div>',
            controller: function($scope, $timeout) {
                $scope.dataChangeEvaluator = function() {
                    $timeout(function() {
                        $scope.onDataChange()
                    });
                }
            }
        };
    }
);
