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
    'jquery.sap.global',
    "sap/ui/core/routing/HashChanger",
    "../js/Common",
],

function (Controller, JSONModel, MessageBox, History, MessageToast,HashChanger,Common) {
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" });
        var yearFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy" });
        var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "YYYY-MM-ddTHH:mm:ss", UTC: false });
        var _oCaption = {};
        var _this;
        return Controller.extend("zuimlc.controller.header", {
            onInit: function () {
                var me = this;
                const route = this.getOwnerComponent().getRouter().getRoute("RouteHeader");
                route.attachPatternMatched(this._routePatternMatched, this);
                /*if (sap.ui.getCore().byId("backBtn") !== undefined) {
                    sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction = function(oEvent) {
                        me.onNavBack();
                    }
                }*/
            },
            _routePatternMatched: function (oEvent) {
                var oHeaderData = {};
                this._oModel = this.getOwnerComponent().getModel();
                this._oModelCommon = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");            
                this._aColumns = [];
                this._aDataBeforeChange = [];
                this._oDataBeforeChange = {};
                this._validationErrors = [];
                this._dataMode = this.getOwnerComponent().getModel("UI_MODEL").getData().action;
                this._LCNO = this.getOwnerComponent().getModel("UI_MODEL").getData().activeLCNO;
                this.byId("detailsTab").removeAllColumns();
                this.getCols();
                this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("CAPTION_MSGS_MODEL").getData().text), "ddtext");
                if (this._dataMode === "NEW" || this._dataMode === "EDIT") {
                    if(this._dataMode === "NEW"){
                        this.setHeaderFieldsEditable(true);
                        this.setDetailsButtonEnabled(false);
                        oHeaderData = {
                            KUNNR : "",
                            LCNO : "",
                            LCDT : "",
                            BANKS : "",
                            BANKL : "",
                            EXPDT : "",
                            WAERS : "",
                            LCAMT : "",
                            BUKRS : "",
                            PERCENT : "",
                            LCAMTPER : "",
                            BALAMT : "",
                            DELETED : false,
                            CREATEDBY : "",
                            CREATEDDT : "",
                            UPDATEDBY : ""
                        }

                        this.getView().byId("btnEditHdr").setVisible(false);
                        this.getView().byId("btnSaveHdr").setVisible(true);
                        this.getView().byId("btnCancelHdr").setVisible(true);
                    }
                    else if(this._dataMode === "EDIT"){
                        //console.log("headerData",this.getOwnerComponent().getModel("MLCDATA_MODEL").getData().header)
                        oHeaderData = jQuery.extend(true, {}, this.getOwnerComponent().getModel("MLCDATA_MODEL").getData().header);
                        this.setHeaderFieldsEditable(false);
                        console.log("oHeaderData",oHeaderData);
                    }
                    
                }

                this.getView().setModel(new JSONModel(oHeaderData), "header");
                this.getDetails(this._LCNO);
                
                //this.getAppAction();
                //console.log("captions",this.getOwnerComponent().getModel("CAPTION_MSGS_MODEL").getData().text);
                //this.getView().setModel(new JSONModel(this.getOwnerComponent().getModel("CAPTION_MSGS_MODEL").getData().text), "ddtext");
                //this.setButton('INIT');
                /*var oModel = new sap.ui.model.json.JSONModel();
                oModel.loadData("/sap/bc/ui2/start_up").then(() => {
                    this._userid = oModel.oData.id;
                })*/
                //alert(oEvent.getParameter("arguments").mode)
                /*this._aColumns = {};
                this.oColumns = {};
                this.byId("detailsTab").removeAllColumns();
                this.validationErrors = [];
                this._oDataBeforeChange = {};
                this._aDataBeforeChange = [];
                this._aInvalidValueState = [];
                
                this.getOwnerComponent().getModel("UI_MODEL").setProperty("/flag", false);

                this._oModel = this.getOwnerComponent().getModel();
                this.getView().setModel(new JSONModel({
                    SRCTBL: oEvent.getParameter("arguments").srctbl,
                    MTYPE: oEvent.getParameter("arguments").mtype,
                    RSVNO: oEvent.getParameter("arguments").rsvno,
                    MODE: oEvent.getParameter("arguments").mode,
                    VARCD: oEvent.getParameter("arguments").varcd
                }), "ui");
                this.displayHeaderData(oEvent.getParameter("arguments").mode);
                this.getMovementTypeDesc(oEvent.getParameter("arguments").mtype);
                this.showLoadingDialog('Loading...');
                this.getMRDtls2(oEvent.getParameter("arguments").rsvno);
                this.setButton(oEvent.getParameter("arguments").mode);
                */
            },
            getCols: async function () {
                var sPath = jQuery.sap.getModulePath("zuimlc", "/model/columns.json");
                var oModelColumns = new JSONModel();
                await oModelColumns.loadData(sPath);

                var oColumns = oModelColumns.getData();
                var oModel = this.getOwnerComponent().getModel();
                oModel.metadataLoaded().then(() => {
                    this.getDynamicColumns(oColumns, "MLCDTLS", "ZERP_LCDET");

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
            setDetailsButtonEnabled(arg){
                this.getView().byId("btnAddDtls").setEnabled(arg);
                this.getView().byId("btnDeleteDtls").setEnabled(arg);
                this.getView().byId("btnRefreshDtls").setEnabled(arg);
                this.getView().byId("btnFullScreenDtls").setEnabled(arg);
                this.getView().byId("btnAddDtls").setVisible(true);
                this.getView().byId("btnDeleteDtls").setVisible(true);
                this.getView().byId("btnRefreshDtls").setVisible(true);
                this.getView().byId("btnFullScreenDtls").setVisible(true);
                this.getView().byId("btnAddNewRow").setVisible(false);
                this.getView().byId("btnRemoveNewRow").setVisible(false);
                this.getView().byId("btnSavedDtls").setVisible(false);
                this.getView().byId("btnCancelDtls").setVisible(false);
            },
            setHeaderFieldsEditable(arg) {
                this.getView().byId("hdrKUNNR").setEditable(arg);
                this.getView().byId("hdrLCNO").setEditable(arg);
                this.getView().byId("hdrLCDT").setEditable(arg);
                this.getView().byId("hdrBANKS").setEditable(arg);
                this.getView().byId("hdrBANKL").setEditable(arg);
                this.getView().byId("hdrEXPDT").setEditable(arg);
                this.getView().byId("hdrWAERS").setEditable(arg);
                this.getView().byId("hdrLCAMT").setEditable(arg);
                this.getView().byId("hdrBUKRS").setEditable(arg);
                this.getView().byId("hdrPERCENT").setEditable(arg);
                this.getView().byId("hdrLCAMTPER").setEditable(arg);
                this.getView().byId("hdrBALAMT").setEditable(arg);
            },
            onEdit(){
                this.setHeaderFieldsEditable(true);
                this.getView().byId("hdrLCNO").setEditable(false);
                this.getView().byId("btnEditHdr").setVisible(false);
                this.getView().byId("btnSaveHdr").setVisible(true);
                this.getView().byId("btnCancelHdr").setVisible(true);
            },
            onRefresh(){
                this.getDetails(this._LCNO);
            },
            onSaveDtls:function(oEvent){
                var _this =this;
                
                sap.m.MessageBox.confirm("Would you like to save your changes?", {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") { 
                            var aNewRows = _this.getView().getModel("MLCDTLS").getData().results.filter(item => item.NEW === true);
                            if (aNewRows.length > 0) {
                                //var aParam = [];
                                aNewRows.forEach((item, idx) => {
                                    setTimeout(() => {
                                        var oParam = {};
                                        oParam["KUNNR"] = _this.getView().byId("hdrKUNNR").getValue();
                                        oParam["LCNO"] = _this.getView().byId("hdrLCNO").getValue();
                                        oParam["LCDT"] = sapDateFormat.format(new Date(_this.getView().byId("hdrLCDT").getValue()));
                                        oParam["SEQ"] = parseInt(aNewRows[idx].SEQ);
                                        oParam["TRANTYP"] = aNewRows[idx].TRANTYP;
                                        oParam["REFDOCNO"] = aNewRows[idx].REFDOCNO;
                                        oParam["REFDOCDT"] = sapDateFormat.format(new Date(_this.getView().byId("hdrLCDT").getValue()));//sapDateFormat.format(new Date(aNewRows[idx].REFDOCDT));
                                        oParam["IONO"] = aNewRows[idx].IONO;
                                        oParam["DLVSEQ"] = parseInt(aNewRows[idx].DLVSEQ);
                                        oParam["INVNO"] = aNewRows[idx].INVNO;
                                        oParam["AMOUNT"] = aNewRows[idx].AMOUNT;
                                        //aParam.push(oParam);
                                        var oModel = _this.getOwnerComponent().getModel();
                                        oModel.create("/detailsSet", oParam, {
                                            method: "POST",
                                            success: function (oData, oResponse) {
                                                alert("saved");
                                            }
                                        });
                                    }, 100);
                                });
                            }
                        }
                    }
                });

                /* insert
                {
    "LCNO": "1",
    "LCDT": "2023-04-19T00:00:00",
    "SEQ": 1,
    "TRANTYP": "T",
    "REFDOCNO": "TEST",
    "REFDOCDT": "2023-04-19T00:00:00",
    "IONO": "10001",
    "DLVSEQ": 1,
    "INVNO": "1",
    "AMOUNT": "1"
}*/

/*update
    detailsSet(LCNO='1',SEQ=1)
    {
    "LCNO": "1",
    "LCDT": "2023-04-19T00:00:00",
    "SEQ": 1,
    "TRANTYP": "C",
    "REFDOCNO": "TEST",
    "REFDOCDT": "2023-04-19T00:00:00",
    "IONO": "10001",
    "DLVSEQ": 1,
    "INVNO": "1",
    "AMOUNT": "1"
}
*/



                
            },
            onSave: function(oEvent) {
                var _this = this;
                this.setHeaderFieldsEditable(false);
                this.setDetailsButtonEnabled(true);
                this.getView().byId("btnEditHdr").setVisible(false);
                this.getView().byId("btnSaveHdr").setVisible(false);
                this.getView().byId("btnCancelHdr").setVisible(true);

                sap.m.MessageBox.confirm("Would you like to save your changes?", {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            var oParam = {};
                            oParam["KUNNR"] = _this.getView().byId("hdrKUNNR").getValue();
                            oParam["LCNO"] = _this.getView().byId("hdrLCNO").getValue();
                            oParam["LCDT"] = sapDateFormat.format(new Date(_this.getView().byId("hdrLCDT").getValue()));
                            oParam["BANKS"] = _this.getView().byId("hdrBANKS").getValue();
                            oParam["BANKL"] = _this.getView().byId("hdrBANKL").getValue();
                            oParam["EXPDT"] = sapDateFormat.format(new Date(_this.getView().byId("hdrEXPDT").getValue()));
                            oParam["WAERS"] = _this.getView().byId("hdrWAERS").getValue();
                            oParam["LCAMT"] = _this.getView().byId("hdrLCAMT").getValue();
                            oParam["BUKRS"] = _this.getView().byId("hdrBUKRS").getValue();
                            oParam["PERCENT"] = _this.getView().byId("hdrPERCENT").getValue();
                            oParam["LCAMTPER"] = _this.getView().byId("hdrLCAMTPER").getValue();
                            oParam["BALAMT"] = _this.getView().byId("hdrBALAMT").getValue();

                            if (_this._dataMode === "NEW") {
                                _this._oModel.create("/mainSet", oParam, {
                                    method: "POST",
                                    success: function (oData, oResponse) {
                                        alert("saved");
                                    }
                                });
                            }
                            else if(_this._dataMode === "EDIT"){
                                alert(_this.getView().byId("hdrLCNO").getValue());
                                var oEntitySet = "/mainSet(LCNO='" + _this.getView().byId("hdrLCNO").getValue() + "')";
                                _this._oModel.update(oEntitySet, oParam, {
                                    method: "PUT",
                                    success: function(data, oResponse) {
                                        alert("edit");
                                    },
                                    error: function(err) {
                                        console.log(err);
                                    }
                                });
                            }
                        }
                    }
                });
                
                

                

                /*save update
                mainSet(LCNO='1')
                {
    "KUNNR": "test",
    "LCNO": "1",
    "LCDT": "2023-04-20T00:00:00",
    "BANKS": "D",
    "BANKL": "S",
    "EXPDT": "2023-04-20T00:00:00",
    "WAERS": "S",
    "LCAMT": "1",
    "BUKRS": "D",
    "PERCENT": "2",
    "LCAMTPER": "3",
    "BALAMT": "4"
}
                */
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
                        data.results.sort((a, b) => new Date(b.CREATEDDT) - new Date(a.CREATEDDT) || parseInt(b.LCNO) - parseInt(a.LCNO));
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel,"MLCDTLS");
                    },
                    error: function (err) {
                        sap.m.MessageBox.warning(err.message);
                    }
                });
            },
            onCreate: function (oEvent) {
                this.getView().byId("btnAddDtls").setVisible(false);
                this.getView().byId("btnDeleteDtls").setVisible(false);
                this.getView().byId("btnRefreshDtls").setVisible(false);
                this.getView().byId("btnFullScreenDtls").setVisible(false);
                this.getView().byId("btnAddNewRow").setVisible(true);
                this.getView().byId("btnRemoveNewRow").setVisible(true);
                this.getView().byId("btnSavedDtls").setVisible(true);
                this.getView().byId("btnCancelDtls").setVisible(true);
                this.setRowCreateMode("details");
            },
            onAddNewRow : function(oEvent){
                this.setRowCreateMode("details");
            },
            setRowCreateMode(arg) {
                var oTable = this.byId(arg + "Tab");
                oTable.clearSelection();
                var aNewRows = this.getView().getModel("MLCDTLS").getData().results.filter(item => item.NEW === true);
                if (aNewRows.length == 0) {
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("MLCDTLS").getData());
                }

                var oNewRow = {};
                var oTable = this.byId("detailsTab");
                oTable.getColumns().forEach((col, idx) => {
                    this._aColumns["MLCDTLS"].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (!ci.hideOnChange && ci.creatable) {
                                if (ci.type === "BOOLEAN") {
                                    col.setTemplate(new sap.m.CheckBox({
                                        selected: "{MLCDTLS>" + ci.name + "}",
                                        select: this.onCheckBoxChange.bind(this),
                                        editable: true
                                    }));
                                }
                                else if (ci.valueHelp["show"]) {
                                    col.setTemplate(new sap.m.Input({
                                        type: "Text",
                                        value: "{MLCDTLS>" + ci.name + "}",
                                        maxLength: +ci.maxLength,
                                        showValueHelp: true,
                                        valueHelpRequest: this.handleValueHelp.bind(this),
                                        showSuggestion: true,
                                        maxSuggestionWidth: ci.valueHelp["suggestionItems"].additionalText !== undefined ? ci.valueHelp["suggestionItems"].maxSuggestionWidth : "1px",
                                        suggestionItems: {
                                            path: ci.valueHelp["suggestionItems"].path,
                                            length: 1000,
                                            template: new sap.ui.core.ListItem({
                                                key: ci.valueHelp["suggestionItems"].text,
                                                text: ci.valueHelp["suggestionItems"].text,
                                                additionalText: ci.valueHelp["suggestionItems"].additionalText !== undefined ? ci.valueHelp["suggestionItems"].additionalText : '',
                                            }),
                                            templateShareable: false
                                        },
                                        change: this.onValueHelpLiveInputChange.bind(this)
                                    }));
                                }
                                else if (ci.type === "NUMBER") {
                                    col.setTemplate(new sap.m.Input({
                                        type: sap.m.InputType.Number,
                                        textAlign: sap.ui.core.TextAlign.Right,
                                        value: "{path:'MLCDTLS>" + ci.name + "', type:'sap.ui.model.odata.type.Decimal', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
                                        liveChange: this.onNumberLiveChange.bind(this)
                                    }));
                                }
                                else {
                                    if (ci.maxLength !== null) {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{MLCDTLS>" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{MLCDTLS>" + ci.name + "}",
                                            liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                }
                            }

                            if (ci.required) {
                                col.getLabel().addStyleClass("sapMLabelRequired");    
                                
                            }

                            if (ci.type === "STRING") oNewRow[ci.name] = "";
                            else if (ci.type === "NUMBER") oNewRow[ci.name] = "0";
                            else if (ci.type === "BOOLEAN") oNewRow[ci.name] = false;
                        });
                });
                oNewRow["NEW"] = true;

                if (arg == "details") {
                    var iMaxSeq = 0;
                    var iMaxSeq1 = 0;
                    var iMaxSeq2 = 0;

                    if (this._oDataBeforeChange.results.length > 0) {
                        iMaxSeq1 = Math.max(...this._oDataBeforeChange.results.map(item => item.SEQ));
                    }

                    //var aNew = this.getView().getModel(pModel).getData();
                    if (aNewRows.length > 0) {
                        iMaxSeq2 = Math.max(...aNewRows.map(item => item.SEQ));
                    }

                    iMaxSeq = (iMaxSeq1 > iMaxSeq2 ? iMaxSeq1 : iMaxSeq2) + 1;
                    oNewRow["SEQ"] = iMaxSeq.toString();
                    //oNewRow["REQDDT"] = dateFormat.format(new Date());
                   // oNewRow["SLOC"] = this.getView().getModel("hdrModel").getData().plant;


                    /*if (this.mtype !== '311') {
                        oNewRow["RCVSLOC"] = this.getView().getModel("hdrModel").getData().plant;
                    }*/

                }

                aNewRows.push(oNewRow);
                this.getView().getModel("MLCDTLS").setProperty("/results", aNewRows);

                // Remove filter
                this.byId(arg + "Tab").getBinding("rows").filter(null, "Application");
            },
            onCancel: function (oEvent) {
                
                this.setDetailsButtonEnabled(true);
            },
            onInputLiveChange: function (oEvent) {
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;

                this.getView().getModel(sModel).setProperty(sRowPath + '/EDITED', true);
            },
            onNumberLiveChange: function (oEvent) {
                var oSource = oEvent.getSource();
                var vColDecPlaces = oSource.getBindingInfo("value").constraints.scale;
                var vColLength = oSource.getBindingInfo("value").constraints.precision;
                var vDecPlaces = oSource.getBindingInfo("value").constraints.scale;

                if (oSource.getBindingInfo("value").parts[0].path === "BASEPOQTY") {
                    var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                    var vUOM = this.byId("myTab").getModel().getProperty(sRowPath + "/BASEUOM");
                    this.getView().getModel("UOM").filter(fItem => fItem.MSEHI === vUOM).forEach(item => vDecPlaces = item.ANDEC);
                }

                if (oEvent.getParameters().value.split(".")[0].length > (vColLength - vColDecPlaces)) {
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Enter a number with a maximum whole number length of " + (vColLength - vColDecPlaces));

                    if (this._validationErrors.filter(fItem => fItem === oEvent.getSource().getId()).length === 0) {
                        this._validationErrors.push(oEvent.getSource().getId());
                    }
                }
                else if (oEvent.getParameters().value.split(".").length > 1) {
                    if (vDecPlaces === 0) {
                        oEvent.getSource().setValueState("Error");
                        oEvent.getSource().setValueStateText("Enter a number without decimal place/s");
                        
                        if (this._validationErrors.filter(fItem => fItem === oEvent.getSource().getId()).length === 0) {
                            this._validationErrors.push(oEvent.getSource().getId());
                        }
                    }
                    else {
                        if (oEvent.getParameters().value.split(".")[1].length > vDecPlaces) {
                            oEvent.getSource().setValueState("Error");
                            oEvent.getSource().setValueStateText("Enter a number with a maximum of " + vDecPlaces.toString() + " decimal places");
                            
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

            },
        });
    });