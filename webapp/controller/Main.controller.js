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

                this._oTableLayout = {
                    headerTab: {
                        type: "MMHDR",
                        tabname: "ZDVZERPMATL"
                    },
                    attributesTab: {
                        type: "MMATTRIB",
                        tabname: "ZERP_MATATTRIB"
                    },
                    batchTab: {
                        type: "MMBATCH",
                        tabname: "ZERP_MATBATCH"
                    },
                    customInfoTab: {
                        type: "MMCUSTOMINFO",
                        tabname: "ZERP_MATCUSINFO"
                    },
                    plantTab: {
                        type: "MMPLANT",
                        tabname: "MARC"
                    },
                    unitTab: {
                        type: "MMUNIT",
                        tabname: "ZDV_MAT_UNIT"
                    },
                }


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
                    acitveMatno: "",
                    smartfiltergf: 0,
                    splittergf: 0.94,
                    fullscreen: {
                        header: false,
                        detail: false
                    },
                    splitter: {
                        header: "50%",
                        detail: "50%"
                    },
                    dataWrap: {
                        headerTab: false,
                        attributesTab: false,
                        batchTab: false,
                        customInfoTab: false,
                        plantTab: false,
                        unitTab: false
                    }
                }), "ui");

                this._counts = {
                    header: 0,
                    attributes: 0,
                    batch: 0,
                    customInfo: 0,
                    plant: 0,
                    unit: 0,
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

                this.byId("unitTab")
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
                oDDTextParam.push({ CODE: "ADDROW" });
                oDDTextParam.push({ CODE: "REMOVEROW" });
                oDDTextParam.push({ CODE: "SAVE" });
                oDDTextParam.push({ CODE: "CANCEL" });
                oDDTextParam.push({ CODE: "DELETE" });
                oDDTextParam.push({ CODE: "REFRESH" });
                oDDTextParam.push({ CODE: "COPY" });
                oDDTextParam.push({ CODE: "HASGMC" });
                oDDTextParam.push({ CODE: "INFO_INPUT_REQD_FIELDS" });
                oDDTextParam.push({ CODE: "INFO_NO_DATA_MODIFIED" });
                oDDTextParam.push({ CODE: "INFO_DATA_COPIED" });
                oDDTextParam.push({ CODE: "WRAP" });
                oDDTextParam.push({ CODE: "UNWRAP" });

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
                this.byId("unitTab").addEventDelegate(oTableEventDelegate);
                this.getColumnProp();

                this.byId("headerTab").attachBrowserEvent("mousemove", function (oEvent) {
                    //get your model and do whatever you want:
                    //console.log("mouseenter")
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

                setTimeout(() => {
                    this.getDynamicColumns("MMUNIT", "ZDV_MAT_UNIT", "unitTab", oColumns);
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
                            console.log("columnset",oData.results);
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
            onSaveTableLayout: function (oEvent) {
                //saving of the layout of table
                this._sActiveTable = oEvent.getSource().data("TableId");
                var oTable = this.byId(this._sActiveTable);
                var oColumns = oTable.getColumns();
                var vSBU = "VER"; //this.getView().getModel("ui").getData().sbu;
                var me = this;
                var ctr = 1;

                var oParam = {
                    "SBU": vSBU,
                    "TYPE": this._oTableLayout[this._sActiveTable].type,
                    "TABNAME": this._oTableLayout[this._sActiveTable].tabname,
                    "TableLayoutToItems": []
                };

                //get information of columns, add to payload
                oColumns.forEach((column) => {
                    oParam.TableLayoutToItems.push({
                        // COLUMNNAME: column.sId,
                        COLUMNNAME: column.mProperties.sortProperty,
                        ORDER: ctr.toString(),
                        SORTED: column.mProperties.sorted,
                        SORTORDER: column.mProperties.sortOrder,
                        SORTSEQ: "1",
                        VISIBLE: column.mProperties.visible,
                        WIDTH: column.mProperties.width.replace('px', '')
                        //WRAPTEXT: this.getView().getModel("ui").getData().dataWrap[this._sActiveTable] === true ? "X" : ""
                    });

                    ctr++;
                });

                console.log(oParam)


                //call the layout save
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                oModel.create("/TableLayoutSet", oParam, {
                    method: "POST",
                    success: function (data, oResponse) {
                        MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_LAYOUT_SAVE"]);
                    },
                    error: function (err) {
                        MessageBox.error(err);
                    }
                });
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
                            //if (item.CREATEDDT !== null) { item.CREATEDDT = dateFormat.format(item.CREATEDDT) + " " + me.formatTimeOffSet(item.CREATEDTM.ms); }
                            //if (item.UPDATEDDT !== null) { item.UPDATEDDT = dateFormat.format(item.UPDATEDDT) + " " + _this.formatTimeOffSet(item.UPDATEDTM.ms); }

                            if (item.UPDATEDDATE !== null)
                                 item.UPDATEDDATE = dateFormat.format(new Date(item.UPDATEDDATE));

                            if (index === 0) {
                                item.ACTIVE = "X";
                                me.getView().getModel("ui").setProperty("/acitveMatno", item.MATERIALNO);
                                me.getAttributes(item.MATERIALNO);
                                me.getBatch(item.MATERIALNO);
                                me.getCustomInfo(item.MATERIALNO);
                                me.getPlant(item.MATERIALNO);
                                me.getUnit(item.MATERIALNO);
                            }
                            else{
                                item.ACTIVE = "";
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
            getUnit(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var oEntitySet = "/UnitMeasureSet";
                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "MATNO eq '" + arg + "'"
                    },
                    success: function (data, response) {
                        // if (data.results.length > 0) {
                        //     data.results.forEach(item => {
                        //         if (item.CREATEDDT !== null) {
                        //             item.CREATEDDT = dateFormat.format(new Date(item.CREATEDDT));
                        //         }

                        //         if (item.UPDATEDDT !== null) {
                        //             item.UPDATEDDT = dateFormat.format(new Date(item.UPDATEDDT));
                        //         }
                        //     })
                        // }
                        me.byId("unitTab").getModel().setProperty("/rows", data.results);
                        me.byId("unitTab").bindRows("/rows");
                        me.getView().getModel("counts").setProperty("/unit", data.results.length);
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
                    var sMatNo = this.getView().getModel("ui").getProperty("/acitveMatno");
                    Common.openLoadingDialog(this);
                    if (this._sActiveTable === "headerTab") {
                        this.getMain();
                    }
                    else if (this._sActiveTable === "attributesTab") {
                        this.getAttributes(sMatNo);
                    }
                    else if (this._sActiveTable === "batchTab") {
                        this.getBatch(sMatNo);
                    }
                    else if (this._sActiveTable === "customInfoTab") {
                        this.getCustomInfo(sMatNo);
                    }
                    else if (this._sActiveTable === "plantTab") {
                        this.getPlant(sMatNo);
                    }
                    else if (this._sActiveTable === "unitTab") {
                        this.getUnit(sMatNo);
                    }
                    // else if (this._sActiveTable === "detailTab") {
                    //     Common.openLoadingDialog(me);
                    //     var vHUID = this.getView().getModel("ui").getData().HUID;
                    //     var vHUTYP = this.getView().getModel("ui").getData().HUTYP;
                    //     me.getDtls(vHUID, vHUTYP === 'ROL' || vHUTYP === 'CTN' ? 'X' : '');
                    // }
                }
            },
            onWrapText: function (oEvent) {
                this._sActiveTable = oEvent.getSource().data("TableId");
                var vWrap = this.getView().getModel("ui").getData().dataWrap[this._sActiveTable];
                this.byId(this._sActiveTable).getColumns().forEach(col => {
                    var oTemplate = col.getTemplate();
                    if (oTemplate instanceof sap.m.Text) {
                        oTemplate.setWrapping(!vWrap);
                        col.setTemplate(oTemplate);
                    }

                })

                this.getView().getModel("ui").setProperty("/dataWrap/" + [this._sActiveTable], !vWrap);
            },
            onCreate: function (oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = sTabId;
                //this.onTableResize("Hdr", "Max");
                //this.byId("btnExitFullScreenDtls").setVisible(false);
                this.byId("splitterHdr").setProperty("size", "100%");
                this.byId("splitterDtl").setProperty("size", "0%");
                this.createData();
            },
            createData() {
                if (this._dataMode === "READ") {
                    if (this._sActiveTable === "headerTab") {
                        this.byId("btnAddHdr").setVisible(false);
                        this.byId("btnEditHdr").setVisible(false);
                        this.byId("btnDeleteHdr").setVisible(false);
                        this.byId("btnRefreshHdr").setVisible(false);
                        this.byId("btnAddRowHdr").setVisible(true);
                        this.byId("btnRemoveRowHdr").setVisible(true);
                        this.byId("btnSaveHdr").setVisible(true);
                        this.byId("btnCancelHdr").setVisible(true);
                        //this.byId("searchFieldHdr").setVisible(false);
                        this.byId("btnFullScreenHdr").setVisible(false);
                        this.byId("btnExitFullScreenHdr").setVisible(false);
                        this.byId("smartFilterBar").setVisible(false);

                        //this.byId("btnSettingsHdr").setVisible(false);
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
                    else if (col.mAggregations.template.mBindingInfos.value !== undefined) {
                        sColName = col.mAggregations.template.mBindingInfos.value.parts[0].path;
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
                aNewRow = this.byId(this._sActiveTable).getModel().getProperty("/rows").filter(item => item.NEW === true);
                aNewRow.push(oNewRow);

                this.byId(this._sActiveTable).getModel().setProperty("/rows", aNewRow);
                this.byId(this._sActiveTable).bindRows("/rows");
                this._dataMode = "NEW";

                oTable.focus();
            },
            setRowEditMode(arg) {
                //this.getView().getModel(arg).getData().results.forEach(item => item.Edited = false);
                var oTable = this.byId(arg + "Tab");
                var me = this;

                var oInputEventDelegate = {
                    onkeydown: function(oEvent){
                        me.onInputKeyDown(oEvent);
                    },

                    onclick: function(oEvent) {
                        if (arg === "attributes") {
                            me.onInputFocus(oEvent);
                        }
                    }
                };

                oTable.getColumns().forEach((col, idx) => {
                    var sColName = "";
                    var oValueHelp = false;

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

                                
                            }
                        })
                })
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
            // onTableResize(arg1, arg2) {
            //     if (arg1 === 'Attr') {
            //         if (arg2 === 'Max') {
            //             this.byId("headerTab").setVisible(false);
            //             this.byId("btnFullScreenAttr").setVisible(false);
            //             this.byId("btnExitFullScreenAttr").setVisible(true);
            //         }
            //         else {
            //             this.byId("headerTab").setVisible(true);
            //             this.byId("btnFullScreenAttr").setVisible(true);
            //             this.byId("btnExitFullScreenAttr").setVisible(false);
            //         }
            //     }
            //     else if (arg1 === 'Unit') {
            //         if (arg2 === 'Max') {
            //             this.byId("headerTab").setVisible(false);
            //             this.byId("btnFullScreenUnit").setVisible(false);
            //             this.byId("btnExitFullScreenUnit").setVisible(true);
            //         }
            //         else {
            //             this.byId("headerTab").setVisible(true);
            //             this.byId("btnFullScreenUnit").setVisible(true);
            //             this.byId("btnExitFullScreenUnit").setVisible(false);
            //         }
            //     }
            //     else {
            //         if (arg2 === 'Max') {
            //             this.byId("itbDetail").setVisible(false);
            //             this.byId("btnFullScreenHdr").setVisible(false);
            //             this.byId("btnExitFullScreenHdr").setVisible(true);
            //         }
            //         else {
            //             this.byId("itbDetail").setVisible(true);
            //             this.byId("btnFullScreenHdr").setVisible(true);
            //             this.byId("btnExitFullScreenHdr").setVisible(false);
            //         }
            //     }

            // },
            onTableResize: function (oEvent) {
                // console.log(this.byId("splitterHdr"))
                this._sActiveTable = oEvent.getSource().data("TableId");

                var vFullScreen = oEvent.getSource().data("Max") === "1" ? true : false;
                var vSuffix = oEvent.getSource().data("ButtonIdSuffix");
                var vHeader = oEvent.getSource().data("Header");
                var me = this;

                // this.byId("smartFilterBar").setFilterBarExpanded(!vFullScreen);
                this.byId("btnFullScreen" + vSuffix).setVisible(!vFullScreen);
                this.byId("btnExitFullScreen" + vSuffix).setVisible(vFullScreen);
                // this._oTables.filter(fItem => fItem.TableId !== me._sActiveTable).forEach(item => me.byId(item.TableId).setVisible(!vFullScreen));

                if (vFullScreen) {
                    if (vHeader === "1") {
                        this.byId("splitterHdr").setProperty("size", "100%");
                        this.byId("splitterDtl").setProperty("size", "0%");
                    }
                    else {
                        this.byId("splitterHdr").setProperty("size", "0%");
                        this.byId("splitterDtl").setProperty("size", "100%");
                    }
                }
                else {
                    this.byId("splitterHdr").setProperty("size", "50%");
                    this.byId("splitterDtl").setProperty("size", "50%");
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
            onAddRow() {
                this.setRowCreateMode();
            },
            onRemoveRow() {
                var oTable = this.byId(this._sActiveTable);
                var aNewRow = oTable.getModel().getProperty("/rows").filter(item => item.NEW === true);
                aNewRow.splice(oTable.getSelectedIndices(), 1);
                oTable.getModel().setProperty("/rows", aNewRow);
                oTable.bindRows("/rows");
            },
            onSaveHdr() {
                var aNewRows = this.byId(this._sActiveTable).getModel().getData().rows.filter(item => item.NEW === true);
                var aEditedRows = this.byId(this._sActiveTable).getModel().getData().rows.filter(item => item.EDITED === true);
                var oModel = this.getOwnerComponent().getModel();
                var oModel1 = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oJSONModel1 = new JSONModel();
                var vSBU = 'VER';
                var oData = {
                    results: []
                };


                if (aNewRows.length > 0) {
                    aNewRows.forEach((item, idx) => {
                        item.NEWSEQ = idx;
                    })

                    this.onMaterialTypeClassDialog(aNewRows);

                    aNewRows.forEach((item, idx) => {
                        oModel.read('/MRPTypeSet', {
                            urlParameters: {
                                "$filter": "Screencode eq 'BAPI_MATNR' and Mtart eq '" + item.MATERIALTYPE + "'"
                            },
                            success: function (data, response) {
                                if (data.results.length > 0) {
                                    oData.results.push(data.results[0]);
                                }

                                if (idx == aNewRows.length - 1) {
                                    oJSONModel.setData(oData);
                                    me.getView().setModel(oJSONModel, "mrpTypeClass");
                                }
                            },
                            error: function (err) {
                                MessageBox.information(err);
                            }
                        })
                    })

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
                }
                // else if (aEditedRows.length > 0) {
                //     var oModel = this.getOwnerComponent().getModel();
                //     var iEdited = 0;
                //     var _this = this; 
                //     var bProceed = true;
                //     var mParameters = {
                //         "groupId": "update"
                //     };

                //     oModel.setUseBatch(true);
                //     oModel.setDeferredGroups(["update"]);

                //     aEditedRows.forEach(item => {
                //         var entitySet = "/MaterialSet(";
                //         var param = {};
                //         var iKeyCount = this._aColumns[arg].filter(col => col.Key === "X").length;
                        
                        
                //         _this._aColumns[arg].forEach(col => {
                //             if (col.Editable) param[col.ColumnName] = item[col.ColumnName];

                //             // if (arg === "attributes" && (col.name === "DESCEN" || col.name === "DESCZH")) {
                //             //     param[col.name] = item[col.name];
                //             // }

                //             if (iKeyCount === 1) { 
                //                 if (col.key) entitySet += "'" + item[col.ColumnName] + "'" 
                //             }
                //             else if (iKeyCount > 1) { 
                //                 if (col.key) entitySet += col.ColumnName + "='" + item[col.ColumnName] + "',"
                //             }
                //         })
                        
                //         if (iKeyCount > 1) entitySet = entitySet.substring(0, entitySet.length - 1);

                //         entitySet += ")";
                //         console.log(param)
                //         oModel.update(entitySet, param, mParameters);
                //     });
                    
                //     if (bProceed) {
                //         this.showLoadingDialog('Processing...');

                //         oModel.submitChanges({
                //             groupId: "update",
                //             success: function(odata, resp){ 
                //                 alert("Edited");
                //                 // _this.closeLoadingDialog();
                //                 // _this.setButton(arg, "save");

                //                 // if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }

                //                 // var oIconTabBar = _this.byId("itbDetail");
                //                 // oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));

                //                 // _this.getView().getModel(arg).getData().results.forEach((row,index) => {
                //                 //     _this.getView().getModel(arg).setProperty('/results/' + index + '/Edited', false);
                //                 // })
                                
                //                 // _this.getView().getModel("ui").setProperty("/dataMode", 'READ');

                //                 // var oTable = _this.byId(arg + "Tab");

                //                 // setTimeout(() => {
                //                 //     var iActiveRowIndex = oTable.getModel(arg).getData().results.findIndex(item => item.ACTIVE === "X");
                
                //                 //     oTable.getRows().forEach(row => {
                //                 //         if (row.getBindingContext(arg) && +row.getBindingContext(arg).sPath.replace("/results/", "") === iActiveRowIndex) {
                //                 //             row.addStyleClass("activeRow");
                //                 //         }
                //                 //         else row.removeStyleClass("activeRow");
                //                 //     })                    
                //                 // }, 1);

                //                 // if (arg === "attributes") {
                //                 //     _this.getAttributes(false);
                //                 // }
                //                 // else if (arg === "cusmat") {
                //                 //     _this.getCustomerMaterial(false);
                //                 // }
                //             },
                //             error: function(odata, resp) { console.log(resp); }
                //         });
                //     }
                // }
                else if (aEditedRows.length > 0) {
                    var oModel = this.getOwnerComponent().getModel();
                    var iEdited = 0;
                    var _this = this;
                    console.log("acol-header",this._aColumns["header"]);
                    aEditedRows.forEach(item => {
                        var entitySet = "/MaterialSet(";
                        var param = {};

                        var iKeyCount = this._aColumns["header"].filter(col => col.Key === "X").length;

                        _this._aColumns["header"].forEach(col => {
                            if (col.Editable) param[col.ColumnName] = item[col.ColumnName]

                            if (iKeyCount === 1) {
                                if (col.Key) entitySet += "'" + item[col.ColumnName] + "'"
                            }
                            else if (iKeyCount > 1) {
                                if (col.Key) entitySet += col.ColumnName + "='" + item[col.ColumnName] + "',"
                            }
                        })

                        if (iKeyCount > 1) entitySet = entitySet.substr(0, entitySet.length - 1);

                        entitySet += ")";

                        console.log("entitySet",entitySet);

                        console.log("update-param",param);

                        setTimeout(() => {
                            oModel.update(entitySet, param, {
                                method: "PUT",
                                success: function (data, oResponse) {
                                    iEdited++;

                                    if (iEdited === aEditedRows.length) {
                                        alert("done editing");
                                        // _this.setButton(arg, "save");

                                        // var oIconTabBar = _this.byId("itbDetail");
                                        // oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));

                                        // _this.getView().getModel(arg).getData().forEach((row, index) => {
                                        //     _this.getView().getModel(arg).setProperty('/results/' + index + '/Edited', false);
                                        // })

                                        // _this.getView().getModel("ui").setProperty("/dataMode", 'READ');
                                    }
                                },
                                error: function () {
                                    // alert("Error");
                                }
                            });
                        }, 500)
                    });
                }
            },
            createDialog: null,
            onMaterialTypeClassDialog(args) {
                console.log("args",args);
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var _this = this;
                var aData = { results: [] };

                //var aMatType = [...new Set(args.map(item => item.MATERIALTYPE))];
                var aMatType = args.map(item => item.MATERIALTYPE);
                console.log("aMatType", aMatType)
                aMatType.forEach((item, idx) => {
                    this.newMattyp = item;
                    oModel.read('/MatTypeClassSet', {
                        urlParameters: {
                            "$filter": "Mattyp eq '" + this.newMattyp + "'"
                        },
                        success: function (data, response) {
                            console.log(data)
                            var aDataMatTClass = JSON.parse(JSON.stringify(data));
                            aDataMatTClass.results.forEach(itemMatClass => {
                                itemMatClass.Descen = '';
                                itemMatClass.Desczh = '';
                                itemMatClass.Attrib = itemMatClass.Attrib === "X" ? true : false;
                                itemMatClass.Createddt = dateFormat.format(new Date(itemMatClass.Createddt));
                                itemMatClass.Updateddt = dateFormat.format(new Date(itemMatClass.Updateddt));
                                itemMatClass.DescInput = itemMatClass.Attrib === "X" ? false : true;
                            })

                            aData.results.push(...aDataMatTClass.results);

                            if (idx == aMatType.length - 1) {
                                aData.results.forEach((itemMatClass, idxMatClass) => {
                                    itemMatClass.NEWSEQ = idxMatClass;
                                })

                                oJSONModel.setData(aData);
                                _this.getView().setModel(oJSONModel, "mtClassModel");

                                _this.createViewSettingsDialog("matTypeClass",
                                    new JSONModel({
                                        items: aData.results,
                                        rowCount: aData.results.length
                                    })
                                );

                                var oDialog = _this._oViewSettingsDialog["zuimatmaster.view.fragments.MaterialTypeClassDialog"];
                                oDialog.getModel().setProperty("/items", aData.results);
                                oDialog.getModel().setProperty("/rowCount", aData.results.length);
                                oDialog.open();
                            }
                        },
                        error: function (err) { }
                    })
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
                var vSBU = 'VER';
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

                    var aNewRows = this.byId(this._sActiveTable).getModel().getData().rows.filter(item => item.NEW === true);
                    var sMessage = "";
                    var bError = false;
                    var iTimeOut = 0;

                    aNewRows.forEach((item, idx) => {

                        _aDescen = [];
                        _aDesczh = [];

                        _this.getView().getModel("mtClassModel").getData().results.forEach(itemMatClass => {
                            if (itemMatClass.Mattyp == item.MATERIALTYPE && itemMatClass.NEWSEQ == item.NEWSEQ) {
                                if (itemMatClass.Desczh === '') itemMatClass.Desczh = itemMatClass.Descen;

                                if (itemMatClass.Inclindesc === 'X') {
                                    if (itemMatClass.Descen !== '') _aDescen.push(itemMatClass.Descen);
                                    if (itemMatClass.Desczh !== '') _aDesczh.push(itemMatClass.Desczh);
                                }
                            }
                        })

                        var _descen = _aDescen.join(', ');
                        var _desczh = _aDesczh.join(', ');
                        var _param = {};
                        var dismm = '';
                        var _MatImportParamSet = [];
                        var _paramAttrib = [];

                        _this.getView().getModel("mtClassModel").getData().results.forEach((itemMatClass, idxMatClass) => {
                            if (itemMatClass.Mattyp == item.MATERIALTYPE && itemMatClass.NEWSEQ == item.NEWSEQ) {
                                _paramAttrib.push({
                                    "Seq": "1",
                                    "Seqno": (idxMatClass + 1) + "",
                                    "Mattypcls": itemMatClass.Mattypcls,
                                    "Attribcd": itemMatClass.Attribcd,
                                    "Descen": itemMatClass.Descen,
                                    "Desczh": itemMatClass.Desczh
                                })
                            }
                        })

                        var oMrpTypeClass = _this.getView().getModel("mrpTypeClass").getData().results.filter(
                            x => x.Mtart == item.MATERIALTYPE)[0];

                        _MatImportParamSet.push({
                            "Seq": "1",
                            "Seqno": "1",
                            "Ind_sector": "J",
                            "Matl_type": item.MATERIALTYPE,
                            "Matl_group": item.MATERIALGROUP,
                            "Old_mat_no": item.OLDMATERIALNO,
                            "Base_uom": item.BASEUOM,
                            "Batch_mgmt": "X",
                            "Net_weight": item.NETWT,
                            "Unit_of_wt": item.WTUOM,
                            "Po_unit": item.ORDERUOM,
                            "Pur_valkey": item.PURCHVALUEKEY,
                            "Plant": _this.getView().getModel("matPlantClass").getData().results[0].PLANTCD,
                            "Mrp_type": oMrpTypeClass.Dismm,
                            "Period_ind": "M",
                            "Proc_type": "F",
                            "Availcheck": "KP",
                            "Profit_ctr": _this.getView().getModel("matPlantClass").getData().results[0].PROFITCTR,
                            "Val_area": _this.getView().getModel("matPlantClass").getData().results[0].PLANTCD,
                            "Price_ctrl": (item.MATERIALGROUP === "ACC" || item.MATERIALGROUP === "FAB") ? "V" : "",
                            "Moving_pr": "0",
                            "Price_unit": "1",
                            "Val_class": oMrpTypeClass.Bklas
                        })

                        _param = {
                            "Seq": "1",
                            "Mattyp": item.MATERIALTYPE,
                            "Gmc": item.GMC,
                            "Descen": _descen,
                            "Desczh": _desczh,
                            "Processcd": item.PROCESSCODE,
                            "Cusmatno": item.CUSMATCODE,
                            "Grswt": item.GROSSWT,
                            "Volume": item.VOLUME,
                            "Voluom": item.VOLUMEUOM,
                            "Length": item.LENGTH + '',
                            "Width": item.WIDTH + '',
                            "Height": item.HEIGHT + '',
                            "Dimuom": item.DIMENSIONUOM,
                            "Remarks": "",
                            "MatAttribParamSet": _paramAttrib,
                            "MatImportParamSet": _MatImportParamSet,
                            "RetMsgSet": [{ "Seq": "1" }]
                        }

                        console.log("_param", _param);
                        iTimeOut += 100;

                        setTimeout(() => {
                            var oModel = _this.getOwnerComponent().getModel("ZGW_3DERP_MATERIAL_SRV");

                            oModel.setHeaders({
                                sbu: vSBU
                            });

                            oModel.create("/MaterialHdrSet", _param, {
                                method: "POST",
                                success: function (res, oResponse) {
                                    Common.closeProcessingDialog(me);

                                    if (res.RetMsgSet.results[0].Type != "S") bError = true;

                                    sMessage += res.RetMsgSet.results[0].Message + "\n";

                                    if (idx == aNewRows.length - 1) {
                                        if (bError == false) {
                                            me._oViewSettingsDialog["zuimatmaster.view.fragments.MaterialTypeClassDialog"].close();
                                            me.getMain();
                                            //me.onTableResize('Hdr', 'Min');
                                            me.byId("smartFilterBar").setVisible(true);
                                            me.byId("splitterHdr").setProperty("size", "50%");
                                            me.byId("splitterDtl").setProperty("size", "50%");
                                            me.byId("btnAddHdr").setVisible(true);
                                            me.byId("btnEditHdr").setVisible(true);
                                            me.byId("btnAddRowHdr").setVisible(false);
                                            me.byId("btnRemoveRowHdr").setVisible(false);
                                            me.byId("btnSaveHdr").setVisible(false);
                                            me.byId("btnCancelHdr").setVisible(false);
                                            me.byId("btnDeleteHdr").setVisible(true);
                                            //me.byId("btnSettingsHdr").setVisible(true);
                                            me.byId("btnFullScreenHdr").setVisible(true);
                                            me.setRowReadMode();
                                            me._dataMode = "READ";
                                        }

                                        MessageBox.information(sMessage);
                                        Common.closeProcessingDialog(me);
                                    }
                                },
                                error: function () {
                                    Common.closeProcessingDialog(me);
                                    // alert("Error");
                                }
                            });
                        }, iTimeOut);

                    });
                }
            },
            // onCreateMMSave() {
            //     var _aDescen = [], _aDesczh = [];
            //     var _this = this;

            //     this.getView().getModel("mtClassModel").getData().results.forEach(item => {
            //         if (item.Desczh === '') item.Desczh = item.Descen;

            //         if (item.Inclindesc === 'X') {
            //             if (item.Descen !== '') _aDescen.push(item.Descen);
            //             if (item.Desczh !== '') _aDesczh.push(item.Desczh);
            //         }
            //     })

            //     if (_aDescen.join('') === '') {
            //         MessageBox.information("At least one description should be specified.");
            //     }
            //     else {
            //         Common.openProcessingDialog(me, "Processing...");

            //         var _descen = _aDescen.join(', ');
            //         var _desczh = _aDesczh.join(', ');
            //         var _param = {};
            //         var dismm = '';
            //         var _MatImportParamSet = [];
            //         var aNewRows = this.byId(this._sActiveTable).getModel().getData().rows.filter(item => item.NEW === true);
            //         var _paramAttrib = [];

            //         this.getView().getModel("mtClassModel").getData().results.forEach((item, index) => {
            //             _paramAttrib.push({
            //                 "Seq": "1",
            //                 "Seqno": (index + 1) + "",
            //                 "Mattypcls": item.Mattypcls,
            //                 "Attribcd": item.Attribcd,
            //                 "Descen": item.Descen,
            //                 "Desczh": item.Desczh
            //             })
            //         });

            //         _MatImportParamSet.push({
            //             "Seq": "1",
            //             "Seqno": "1",
            //             "Ind_sector": "J",
            //             "Matl_type": aNewRows[0].MATERIALTYPE,
            //             "Matl_group": aNewRows[0].MATERIALGROUP,
            //             "Old_mat_no": aNewRows[0].OLDMATERIALNO,
            //             "Base_uom": aNewRows[0].BASEUOM,
            //             "Batch_mgmt": "X",
            //             "Net_weight": aNewRows[0].NETWT,
            //             "Unit_of_wt": aNewRows[0].WTUOM,
            //             "Po_unit": aNewRows[0].ORDERUOM,
            //             "Pur_valkey": aNewRows[0].PURCHVALUEKEY,
            //             "Plant": this.getView().getModel("matPlantClass").getData().results[0].PLANTCD,
            //             "Mrp_type": this.getView().getModel("mrpTypeClass").getData().results[0].Dismm,
            //             "Period_ind": "M",
            //             "Proc_type": "F",
            //             "Availcheck": "KP",
            //             "Profit_ctr": this.getView().getModel("matPlantClass").getData().results[0].PROFITCTR,
            //             "Val_area": this.getView().getModel("matPlantClass").getData().results[0].PLANTCD,
            //             "Price_ctrl": (aNewRows[0].MATERIALGROUP === "ACC" || aNewRows[0].MATERIALGROUP === "FAB") ? "V" : "",
            //             "Moving_pr": "0",
            //             "Price_unit": "1",
            //             "Val_class": this.getView().getModel("mrpTypeClass").getData().results[0].Bklas
            //         })

            //         _param = {
            //             "Seq": "1",
            //             "Mattyp": aNewRows[0].MATERIALTYPE,
            //             "Gmc": aNewRows[0].GMC,
            //             "Descen": _descen,
            //             "Desczh": _desczh,
            //             "Processcd": aNewRows[0].PROCESSCODE,
            //             "Cusmatno": aNewRows[0].CUSMATCODE,
            //             "Grswt": aNewRows[0].GROSSWT,
            //             "Volume": aNewRows[0].VOLUME,
            //             "Voluom": aNewRows[0].VOLUMEUOM,
            //             "Length": aNewRows[0].LENGTH + '',
            //             "Width": aNewRows[0].WIDTH + '',
            //             "Height": aNewRows[0].HEIGHT + '',
            //             "Dimuom": aNewRows[0].DIMENSIONUOM,
            //             "Remarks": "",
            //             "MatAttribParamSet": _paramAttrib,
            //             "MatImportParamSet": _MatImportParamSet,
            //             "RetMsgSet": [{ "Seq": "1" }]
            //         }
            //         console.log("_param", _param);

            //         var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_MATERIAL_SRV");
            //         oModel.create("/MaterialHdrSet", _param, {
            //             method: "POST",
            //             success: function (res, oResponse) {
            //                 Common.closeProcessingDialog(me);
            //                 if (res.RetMsgSet.results[0].Type === "S") {
            //                     me._oViewSettingsDialog["zuimatmaster.view.fragments.MaterialTypeClassDialog"].close();
            //                     me.getMain();
            //                     me.onTableResize('Hdr', 'Min');
            //                     me.byId("btnAddHdr").setVisible(true);
            //                     me.byId("btnEditHdr").setVisible(true);
            //                     me.byId("btnSaveHdr").setVisible(false);
            //                     me.byId("btnCancelHdr").setVisible(false);
            //                     me.byId("btnDeleteHdr").setVisible(true);
            //                     me.byId("btnSettingsHdr").setVisible(true);
            //                     me.byId("btnFullScreenHdr").setVisible(true);
            //                     me.setRowReadMode();
            //                     me._dataMode = "READ";
            //                 }

            //                 MessageBox.information(res.RetMsgSet.results[0].Message);
            //             },
            //             error: function () {
            //                 Common.closeProcessingDialog(me);
            //                 // alert("Error");
            //             }
            //         });
            //     }
            // },
            // onCloseConfirmDialog: function (oEvent) {
            //     alert("here");
            //     if (this._ConfirmDialog.getModel().getData().Action === "update-cancel") {
            //         if (this._sActiveTable === "headerTab") {
            //             this.byId("smartFilterBar").setVisible(true);
            //             // this.byId("btnAddHdr").setVisible(true);
            //             // this.byId("btnEditHdr").setVisible(true);
            //             // this.byId("btnDeleteHdr").setVisible(true);
            //             // this.byId("btnRefreshHdr").setVisible(true);
            //             // this.byId("btnSaveHdr").setVisible(false);
            //             // this.byId("btnCancelHdr").setVisible(false);
            //             // this.byId("btnCopyHdr").setVisible(true);
            //             //this.byId("btnAddNewDtl").setVisible(false);
            //             me.byId("btnAddHdr").setVisible(true);
            //                 me.byId("btnEditHdr").setVisible(true);
            //                 //me.byId("btnAddNewHdr").setVisible(false);
            //                 me.byId("btnAddRowHdr").setVisible(false);
            //                 me.byId("btnRemoveRowHdr").setVisible(false);
            //                 me.byId("btnSaveHdr").setVisible(false);
            //                 me.byId("btnCancelHdr").setVisible(false);
            //                 me.byId("btnDeleteHdr").setVisible(true);
            //                 //me.byId("btnSettingsHdr").setVisible(true);
            //                 me.byId("btnRefreshHdr").setVisible(true);
            //                 me.byId("btnFullScreenHdr").setVisible(true);
            //         }

            //         this.byId(this._sActiveTable).getModel().setProperty("/rows", this._aDataBeforeChange);
            //         this.byId(this._sActiveTable).bindRows("/rows");

            //         if (this._aColFilters.length > 0) { this.setColumnFilters(this._sActiveTable); }
            //         if (this._aColSorters.length > 0) { this.setColumnSorters(this._sActiveTable); }
            //         //this.onTableResize('Dtls', 'Min');
            //         this.setRowReadMode();
            //         this._dataMode = "READ";
            //         this.setActiveRowHighlightByTableId(this._sActiveTable);
            //     }

            //     this._ConfirmDialog.close();
            // },
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
                            me.byId("btnAddRowHdr").setVisible(false);
                            me.byId("btnRemoveRowHdr").setVisible(false);
                            me.byId("btnSaveHdr").setVisible(false);
                            me.byId("btnCancelHdr").setVisible(false);
                            me.byId("btnDeleteHdr").setVisible(true);
                            //me.byId("btnSettingsHdr").setVisible(true);
                            me.byId("btnRefreshHdr").setVisible(true);
                            me.byId("btnFullScreenHdr").setVisible(true);
                            this.byId("smartFilterBar").setVisible(true);
                            //this.onTableResize('Hdr', 'Min');

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
                        this.byId("splitterHdr").setProperty("size", "50%");
                        this.byId("splitterDtl").setProperty("size", "50%");
                        this.setRowReadMode();
                        this._dataMode = "READ";
                    }
                }
            },
            onEdit() {
                if (this._dataMode === "READ") {
                    if (this._sActiveTable === "headerTab") { 
                        this.byId("splitterHdr").setProperty("size", "100%");
                        this.byId("splitterDtl").setProperty("size", "0%");
                        this.byId("btnAddHdr").setVisible(false);
                        this.byId("btnEditHdr").setVisible(false);
                        this.byId("btnDeleteHdr").setVisible(false);
                        this.byId("btnRefreshHdr").setVisible(false);
                        this.byId("btnAddRowHdr").setVisible(true);
                        this.byId("btnRemoveRowHdr").setVisible(true);
                        this.byId("btnSaveHdr").setVisible(true);
                        this.byId("btnCancelHdr").setVisible(true);
                        //this.byId("searchFieldHdr").setVisible(false);
                        this.byId("btnFullScreenHdr").setVisible(false);
                        this.byId("btnExitFullScreenHdr").setVisible(false);
                        this.byId("smartFilterBar").setVisible(false);
                        this.onEditMain(); 
                    }
                    
                }
            },
            onEditMain() {
                var oModel = this.getOwnerComponent().getModel();
                var oEntitySet = "/MaterialSet";
                var me = this;
                var oTable = this.byId("headerTab");
                var aSelIndices = oTable.getSelectedIndices();
                var oTmpSelectedIndices = [];
                var aData = oTable.getModel().getData().rows; //this.getView().getModel().getData().results;
                var aDataToEdit = [];
                var bDeleted = false, bWithMaterial = false;
                var iCounter = 0;
                // console.log(this.getView().getModel("materials").getData().results.length)
                // console.log(aSelIndices)
                if (aSelIndices.length > 0) {
                    aSelIndices.forEach(item => {
                        oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                    })

                    aSelIndices = oTmpSelectedIndices;

                    aSelIndices.forEach((item, index) => {
                        // if (aData.at(item).DELETED === true) {
                        //     iCounter++;
                        //     bDeleted = true;

                        //     if (aSelIndices.length === iCounter) {
                        //         if (aDataToEdit.length === 0) {
                        //             MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_GMC_NO_EDIT"]);
                        //         }
                        //         else {
                        //             me.byId("btnAddGMC").setVisible(false);
                        //             me.byId("btnEditGMC").setVisible(false);
                        //             me.byId("btnSaveGMC").setVisible(true);
                        //             me.byId("btnCancelGMC").setVisible(true);
                        //             me.byId("btnDeleteGMC").setVisible(false);
                        //             me.byId("btnRefreshGMC").setVisible(false);
                        //             me.byId("btnSortGMC").setVisible(false);
                        //             // me.byId("btnFilterGMC").setVisible(false);
                        //             me.byId("btnExitFullScreenHdr").setVisible(false);
                        //             // me.byId("btnColPropGMC").setVisible(false);
                        //             me.byId("searchFieldGMC").setVisible(false);
                        //             // me.onTableResize("Hdr","Max");
                        //             me.byId("btnExitFullScreenHdr").setVisible(false);
                        //             me.byId("btnTabLayoutGMC").setVisible(false);
                        //             me.byId("btnDataWrapGMC").setVisible(false);
                        //             me.byId("cboxSBU").setEnabled(false);
                        //             me.setScreenSize("header", true, "100%", "0%");

                        //             me._oDataBeforeChange = jQuery.extend(true, {}, me.getView().getModel("gmc").getData());
                
                        //             me.getView().getModel("gmc").setProperty("/results", aDataToEdit);
                        //             me.setRowEditMode("gmc");
                    
                        //             me.getView().getModel("ui").setProperty("/dataMode", 'EDIT');
                        //             me.getView().getModel("ui").setProperty("/updTable", "gmc");
                        //             me._isGMCEdited = false;
                        //             if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }
                        //         }
                        //     }
                        // }
                        // else {
                            oModel.read(oEntitySet, {
                                urlParameters: {
                                    "$filter": "MATERIALNO eq '" + aData.at(item).MATERIALNO + "'"
                                },
                                success: function (data, response) {
                                    iCounter++;
                                    console.log(data.results)
                                    // if (data.results.length > 0) { 
                                    //     bWithMaterial = true; 
                                    //     aData.at(item).WMAT = true;
                                    // }
                                    // else {
                                    //     aData.at(item).WMAT = false;
                                    // }

                                    aDataToEdit.push(aData.at(item));

                                    if (aSelIndices.length === iCounter) {
                                        me.byId("headerTab").getModel().setProperty("/rows", aDataToEdit);
                                        me.byId("headerTab").bindRows("/rows");
                                        me.getView().getModel("counts").setProperty("/header", aDataToEdit.length);
                                        me.setRowEditMode("header");
                                        // if (!me._GMCDescZHAuth && aDataToEdit.filter(fItem => fItem.WMAT === false).length === 0) {
                                        //     MessageBox.information(me.getView().getModel("ddtext").getData()["INFO_GMC_NO_EDIT"]);
                                        // }
                                        // else {
                                        //     me.byId("btnAddGMC").setVisible(false);
                                        //     me.byId("btnEditGMC").setVisible(false);
                                        //     me.byId("btnSaveGMC").setVisible(true);
                                        //     me.byId("btnCancelGMC").setVisible(true);
                                        //     me.byId("btnDeleteGMC").setVisible(false);
                                        //     me.byId("btnRefreshGMC").setVisible(false);
                                        //     me.byId("btnSortGMC").setVisible(false);
                                        //     // me.byId("btnFilterGMC").setVisible(false);
                                        //     me.byId("btnExitFullScreenHdr").setVisible(false);
                                        //     // me.byId("btnColPropGMC").setVisible(false);
                                        //     me.byId("searchFieldGMC").setVisible(false);
                                        //     // me.onTableResize("Hdr","Max");
                                        //     me.byId("btnExitFullScreenHdr").setVisible(false);
                                        //     me.byId("btnTabLayoutGMC").setVisible(false);
                                        //     me.byId("btnDataWrapGMC").setVisible(false);
                                        //     me.byId("cboxSBU").setEnabled(false);
                                        //     me.setScreenSize("header", true, "100%", "0%");

                                        //     me._oDataBeforeChange = jQuery.extend(true, {}, me.getView().getModel("gmc").getData());
                        
                                        //     me.getView().getModel("gmc").setProperty("/results", aDataToEdit);
                                        //     me.setRowEditMode("gmc");
                            
                                        //     me.getView().getModel("ui").setProperty("/dataMode", 'EDIT');
                                        //     me.getView().getModel("ui").setProperty("/updTable", "gmc");
                                        //     me._isGMCEdited = false;
                                        //     if (sap.ushell.Container !== undefined) { sap.ushell.Container.setDirtyFlag(false); }
                                        // }
                                    }                                    
                                },
                                error: function (err) {
                                    iCounter++;
                                }
                            })
                        //}
                    })
                }
                else {
                    // aDataToEdit = aData;
                    MessageBox.information(this.getView().getModel("ddtext").getData()["INFO_NO_SEL_RECORD_TO_PROC"]);
                }
                // aDataToEdit = aDataToEdit.filter(item => item.Deleted === false);
            },
            onCancelConfirmDialog: function (oEvent) {
                

                this._ConfirmDialog.close();
                
            },
            onCloseConfirmDialog: function (oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTabId = oTable.sId.split("--")[oTable.sId.split("--").length - 1];
                this._sActiveTable = "headerTab";
                
                //this.onTableResize('Dtls', 'Min');
                // this.byId("smartFilterBar").setVisible(true);
                // this.byId("splitterHdr").setProperty("size", "50%");
                // this.byId("splitterDtl").setProperty("size", "50%");
                // this._ConfirmDialog.close();
                // this.setRowReadMode();
                // this.refreshData();

                if (this._sActiveTable === "headerTab") {
                    me.byId("btnAddHdr").setVisible(true);
                    me.byId("btnEditHdr").setVisible(true);
                    //me.byId("btnAddNewHdr").setVisible(false);
                    me.byId("btnAddRowHdr").setVisible(false);
                    me.byId("btnRemoveRowHdr").setVisible(false);
                    me.byId("btnSaveHdr").setVisible(false);
                    me.byId("btnCancelHdr").setVisible(false);
                    me.byId("btnDeleteHdr").setVisible(true);
                    //me.byId("btnSettingsHdr").setVisible(true);
                    me.byId("btnRefreshHdr").setVisible(true);
                    me.byId("btnFullScreenHdr").setVisible(true);
                    me.byId("smartFilterBar").setVisible(true);
                    //this.onTableResize('Hdr', 'Min');

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
                this.byId("splitterHdr").setProperty("size", "50%");
                this.byId("splitterDtl").setProperty("size", "50%");
                this.setRowReadMode();
                this._dataMode = "READ";

                this._ConfirmDialog.close();
                
                
                // if (this._ConfirmDialog.getModel().getData().Action === "update-cancel") {
                //     if (this._sActiveTable === "headerTab") {
                //         me.byId("btnAddHdr").setVisible(true);
                //         me.byId("btnEditHdr").setVisible(true);
                //         //me.byId("btnAddNewHdr").setVisible(false);
                //         me.byId("btnAddRowHdr").setVisible(false);
                //         me.byId("btnRemoveRowHdr").setVisible(false);
                //         me.byId("btnSaveHdr").setVisible(false);
                //         me.byId("btnCancelHdr").setVisible(false);
                //         me.byId("btnDeleteHdr").setVisible(true);
                //         //me.byId("btnSettingsHdr").setVisible(true);
                //         me.byId("btnRefreshHdr").setVisible(true);
                //         me.byId("btnFullScreenHdr").setVisible(true);
                //         this.onTableResize('Hdr', 'Min');
                //     }
                //     // else if (this._sActiveTable === "detailTab") {
                //     //     me.byId("btnRefreshDtl").setVisible(true);
                //     //     me.byId("searchFieldDtl").setVisible(true);
                //     //     me.byId("btnRefreshHdr").setEnabled(true);
                //     //     me.byId("searchFieldHdr").setEnabled(true);
                //     //     this.onTableResize('Dtls', 'Min');
                //     // }

                //     this.byId(this._sActiveTable).getModel().setProperty("/rows", this._aDataBeforeChange);
                //     this.byId(this._sActiveTable).bindRows("/rows");

                //     if (this._aColFilters.length > 0) { this.setColumnFilters(this._sActiveTable); }
                //     if (this._aColSorters.length > 0) { this.setColumnSorters(this._sActiveTable); }
                //     this.setRowReadMode();
                //     this._dataMode = "READ";
                //     this.setActiveRowHighlightByTableId(this._sActiveTable);
                // }

                // this._ConfirmDialog.close();
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
                        me.getUnit(vMATNO);
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
            formatValueHelp: function(sValue, sPath, sKey, sText, sFormat) {
                // console.log(sValue, sPath, sKey, sText, sFormat);
                // console.log(this.getView().getModel(sPath))

                if (this.getView().getModel(sPath) === undefined) {
                    return sValue;
                }

                var oValue = this.getView().getModel(sPath).getData().filter(v => v[sKey] === sValue);

                if (oValue && oValue.length > 0) {
                    if (sFormat === "Value") {
                        return oValue[0][sText];
                    }
                    else if (sFormat === "ValueKey") {
                        return oValue[0][sText] + " (" + sValue + ")";
                    }
                    else if (sFormat === "KeyValue") {
                        return sValue + " (" + oValue[0][sText] + ")";
                    }
                    else {
                        return sValue;
                    }
                }
                else return sValue;
            },
            onKeyUp(oEvent) {
                if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    if (this.byId(oEvent.srcControl.sId).getBindingContext()) {
                        var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext().sPath;
                        var MATERIALNO = oTable.getModel().getProperty(sRowPath + "/MATERIALNO");
                        oTable.getModel().getData().rows.forEach(row => row.ACTIVE = "");
                        oTable.getModel().setProperty(sRowPath + "/ACTIVE", "X");
                        me.getView().getModel("ui").setProperty("/acitveMatno", MATERIALNO);

                        oTable.getRows().forEach(row => {
                            if (row.getBindingContext() && row.getBindingContext().sPath.replace("/rows/", "") === sRowPath.replace("/rows/", "")) {
                                row.addStyleClass("activeRow");
                            }
                            else row.removeStyleClass("activeRow")
                        })

                        me.getAttributes(MATERIALNO);
                        me.getBatch(MATERIALNO);
                        me.getCustomInfo(MATERIALNO);
                        me.getPlant(MATERIALNO);
                        me.getUnit(MATERIALNO);
                    }

                    if (oTable.getId().indexOf("headerTab") >= 0) {
                        var oTableDetail = this.byId("detailTab");
                        var oColumns = oTableDetail.getColumns();

                        for (var i = 0, l = oColumns.length; i < l; i++) {
                            if (oColumns[i].getSorted()) {
                                oColumns[i].setSorted(false);
                            }
                        }
                    }
                }
                else if (oEvent.key === "Enter" && oEvent.srcControl.sParentAggregationName === "cells") {
                    if (this._dataMode === "NEW") this.onAddNewRow();
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
