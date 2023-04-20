sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/model/Sorter',
    "sap/ui/Device",
    "sap/ui/table/library",
    "sap/ui/core/Fragment",
    'jquery.sap.global'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox, Filter, FilterOperator, Sorter, Device, library, Fragment, jQuery) {
        "use strict";
        var that;
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" });
        var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-ddTHH:mm:ss", UTC: false });
        return Controller.extend("zuimlc.controller.main", {
            onInit: function () {
                var me = this;
                this.getView().setModel(new JSONModel({
                    SBU: ''
                }), "ui");

                this.getOwnerComponent().getModel("UI_MODEL").setData({
                    sbu: "",
                    activeLCNO: "",
                    action: "READ",
                    refresh: false
                });

                this.setSmartFilterModel();
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_MLC_FILTERS_CDS");
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
                this.getAppAction();
                this.byId("mainTab").removeAllColumns();
                this.byId("detailsTab").removeAllColumns();
                this.getCols();
                this._aColumns = {};
                this._aFilterableColumns = {};
                this._oDataBeforeChange = {};
                this._aDataBeforeChange = [];
                this._aInvalidValueState = [];

                var oDDTextParam = [], oDDTextResult = {};

                oDDTextParam.push({CODE: "SBU"});
                oDDTextParam.push({CODE: "KUNNR"});
                oDDTextParam.push({CODE: "LCNO"});
                oDDTextParam.push({CODE: "BANKS"});
                oDDTextParam.push({CODE: "CREATEDBY"});
                oDDTextParam.push({CODE: "CREATEDDT"});
                oDDTextParam.push({CODE: "UPDATEDBY"});
                oDDTextParam.push({CODE: "UPDATEDDT"});
                oDDTextParam.push({CODE: "DELETED"});
                oDDTextParam.push({CODE: "BANKL"});
                oDDTextParam.push({CODE: "EXPDT"});
                oDDTextParam.push({CODE: "WAERS"});
                oDDTextParam.push({CODE: "LCAMT"});
                oDDTextParam.push({CODE: "BUKRS"});
                oDDTextParam.push({CODE: "PERCENT"});
                oDDTextParam.push({CODE: "LCAMTPER"});
                oDDTextParam.push({CODE: "BALAMT"});
                oDDTextParam.push({CODE: "BANKS"});
                oDDTextParam.push({CODE: "LCDT"});

                oDDTextParam.push({CODE: "INFO_NO_RECORD_TO_PROC"});
                oDDTextParam.push({CODE: "INFO_NO_SEL_RECORD_TO_PROC"});
                oDDTextParam.push({CODE: "INFO_NO_LAYOUT"});
                oDDTextParam.push({CODE: "INFO_LAYOUT_SAVE"});
                oDDTextParam.push({CODE: "INFO_INPUT_REQD_FIELDS"});
                oDDTextParam.push({CODE: "CONFIRM_DISREGARD_CHANGE"});
                oDDTextParam.push({CODE: "INFO_SEL_RECORD_TO_DELETE"});  
                oDDTextParam.push({CODE: "INFO_NO_RECORD_TO_DELETE"});  
                oDDTextParam.push({CODE: "INFO_DLV_DELETE_NOT_ALLOW"});
                oDDTextParam.push({CODE: "INFO_NO_RECORD_TO_REMOVE"});
                oDDTextParam.push({CODE: "INFO_SEL_RECORD_TO_REMOVE"});
                oDDTextParam.push({CODE: "INFO_DATA_DELETED"});  
                oDDTextParam.push({CODE: "CONF_DELETE_RECORDS"});  
                oDDTextParam.push({CODE: "INFO_ERROR"});
                oDDTextParam.push({CODE: "INFO_NO_DATA_SAVE"});
                oDDTextParam.push({CODE: "INFO_DATA_SAVE"});
                oDDTextParam.push({CODE: "INFO_NO_DATA_EDIT"});
                oDDTextParam.push({CODE: "INFO_CHECK_INVALID_ENTRIES"});
                oDDTextParam.push({CODE: "ADD"});
                oDDTextParam.push({CODE: "EDIT"});
                oDDTextParam.push({CODE: "SAVE"});
                oDDTextParam.push({CODE: "CANCEL"});
                oDDTextParam.push({CODE: "CLOSE"});
                oDDTextParam.push({CODE: "DELETE"});
                oDDTextParam.push({CODE: "REMOVE"});
                oDDTextParam.push({CODE: "REFRESH"});
                oDDTextParam.push({CODE: "FULLSCREEN"});
                oDDTextParam.push({CODE: "EXITFULLSCREEN"});
                oDDTextParam.push({CODE: "COMPLETE"});
                oDDTextParam.push({CODE: "INFO_NO_DATA_MODIFIED"}); 
                oDDTextParam.push({CODE: "INFO_DLV_INVOICE_REQD"}); 
                oDDTextParam.push({CODE: "INFO_DLV_INSUFFICIENT_STOCK"}); 
                this._oModelCommon = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                this._oModelCommon.create("/CaptionMsgSet", { CaptionMsgItems: oDDTextParam  }, {
                    method: "POST",
                    success: function(oData, oResponse) {     
                        oData.CaptionMsgItems.results.forEach(item => {
                            oDDTextResult[item.CODE] = item.TEXT;
                        })

                        me.getView().setModel(new JSONModel(oDDTextResult), "ddtext");
                        me.getOwnerComponent().getModel("CAPTION_MSGS_MODEL").setData({text: oDDTextResult})
                        //Common.closeLoadingDialog(me);
                    },
                    error: function(err) { }
                });
            },
            setSmartFilterModel: function () {
                //Model StyleHeaderFilters is for the smartfilterbar
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_MLC_FILTERS_CDS");
                // console.log(oModel)
                var oSmartFilter = this.getView().byId("smartFilterBar");
                oSmartFilter.setModel(oModel);
            },
            getAppAction: async function () {
                if (sap.ushell.Container !== undefined) {
                    const fullHash = new HashChanger().getHash();
                    const urlParsing = await sap.ushell.Container.getServiceAsync("URLParsing");
                    const shellHash = urlParsing.parseShellHash(fullHash);
                    const sAction = shellHash.action;

                    if (sAction === "display") {
                        this.byId("btnNewMain").setVisible(false);
                    }
                    else {
                        this.byId("btnNewMain").setVisible(true);
                    }
                }
            },
            onSearch: function () {
                this.getMain();
            },
            onCellClick: function (oEvent) {
                var LCNO = oEvent.getParameters().rowBindingContext.getObject().LCNO;
                this.getOwnerComponent().getModel("UI_MODEL").setProperty("/activeLCNO", LCNO);
                this.getDetails(LCNO);
            },
            getMain() {
                var oModel = this.getOwnerComponent().getModel();
                var _this = this;
                oModel.read('/mainSet', {
                    success: function (data, response) {
                        _this.getView().setModel(new JSONModel({
                            results: []
                        }), "MLC");

                        if (data.results.length > 0) {
                            data.results.forEach(item => {
                                item.CREATEDDT = dateFormat.format(item.CREATEDDT);
                                item.UPDATEDDT = dateFormat.format(item.UPDATEDDT);
                                item.EXPDT = dateFormat.format(item.EXPDT);
                                item.LCDT = dateFormat.format(item.LCDT);
                                item.DELETED = item.DELETED === "" ? false : true;
                            })

                            data.results.sort((a, b) => parseInt(b.LCNO) - parseInt(a.LCNO) || new Date(b.CREATEDDT) - new Date(a.CREATEDDT));
                            var oJSONModel = new sap.ui.model.json.JSONModel();
                            oJSONModel.setData(data);
                            _this.getView().setModel(oJSONModel,"MLC");
                            _this.getDetails(data.results[0].LCNO);
                        }
                        
                    },
                    error: function (err) {
                        sap.m.MessageBox.warning(err.message);
                    }
                });
            },
            getDetails(LCNO) {
                var oModel = this.getOwnerComponent().getModel();
                var _this = this;
                oModel.read('/detailsSet', {
                    urlParameters: {
                        "$filter": "LCNO eq '" + LCNO + "'"
                    },
                    success: function (data, response) {
                        if (data.results.length > 0) {
                            data.results.forEach(item => {
                                item.REFDOCDT = dateFormat.format(item.REFDOCDT);
                                item.CREATEDDT = dateFormat.format(item.CREATEDDT);
                                item.UPDATEDDT = dateFormat.format(item.UPDATEDDT);
                                item.LCDT = dateFormat.format(item.LCDT);
                                item.DELETED = item.DELETED === "" ? false : true;
                            })
                        }
                        data.results.sort((a, b) => new Date(parseInt(b.LCNO) - parseInt(a.LCNO) || parseInt(b.SEQ) - parseInt(a.SEQ)));
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel,"MLCDTLS");
                    },
                    error: function (err) {
                        sap.m.MessageBox.warning(err.message);
                    }
                });
            },
            getCols: async function () {
                var sPath = jQuery.sap.getModulePath("zuimlc", "/model/columns.json");
                var oModelColumns = new JSONModel();
                await oModelColumns.loadData(sPath);

                var oColumns = oModelColumns.getData();
                var oModel = this.getOwnerComponent().getModel();
                oModel.metadataLoaded().then(() => {
                    this.getDynamicColumns(oColumns, "MLC", "ZERP_LCHDR");
                    setTimeout(() => {
                        this.getDynamicColumns(oColumns, "MLCDTLS", "ZERP_LCDET");
                    }, 100);

                });

            },
            getDynamicColumns(arg1, arg2, arg3) {
                var me = this;
                var oColumns = arg1;
                var modCode = arg2;
                var tabName = arg3;
                //get dynamic columns based on saved layout or ZERP_CHECK
                var oJSONColumnsModel = new JSONModel();
                var vSBU = 'VER';

                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                // console.log(oModel)
                oModel.setHeaders({
                    sbu: vSBU,
                    type: modCode,
                    tabname: tabName
                });

                oModel.read("/ColumnsSet", {
                    success: function (oData, oResponse) {
                        oJSONColumnsModel.setData(oData);

                        if (oData.results.length > 0) {
                            if (modCode === 'MLC') {
                                var aColumns = me.setTableColumns(oColumns["MLC"], oData.results);
                                me._aColumns["MLC"] = aColumns["columns"];
                                me.addColumns(me.byId("mainTab"), aColumns["columns"], "MLC");
                            }
                            if (modCode === 'MLCDTLS') {
                                var aColumns = me.setTableColumns(oColumns["MLCDTLS"], oData.results);
                                me._aColumns["MLCDTLS"] = aColumns["columns"];
                                //me._aFilterableColumns["MHUDTLS"] = aColumns["filterableColumns"];
                                me.addColumns(me.byId("detailsTab"), aColumns["columns"], "MLCDTLS");
                            }
                        }
                    },
                    error: function (err) {
                        //me.closeLoadingDialog(that);
                    }
                });
            },
            addColumns(table, columns, model) {
                var aColumns = columns.filter(item => item.showable === true)
                aColumns.sort((a, b) => (a.position > b.position ? 1 : -1));
                aColumns.forEach(col => {
                    // console.log(col)
                    if (col.type === "STRING" || col.type === "DATETIME") {
                        table.addColumn(new sap.ui.table.Column({
                            //id: model + "Col" + col.name,
                            // id: col.name,
                            width: col.width,
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({ text: col.label }),
                            template: new sap.m.Text({ text: "{" + model + ">" + col.name + "}" }),
                            visible: col.visible
                        }));
                    }
                    else if (col.type === "NUMBER") {
                        table.addColumn(new sap.ui.table.Column({
                            //id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "End",
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({ text: col.label }),
                            template: new sap.m.Text({ text: "{" + model + ">" + col.name + "}" }),
                            visible: col.visible
                        }));
                    }
                    else if (col.type === "BOOLEAN") {
                        table.addColumn(new sap.ui.table.Column({
                            //id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "Center",
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({ text: col.label }),
                            template: new sap.m.CheckBox({ selected: "{" + model + ">" + col.name + "}", editable: false }),
                            visible: col.visible
                        }));
                    }
                })
            },
            setTableColumns: function (arg1, arg2) {
                var oColumn = arg1;
                var oMetadata = arg2;

                var aSortableColumns = [];
                var aFilterableColumns = [];
                var aColumns = [];

                oMetadata.forEach((prop, idx) => {
                    var vCreatable = prop.Editable;
                    var vUpdatable = prop.Editable;
                    var vSortable = true;
                    var vSorted = prop.Sorted;
                    var vSortOrder = prop.SortOrder;
                    var vFilterable = true;
                    var vName = prop.ColumnLabel;
                    var oColumnLocalProp = oColumn.filter(col => col.name.toUpperCase() === prop.ColumnName);
                    var vShowable = true;
                    var vOrder = prop.Order;

                    // console.loetco(prop)
                    if (vShowable) {
                        //sortable
                        if (vSortable) {
                            aSortableColumns.push({
                                name: prop.ColumnName,
                                label: vName,
                                position: +vOrder,
                                sorted: vSorted,
                                sortOrder: vSortOrder
                            });
                        }

                        //filterable
                        if (vFilterable) {
                            aFilterableColumns.push({
                                name: prop.ColumnName,
                                label: vName,
                                position: +vOrder,
                                value: "",
                                connector: "Contains"
                            });
                        }
                    }

                    //columns
                    aColumns.push({
                        name: prop.ColumnName,
                        label: vName,
                        position: +vOrder,
                        type: prop.DataType,
                        creatable: vCreatable,
                        updatable: vUpdatable,
                        sortable: vSortable,
                        filterable: vFilterable,
                        visible: prop.Visible,
                        required: prop.Mandatory,
                        width: prop.ColumnWidth + 'rem',
                        sortIndicator: vSortOrder === '' ? "None" : vSortOrder,
                        hideOnChange: false,
                        valueHelp: oColumnLocalProp.length === 0 ? { "show": false } : oColumnLocalProp[0].valueHelp,
                        showable: vShowable,
                        key: prop.Key === '' ? false : true,
                        maxLength: prop.Length,
                        precision: prop.Decimal,
                        scale: prop.Scale !== undefined ? prop.Scale : null
                    })
                })

                /*aSortableColumns.sort((a,b) => (a.position > b.position ? 1 : -1));
                this.createViewSettingsDialog("sort", 
                    new JSONModel({
                        items: aSortableColumns,
                        rowCount: aSortableColumns.length,
                        activeRow: 0,
                        table: ""
                    })
                );

                aFilterableColumns.sort((a,b) => (a.position > b.position ? 1 : -1));
                this.createViewSettingsDialog("filter", 
                    new JSONModel({
                        items: aFilterableColumns,
                        rowCount: aFilterableColumns.length,
                        table: ""
                    })
                );*/

                aColumns.sort((a, b) => (a.position > b.position ? 1 : -1));
                var aColumnProp = aColumns.filter(item => item.showable === true);

                /*this.createViewSettingsDialog("column", 
                    new JSONModel({
                        items: aColumnProp,
                        rowCount: aColumnProp.length,
                        table: ""
                    })
                );*/


                //return { columns: aColumns, sortableColumns: aSortableColumns, filterableColumns: aFilterableColumns };
                return { columns: aColumns };
            },
            onNewHdr: function (oEvent) {
                this.getOwnerComponent().getModel("UI_MODEL").setProperty("/action", "NEW");
                this.getOwnerComponent().getModel("UI_MODEL").setProperty("/activeLCNO", "");
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteHeader");
            },
            onAfterRendering:function(){
                var that = this;
                var oModel = new JSONModel();
                var oTable = this.getView().byId("mainTab");
                oTable.setModel(oModel);
                oTable.attachBrowserEvent('dblclick', function (e) {
                    e.preventDefault();
                    that.getOwnerComponent().getModel("MLCDATA_MODEL").setData({
                        header: that.byId("mainTab").getModel("MLC").getData().results.filter(item => item.LCNO === that.getOwnerComponent().getModel("UI_MODEL").getData().activeLCNO)[0],
                        detail: that.byId("detailsTab").getModel("MLCDTLS").getData().results.filter(item => item.LCNO === that.getOwnerComponent().getModel("UI_MODEL").getData().activeLCNO),
                    })

                    that.getOwnerComponent().getModel("UI_MODEL").setProperty("/action", "EDIT");
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
                    oRouter.navTo("RouteHeader");
                });
            },
        });
    });
