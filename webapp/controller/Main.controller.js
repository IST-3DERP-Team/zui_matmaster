sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "../js/Common",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/HashChanger",
    'sap/m/Token',
    'sap/m/ColumnListItem',
    'sap/m/Label',
    "../js/TableValueHelp",
    "../js/TableFilter",
    'jquery.sap.global',
    "sap/ui/Device",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox, Common, Filter, FilterOperator, HashChanger, Token, ColumnListItem, Label, TableValueHelp, TableFilter, jQuery, Device) {
        "use strict";
        var me;
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" });
        var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-dd" });
        var sapDateFormat2 = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyyMMdd" });
        var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({ pattern: "KK:mm:ss a" });
        var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;

        return Controller.extend("zuimatmaster.controller.Main", {
            onInit: function () {
                me = this;
                this._aColumns = {};
                this._aDataBeforeChange = [];
                this._validationErrors = [];
                this._bHdrChanged = false;
                this._bDtlChanged = false;
                this._dataMode = "READ";
                this._aColFilters = [];
                this._aColSorters = [];
                this._aMultiFiltersBeforeChange = [];
                this._aFilterableColumns = {};
                this._oViewSettingsDialog = {};
                this._sActiveTable = "headerTab";
                this._oModel = this.getOwnerComponent().getModel();
                this._tableValueHelp = TableValueHelp;
                this._tableFilter = TableFilter;
                this._colFilters = {};

                //Common.openLoadingDialog(this);
                this.setSmartFilterModel();
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_MM_FILTERS_CDS");
                oModel.read("/ZVB_3DERP_SBU_SH", {
                    success: function (oData, oResponse) {
                        //console.log(oData)
                        if (oData.results.length === 1) {
                            that.getView().getModel("ui").setProperty("/sbu", oData.results[0].SBU);
                        }
                        else {
                            //that.closeLoadingDialog();
                        }
                    },
                    error: function (err) { }
                });

                this.getView().setModel(new JSONModel({
                    acitveMatno: ""
                }), "ui");

                this._counts = {
                    header: 0,
                    attributes: 0,
                    batch: 0,
                    customInfo: 0,
                    plant: 0
                }

                this.getView().setModel(new JSONModel(this._counts), "counts");

                this.byId("headerTab")
                    .setModel(new JSONModel({
                        columns: [],
                        rows: []
                    }));

                this.byId("attributesTab")
                    .setModel(new JSONModel({
                        columns: [],
                        rows: []
                    }));

                this.byId("batchTab")
                    .setModel(new JSONModel({
                        columns: [],
                        rows: []
                    }));

                this.byId("customInfoTab")
                    .setModel(new JSONModel({
                        columns: [],
                        rows: []
                    }));

                this.byId("plantTab")
                    .setModel(new JSONModel({
                        columns: [],
                        rows: []
                    }));

                var oDDTextParam = [], oDDTextResult = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                oDDTextParam.push({ CODE: "SBU" });
                oDDTextParam.push({ CODE: "INFO_NO_RECORD_TO_PROC" });
                oDDTextParam.push({ CODE: "INFO_NO_SEL_RECORD_TO_PROC" });
                oDDTextParam.push({ CODE: "INFO_NO_LAYOUT" });
                oDDTextParam.push({ CODE: "INFO_LAYOUT_SAVE" });
                oDDTextParam.push({ CODE: "INFO_INPUT_REQD_FIELDS" });
                oDDTextParam.push({ CODE: "CONFIRM_DISREGARD_CHANGE" });
                oDDTextParam.push({ CODE: "INFO_SEL_RECORD_TO_DELETE" });
                oDDTextParam.push({ CODE: "INFO_DATA_DELETED" });
                oDDTextParam.push({ CODE: "CONF_DELETE_RECORDS" });
                oDDTextParam.push({ CODE: "INFO_ERROR" });
                oDDTextParam.push({ CODE: "INFO_NO_DATA_SAVE" });
                oDDTextParam.push({ CODE: "INFO_DATA_SAVE" });
                oDDTextParam.push({ CODE: "INFO_NO_DATA_EDIT" });
                oDDTextParam.push({ CODE: "INFO_CHECK_INVALID_ENTRIES" });
                oDDTextParam.push({ CODE: "ADD" });
                oDDTextParam.push({ CODE: "EDIT" });
                oDDTextParam.push({ CODE: "SAVE" });
                oDDTextParam.push({ CODE: "CANCEL" });
                oDDTextParam.push({ CODE: "DELETE" });
                oDDTextParam.push({ CODE: "REFRESH" });
                oDDTextParam.push({ CODE: "COPY" });
                oDDTextParam.push({ CODE: "HASGMC" });
                oDDTextParam.push({ CODE: "INFO_INPUT_REQD_FIELDS" });
                oDDTextParam.push({ CODE: "INFO_NO_DATA_MODIFIED" });
                oDDTextParam.push({ CODE: "INFO_DATA_COPIED" });

                oModel.create("/CaptionMsgSet", { CaptionMsgItems: oDDTextParam }, {
                    method: "POST",
                    success: function (oData, oResponse) {
                        oData.CaptionMsgItems.results.forEach(item => {
                            oDDTextResult[item.CODE] = item.TEXT;
                        })

                        me.getView().setModel(new JSONModel(oDDTextResult), "ddtext");
                    },
                    error: function (err) { }
                });

                var oTableEventDelegate = {
                    onkeyup: function (oEvent) {
                        me.onKeyUp(oEvent);
                    },

                    onAfterRendering: function (oEvent) {
                        var oControl = oEvent.srcControl;
                        var sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];

                        if (sTabId.substr(sTabId.length - 3) === "Tab") me._tableRendered = sTabId;
                        else me._tableRendered = "";

                        me.onAfterTableRendering();
                    },

                    onclick: function (oEvent) {
                        me.onTableClick(oEvent);
                    }
                };

                this.byId("headerTab").addEventDelegate(oTableEventDelegate);
                this.byId("attributesTab").addEventDelegate(oTableEventDelegate);
                this.byId("batchTab").addEventDelegate(oTableEventDelegate);
                this.byId("customInfoTab").addEventDelegate(oTableEventDelegate);
                this.byId("plantTab").addEventDelegate(oTableEventDelegate);
                this.getColumnProp();

                this.byId("headerTab").attachBrowserEvent("mousemove", function (oEvent) {
                    //get your model and do whatever you want:
                    console.log("mouseenter")
                });
                //this.getMain();

                //Material Type Resource
                this._oModel.read('/MatTypeSHSet', {
                    async: false,
                    success: function (oData) {
                        me.getView().setModel(new JSONModel(oData.results), "MTYP_MODEL");
                    },
                    error: function (err) { }
                })

                //Material Group
                this._oModel.read('/MatGrpRscSet', {
                    async: false,
                    success: function (oData) {
                        me.getView().setModel(new JSONModel(oData.results), "MATERIALGRP_MODEL");
                    },
                    error: function (err) { }
                })

                //Base UOM
                this._oModel.read('/UOMRscSet', {
                    async: false,
                    success: function (oData) {
                        me.getView().setModel(new JSONModel(oData.results), "BASEUOM_MODEL");
                    },
                    error: function (err) { }
                })

                //Weight UOM
                this._oModel.read('/WeightUnitSet', {
                    async: false,
                    success: function (oData) {
                        me.getView().setModel(new JSONModel(oData.results), "WTUOM_MODEL");
                    },
                    error: function (err) { }
                })

                //Volume UOM
                this._oModel.read('/VolumeUnitSet', {
                    async: false,
                    success: function (oData) {
                        me.getView().setModel(new JSONModel(oData.results), "VOLUOM_MODEL");
                    },
                    error: function (err) { }
                })

                //Process Code
                this._oModel.read('/ProcessRscSet', {
                    async: false,
                    success: function (oData) {
                        me.getView().setModel(new JSONModel(oData.results), "PROCESSCD_MODEL");
                    },
                    error: function (err) { }
                })

                //Dimension code
                this._oModel.read('/DimensionUnitSet', {
                    async: false,
                    success: function (oData) {
                        me.getView().setModel(new JSONModel(oData.results), "DIMUOM_MODEL");
                    },
                    error: function (err) { }
                })

                //Purchase Value
                this._oModel.read('/PurValKeyRscSet', {
                    async: false,
                    success: function (oData) {
                        me.getView().setModel(new JSONModel(oData.results), "PURCHASEVALUE_MODEL");
                    },
                    error: function (err) { }
                })
            },
            onSearch: function () {
                this.getMain();
            },
            setSmartFilterModel: function () {
                //Model StyleHeaderFilters is for the smartfilterbar
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_MM_FILTERS_CDS");
                var oSmartFilter = this.getView().byId("smartFilterBar");
                oSmartFilter.setModel(oModel);
            },
            getColumnProp: async function () {
                var sPath = jQuery.sap.getModulePath("zuimatmaster", "/model/columns.json");

                var oModelColumns = new JSONModel();
                await oModelColumns.loadData(sPath);

                var oColumns = oModelColumns.getData();
                this._oModelColumns = oModelColumns.getData();
                setTimeout(() => {

                    this.getDynamicColumns("MMHDR", "ZDVZERPMATL", "headerTab", oColumns);
                }, 100);

                setTimeout(() => {
                    this.getDynamicColumns("MMATTRIB", "ZERP_MATATTRIB", "attributesTab", oColumns);
                }, 100);

                setTimeout(() => {
                    this.getDynamicColumns("MMBATCH", "ZERP_MATBATCH", "batchTab", oColumns);
                }, 100);

                setTimeout(() => {
                    this.getDynamicColumns("MMCUSTOMINFO", "ZERP_MATCUSINFO", "customInfoTab", oColumns);
                }, 100);

                setTimeout(() => {
                    this.getDynamicColumns("MMPLANT", "MARC", "plantTab", oColumns);
                }, 100);
            },
            getDynamicColumns(arg1, arg2, arg3, arg4) {
                var me = this;
                var sType = arg1;
                var sTabName = arg2;
                var sTabId = arg3;
                var oLocColProp = arg4;
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                var vSBU = "VER";

                oModel.setHeaders({
                    sbu: vSBU,
                    type: sType,
                    tabname: sTabName
                });

                oModel.read("/ColumnsSet", {
                    success: function (oData, oResponse) {
                        if (oData.results.length > 0) {
                            if (oLocColProp[sTabId.replace("Tab", "")] !== undefined) {
                                oData.results.forEach(item => {
                                    oLocColProp[sTabId.replace("Tab", "")].filter(loc => loc.ColumnName === item.ColumnName)
                                        .forEach(col => {
                                            item.ValueHelp = col.ValueHelp;
                                            item.TextFormatMode = col.TextFormatMode;
                                        })
                                })
                            }

                            me._aColumns[sTabId.replace("Tab", "")] = oData.results;
                            me.setTableColumns(sTabId, oData.results);

                            var oDDTextResult = me.getView().getModel("ddtext").getData();
                            oData.results.forEach(item => {
                                oDDTextResult[item.ColumnName] = item.ColumnLabel;
                            })

                            me.getView().setModel(new JSONModel(oDDTextResult), "ddtext");
                        }
                    },
                    error: function (err) {
                    }
                });
            },
            setTableColumns(arg1, arg2) {
                var sTabId = arg1;
                var oColumns = arg2;
                var oTable = this.getView().byId(sTabId);
                oTable.getModel().setProperty("/columns", oColumns);
                //bind the dynamic column to the table
                oTable.bindColumns("/columns", function (index, context) {
                    var sColumnId = context.getObject().ColumnName;
                    var sColumnLabel = context.getObject().ColumnLabel;
                    var sColumnWidth = context.getObject().ColumnWidth;
                    var sColumnVisible = context.getObject().Visible;
                    var sColumnSorted = context.getObject().Sorted;
                    var sColumnSortOrder = context.getObject().SortOrder;
                    var sColumnDataType = context.getObject().DataType;

                    if (sColumnWidth === 0) sColumnWidth = 100;

                    var oText = new sap.m.Text({
                        wrapping: false,
                        //tooltip: sColumnDataType === "BOOLEAN" ? "" : "{" + sColumnId + "}"
                    })

                    var oColProp = me._aColumns[sTabId.replace("Tab", "")].filter(fItem => fItem.ColumnName === sColumnId);

                    if (oColProp && oColProp.length > 0 && oColProp[0].ValueHelp && oColProp[0].ValueHelp["items"].text && oColProp[0].ValueHelp["items"].value !== oColProp[0].ValueHelp["items"].text &&
                        oColProp[0].TextFormatMode && oColProp[0].TextFormatMode !== "Key") {
                        oText.bindText({
                            parts: [
                                { path: sColumnId }
                            ],
                            formatter: function (sKey) {
                                var oValue = me.getView().getModel(oColProp[0].ValueHelp["items"].path).getData().filter(v => v[oColProp[0].ValueHelp["items"].value] === sKey);

                                if (oValue && oValue.length > 0) {
                                    if (oColProp[0].TextFormatMode === "Value") {
                                        return oValue[0][oColProp[0].ValueHelp["items"].text];
                                    }
                                    else if (oColProp[0].TextFormatMode === "ValueKey") {
                                        return oValue[0][oColProp[0].ValueHelp["items"].text] + " (" + sKey + ")";
                                    }
                                    else if (oColProp[0].TextFormatMode === "KeyValue") {
                                        return sKey + " (" + oValue[0][oColProp[0].ValueHelp["items"].text] + ")";
                                    }
                                }
                                else return sKey;
                            }
                        });
                    }
                    else {
                        oText.bindText({
                            parts: [
                                { path: sColumnId }
                            ]
                        });
                    }

                    if (sTabId === 'headerTab') {
                        if (sColumnId === 'HASGMC') {
                            sColumnDataType = 'BOOLEAN';
                        }
                        else if (sColumnId === 'UEBTK') {
                            sColumnDataType = 'BOOLEAN';
                        }
                    }
                    else if (sTabId === 'plantTab') {
                        if (sColumnId === 'LVORM') {
                            sColumnDataType = 'BOOLEAN';
                        }
                    }

                    return new sap.ui.table.Column({
                        id: sTabId.replace("Tab", "") + "Col" + sColumnId,
                        label: new sap.m.Text({ text: sColumnLabel }),
                        //template: sColumnDataType === "BOOLEAN" ? new sap.m.CheckBox({ selected: '{' + sColumnId + '}' }) : oText,
                        template: sColumnDataType === "BOOLEAN" ? new sap.m.CheckBox({ selected: '{' + sColumnId + '}', editable: false }) : oText,
                        width: sColumnWidth + "px",
                        sortProperty: sColumnId,
                        // filterProperty: sColumnId,
                        autoResizable: true,
                        visible: sColumnVisible,
                        sorted: sColumnSorted,
                        hAlign: sColumnDataType === "NUMBER" ? "End" : sColumnDataType === "BOOLEAN" ? "Center" : "Begin",
                        sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending")
                    });
                });

                //date/number sorting
                oTable.attachSort(function (oEvent) {
                    var sPath = oEvent.getParameter("column").getSortProperty();
                    var bDescending = false;

                    oTable.getColumns().forEach(col => {
                        if (col.getSorted()) {
                            col.setSorted(false);
                        }
                    })

                    oEvent.getParameter("column").setSorted(true); //sort icon initiator

                    if (oEvent.getParameter("sortOrder") === "Descending") {
                        bDescending = true;
                        oEvent.getParameter("column").setSortOrder("Descending") //sort icon Descending
                    }
                    else {
                        oEvent.getParameter("column").setSortOrder("Ascending") //sort icon Ascending
                    }

                    var oSorter = new sap.ui.model.Sorter(sPath, bDescending); //sorter(columnData, If Ascending(false) or Descending(True))
                    var oColumn = oColumns.filter(fItem => fItem.ColumnName === oEvent.getParameter("column").getProperty("sortProperty"));
                    var columnType = oColumn[0].DataType;

                    if (columnType === "DATETIME") {
                        oSorter.fnCompare = function (a, b) {
                            // parse to Date object
                            var aDate = new Date(a);
                            var bDate = new Date(b);

                            if (bDate === null) { return -1; }
                            if (aDate === null) { return 1; }
                            if (aDate < bDate) { return -1; }
                            if (aDate > bDate) { return 1; }

                            return 0;
                        };
                    }
                    else if (columnType === "NUMBER") {
                        oSorter.fnCompare = function (a, b) {
                            // parse to Date object
                            var aNumber = +a;
                            var bNumber = +b;

                            if (bNumber === null) { return -1; }
                            if (aNumber === null) { return 1; }
                            if (aNumber < bNumber) { return -1; }
                            if (aNumber > bNumber) { return 1; }

                            return 0;
                        };
                    }

                    oTable.getBinding('rows').sort(oSorter);
                    // prevent internal sorting by table
                    oEvent.preventDefault();
                });

                TableFilter.updateColumnMenu(sTabId, this);
            },
            onTableClick(oEvent) {
                var oControl = oEvent.srcControl;
                var sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];

                while (sTabId.substr(sTabId.length - 3) !== "Tab") {
                    oControl = oControl.oParent;
                    sTabId = oControl.sId.split("--")[oControl.sId.split("--").length - 1];
                }

                if (this._dataMode === "READ") this._sActiveTable = sTabId;
                // console.log(this._sActiveTable);
            },
            onAfterTableRendering: function (oEvent) {
                if (this._tableRendered !== "") {
                    this.setActiveRowHighlightByTableId(this._tableRendered);
                    this._tableRendered = "";
                }
            },
            setActiveRowHighlightByTableId(arg) {
                var oTable = this.byId(arg);

                setTimeout(() => {
                    var iActiveRowIndex = oTable.getModel().getData().rows.findIndex(item => item.ACTIVE === "X");

                    oTable.getRows().forEach(row => {
                        if (row.getBindingContext() && +row.getBindingContext().sPath.replace("/rows/", "") === iActiveRowIndex) {
                            row.addStyleClass("activeRow");
                        }
                        else row.removeStyleClass("activeRow");
                    })
                }, 10);
            },
            getMain() {
                Common.openLoadingDialog(this);
                var oModel = this.getOwnerComponent().getModel();
                var aFilters = this.getView().byId("smartFilterBar").getFilters();
                console.log("aFilters", aFilters);
                var _this = this;
                var vSBU = 'VER'
                oModel.read('/MaterialSet', {
                    filters: aFilters,
                    // urlParameters: {
                    //     "$filter": "SBU eq '" + vSBU + "'"
                    // },
                    success: function (data, response) {
                        if (data.results.length > 0) {
                            data.results.sort((a, b) => new Date(b.CREATEDDT) - new Date(a.CREATEDDT) || parseInt(b.MATERIALNO) - parseInt(a.MATERIALNO));
                        }
                        data.results.forEach((item, index) => {
                            item.HASGMC = item.HASGMC === "X" ? true : false;
                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT));

                            if (item.UPDATEDDATE !== null)
                                item.UPDATEDDATE = dateFormat.format(new Date(item.UPDATEDDATE));
                            if (index === 0) {
                                me.getView().getModel("ui").setProperty("/acitveMatno", item.MATERIALNO);
                                me.getAttributes(item.MATERIALNO);
                                me.getBatch(item.MATERIALNO);
                                me.getCustomInfo(item.MATERIALNO);
                                me.getPlant(item.MATERIALNO);
                            }
                        });
                        me.byId("headerTab").getModel().setProperty("/rows", data.results);
                        me.byId("headerTab").bindRows("/rows");
                        me.getView().getModel("counts").setProperty("/header", data.results.length);
                        //me.setActiveRowHighlight("headerTab");


                        Common.closeLoadingDialog(me);
                    },
                    error: function (err) {
                        Common.closeLoadingDialog(me);
                    }
                });
            },
            getAttributes(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var oEntitySet = "/MaterialAtrribSet";
                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "MATNO eq '" + arg + "'"
                    },
                    success: function (data, response) {
                        if (data.results.length > 0) {
                            data.results.forEach(item => {
                                if (item.CREATEDDT !== null) {
                                    item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT));
                                }

                                if (item.UPDATEDDT !== null) {
                                    item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT));
                                }
                            })
                        }
                        me.byId("attributesTab").getModel().setProperty("/rows", data.results);
                        me.byId("attributesTab").bindRows("/rows");
                        me.getView().getModel("counts").setProperty("/attributes", data.results.length);
                        Common.closeLoadingDialog(me);
                    },
                    error: function (err) {
                        Common.closeLoadingDialog(me);
                    }
                })
            },
            getBatch(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var oEntitySet = "/MaterialBatchSet";
                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "MATNO eq '" + arg + "'"
                    },
                    success: function (data, response) {
                        if (data.results.length > 0) {
                            data.results.forEach(item => {
                                if (item.CREATEDDT !== null) {
                                    item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT));
                                }

                                if (item.UPDATEDDT !== null) {
                                    item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT));
                                }
                            })
                        }
                        me.byId("batchTab").getModel().setProperty("/rows", data.results);
                        me.byId("batchTab").bindRows("/rows");
                        me.getView().getModel("counts").setProperty("/batch", data.results.length);
                        Common.closeLoadingDialog(me);
                    },
                    error: function (err) {
                        Common.closeLoadingDialog(me);
                    }
                })
            },
            getCustomInfo(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var oEntitySet = "/MaterialCusInfoSet";
                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "MATNO eq '" + arg + "'"
                    },
                    success: function (data, response) {
                        if (data.results.length > 0) {
                            data.results.forEach(item => {
                                if (item.CREATEDDT !== null) {
                                    item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT));
                                }

                                if (item.UPDATEDDT !== null) {
                                    item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT));
                                }
                            })
                        }
                        me.byId("customInfoTab").getModel().setProperty("/rows", data.results);
                        me.byId("customInfoTab").bindRows("/rows");
                        me.getView().getModel("counts").setProperty("/customInfo", data.results.length);
                        Common.closeLoadingDialog(me);
                    },
                    error: function (err) {
                        Common.closeLoadingDialog(me);
                    }
                })
            },
            getPlant(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var oEntitySet = "/PlantSet";
                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "MATNR eq '" + arg + "'"
                    },
                    success: function (data, response) {
                        if (data.results.length > 0) {
                            data.results.forEach(item => {
                                if (item.CREATEDDT !== null) {
                                    item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT));
                                }

                                if (item.UPDATEDDT !== null) {
                                    item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT));
                                }
                            })
                        }
                        me.byId("plantTab").getModel().setProperty("/rows", data.results);
                        me.byId("plantTab").bindRows("/rows");
                        me.getView().getModel("counts").setProperty("/plant", data.results.length);
                        Common.closeLoadingDialog(me);
                    },
                    error: function (err) {
                        Common.closeLoadingDialog(me);
                    }
                })
            },
            //******************************************* */
            // Column Filtering
            //******************************************* */

            onColFilterClear: function (oEvent) {
                TableFilter.onColFilterClear(oEvent, this);
            },

            onColFilterCancel: function (oEvent) {
                TableFilter.onColFilterCancel(oEvent, this);
            },

            onColFilterConfirm: function (oEvent) {
                TableFilter.onColFilterConfirm(oEvent, this);
            },

            onFilterItemPress: function (oEvent) {
                TableFilter.onFilterItemPress(oEvent, this);
            },

            onFilterValuesSelectionChange: function (oEvent) {
                TableFilter.onFilterValuesSelectionChange(oEvent, this);
            },

            onSearchFilterValue: function (oEvent) {
                TableFilter.onSearchFilterValue(oEvent, this);
            },

            onCustomColFilterChange: function (oEvent) {
                TableFilter.onCustomColFilterChange(oEvent, this);
            },

            onSetUseColFilter: function (oEvent) {
                TableFilter.onSetUseColFilter(oEvent, this);
            },

            onRemoveColFilter: function (oEvent) {
                TableFilter.onRemoveColFilter(oEvent, this);
            },
            onRefresh: function (oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;
                this.refreshData();
            },
            refreshData() {
                if (this._dataMode === "READ") {
                    this._aColFilters = this.byId(this._sActiveTable).getBinding("rows").aFilters;
                    this._aColSorters = this.byId(this._sActiveTable).getBinding("rows").aSorters;

                    if (this._sActiveTable === "headerTab") {
                        this.getMain();
                    }
                    // else if (this._sActiveTable === "detailTab") {
                    //     Common.openLoadingDialog(me);
                    //     var vHUID = this.getView().getModel("ui").getData().HUID;
                    //     var vHUTYP = this.getView().getModel("ui").getData().HUTYP;
                    //     me.getDtls(vHUID, vHUTYP === 'ROL' || vHUTYP === 'CTN' ? 'X' : '');
                    // }
                }
            },
            onCreate: function (oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;
                this.onTableResize("Hdr", "Max");
                //this.byId("btnExitFullScreenDtls").setVisible(false);
                this.createData();
            },
            createData() {
                if (this._dataMode === "READ") {
                    if (this._sActiveTable === "headerTab") {
                        this.byId("btnAddHdr").setVisible(false);
                        this.byId("btnEditHdr").setVisible(false);
                        this.byId("btnDeleteHdr").setVisible(false);
                        this.byId("btnRefreshHdr").setVisible(false);
                        this.byId("btnSaveHdr").setVisible(true);
                        this.byId("btnCancelHdr").setVisible(true);
                        //this.byId("searchFieldHdr").setVisible(false);
                        this.byId("btnFullScreenHdr").setVisible(false);
                        this.byId("btnExitFullScreenHdr").setVisible(false);

                        this.byId("btnSettingsHdr").setVisible(false);
                    }

                    var oTable = this.byId(this._sActiveTable);
                    this._aDataBeforeChange = jQuery.extend(true, [], oTable.getModel().getData().rows);
                    this._validationErrors = [];

                    if (oTable.getBinding("rows").aApplicationFilters.length > 0) {
                        this._aMultiFiltersBeforeChange = this._aFilterableColumns["gmc"].filter(fItem => fItem.value !== "");
                        oTable.getBinding("rows").filter("", "Application");
                    }

                    if (oTable.getBinding("rows").aFilters.length > 0) {
                        this._aColFilters = jQuery.extend(true, [], oTable.getBinding("rows").aFilters);
                        // this._aColFilters = oTable.getBinding("rows").aFilters;
                        oTable.getBinding("rows").aFilters = [];
                    }

                    if (oTable.getBinding("rows").aSorters.length > 0) {
                        this._aColSorters = jQuery.extend(true, [], oTable.getBinding("rows").aSorters);
                    }

                    var oColumns = oTable.getColumns();

                    for (var i = 0, l = oColumns.length; i < l; i++) {
                        var isFiltered = oColumns[i].getFiltered();

                        if (isFiltered) {
                            oColumns[i].filter("");
                        }
                    }

                    this.setRowCreateMode();
                    // sap.ushell.Container.setDirtyFlag(true);
                }
            },
            setRowCreateMode() {
                var oTable = this.byId(this._sActiveTable);
                var aNewRow = [];
                var oNewRow = {};

                oTable.getColumns().forEach((col, idx) => {
                    var sColName = "";
                    var oValueHelp = false;

                    if (col.mAggregations.template.mBindingInfos.text !== undefined) {
                        sColName = col.mAggregations.template.mBindingInfos.text.parts[0].path;
                    }
                    else if (col.mAggregations.template.mBindingInfos.selected !== undefined) {
                        sColName = col.mAggregations.template.mBindingInfos.selected.parts[0].path;
                    }

                    this._aColumns[this._sActiveTable.replace("Tab", "")].filter(item => item.ColumnName === sColName)
                        .forEach(ci => {
                            if (ci.Editable || ci.Creatable) {
                                if (ci.ValueHelp !== undefined) oValueHelp = ci.ValueHelp["show"];

                                if (oValueHelp) {
                                    var bValueFormatter = false;
                                    var sSuggestItemText = ci.ValueHelp["SuggestionItems"].text;
                                    var sSuggestItemAddtlText = ci.ValueHelp["SuggestionItems"].additionalText !== undefined ? ci.ValueHelp["SuggestionItems"].additionalText : '';
                                    var sTextFormatMode = "Key";

                                    if (ci.TextFormatMode && ci.TextFormatMode !== "" && ci.TextFormatMode !== "Key" && ci.ValueHelp["items"].value !== ci.ValueHelp["items"].text) {
                                        sTextFormatMode = ci.TextFormatMode;
                                        bValueFormatter = true;

                                        if (ci.ValueHelp["SuggestionItems"].additionalText && ci.ValueHelp["SuggestionItems"].text !== ci.ValueHelp["SuggestionItems"].additionalText) {
                                            if (sTextFormatMode === "ValueKey" || sTextFormatMode === "Value") {
                                                sSuggestItemText = ci.ValueHelp["SuggestionItems"].additionalText;
                                                sSuggestItemAddtlText = ci.ValueHelp["SuggestionItems"].text;
                                            }
                                        }
                                    }

                                    // Assuming me and ci are defined appropriately
                                    var oInput = new sap.m.Input({
                                        type: "Text",
                                        showValueHelp: true,
                                        valueHelpRequest: TableValueHelp.handleTableValueHelp.bind(this),
                                        showSuggestion: true,
                                        maxSuggestionWidth: ci.ValueHelp["SuggestionItems"]?.additionalText ? ci.ValueHelp["SuggestionItems"].maxSuggestionWidth : "1px",
                                        suggestionItems: {
                                            path: ci.ValueHelp["SuggestionItems"].path,
                                            length: 10000,
                                            template: new sap.ui.core.ListItem({
                                                key: ci.ValueHelp["SuggestionItems"].text,
                                                text: sSuggestItemText,
                                                additionalText: sSuggestItemAddtlText,
                                            }),
                                            templateShareable: false
                                        },
                                        change: this.handleValueHelpChange.bind(this)
                                    });

                                    if (bValueFormatter) {
                                        oInput.setProperty("textFormatMode", sTextFormatMode);

                                        // Using optional chaining (?.) to simplify property access
                                        oInput.bindValue({
                                            parts: [
                                                { path: sColName },
                                                { value: ci.ValueHelp?.items?.path },
                                                { value: ci.ValueHelp?.items?.value },
                                                { value: ci.ValueHelp?.items?.text },
                                                { value: sTextFormatMode }
                                            ],
                                            formatter: this.formatValueHelp.bind(this)
                                        });
                                    } else {
                                        oInput.bindValue({
                                            parts: [{ path: sColName }]
                                        });
                                    }

                                    col.setTemplate(oInput);
                                }
                                else if (ci.DataType === "DATETIME") {
                                    if (this._sActiveTable === "costHdrTab" && sColName === "CSDATE") {
                                        col.setTemplate(new sap.m.DatePicker({
                                            value: "{path: '" + ci.ColumnName + "', mandatory: '" + ci.Mandatory + "'}",
                                            displayFormat: "MM/dd/yyyy",
                                            valueFormat: "MM/dd/yyyy",
                                            change: this.onInputLiveChange.bind(this),
                                            enabled: {
                                                path: "COSTSTATUS",
                                                formatter: function (COSTSTATUS) {
                                                    if (COSTSTATUS === "REL") { return false }
                                                    else { return true }
                                                }
                                            }
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.DatePicker({
                                            value: "{path: '" + ci.ColumnName + "', mandatory: '" + ci.Mandatory + "'}",
                                            displayFormat: "MM/dd/yyyy",
                                            valueFormat: "MM/dd/yyyy",
                                            change: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                }
                                else if (ci.DataType === "NUMBER") {
                                    // console.log("a3 NUMBER " + sColName);
                                    col.setTemplate(new sap.m.Input({
                                        type: sap.m.InputType.Number,
                                        textAlign: sap.ui.core.TextAlign.Right,
                                        value: "{path:'" + sColName + "', formatOptions:{ minFractionDigits:" + ci.Decimal + ", maxFractionDigits:" + ci.Decimal + " }, constraints:{ precision:" + ci.Length + ", scale:" + ci.Decimal + " }}",
                                        // change: this.onNumberChange.bind(this),
                                        liveChange: this.onNumberLiveChange.bind(this)
                                    }));
                                }
                                else if (ci.DataType === "BOOLEAN") {
                                    col.setTemplate(new sap.m.CheckBox({ selected: "{" + sColName + "}", editable: true }));
                                }
                                else {
                                    if (this._sActiveTable === "ioMatListTab" && sColName === "MATDESC1") {
                                        col.setTemplate(new sap.m.Input({
                                            type: "Text",
                                            value: "{" + sColName + "}",
                                            maxLength: ci.Length,
                                            change: this.onInputLiveChange.bind(this),
                                            enabled: {
                                                path: "MATNO",
                                                formatter: function (MATNO) {
                                                    if (MATNO !== "") { return false }
                                                    else { return true }
                                                }
                                            }
                                        }));
                                    }
                                    else if (this._sActiveTable === "costHdrTab" && sColName === "VERDESC") {
                                        col.setTemplate(new sap.m.Input({
                                            type: "Text",
                                            value: "{" + sColName + "}",
                                            maxLength: ci.Length,
                                            change: this.onInputLiveChange.bind(this),
                                            enabled: {
                                                path: "COSTSTATUS",
                                                formatter: function (COSTSTATUS) {
                                                    if (COSTSTATUS === "REL") { return false }
                                                    else { return true }
                                                }
                                            }
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            type: "Text",
                                            value: "{" + sColName + "}",
                                            maxLength: ci.Length,
                                            change: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                }

                                if (ci.Mandatory) {
                                    col.getLabel().addStyleClass("sapMLabelRequired");
                                }

                                if (ci.DataType === "STRING") oNewRow[sColName] = "";
                                else if (ci.DataType === "NUMBER") oNewRow[sColName] = 0;
                                else if (ci.DataType === "BOOLEAN") oNewRow[sColName] = false;
                            }
                        })
                })

                oNewRow["NEW"] = true;
                aNewRow.push(oNewRow);

                this.byId(this._sActiveTable).getModel().setProperty("/rows", aNewRow);
                this.byId(this._sActiveTable).bindRows("/rows");
                this._dataMode = "NEW";

                oTable.focus();
            },
            setRowReadMode() {
                var oTable = this.byId(this._sActiveTable);
                var sColName = "";
                oTable.getColumns().forEach((col, idx) => {
                    if (col.mAggregations.template.mBindingInfos.text !== undefined) {
                        sColName = col.mAggregations.template.mBindingInfos.text.parts[0].path;
                    }
                    else if (col.mAggregations.template.mBindingInfos.selected !== undefined) {
                        sColName = col.mAggregations.template.mBindingInfos.selected.parts[0].path;
                    }
                    else if (col.mAggregations.template.mBindingInfos.value !== undefined) {
                        sColName = col.mAggregations.template.mBindingInfos.value.parts[0].path;
                    }

                    this._aColumns[this._sActiveTable.replace("Tab", "")].filter(item => item.ColumnName === sColName)
                        .forEach(ci => {
                            if (ci.TextFormatMode && ci.TextFormatMode !== "" && ci.TextFormatMode !== "Key" && ci.ValueHelp && ci.ValueHelp["items"].text && ci.ValueHelp["items"].value !== ci.ValueHelp["items"].text) {
                                col.setTemplate(new sap.m.Text({
                                    text: {
                                        parts: [
                                            { path: sColName }
                                        ],
                                        formatter: function (sKey) {
                                            var oValue = me.getView().getModel(ci.ValueHelp["items"].path).getData().filter(v => v[ci.ValueHelp["items"].value] === sKey);

                                            if (oValue && oValue.length > 0) {
                                                if (ci.TextFormatMode === "Value") {
                                                    return oValue[0][ci.ValueHelp["items"].text];
                                                }
                                                else if (ci.TextFormatMode === "ValueKey") {
                                                    return oValue[0][ci.ValueHelp["items"].text] + " (" + sKey + ")";
                                                }
                                                else if (ci.TextFormatMode === "KeyValue") {
                                                    return sKey + " (" + oValue[0][ci.ValueHelp["items"].text] + ")";
                                                }
                                            }
                                            else return sKey;
                                        }
                                    },
                                    wrapping: false
                                    //tooltip: "{" + sColName + "}"
                                }));
                            }
                            else if (ci.DataType === "STRING" || ci.DataType === "DATETIME" || ci.DataType === "NUMBER") {
                                col.setTemplate(new sap.m.Text({
                                    text: "{" + sColName + "}",
                                    wrapping: false
                                    //tooltip: "{" + sColName + "}"
                                }));
                            }
                            else if (ci.DataType === "BOOLEAN") {
                                col.setTemplate(new sap.m.CheckBox({
                                    selected: "{" + sColName + "}",
                                    editable: false
                                }));

                            }
                        })

                    col.getLabel().removeStyleClass("sapMLabelRequired");
                })

                this.byId(this._sActiveTable).getModel().getData().rows.forEach(item => item.EDITED = false);
            },
            onTableResize(arg1, arg2) {
                if (arg1 === 'Attr') {
                    if (arg2 === 'Max') {
                        this.byId("headerTab").setVisible(false);
                        this.byId("btnFullScreenAttr").setVisible(false);
                        this.byId("btnExitFullScreenAttr").setVisible(true);
                    }
                    else {
                        this.byId("headerTab").setVisible(true);
                        this.byId("btnFullScreenAttr").setVisible(true);
                        this.byId("btnExitFullScreenAttr").setVisible(false);
                    }
                }
                else {
                    if (arg2 === 'Max') {
                        this.byId("itbDetail").setVisible(false);
                        this.byId("btnFullScreenHdr").setVisible(false);
                        this.byId("btnExitFullScreenHdr").setVisible(true);
                    }
                    else {
                        this.byId("itbDetail").setVisible(true);
                        this.byId("btnFullScreenHdr").setVisible(true);
                        this.byId("btnExitFullScreenHdr").setVisible(false);
                    }
                }

            },
            onInputLiveChange: function (oEvent) {

                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;

                this.byId(this._sActiveTable).getModel().setProperty(sRowPath + '/EDITED', true);

                if (this._sActiveTable === "headerTab") this._bHdrChanged = true;
                else if (this._sActiveTable === "detailTab") this._bDtlChanged = true;
            },
            onNumberLiveChange: function (oEvent) {
                var oSource = oEvent.getSource();
                var vColDecPlaces = oSource.getBindingInfo("value").constraints.scale;
                var vColLength = oSource.getBindingInfo("value").constraints.precision;

                if (oEvent.getParameters().value.split(".")[0].length > (vColLength - vColDecPlaces)) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Enter a number with a maximum whole number length of " + (vColLength - vColDecPlaces));

                    if (this._validationErrors.filter(fItem => fItem === oEvent.getSource().getId()).length === 0) {
                        this._validationErrors.push(oEvent.getSource().getId());
                    }
                }
                else if (oEvent.getParameters().value.split(".").length > 1) {
                    if (vColDecPlaces === 0) {
                        oEvent.getSource().setValueState("Error");
                        oEvent.getSource().setValueStateText("Enter a number without decimal place/s");

                        if (this._validationErrors.filter(fItem => fItem === oEvent.getSource().getId()).length === 0) {
                            this._validationErrors.push(oEvent.getSource().getId());
                        }
                    }
                    else {
                        if (oEvent.getParameters().value.split(".")[1].length > vColDecPlaces) {
                            oEvent.getSource().setValueState("Error");
                            oEvent.getSource().setValueStateText("Enter a number with a maximum of " + vColDecPlaces.toString() + " decimal places");

                            if (this._validationErrors.filter(fItem => fItem === oEvent.getSource().getId()).length === 0) {
                                this._validationErrors.push(oEvent.getSource().getId());
                            }
                        }
                        else {
                            oEvent.getSource().setValueState("None");
                            this._validationErrors.forEach((item, index) => {
                                if (item === oEvent.getSource().getId()) {
                                    this._validationErrors.splice(index, 1);
                                }
                            })
                        }
                    }
                }
                else {
                    oEvent.getSource().setValueState("None");
                    this._validationErrors.forEach((item, index) => {
                        if (item === oEvent.getSource().getId()) {
                            this._validationErrors.splice(index, 1);
                        }
                    })
                }

                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;

                this.byId(this._sActiveTable).getModel().setProperty(sRowPath + '/EDITED', true);

                if (this._sActiveTable === "headerTab") this._bHdrChanged = true;
                else if (this._sActiveTable === "detailTab") this._bDtlChanged = true;
            },
            handleValueHelpChange: function (oEvent) {
                var oSource = oEvent.getSource();
                var sRowPath = oSource.oParent.getBindingContext().sPath;
                var isInvalid = !oSource.getSelectedKey() && oSource.getValue().trim();
                var sModel = oSource.getBindingInfo("suggestionItems").model;
                var vSBU = 'VER';
                oSource.getSuggestionItems().forEach(item => {
                    if (oSource.getSelectedKey() === "" && oSource.getValue() !== "") {
                        if (oSource.getProperty("textFormatMode") === "ValueKey" && ((item.getProperty("text") + " (" + item.getProperty("key") + ")") === oSource.getValue())) {
                            oSource.setSelectedKey(item.getProperty("key"));
                            isInvalid = false;
                            oSource.setValueState(isInvalid ? "Error" : "None");
                        }
                        else if ((oSource.getProperty("textFormatMode") === "Value" || oSource.getProperty("textFormatMode") === "Key") && (item.getProperty("key") === oSource.getValue())) {
                            oSource.setSelectedKey(item.getProperty("key"));
                            isInvalid = false;
                            oSource.setValueState(isInvalid ? "Error" : "None");
                        }
                    }
                    else if (item.getProperty("key") === oSource.getSelectedKey()) {
                        isInvalid = false;
                        oSource.setValueState(isInvalid ? "Error" : "None");
                    }
                })

                if (isInvalid) this._validationErrors.push(oEvent.getSource().getId());
                else {
                    const model = this.byId(this._sActiveTable).getModel();
                    switch (sModel) {
                        case 'MTYP_MODEL':
                            var oTable = this.getView().byId("headerTab");
                            var mtypData = me.getView().getModel("MTYP_MODEL").getData().filter(item => item.Mattyp === oSource.getSelectedKey());
                            model.setProperty(sRowPath + '/HASGMC', mtypData[0].Hasgmc === 'X' ? true : false);
                            model.setProperty(sRowPath + '/GROSSWT', "0.000");
                            model.setProperty(sRowPath + '/NETWT', "0.000");
                            model.setProperty(sRowPath + '/VOLUME', "0.000");
                            model.setProperty(sRowPath + '/UEBTK', false);
                            model.setProperty(sRowPath + '/MATERIALGROUP', "");
                            model.setProperty(sRowPath + '/GMC', "");
                            model.setProperty(sRowPath + '/BASEUOM', "");
                            model.setProperty(sRowPath + '/WTUOM', "");
                            model.setProperty(sRowPath + '/VOLUMEUOM', "");
                            model.setProperty(sRowPath + '/MATERIALGROUP', "");
                            model.setProperty(sRowPath + '/CUSTMATCODE', "");
                            model.setProperty(sRowPath + '/PROCESSCODE', "");
                            model.setProperty(sRowPath + '/UEBTO', "");
                            model.setProperty(sRowPath + '/UNTTO', "");
                            model.setProperty(sRowPath + '/UEBTK', false);

                            if (mtypData[0].Hasgmc === 'X') {
                                oTable.getColumns().forEach((col, idx) => {
                                    const columnId = col.getId().replace(this._sActiveTable.replace("Tab", "") + "Col", "");
                                    switch (columnId) {
                                        case 'MATERIALGROUP':
                                        case 'GROSSWT':
                                        case 'NETWT':
                                        case 'WTUOM':
                                        case 'VOLUME':
                                        case 'VOLUMEUOM':
                                        case 'CUSTMATLNO':
                                        case 'PROCESSCODE':
                                        case 'ORDERUOM':
                                        case 'BASEUOM':
                                        case 'GROSSWT': {
                                            oTable.getRows()[0].getCells()[idx].setProperty("editable", false);
                                            break;
                                        }
                                        case 'GMC': {
                                            oTable.getRows()[0].getCells()[idx].setProperty("editable", true);
                                            break;
                                        }
                                    }
                                });

                                this._oModel.read('/GMCRscSet', {
                                    urlParameters: {
                                        "$filter": "Mattyp eq '" + oSource.getSelectedKey() + "' and Sbu eq '" + vSBU + "'"
                                    },
                                    async: false,
                                    success: function (oData) {
                                        me.getView().setModel(new JSONModel(oData.results), "GMC_MODEL");
                                    },
                                    error: function (err) { }
                                })
                            }
                            else {
                                oTable.getColumns().forEach((col, idx) => {
                                    const columnId = col.getId().replace(this._sActiveTable.replace("Tab", "") + "Col", "");
                                    switch (columnId) {
                                        case 'MATERIALGROUP':
                                        case 'GROSSWT':
                                        case 'NETWT':
                                        case 'WTUOM':
                                        case 'VOLUME':
                                        case 'VOLUMEUOM':
                                        case 'CUSTMATLNO':
                                        case 'PROCESSCODE':
                                        case 'ORDERUOM':
                                        case 'BASEUOM':
                                        case 'GROSSWT': {
                                            oTable.getRows()[0].getCells()[idx].setProperty("editable", true);
                                            break;
                                        }
                                        case 'GMC': {
                                            oTable.getRows()[0].getCells()[idx].setProperty("editable", false);
                                            break;
                                        }
                                    }
                                });
                            }
                            break;
                        case 'GMC_MODEL':
                            var gmcData = me.getView().getModel("GMC_MODEL").getData().filter(item => item.Gmc === oSource.getSelectedKey());
                            model.setProperty(sRowPath + '/MATERIALGROUP', "");
                            model.setProperty(sRowPath + '/BASEUOM', "");
                            model.setProperty(sRowPath + '/GROSSWT', "");
                            model.setProperty(sRowPath + '/NETWT', "");
                            model.setProperty(sRowPath + '/WTUOM', "");
                            model.setProperty(sRowPath + '/VOLUME', "");
                            model.setProperty(sRowPath + '/VOLUMEUOM', "");
                            model.setProperty(sRowPath + '/CUSTMATCODE', "");

                            model.setProperty(sRowPath + '/MATERIALGROUP', gmcData[0].Matgrpcd);
                            model.setProperty(sRowPath + '/BASEUOM', gmcData[0].Baseuom);
                            model.setProperty(sRowPath + '/GROSSWT', gmcData[0].Grswt);
                            model.setProperty(sRowPath + '/NETWT', gmcData[0].Netwt);
                            model.setProperty(sRowPath + '/WTUOM', gmcData[0].Wtuom);
                            model.setProperty(sRowPath + '/VOLUME', gmcData[0].Volume);
                            model.setProperty(sRowPath + '/VOLUMEUOM', gmcData[0].Voluom);
                            model.setProperty(sRowPath + '/CUSTMATCODE', gmcData[0].Cusmatcd);
                            break;
                        case 'PURCHASEVALUE_MODEL':
                            var purchaseKeyData = me.getView().getModel("PURCHASEVALUE_MODEL").getData().filter(item => item.Ekwsl === oSource.getSelectedKey());
                            model.setProperty(sRowPath + '/UEBTO', "");
                            model.setProperty(sRowPath + '/UNTTO', "");
                            model.setProperty(sRowPath + '/UEBTK', false);

                            model.setProperty(sRowPath + '/UEBTO', purchaseKeyData[0].Uebto);
                            model.setProperty(sRowPath + '/UNTTO', purchaseKeyData[0].Untto);
                            model.setProperty(sRowPath + '/UEBTK', purchaseKeyData[0].Uebtk === "X" ? true : false);
                            break;
                    }
                }

                this.byId(this._sActiveTable).getModel().setProperty(sRowPath + '/EDITED', true);

                if (this._sActiveTable === "headerTab") this._bHdrChanged = true;
                else if (this._sActiveTable === "detailTab") this._bDtlChanged = true;
            },
            onSaveHdr() {
                var aNewRows = this.byId(this._sActiveTable).getModel().getData().rows.filter(item => item.NEW === true);
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var vSBU = 'VER';

                console.log("aNewRows", aNewRows);
                this.onMaterialTypeClassDialog(aNewRows[0]);

                oModel.read('/MRPTypeSet', {
                    urlParameters: {
                        "$filter": "Screencode eq 'BAPI_MATNR' and Mtart eq '" + aNewRows[0].MATERIALTYPE + "'"
                    },
                    success: function (data, response) {
                        oJSONModel.setData(data);
                        me.getView().setModel(oJSONModel, "mrpTypeClass");
                    },
                    error: function (err) {
                        MessageBox.information(err);
                    }
                })

                var oModel1 = this.getOwnerComponent().getModel();
                var oJSONModel1 = new JSONModel();
                oModel1.read('/MatPlantSet', {
                    urlParameters: {
                        "$filter": "SBU eq '" + vSBU + "'"
                    },
                    success: function (data, response) {
                        oJSONModel1.setData(data);
                        me.getView().setModel(oJSONModel1, "matPlantClass");

                    },
                    error: function (err) {
                    }
                })
            },
            createDialog: null,
            onMaterialTypeClassDialog(args) {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var _this = this;
                this.newMattyp = args.MATERIALTYPE;
                oModel.read('/MatTypeClassSet', {
                    urlParameters: {
                        "$filter": "Mattyp eq '" + this.newMattyp + "'"
                    },
                    success: function (data, response) {
                        data.results.forEach(item => {
                            item.Descen = '';
                            item.Desczh = '';
                            item.Attrib = item.Attrib === "X" ? true : false;
                            item.Createddt = dateFormat.format(item.Createddt);
                            item.Updateddt = dateFormat.format(item.Updateddt);
                            item.DescInput = item.Attrib === "X" ? false : true;
                        })

                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "mtClassModel");

                        _this.createViewSettingsDialog("matTypeClass",
                            new JSONModel({
                                items: data.results,
                                rowCount: data.results.length
                            })
                        );

                        var oDialog = _this._oViewSettingsDialog["zuimatmaster.view.fragments.MaterialTypeClassDialog"];
                        oDialog.getModel().setProperty("/items", data.results);
                        oDialog.getModel().setProperty("/rowCount", data.results.length);
                        oDialog.open();
                    },
                    error: function (err) { }
                })
            },
            createViewSettingsDialog: function (arg1, arg2) {
                var sDialogFragmentName = null;

                if (arg1 === "sort") sDialogFragmentName = "zuimatmaster.view.SortDialog";
                else if (arg1 === "filter") sDialogFragmentName = "zuimatmaster.view.FilterDialog";
                else if (arg1 === "column") sDialogFragmentName = "zuimatmaster.view.ColumnDialog";
                else if (arg1 === "matTypeClass") sDialogFragmentName = "zuimatmaster.view.fragments.MaterialTypeClassDialog";

                var oViewSettingsDialog = this._oViewSettingsDialog[sDialogFragmentName];

                if (!oViewSettingsDialog) {
                    oViewSettingsDialog = sap.ui.xmlfragment(sDialogFragmentName, this);

                    if (Device.system.desktop) {
                        oViewSettingsDialog.addStyleClass("sapUiSizeCompact");
                    }

                    oViewSettingsDialog.setModel(arg2);

                    this._oViewSettingsDialog[sDialogFragmentName] = oViewSettingsDialog;
                    this.getView().addDependent(oViewSettingsDialog);
                }
                else {
                    oViewSettingsDialog.setModel(arg2);
                }
            },
            onCreateMMCancel() {
                this._oViewSettingsDialog["zuimatmaster.view.fragments.MaterialTypeClassDialog"].close();
            },
            onCreateMMSave() {
                var _aDescen = [], _aDesczh = [];
                var _this = this;

                this.getView().getModel("mtClassModel").getData().results.forEach(item => {
                    if (item.Desczh === '') item.Desczh = item.Descen;

                    if (item.Inclindesc === 'X') {
                        if (item.Descen !== '') _aDescen.push(item.Descen);
                        if (item.Desczh !== '') _aDesczh.push(item.Desczh);
                    }
                })

                if (_aDescen.join('') === '') {
                    MessageBox.information("At least one description should be specified.");
                }
                else {
                    Common.openProcessingDialog(me, "Processing...");

                    var _descen = _aDescen.join(', ');
                    var _desczh = _aDesczh.join(', ');
                    var _param = {};
                    var dismm = '';
                    var _MatImportParamSet = [];
                    var aNewRows = this.byId(this._sActiveTable).getModel().getData().rows.filter(item => item.NEW === true);
                    var _paramAttrib = [];

                    this.getView().getModel("mtClassModel").getData().results.forEach((item, index) => {
                        _paramAttrib.push({
                            "Seq": "1",
                            "Seqno": (index + 1) + "",
                            "Mattypcls": item.Mattypcls,
                            "Attribcd": item.Attribcd,
                            "Descen": item.Descen,
                            "Desczh": item.Desczh
                        })
                    });

                    _MatImportParamSet.push({
                        "Seq": "1",
                        "Seqno": "1",
                        "Ind_sector": "J",
                        "Matl_type": aNewRows[0].MATERIALTYPE,
                        "Matl_group": aNewRows[0].MATERIALGROUP,
                        "Old_mat_no": aNewRows[0].OLDMATERIALNO,
                        "Base_uom": aNewRows[0].BASEUOM,
                        "Batch_mgmt": "X",
                        "Net_weight": aNewRows[0].NETWT,
                        "Unit_of_wt": aNewRows[0].WTUOM,
                        "Po_unit": aNewRows[0].ORDERUOM,
                        "Pur_valkey": aNewRows[0].PURCHVALUEKEY,
                        "Plant": this.getView().getModel("matPlantClass").getData().results[0].PLANTCD,
                        "Mrp_type": this.getView().getModel("mrpTypeClass").getData().results[0].Dismm,
                        "Period_ind": "M",
                        "Proc_type": "F",
                        "Availcheck": "KP",
                        "Profit_ctr": this.getView().getModel("matPlantClass").getData().results[0].PROFITCTR,
                        "Val_area": this.getView().getModel("matPlantClass").getData().results[0].PLANTCD,
                        "Price_ctrl": (aNewRows[0].MATERIALGROUP === "ACC" || aNewRows[0].MATERIALGROUP === "FAB") ? "V" : "",
                        "Moving_pr": "0",
                        "Price_unit": "1",
                        "Val_class": this.getView().getModel("mrpTypeClass").getData().results[0].Bklas
                    })

                    _param = {
                        "Seq": "1",
                        "Mattyp": aNewRows[0].MATERIALTYPE,
                        "Gmc": aNewRows[0].GMC,
                        "Descen": _descen,
                        "Desczh": _desczh,
                        "Processcd": aNewRows[0].PROCESSCODE,
                        "Cusmatno": aNewRows[0].CUSMATCODE,
                        "Grswt": aNewRows[0].GROSSWT,
                        "Volume": aNewRows[0].VOLUME,
                        "Voluom": aNewRows[0].VOLUMEUOM,
                        "Length": aNewRows[0].LENGTH + '',
                        "Width": aNewRows[0].WIDTH + '',
                        "Height": aNewRows[0].HEIGHT + '',
                        "Dimuom": aNewRows[0].DIMENSIONUOM,
                        "Remarks": "",
                        "MatAttribParamSet": _paramAttrib,
                        "MatImportParamSet": _MatImportParamSet,
                        "RetMsgSet": [{ "Seq": "1" }]
                    }
                    console.log("_param", _param);

                    var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_MATERIAL_SRV");
                    oModel.create("/MaterialHdrSet", _param, {
                        method: "POST",
                        success: function (res, oResponse) {
                            Common.closeProcessingDialog(me);
                            if (res.RetMsgSet.results[0].Type === "S") {
                                me._oViewSettingsDialog["zuimatmaster.view.fragments.MaterialTypeClassDialog"].close();
                                me.getMain();
                                me.onTableResize('Hdr', 'Min');
                                me.byId("btnAddHdr").setVisible(true);
                                me.byId("btnEditHdr").setVisible(true);
                                me.byId("btnSaveHdr").setVisible(false);
                                me.byId("btnCancelHdr").setVisible(false);
                                me.byId("btnDeleteHdr").setVisible(true);
                                me.byId("btnSettingsHdr").setVisible(true);
                                me.byId("btnFullScreenHdr").setVisible(true);
                                me.setRowReadMode();
                                me._dataMode = "READ";
                            }

                            MessageBox.information(res.RetMsgSet.results[0].Message);
                        },
                        error: function () {
                            Common.closeProcessingDialog(me);
                            // alert("Error");
                        }
                    });
                }
            },
            onCancel: function (oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;
                //this.onTableResize('Dtls', 'Min');
                this.cancelData();
            },
            cancelData() {
                if (this._dataMode === "NEW" || this._dataMode === "EDIT") {
                    var bChanged = false;

                    if (this._sActiveTable === "headerTab") bChanged = this._bHdrChanged;
                //     else if (this._sActiveTable === "detailTab") bChanged = this._bDtlChanged;

                    if (bChanged) {
                        var oData = {
                            Action: "update-cancel",
                            Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                        }

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(oData);

                        if (!this._ConfirmDialog) {
                            this._ConfirmDialog = sap.ui.xmlfragment("zuimatmaster.view.fragments.dialog.ConfirmDialog", this);

                            this._ConfirmDialog.setModel(oJSONModel);
                            this.getView().addDependent(this._ConfirmDialog);
                        }
                        else this._ConfirmDialog.setModel(oJSONModel);

                        this._ConfirmDialog.open();
                    }
                    else {
                        if (this._sActiveTable === "headerTab") {
                            me.byId("btnAddHdr").setVisible(true);
                            me.byId("btnEditHdr").setVisible(true);
                            //me.byId("btnAddNewHdr").setVisible(false);
                            me.byId("btnSaveHdr").setVisible(false);
                            me.byId("btnCancelHdr").setVisible(false);
                            me.byId("btnDeleteHdr").setVisible(true);
                            me.byId("btnSettingsHdr").setVisible(true);
                            me.byId("btnRefreshHdr").setVisible(true);
                            me.byId("btnFullScreenHdr").setVisible(true);
                            this.onTableResize('Hdr', 'Min');
                        }
                        // else if (this._sActiveTable === "detailTab") {
                        //     me.byId("btnRefreshDtl").setVisible(true);
                        //     me.byId("searchFieldDtl").setVisible(true);
                        //     me.byId("btnRefreshHdr").setEnabled(true);
                        //     me.byId("searchFieldHdr").setEnabled(true);
                        //     this.onTableResize('Dtls', 'Min');
                        // }
                        this.byId(this._sActiveTable).getModel().setProperty("/rows", this._aDataBeforeChange);
                        this.byId(this._sActiveTable).bindRows("/rows");

                        if (this._aColFilters.length > 0) { this.setColumnFilters(this._sActiveTable); }
                        if (this._aColSorters.length > 0) { this.setColumnSorters(this._sActiveTable); }

                        this.setRowReadMode();
                        this._dataMode = "READ";
                    }
                }
            },
            onCancelConfirmDialog: function (oEvent) {
                this._ConfirmDialog.close();
            },
            onCloseConfirmDialog: function (oEvent) {
                if (this._ConfirmDialog.getModel().getData().Action === "update-cancel") {
                    if (this._sActiveTable === "headerTab") {
                        me.byId("btnAddHdr").setVisible(true);
                        me.byId("btnEditHdr").setVisible(true);
                        //me.byId("btnAddNewHdr").setVisible(false);
                        me.byId("btnSaveHdr").setVisible(false);
                        me.byId("btnCancelHdr").setVisible(false);
                        me.byId("btnDeleteHdr").setVisible(true);
                        me.byId("btnSettingsHdr").setVisible(true);
                        me.byId("btnRefreshHdr").setVisible(true);
                        me.byId("btnFullScreenHdr").setVisible(true);
                        this.onTableResize('Hdr', 'Min');
                    }
                    // else if (this._sActiveTable === "detailTab") {
                    //     me.byId("btnRefreshDtl").setVisible(true);
                    //     me.byId("searchFieldDtl").setVisible(true);
                    //     me.byId("btnRefreshHdr").setEnabled(true);
                    //     me.byId("searchFieldHdr").setEnabled(true);
                    //     this.onTableResize('Dtls', 'Min');
                    // }

                    this.byId(this._sActiveTable).getModel().setProperty("/rows", this._aDataBeforeChange);
                    this.byId(this._sActiveTable).bindRows("/rows");

                    if (this._aColFilters.length > 0) { this.setColumnFilters(this._sActiveTable); }
                    if (this._aColSorters.length > 0) { this.setColumnSorters(this._sActiveTable); }
                    this.setRowReadMode();
                    this._dataMode = "READ";
                    this.setActiveRowHighlightByTableId(this._sActiveTable);
                }

                this._ConfirmDialog.close();
            },
            onCellClick: function (oEvent) {
                if (oEvent.getParameters().rowBindingContext) {
                    var oTable = oEvent.getSource();
                    var sRowPath = oEvent.getParameters().rowBindingContext.sPath;
                    var vMATNO = oTable.getModel().getProperty(sRowPath + "/MATERIALNO");

                    if (oTable.getId().indexOf("headerTab") >= 0) {
                        Common.openLoadingDialog(me);
                        me.getView().getModel("ui").setProperty("/acitveMatno", vMATNO);
                        me.getAttributes(vMATNO);
                        me.getBatch(vMATNO);
                        me.getCustomInfo(vMATNO);
                        me.getPlant(vMATNO);
                        if (this._dataMode === "READ") this._sActiveTable = "headerTab";
                    }
                    else {
                        if (this._dataMode === "READ") this._sActiveTable = "detailTab";
                    }

                    oTable.getModel().getData().rows.forEach(row => row.ACTIVE = "");
                    oTable.getModel().setProperty(sRowPath + "/ACTIVE", "X");

                    oTable.getRows().forEach(row => {
                        if (row.getBindingContext() && row.getBindingContext().sPath.replace("/rows/", "") === sRowPath.replace("/rows/", "")) {
                            row.addStyleClass("activeRow");
                        }
                        else row.removeStyleClass("activeRow")
                    })
                }
            },
            onExtendMaterial: async function () {
                var _this = this;
                var oModel = this.getOwnerComponent().getModel();
                var matNo = me.getView().getModel("ui").getProperty("/acitveMatno");
                var vSBU = 'VER';


                var onExtendMatData = {};
                var oJSONModel = new JSONModel();
                var extendMatJSONModel = new JSONModel();

                var extendMaterialCheck = [];
                var extendMaterialSet = [];
                var matchedPlant = [];
                var extendMaterialList = [];

                await new Promise((resolve, reject) => {
                    oModel.read("/ExtendMaterialChkSet", {
                        urlParameters: {
                            "$filter": "MATNO eq '" + matNo + "'"
                        }, success: async function (oData, oResponse) {
                            console.log("ExtMatChk", oData.results);
                            extendMaterialCheck = oData.results;
                            resolve();
                        },
                        error: function () {
                            resolve();
                        }
                    });
                });

                await new Promise((resolve, reject) => {
                    oModel.read("/ExtendMaterialSet", {
                        urlParameters: {
                            "$filter": "SBU eq '" + vSBU + "'"
                        }, success: async function (oData, oResponse) {
                            console.log("ExtMat", oData.results);
                            extendMaterialSet = oData.results;
                            resolve();
                        },
                        error: function () {
                            resolve();
                        }
                    });
                });

                await new Promise((resolve, reject) => {
                    extendMaterialSet.filter(function (el, index) {
                        extendMaterialCheck.forEach(item => {
                            if (el.PLANTCD === item.PLANTCD) {
                                delete extendMaterialSet[index]
                            }
                        });
                        resolve();
                    })

                    extendMaterialSet.forEach(item => {
                        extendMaterialList.push(item)
                    })
                    resolve();
                });

                oJSONModel.setData(extendMaterialList);
                _this.getView().setModel(oJSONModel, "mmExtendTblData");
                console.log("mmExtendTblData", me.getView().getModel("mmExtendTblData").getData());


                onExtendMatData = {
                    Title: "Extend Material",
                };
                extendMatJSONModel.setData(onExtendMatData);

                _this.onExtendMaterialDialog = sap.ui.xmlfragment(_this.getView().getId(), "zuimatmaster.view.fragments.dialog.MMExtendDialog", _this);
                _this.onExtendMaterialDialog.setModel(extendMatJSONModel);
                _this.getView().addDependent(_this.onExtendMaterialDialog);

                var sPath = jQuery.sap.getModulePath("zuimatmaster", "/model/columns.json");

                var oModelColumns = new JSONModel();
                await oModelColumns.loadData(sPath);

                var oColumns = oModelColumns.getData();
                this._oModelColumns = oModelColumns.getData();


                var _promiseResult = new Promise((resolve, reject) => {
                    resolve(this.getDynamicColumns("MMExtend", "ZDV_MMEXTEND", "mmExtendTbl", oColumns));
                });
                await _promiseResult;

                me.byId("mmExtendTbl").getModel().setProperty("/rows", me.getView().getModel("mmExtendTblData").getData());
                me.byId("mmExtendTbl").bindRows("/rows");

                _this.onExtendMaterialDialog.open();
            },

            onCancelExtendMM: async function () {
                this.onExtendMaterialDialog.destroy(true);
            },
            onSaveExtendMaterial: async function () {
                var _this = this;
                var oModel = this.getOwnerComponent().getModel();
                var matModel = this.getOwnerComponent().getModel("ZGW_3DERP_MATERIAL_SRV");
                var matNo = _this.getView().getModel("ui").getProperty("/acitveMatno");

                var oTable = this.byId("mmExtendTbl");
                var aSelIndices = oTable.getSelectedIndices();
                var oTmpSelectedIndices = [];
                var aData = oTable.getModel().getData().rows;

                var isValid = false;
                var plantCd = "";
                var iCounter = 0;

                var oParam = {};
                var oParamInitParam = {};
                var oParamData = [];

                if (aSelIndices.length > 0) {
                    Common.openLoadingDialog(this);
                    aSelIndices.forEach(item => {
                        oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                    });
                    aSelIndices = oTmpSelectedIndices;
                    for (var item in aSelIndices) {
                        await new Promise((resolve, reject) => {
                            iCounter++;
                            oModel.read("/ExtendMaterialVldMatChkSet", {
                                urlParameters: {
                                    "$filter": "MATNO eq '" + matNo + "'"
                                    // "$filter": "VENDORCD eq '0003101604' and PURCHORG eq '1601' and PURCHGRP eq '601' and SHIPTOPLANT eq 'B601' and PURCHPLANT eq 'C600' and DOCTYP eq 'ZMRP'"
                                }, success: async function (oData, oResponse) {
                                    if (oData.results.length > 0) {
                                        isValid = true;
                                        resolve(plantCd = oData.results[0].PLANTCD);
                                    }
                                    resolve();
                                },
                                error: function () {
                                    resolve();
                                }
                            });
                        });
                        if (isValid) {
                            oParamInitParam = {
                                Subrc: 0
                            }
                            oParamData.push({
                                Row: 0,
                                Matnr: matNo,
                                WerksFrom: plantCd,
                                WerksTo: aData.at(item).PLANTCD
                            })
                        }
                        if (aSelIndices.length === iCounter) {
                            oParam = oParamInitParam;
                            oParam['N_IMatPlant'] = oParamData;
                            oParam['N_EMatPlant'] = [];
                            oParam['N_Messtab'] = [];

                            if (oParamData.length > 0) {
                                await new Promise((resolve, reject) => {
                                    matModel.create("/MatExtendSet", oParam, {
                                        method: "POST",
                                        success: function (oData, oResponse) {
                                            // if(oData.N_Messtab.results[0].Message !== undefined || oData.N_Messtab.results[0].Message !== "" || oData.N_Messtab.results[0].Message !== null){
                                            const lastKey = oData.N_Messtab.results.length - 1;
                                            if (oData.N_Messtab.results[lastKey].Type === "S") {
                                                MessageBox.information(oData.N_Messtab.results[0].Message);
                                            }
                                            // }
                                            else if (oData.N_Messtab.results[lastKey].Type === "E") {
                                                MessageBox.error(Object.values(oData.N_Messtab.results).pop().Message);
                                            }
                                            resolve();
                                        }, error: function (error) {

                                            resolve();
                                        }
                                    });
                                })
                            } else {
                                MessageBox.error("No valid Purchasing Plant found.");
                            }

                        }
                    }

                    Common.closeLoadingDialog(me);
                    this.onExtendMaterialDialog.destroy(true);
                    this.getPlant(matNo);
                } else {
                    MessageBox.warning("No Selected Record!");
                }

            },
            onDelete: function (oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;
                this.deleteData();
            },
            deleteData() {
                if (this._dataMode === "READ") {
                    var oTable = this.byId(this._sActiveTable);
                    var aSelIndices = oTable.getSelectedIndices();
                    var oTmpSelectedIndices = [];
                    var aData = oTable.getModel().getData().rows;
                    if (aSelIndices.length === 0) {
                        MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_NO_SEL_RECORD_TO_PROC"]);
                    }
                    else {
                        if (aSelIndices.length > 1) {
                            this.byId("headerTab").clearSelection();
                            MessageBox.information("Please select one record only.");
                        }
                        else {
                            aSelIndices.forEach(item => {
                                oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                            })

                            aSelIndices = oTmpSelectedIndices;

                            MessageBox.confirm("Proceed to delete record?", {
                                actions: ["Yes", "No"],
                                onClose: function (sAction) {
                                    if (sAction === "Yes") {
                                        Common.openProcessingDialog(me, "Processing...");

                                        if (me.byId(me._sActiveTable).getBinding("rows").aFilters.length > 0) {
                                            me._aColFilters = me.byId(me._sActiveTable).getBinding("rows").aFilters;
                                        }

                                        if (me.byId(me._sActiveTable).getBinding("rows").aSorters.length > 0) {
                                            me._aColSorters = me.byId(me._sActiveTable).getBinding("rows").aSorters;
                                        }

                                        aSelIndices.forEach(item => {
                                            var oModel = me.getOwnerComponent().getModel();
                                            var oEntitySet = "/MaterialSet('" + aData.at(item)['MATERIALNO'] + "')";
                                            var oParam = {
                                                "Deleted": "X"
                                            };
                                            oModel.update(oEntitySet, oParam, {
                                                method: "PUT",
                                                success: function (data) {
                                                    me.getMain();
                                                    Common.closeProcessingDialog(me);
                                                    sap.m.MessageBox.information("Material No : " + aData.at(item)['MATERIALNO'] + " has been successfully deleted!");

                                                },
                                                error: function (err, oResponse) {
                                                    Common.closeProcessingDialog(me);
                                                    sap.m.MessageBox.warning(err.message);
                                                }
                                            });
                                        })
                                    }
                                }
                            })
                        }
                    }
                }
            },
        });
    });
