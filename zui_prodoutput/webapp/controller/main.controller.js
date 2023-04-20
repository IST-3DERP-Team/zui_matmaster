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
    function (Controller, JSONModel, MessageBox, Filter, FilterOperator, Sorter, Device, library, Fragment,jQuery) {
        "use strict";
        var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "yyyy-MM-dd" });
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });
        return Controller.extend("zuiprodoutput.controller.main", {
            onInit: function () {
                var _this=this;
                this.getAppAction();
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.loadData("/sap/bc/ui2/start_up").then(() => {
                    this._userid = oModel.oData.id;
                })
                
                this.setButton("init");
                this.mode = "readDtls"
                this._Model = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                this.setSmartFilterModel();
                this.getView().setModel(new JSONModel({
                    sbu: ''
                }), "ui");

                this._aColumns = {};
                this._oDataBeforeChange = {};
                this._aDataBeforeChange = [];
                this._OutputBreakdownDialog = null;

                var oDelegateKeyUp = {
                    onkeyup: function(oEvent){
                        _this.onKeyUp(oEvent);
                    }
                };
                this.byId("detailsTab").addEventDelegate(oDelegateKeyUp);
            },
            getAppAction: async function() {
                if (sap.ushell.Container !== undefined) {
                    const fullHash = new HashChanger().getHash(); 
                    const urlParsing = await sap.ushell.Container.getServiceAsync("URLParsing");
                    const shellHash = urlParsing.parseShellHash(fullHash); 
                    const sAction = shellHash.action;

                    if (sAction === "display") {
                        this.byId("btnNew").setVisible(false);
                        this.byId("btnEdit").setVisible(false);
                    }
                    else {
                        this.byId("btnNew").setVisible(true);
                        this.byId("btnEdit").setVisible(true);
                    }
                }
            },
            getFgsloc(plantcd){
                var _this = this;
                var vSBU = 'VER';
                var oJSONCommonDataModel = new JSONModel();
                var oModel = this.getOwnerComponent().getModel();
                oModel.read("/FGSLOCSet", {
                    urlParameters: {
                        "$filter": "SBU eq '" + vSBU + "' and PLANTCD eq '"+plantcd+"'"
                    },
                    success: function (oData, oResponse) {
                        if (oData.results.length > 0) {
                            _this.getView().getModel("ui").setProperty("/fgsloc", oData.results[0].Fgsloc);
                        }
                    },
                    error: function (err) { }
                });
            },
            getProcess(iono){
                var _this = this;
                var oJSONCommonDataModel = new JSONModel();
                var oModel = this.getOwnerComponent().getModel();
                oModel.read("/OutputBreakdownProcessSet", {
                    urlParameters: {
                        "$filter": "IONO eq '" + iono + "'"
                    },
                    success: function (oData, oResponse) {
                        if (oData.results.length > 0) {
                            _this.isHasPOB(oData.results[0].PROCESSCD);
                            if(_this.hasPOB === true){
                                _this.byId("btnOutputBreakdown").setEnabled(true);
                            }
                            else{
                                _this.byId("btnOutputBreakdown").setEnabled(false);
                            }
                            _this.byId("btnNew").setEnabled(true);
                            _this.byId("btnEdit").setEnabled(true);
                            //_this.byId("btnOutputBreakdown").setEnabled(true);
                            _this.byId("btnDelete").setEnabled(true);
                            _this.byId("btnRefreshDtls").setEnabled(true);
                            oJSONCommonDataModel.setData(oData);
                            _this.getView().setModel(oJSONCommonDataModel, "processData");   
                            _this.getView().getModel("ui").setProperty("/process", oData.results[0].PROCESSCD);
                            _this.getDtls(iono,oData.results[0].PROCESSCD)
                        }
                        else{
                            _this.byId("btnNew").setEnabled(false);
                            _this.byId("btnEdit").setEnabled(false);
                            _this.byId("btnOutputBreakdown").setEnabled(false);
                            _this.byId("btnDelete").setEnabled(false);
                            _this.byId("btnRefreshDtls").setEnabled(false);
                            oJSONCommonDataModel.setData("");
                            _this.getView().setModel(oJSONCommonDataModel, "processData");   
                        }
                    },
                    error: function (err) { }
                });
            },
            setButton(arg){
                if(arg === "init"){
                    this.byId("btnRefreshMain").setEnabled(false);
                    this.byId("btnUploadOutput").setEnabled(false);
                    this.byId("cboxProcess").setVisible(false);
                    this.byId("txtProcess").setVisible(false);
                    this.byId("txtIONO").setVisible(false);
                    this.byId("btnNew").setEnabled(false);
                    this.byId("btnEdit").setEnabled(false);
                    this.byId("btnOutputBreakdown").setEnabled(false);
                    this.byId("btnDelete").setEnabled(false);
                    this.byId("btnRefreshDtls").setEnabled(false);   
                }
                if(arg === "read"){
                    this.byId("btnRefreshMain").setEnabled(true);
                    this.byId("btnUploadOutput").setEnabled(true);
                    this.byId("cboxProcess").setVisible(true);
                    this.byId("txtProcess").setVisible(true);
                    this.byId("txtIONO").setVisible(true);
                    this.byId("btnNew").setEnabled(true);
                    this.byId("btnEdit").setEnabled(true);
                    this.byId("btnOutputBreakdown").setEnabled(true);
                    this.byId("btnDelete").setEnabled(true);
                    this.byId("btnRefreshDtls").setEnabled(true);   
                }
            },
            setSmartFilterModel: function () {
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_IO_FILTER_CDS");
                var oSmartFilter = this.getView().byId("smartFilterBar");
                oSmartFilter.setModel(oModel);
            },
            onSearch: function () {
                this.getCols();
                this.getMain();

            },
            getMain(){
                var oModel = this.getOwnerComponent().getModel();
                var _this = this;
                var vProcess = this.byId('cboxProcess').getSelectedKey();
                var aFilters = this.getView().byId("smartFilterBar").getFilters();
                this.isHasPOB(vProcess);
                
                oModel.read('/PRODOUTPUTIOHDRSet', { 
                    filters: aFilters,
                    success: function (data, response) {
                        if (data.results.length > 0) {
                            data.results.sort((a,b)=>(a.IONO > b.IONO ? 1 : -1));
                            _this.setButton("read");
                            _this.getView().getModel("ui").setProperty("/activeIONO", data.results[0].IONO);
                            _this.getDtls(data.results[0].IONO,vProcess)
                            _this.getProcess(data.results[0].IONO,vProcess);
                            var oJSONModel = new sap.ui.model.json.JSONModel();
                            oJSONModel.setData(data);
                        }

                        _this.getView().setModel(oJSONModel, "PRDOUTPUTHDR");
                      //  _this.closeLoadingDialog();
                    },
                    error: function (err) { }
                })
                
            },
            getDtls(IONO,PROCESSCD){
                var oModel = this.getOwnerComponent().getModel();
                var _this = this;

                this.showLoadingDialog('Loading...');
                oModel.read('/PRDOUTPUTDTLSet',{
                    urlParameters: {
                        "$filter": "IONO eq '" + IONO + "' and PROCESSCD eq '" + PROCESSCD + "'"
                    },
                    success: function (data, response) {
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                            oJSONModel.setData(data);
                        if (data.results.length > 0) {
                            data.results.forEach(item => {
                                item.STARTDT = dateFormat.format(item.STARTDT);
                                item.FINISHDT = dateFormat.format(item.FINISHDT);
                                item.POSTDT = dateFormat.format(item.POSTDT);
                            })
                            
                            data.results.sort((a,b) => (a.SEQNO > b.SEQNO ? 1 : -1));
                        }
                        else {
                        }

                        _this.getView().setModel(oJSONModel, "PRDOUTPUTDTL");
                        _this.closeLoadingDialog();
                    },
                    error: function (err) { }
                })
                
            },
            getCols: async function() {
                var sPath = jQuery.sap.getModulePath("zuiprodoutput", "/model/columns.json");
                var oModelColumns = new JSONModel();
                await oModelColumns.loadData(sPath);

                var oColumns = oModelColumns.getData();
                var oModel = this.getOwnerComponent().getModel();
                
                oModel.metadataLoaded().then(() => {
                    this.getDynamicColumns(oColumns, "PRDOUTPUTHDR", "ZERP_IOHDR");
                    setTimeout(() => {
                        this.getDynamicColumns(oColumns, "PRDOUTPUTDTL", "ZERP_IOPROCOUT");
                    }, 100);
                });
            },
            onNewDtls(){
                this.byId("btnNew").setVisible(false);
                this.byId("btnEdit").setVisible(false);
                this.byId("btnOutputBreakdown").setVisible(false);
                this.byId("btnDelete").setVisible(false);
                this.byId("btnRefreshDtls").setVisible(false);
                this.byId("btnCancel").setVisible(true);
                //this.byId("btnSave").setVisible(true);
                this.byId("btnRefreshMain").setEnabled(false);
                this.byId("btnUploadOutput").setEnabled(false);
                this.byId("cboxProcess").setEnabled(false);
                this.byId("btnSave").setVisible(false);
                this.mode = "editDtls";
                this.editmode = "false";
                this.setRowCreateMode('details');
                if(this.hasPOB === false){
                    this.byId("btnSave").setVisible(true);
                }
            },
            onCancel(){
                this.mode ="readDtls"
                this.byId("btnNew").setVisible(true);
                this.byId("btnEdit").setVisible(true);
                this.byId("btnOutputBreakdown").setVisible(true);
                this.byId("btnDelete").setVisible(true);
                this.byId("btnRefreshDtls").setVisible(true);
                this.byId("btnCancel").setVisible(false);
                this.byId("btnSave").setVisible(false);
                this.byId("cboxProcess").setEnabled(true);
                this.byId("btnRefreshMain").setEnabled(true);
                this.byId("btnUploadOutput").setEnabled(true);
                this.setRowReadMode("PRDOUTPUTDTL")
                this.getView().getModel("PRDOUTPUTDTL").setProperty("/", this._oDataBeforeChange);
            },
            onSaveOB: async function(){
                this.showLoadingDialog('Loading...');
                var _this = this;
                var hasMatchingSize = false;
                var aEditedRows = sap.ui.getCore().byId("OBTab").getModel("DataModel").getData().results.filter(item => item.EDITED === true && item.New !== true);
                var aNewRows = this.getView().getModel("PRDOUTPUTDTL").getData().results.filter(item => item.NEW === true);
                var oParam = {};
                var vProcess = this.byId('cboxProcess').getSelectedKey();
                var vIONO = this.getView().getModel("ui").getData().activeIONO;
                var vUOM = this.getView().getModel("ui").getData().activeUOM;
                var vPRODPLANT = this.getView().getModel("ui").getData().activePRODPLANT;
                
                var totalQty = 0;
                var aGoodsMvtHdrTab = [];
                var oGoodsMvtHdrTab = {
                    "PstngDate": aNewRows[0].POSTDT+ 'T00:00:00',
                    "DocDate": aNewRows[0].FINISHDT+ 'T00:00:00',
                    "RefDocNo": aNewRows[0].ASNDOCNO === "" ?  aNewRows[0].REFDOC : aNewRows[0].ASNDOCNO,
                    "PrUname":  _this._userid, 
                    "HeaderTxt": aNewRows[0].ASNDOCNO === "" ?  aNewRows[0].REFDOC : aNewRows[0].ASNDOCNO,
                }
                aGoodsMvtHdrTab.push(oGoodsMvtHdrTab);
                var paramOB = [];
                var aGoodsMvtItemTab = [];
                if(aEditedRows.length>0){
                    aEditedRows.forEach(item => {
                        _this._aColumns["OBTab"].forEach(col => {
                            if(col.ColumnName != 'COLORCD' && col.ColumnName != 'COLORDESC'){
                                if(item[col.ColumnName] != 0){
                                    var param = {};
                                    var oGoodsMvtItemTab = {};

                                    console.log(item["COLORCD"] + col.ColumnName + " - "+item[col.ColumnName]);
                                    oGoodsMvtItemTab["Material"] = vIONO;
                                    oGoodsMvtItemTab["Plant"] = vPRODPLANT;
                                    oGoodsMvtItemTab["Batch"] = item["COLORCD"] + col.ColumnName;
                                    oGoodsMvtItemTab["MoveType"] = "915";
                                    oGoodsMvtItemTab["EntryQnt"] = item[col.ColumnName];
                                    oGoodsMvtItemTab["EntryUom"] = vUOM;
                                    oGoodsMvtItemTab["MvtInd"] = "";
                                    oGoodsMvtItemTab["Orderid"] = vIONO;
                                    oGoodsMvtItemTab["Costcenter"] = 'VHKLSC004';
                                    oGoodsMvtItemTab["StgeLoc"] = _this.getView().getModel("ui").getData().fgsloc;
                                    aGoodsMvtItemTab.push(oGoodsMvtItemTab);

                                    param["IONO"] = vIONO;
                                    param["PROCESSCD"] = vProcess;
                                    param["SEQNO"] = "";
                                    param["COLORCD"] = item["COLORCD"];
                                    param["SIZECD"] = col.ColumnName;
                                    param["COLORDESC"] =item["COLORDESC"];
                                    param["QTY"] =item[col.ColumnName];   
                                    paramOB.push(param);

                                    totalQty = parseInt(totalQty) + parseInt(item[col.ColumnName]);
                                }
                            }
                        })
                        
                    });   
                    var oParamSeq = {};
                    oParamSeq["N_GOODSMVT_CODE"] = [{GmCode: "05"}];
                    oParamSeq["N_GOODSMVT_HEADER"] = aGoodsMvtHdrTab;
                    oParamSeq["N_GOODSMVT_HEADRET"] = [];
                    oParamSeq["N_GOODSMVT_ITEM"] = aGoodsMvtItemTab;
                    oParamSeq["N_GOODSMVT_PRINT_CTRL"] = [];
                    oParamSeq["N_GOODSMVT_RETURN"]=[];
                    oParamSeq["materialdocument"]="";
                    oParamSeq["materialdocumentyear"]="";
                  
                    var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
                    oModel.create("/GoodsMvt_CreateSet", oParamSeq, {
                        method: "POST",
                        success: function(oResult, oResponse) {
                            if(oResult.N_GOODSMVT_RETURN.results[0].Type === 'S'){
                                 _this.onSaveIOPOB(paramOB,aNewRows,oResult.N_GOODSMVT_RETURN.results[0].Materialdocument,oResult.N_GOODSMVT_RETURN.results[0].Materialdocumentyear,totalQty)
                                 MessageBox.information(oResult.N_GOODSMVT_RETURN.results[0].Message);
                            }
                            else{
                                _this.closeLoadingDialog();
                                MessageBox.information(oResult.N_GOODSMVT_RETURN.results[0].Message);
                            }
                            
                        }
                    });
                }
            },
            onSaveIOPOB(paramSet,paramHdr,docno,docyr,totalQty){
                var vProcess = this.byId('cboxProcess').getSelectedKey();
                var vIONO = this.getView().getModel("ui").getData().activeIONO;
                var _this=this;

                var oParamDtls = {
                    "POSTDT": paramHdr[0].POSTDT+ 'T00:00:00',
                    "REFDOC": paramHdr[0].REFDOC,
                    "IONO":vIONO,
                    "PROCESSCD":vProcess,
                    "SEQNO": "",//paramHdr[0].SEQNO,
                    "STARTDT":paramHdr[0].STARTDT+ 'T00:00:00',
                    "FINISHDT": paramHdr[0].FINISHDT+ 'T00:00:00',
                    "QTY": totalQty.toString(),
                    "MBLNR":docno,
                    "MJAHR":docyr,
                    "SOLDTOCUST":"",
                    "CPONO":"",
                    "ASNDOCNO":"",
                    "REMARKS":paramHdr[0].REMARKS,
                    "CANCELLED":""
                }
                var oModel1 = this.getOwnerComponent().getModel();
                oModel1.create("/PRDOUTPUTDTLSet", oParamDtls, {
                    method: "POST",
                    success: function(oResult, oResponse) {
                        var oModel = _this.getOwnerComponent().getModel();
                        oModel.setUseBatch(true);
                        oModel.setDeferredGroups(["insert"]);
                        var mParameters = {
                            "groupId": "insert"
                        };
                        paramSet.forEach(item => {
                            var param ={};
                            param["IONO"] = item["IONO"];
                            param["PROCESSCD"] = item["PROCESSCD"];
                            param["SEQNO"] = JSON.parse(oResponse.headers["sap-message"]).message.toString().trim();
                            param["COLORCD"] = item["COLORCD"];
                            param["SIZECD"] = item["SIZECD"];
                            param["COLORDESC"] =item["COLORDESC"];
                            param["QTY"] =item["QTY"];

                            console.log("outputbreakdownset",param);
                            
                            oModel.create("/OUTPUTBREAKDOWNSet", param, mParameters);

                        });

                        oModel.submitChanges({
                            mParameters,
                            // groupId: "insert",
                            success: function (oData, oResponse) {
                                //Common.showMessage(me.getView().getModel("ddtext").getData()["INFO_DATA_SAVE"]);
                            },
                            error: function (oData, oResponse) {
                            }
                        });

                        _this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty('/results/0/QTY', totalQty);
                        var input = sap.ui.getCore().byId(_this.inputId);
                        input.setValue(totalQty);
                        _this.closeLoadingDialog();
                        _this.closeOutputBreakdown();
                        _this.onCancel();
                        _this.onRefreshDtls();
                    }
                });
            },
            onEditOB(){
                sap.ui.getCore().byId("btnSaveOB").setVisible(true);
                sap.ui.getCore().byId("btnEditOB").setVisible(false);
                this.setRowEditMode();
                /*var oModel = oTable.getModel("DataModel");
                oModel.setProperty("/results", aNewRow);
                console.log(oModel);*/

            },
            onRefreshMain(){
                this.getMain();
            },
            onRefreshDtls(){
                var vIONO = this.getView().getModel("ui").getData().activeIONO;
                var vProcess = this.getView().getModel("ui").getData().process;
                this.getDtls(vIONO,vProcess);
            },
            onDeleteDtls(){
                var _this = this;
                var oTable = this.byId("detailsTab");
                var vIONO = this.getView().getModel("ui").getData().activeIONO;
                var vProcess = this.getView().getModel("ui").getData().process;
                var aSelRows = oTable.getSelectedIndices();
                if (aSelRows.length === 0) {
                    MessageBox.information("No record(s) have been selected.");
                }
                else {
                    if(aSelRows.length > 1){
                        MessageBox.information("Please select one record only.");
                    }
                    else{
                        aSelRows.forEach(rec => {
                            var oContext = oTable.getContextByIndex(rec);
                            if(oContext.getObject().MBLNR!==''){
                                sap.m.MessageBox.confirm("Are you sure you want to delete this item?", {
                                    actions: ["Yes", "No"],
                                    onClose: function (sAction) {
                                        if (sAction === "Yes") { 
                                            _this.showLoadingDialog('Loading...');
                                            var oParamSeq = {};
                                            oParamSeq["N_ET_DATA"] = [{PostingDate: sapDateFormat.format(new Date(oContext.getObject().POSTDT)) + "T00:00:00",MatDoc:oContext.getObject().MBLNR,MatDocYear:oContext.getObject().MJAHR,RevMatDoc:"",RevMatDocYear:"",Message:""}];
                                            oParamSeq["N_IT_DATA"] = [{PostingDate: sapDateFormat.format(new Date(oContext.getObject().POSTDT)) + "T00:00:00",MatDoc:oContext.getObject().MBLNR,MatDocYear:oContext.getObject().MJAHR,RevMatDoc:"",RevMatDocYear:"",Message:""}];
                                            var oModel = _this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
                                            oModel.create("/GoodsMvt_CancelSet", oParamSeq, {
                                                method: "POST",
                                                success: function(oResult, oResponse) {
                                                    if(oResult.SUBRC === 0){
                                                        var oModel = _this.getOwnerComponent().getModel();
                                                        var oEntitySet = "/PRDOUTPUTDTLSet(IONO='" + vIONO +"',PROCESSCD='"+encodeURIComponent(vProcess)+"',SEQNO='"+ oContext.getObject().SEQNO +"')";
                                                        var oParam = {
                                                            "STARTDT": sapDateFormat.format(new Date(oContext.getObject().STARTDT)) + "T00:00:00",
                                                            "FINISHDT": sapDateFormat.format(new Date(oContext.getObject().FINISHDT)) + "T00:00:00", 
                                                            "POSTDT": sapDateFormat.format(new Date(oContext.getObject().POSTDT)) + "T00:00:00",
                                                            "QTY": oContext.getObject().QTY,
                                                            "REFDOC": oContext.getObject().REFDOC,
                                                            "REMARKS": oContext.getObject().REMARKS,
                                                            "CANCELLED": "X"
                                                        };
                                                        oModel.update(oEntitySet, oParam, {
                                                            method: "PUT",
                                                            success: function(data, oResponse) {
                                                                _this.closeLoadingDialog();
                                                                _this.onRefreshDtls();
                                                                sap.m.MessageBox.warning("Document No: "+ oContext.getObject().MBLNR +" Successfully Deleted!");
                                                            },
                                                            error: function(err) {
                                                                console.log(err);
                                                            }
                                                        });
                                                    }
                                                }
                                            });        
                                        }
                                    }
                                });
                            }
                            else{
                                MessageBox.warning("Delete not allowed!");
                            }
                        });
                    }
                }
            },
            onEditDtls(){
                /*var oTable = this.byId("detailsTab");
                var aSelRows = oTable.getSelectedIndices();
                if (aSelRows.length === 0) {
                    MessageBox.information("No record(s) have been selected.");
                }
                else {
                    if(aSelRows.length > 1){
                        MessageBox.information("Please select one record only.");
                    }
                    else{
                        aSelRows.forEach(rec => {
                            var oContext = oTable.getContextByIndex(rec);
                            if(oContext.getObject().MBLNR==''){
                                this.setRowEditModeDtls();
                                
                            }
                            else{
                                MessageBox.warning("Edit not allowed!");
                            }
                        });
                    }
                }*/
                if(this.hasPOB === false){
                    this.editmode=true;
                    this.byId("btnNew").setVisible(false);
                    this.byId("btnEdit").setVisible(false);
                    this.byId("btnOutputBreakdown").setVisible(false);
                    this.byId("btnDelete").setVisible(false);
                    this.byId("btnRefreshDtls").setVisible(false);
                    this.byId("btnCancel").setVisible(true);
                    this.byId("btnSave").setVisible(true);
                    this.byId("btnRefreshMain").setEnabled(false);
                    this.byId("btnUploadOutput").setEnabled(false);
                    this.byId("cboxProcess").setEnabled(false);
                    this.setRowEditModeDtls();
                }
                else{
                    MessageBox.warning("Edit not allowed!");
                }
                
            },
            setRowReadMode(arg) {
                // var aSortedColumns = [];
                // if (arg == "matAttrib") {
                //     aSortedColumns.push(
                //         {model: "matAttrib", sortProperty: "ATTRIBCD", sorted: true, sortOrder: "Ascending"}
                //     );
                // }
                //this.setControlEditMode(arg, false);

                var oTable = this.byId("detailsTab");
                oTable.getColumns().forEach((col, idx) => {                    
                    this._aColumns[arg].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (ci.type === "STRING" || ci.type === "NUMBER" || ci.type === "DATETIME") {
                                col.setTemplate(new sap.m.Text({
                                    text: "{" + arg + ">" + ci.name + "}",
                                    wrapping: false,
                                    tooltip: "{" + arg + ">" + ci.name + "}"
                                }));
                            }
                            else if (ci.type === "BOOLEAN") {
                                col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", editable: false}));
                            }

                            if (ci.required) {
                                col.getLabel().removeStyleClass("requiredField");
                            }
                        })
                    // // Sorting
                    // if (aSortedColumns.filter(x => x.model == arg && x.sortProperty == col.name).length > 0) {
                    //     console.log("setRowReadMode", col)
                    //     var oSortedColumn = aSortedColumns.filter(x => x.model == arg && x.sortProperty == col.name)[0];
                    //     col.sorted = oSortedColumn.sorted;
                    //     col.sortOrder = oSortedColumn.sortOrder;
                    // }    
                })

                // Reapply filter
                var aFilters = [];
                if (this.getView().byId("detailsTab").getBinding("rows")) {
                    aFilters = this.getView().byId("detailsTab").getBinding("rows").aFilters;
                }

                //var sFilterGlobal = this.getView().byId("searchField" + arg[0].toUpperCase() + arg.slice(1)).getProperty("value");
                //this.onRefreshFilter(arg, aFilters, sFilterGlobal);
            },
            setRowEditMode(){
                //var aEditRows = sap.ui.getCore().byId("OBTab").getModel("DataModel").getData().results;
                this._aDataBeforeChange = jQuery.extend(true, [], sap.ui.getCore().byId("OBTab").getModel("DataModel").getData().results);
                //var oEditRow = {};
                //var aEditRows={};
                var oTable = sap.ui.getCore().byId("OBTab");

                //oEditRow["EDIT"] = true;
                //aEditRows.push(oEditRow);

                //console.log(aEditRows);
                oTable.getColumns().forEach((col, idx) => {
                    var sColName = "";
                    if (col.mAggregations.template.mBindingInfos.text !== undefined) {
                        sColName = col.mAggregations.template.mBindingInfos.text.parts[0].path;
                    }
                    else if (col.mAggregations.template.mBindingInfos.selected !== undefined) {
                        sColName = col.mAggregations.template.mBindingInfos.selected.parts[0].path;
                    }
                    this._aColumns["OBTab"].filter(item => item.ColumnName === sColName)
                        .forEach(ci => {
                            if (ci.Editable) {
                                col.setTemplate(new sap.m.Input({
                                    type: sap.m.InputType.Number,
                                    textAlign: sap.ui.core.TextAlign.Right,
                                    value: "{path:'DataModel>" + sColName + "'}",
                                    change: this.onNumberChange.bind(this)
                                }));

                            }
                        });
                    //console.log(col.getLabel().getText());
                });
                //sap.ui.getCore().byId("OBTab").getModel("DataModel").setProperty("/results", aEditRows);
                //sap.ui.getCore().byId("OBTab").getBinding("rows").filter(null, "Application");

                //console.log(aEditRows);

            },
            setRowEditModeDtls(){
                var oTable = this.byId("detailsTab");
                oTable.clearSelection();
                
                var aEditRows = this.getView().getModel("PRDOUTPUTDTL").getData().results.filter(item => item.EDIT === true);
                if (aEditRows.length == 0) {
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("PRDOUTPUTDTL").getData());
                }
                
                oTable.getColumns().forEach((col, idx) => {
                    this._aColumns["PRDOUTPUTDTL"].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (!ci.hideOnChange && ci.updatable) {
                                if (ci.type === "BOOLEAN") {
                                    col.setTemplate(new sap.m.CheckBox({selected: "{PRDOUTPUTDTL>" + ci.name + "}", 
                                        select: this.onCheckBoxChange.bind(this),    
                                        editable: true
                                    }));
                                }
                                else if (ci.valueHelp["show"]) {
                                    col.setTemplate(new sap.m.Input({
                                        // id: "ipt" + ci.name,
                                        type: "Text",
                                        value: "{PRDOUTPUTDTL>" + ci.name + "}",
                                        maxLength: +ci.maxLength,
                                        showValueHelp: true,
                                        valueHelpRequest: this.handleValueHelp.bind(this),
                                        showSuggestion: true,
                                        maxSuggestionWidth: ci.valueHelp["suggestionItems"].additionalText !== undefined ? ci.valueHelp["suggestionItems"].maxSuggestionWidth : "1px",
                                        suggestionItems: {
                                            path: ci.valueHelp["items"].path, //ci.valueHelp.model + ">/items", //ci.valueHelp["suggestionItems"].path,
                                            length: 1000,
                                            template: new sap.ui.core.ListItem({
                                                key: "{" + ci.valueHelp["items"].value + "}", //"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}",
                                                text: "{" + ci.valueHelp["items"].value + "}", //"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}", //ci.valueHelp["suggestionItems"].text
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
                                        value: "{path:'PRDOUTPUTDTL>" + ci.name + "', type:'sap.ui.model.odata.type.Decimal', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
                                        liveChange: this.onNumberLiveChange.bind(this)
                                    }));
                                }
                                else if (ci.type === "DATETIME") {
                                    col.setTemplate(new sap.m.DatePicker({
                                        value: "{PRDOUTPUTDTL>" + ci.name + "}",
                                        displayFormat: "MM/dd/yyyy",
                                        valueFormat: "yyyy-MM-dd",
                                        change: this.onDateChange.bind(this),
                                       // navigate: this.onClickDate.bind(this)
                                    }))
                                }
                                else {
                                    if (ci.maxLength !== null) {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{PRDOUTPUTDTL>" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{PRDOUTPUTDTL>" + ci.name + "}",
                                            liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                }                                
                            }
    
                            if (ci.required) {
                                col.getLabel().addStyleClass("requiredField");
                            }
                        })
                })

            },
            onInputLiveChange: function(oEvent) {
                var oSource = oEvent.getSource();
                var srcInput = oSource.getBindingInfo("value").parts[0].path;
                if(this.editmode === true){
                    var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                    this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty(sRowPath+'/'+srcInput, oSource.getValue().trim());
                    this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty(sRowPath+'/EDITED', true);    
                }
                else{
                    this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty('/results/0/'+srcInput, oSource.getValue().trim());
                }
            },
            onNumberLiveChange: function(oEvent) {
                var oSource = oEvent.getSource();
                var srcInput = oSource.getBindingInfo("value").parts[0].path;
                if(this.editmode === true){
                    var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                    this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty(sRowPath+'/'+srcInput, oSource.getValue().trim());
                    this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty(sRowPath+'/EDITED', true);    
                }
                else{
                    this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty('/results/0/'+srcInput, oSource.getValue().trim());
                }
            },
            onDateChange:function(oEvent) {
                var oSource = oEvent.getSource();
                var srcInput = oSource.getBindingInfo("value").parts[0].path;
                if(this.editmode === true){
                    var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                    this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty(sRowPath+'/'+srcInput, oSource.getValue().trim());
                    this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty(sRowPath+'/EDITED', true);    
                }
                else{
                    this.byId("detailsTab").getModel("PRDOUTPUTDTL").setProperty('/results/0/'+srcInput, oSource.getValue().trim());
                }
                
                
            },
            onNumberChange: function (oEvent) {
                var oSource = oEvent.getSource().oParent.oBindingContexts.DataModel.sPath;
                sap.ui.getCore().byId("OBTab").getModel("DataModel").setProperty(oSource+oEvent.getSource().getBindingInfo("value").parts[0].path, oEvent.getSource().mProperties.value);
                sap.ui.getCore().byId("OBTab").getModel("DataModel").setProperty(oSource+"/EDITED",true);
            },
            handleValueHelp: function(oEvent) {
                this.inputId = oEvent.getSource().getId();
                
                this.mode='edit';
                var oViewModel;
                //oViewModel = new JSONModel({displayMode: true,createMode:false, saveBtn : false});
                oViewModel = new JSONModel({onsave: false,createMode:true,saveBtn:false});
                this.getView().setModel(oViewModel,"mode"); 
                this.getOutputBreakdownSizes(this.IONO,"");
                if (!this._OutputBreakdownDialog) {
                    this._OutputBreakdownDialog = sap.ui.xmlfragment("zuiprodoutput.view.outputBreakdown",this);
                    this.getView().addDependent(this._OutputBreakdownDialog);
                }
                this._OutputBreakdownDialog.open();
               /* setTimeout(() => {
//                    this.setRowEditMode();
                        this.onEditOB();
                }, 1500);*/
                
                /*this.mode='edit';
                var oViewModel;
                oViewModel = new JSONModel({onsave: false,createMode:true,saveBtn:false});
                this.getView().setModel(oViewModel,"mode"); */
            },
            setRowCreateMode(arg) {
                var aNewRows = this.getView().getModel("PRDOUTPUTDTL").getData().results.filter(item => item.NEW === true);
                //console.log("ANEWROWS",aNewRows);
                
                if (aNewRows.length == 0) {
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("PRDOUTPUTDTL").getData());
                }

                var oNewRow = {};
                var oTable = this.byId("detailsTab");    
                //console.log("ProdOutputDtlColumns",this._aColumns["PRDOUTPUTDTL"]);
                oTable.getColumns().forEach((col, idx) => {
                    this._aColumns["PRDOUTPUTDTL"].filter(item => item.label === col.getLabel().getText())
                    .forEach(ci => {
                        if (!ci.hideOnChange && ci.creatable) {
                            if (ci.type === "BOOLEAN") {
                                col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", 
                                    select: this.onCheckBoxChange.bind(this),    
                                    editable: true
                                }));
                            }
                            else if (ci.valueHelp["show"]) {
                                col.setTemplate(new sap.m.Input({
                                    type: "Text",
                                    value: "{" + arg + ">" + ci.name + "}",
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
                                    //change: this.onValueHelpLiveInputChange.bind(this)
                                }));
                            }
                            else if (ci.type === "NUMBER") {
                                if(ci.name === 'QTY'){
                                    if(this.hasPOB === true){
                                        col.setTemplate(new sap.m.Input({
                                            type: "Text",
                                            value: "{" + arg + ">" + ci.name + "}",
                                            showValueHelp: true,
                                            valueHelpOnly: true,
                                            valueHelpRequest: this.handleValueHelp.bind(this)
                                        }));
                                    }
                                    else{
                                        col.setTemplate(new sap.m.Input({
                                            type: sap.m.InputType.Number,
                                            textAlign: sap.ui.core.TextAlign.Right,
                                            value: "{path:'" + arg + ">" + ci.name + "', type:'sap.ui.model.odata.type.Decimal', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
                                            liveChange: this.onNumberLiveChange.bind(this)
                                        }));
                                    }
                                }
                                else{
                                    col.setTemplate(new sap.m.Input({
                                        type: sap.m.InputType.Number,
                                        textAlign: sap.ui.core.TextAlign.Right,
                                        value: "{path:'" + arg + ">" + ci.name + "', type:'sap.ui.model.odata.type.Decimal', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
                                        //liveChange: this.onNumberLiveChange.bind(this)
                                    }));
                                }
                            }
                            else if (ci.type === "DATETIME") {
                                /*if(ci.name === 'POSTDT'){
                                    dateFormat.format(new Date())
                                    col.setTemplate(new sap.m.DatePicker({
                                        value: "{" + arg + ">" + ci.name + "}",
                                        displayFormat: "MM/dd/yyyy",
                                        valueFormat: "yyyy-MM-dd",
                                        change: this.onDateChange.bind(this),
                                       // navigate: this.onClickDate.bind(this)
                                    }))
                                }
                                else{*/
                                    col.setTemplate(new sap.m.DatePicker({
                                        value: "{" + arg + ">" + ci.name + "}",
                                        displayFormat: "MM/dd/yyyy",
                                        valueFormat: "yyyy-MM-dd",
                                        change: this.onDateChange.bind(this),
                                       // navigate: this.onClickDate.bind(this)
                                    }))
                                //}
                            }
                            else {
                                if (ci.maxLength !== null) {
                                    col.setTemplate(new sap.m.Input({
                                        value: "{" + arg + ">" + ci.name + "}",
                                        maxLength: +ci.maxLength,
                                        change: this.onInputLiveChange.bind(this)
                                    }));
                                }
                                else {
                                    col.setTemplate(new sap.m.Input({
                                        value: "{" + arg + ">" + ci.name + "}",
                                        change: this.onInputLiveChange.bind(this)
                                    }));
                                }
                            }
                        } 

                        if (ci.required) {
                            col.getLabel().addStyleClass("requiredField");
                        }

                        if (ci.type === "STRING") oNewRow[ci.name] = "";
                        //else if (ci.type === "NUMBER") oNewRow[ci.name] = "0";
                        else if (ci.type === "BOOLEAN") oNewRow[ci.name] = false;
                    });
                });

                oNewRow["NEW"] = true;
                var iMaxSeq = 0;
                var iMaxSeq1 = 0;
                var iMaxSeq2 = 0;
                
                if (this._oDataBeforeChange.results.length > 0) {
                    iMaxSeq1 = Math.max(...this._oDataBeforeChange.results.map(item => item.SEQNO));
                }
                
                //var aNew = this.getView().getModel(pModel).getData();
                if (aNewRows.length > 0) {
                    iMaxSeq2 = Math.max(...aNewRows.map(item => item.SEQNO));
                }
                
                iMaxSeq = (iMaxSeq1 > iMaxSeq2 ? iMaxSeq1 : iMaxSeq2) + 1;
                this._iMaxSeqNo=iMaxSeq;
                oNewRow["SEQNO"] =""; //iMaxSeq.toString();
                //alert(dateFormat.format(new Date()));
                aNewRows.push(oNewRow);
                this.getView().getModel("PRDOUTPUTDTL").setProperty("/results", aNewRows);
                
                // Remove filter
                this.byId(arg + "Tab").getBinding("rows").filter(null, "Application");
            },
            getDynamicColumns(arg1, arg2, arg3) {
                var me = this;      
                var columnData = [];         
                var oColumns = arg1;
                var modCode = arg2;
                var tabName = arg3;
                //get dynamic columns based on saved layout or ZERP_CHECK
                var vSBU = 'VER';
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                var o3DModel = this.getOwnerComponent().getModel("ZGW_3DERP_SRV");
                // console.log(oModel)

                if(arg2 === "PRODOB"){
                    var oJSONCommonDataModel = new JSONModel();
                    var oJSON3DDataModel = new JSONModel();
                    var oJSONModel = new JSONModel();
                    this._columns;
                    var columns;
                    var ccolumns;
                    var pivotArray;
                    pivotArray = this.OBSizes;
                    console.log("PivotArray",pivotArray);

                    oModel.setHeaders({
                        sbu: vSBU,
                        type: modCode,
                        tabname: tabName
                    });

                    oModel.read("/ColumnsSet", {
                        success: function (oData, oResponse) {
                            if (oData.results.length > 0) {
                                oJSONCommonDataModel.setData(oData);
                                me.getView().setModel(oJSONCommonDataModel, "currIODETModel");                                 
                            }
                        },
                        error: function (err) {
                            //resolve();
                        }
                    });

                    
                    o3DModel.setHeaders({
                        sbu: vSBU,
                        type: modCode,
                        usgcls: ""
                    });

                    o3DModel.read("/DynamicColumnsSet", {
                        success: function (oData, oResponse) {
                            if (oData.results.length > 0) {
                                oJSON3DDataModel.setData(oData);
                                me.getView().setModel(oJSON3DDataModel, "IODETPVTModel");
                            }
                        },
                        error: function (err) {
                            //resolve();
                        }
                    });

                    var pivotRow;
                    columns = me.getView().getModel("IODETPVTModel").getProperty("/results");
                    ccolumns = me.getView().getModel("currIODETModel").getProperty("/results");

                    for (var i = 0; i < columns.length; i++) {
                        if (columns[i].Pivot !== '') {
                            pivotRow = columns[i].Pivot;
                        }
                    }
                    /*console.log("Pivot Row");
                    console.log(pivotRow);

                    console.log("Columns");
                    console.log(columns);*/

                    
                    for (var i = 0; i < columns.length; i++) {
                        if (columns[i].Pivot === pivotRow) {
                            console.log(columns[i].Pivot);
                            console.log("----> "+ pivotRow);
                            //pivot the columns
                            for (var j = 0; j < pivotArray.length; j++) {
                                columnData.push({
                                    "ColumnName": pivotArray[j].Custsize + ccolumns[i].ColumnName,
                                    "ColumnLabel": pivotArray[j].Custsize + " " + ccolumns[i].ColumnLabel,
                                    "ColumnWidth": 120,
                                    "ColumnType": pivotRow,
                                    "DataType": ccolumns[i].DataType,
                                    "Editable": ccolumns[i].Editable,
                                    "Mandatory": columns[i].Mandatory,
                                    "Visible": true,
                                    "Creatable": ccolumns[i].Creatable,
                                    "Decimal": ccolumns[i].Decimal,
                                    "DictType": ccolumns[i].DictType,
                                    "Key": ccolumns[i].Key,
                                    "Length": ccolumns[i].Length,
                                    "Order": ccolumns[i].Length,
                                    "SortOrder": ccolumns[i].SortOrder,
                                    "SortSeq": ccolumns[i].SortSeq,
                                    "Sorted": ccolumns[i].Sorted
                                })
                            }
                        } 
                    }
                    console.log("column Data");
                        console.log(columnData);

                }
                else{
                    var oJSONColumnsModel = new JSONModel();
                    oModel.setHeaders({
                        sbu: vSBU,
                        type: modCode,
                        tabname: tabName
                    });
                    
                    oModel.read("/ColumnsSet", {
                        success: function (oData, oResponse) {
                            oJSONColumnsModel.setData(oData);
    
                            if (oData.results.length > 0) {
                                if (modCode === 'PRDOUTPUTHDR') {
                                    var aColumns = me.setTableColumns(oColumns["PRDOUTPUTHDR"], oData.results);                               
                                    me._aColumns["PRDOUTPUTHDR"] = aColumns["columns"];
                                    me.addColumns(me.byId("mainTab"), aColumns["columns"], "PRDOUTPUTHDR");
                                }
                                if (modCode === 'PRDOUTPUTDTL') {
                                    var aColumns = me.setTableColumns(oColumns["PRDOUTPUTDTL"], oData.results);                               
                                    me._aColumns["PRDOUTPUTDTL"] = aColumns["columns"];
                                    me.addColumns(me.byId("detailsTab"), aColumns["columns"], "PRDOUTPUTDTL");
                                }
                            }
                        },
                        error: function (err) {
                            //me.closeLoadingDialog(that);
                        }
                    });
                }
            },
            getStyleBOMUV: function (SEQNO) {
                console.log("get BOM by UV");
                var me = this;
                var columnData = [];
                var oModelUV = this.getOwnerComponent().getModel("ZGW_3DERP_SRV");
                //var usageClass = this.getView().byId("UsageClassCB").getSelectedKey();
                // console.log(usageClass)
                oModelUV.setHeaders({
                    sbu: this._sbu, //"VER",
                    type: "PRODOB"
                });

                var pivotArray=[];
                pivotArray = this.OBSizes.filter((rowData, index, self) =>
                index === self.findIndex((t) => (t.Custsize === rowData.Custsize)));
                console.log("pivotArray",pivotArray);

                console.log("get dynamic columns of BOM by UV");
                oModelUV.read("/DynamicColumnsSet", {
                    success: function (oData, oResponse) {
                        var columns = oData.results;
                        var pivotRow;
                        //find the column to pivot
                        console.log("Columns",columns);
                        for (var i = 0; i < columns.length; i++) {
                            if (columns[i].Pivot !== '') {
                                pivotRow = columns[i].Pivot;
                            }
                        }
                        //build the table dyanmic columns
                        for (var i = 0; i < columns.length; i++) {
                            if (columns[i].Pivot === pivotRow) {
                                //pivot the columns
                                for (var j = 0; j < pivotArray.length; j++) {
                                    columnData.push({
                                        "ColumnName": pivotArray[j].Custsize,
                                        "ColumnDesc": pivotArray[j].Custsize,
                                        "ColumnWidth": 125,
                                        "ColumnType": pivotRow,
                                        "Editable": true,
                                        "Mandatory": false,
                                        "Visible": true,
                                        "Sorted": false,
                                        "SortOrder": "ASC"
                                    })
                                }
                            } else {
                                if (columns[i].ColumnName !== pivotRow) {
                                    if (columns[i].Visible === true) {
                                        columnData.push({
                                            "ColumnName": columns[i].ColumnName,
                                            "ColumnDesc": columns[i].ColumnName,
                                            "ColumnWidth": columns[i].ColumnWidth,
                                            "ColumnType": columns[i].ColumnType,
                                            "Editable": columns[i].Editable,
                                            "Mandatory": columns[i].Mandatory,
                                            "Sorted": columns[i].Sorted,
                                            "SortOrder": columns[i].SortOrder
                                        })
                                    }
                                }
                            }
                        }
                        console.log("columnData",columnData);
                        if(me.mode === 'read'){
                            me.getBOMUVTableData(columnData, pivotArray,SEQNO);    
                        }
                        else{
                            me.getBOMUVIOTableData(columnData, pivotArray);
                        }
                        
                    },
                    error: function (err) {
                        Common.closeLoadingDialog(that);
                    }
                });

            },
            getBOMUVTableData: function (columnData, pivot,SEQNO) {
                
                console.log("Get BOM by UV actual data");
                var me = this;
                this._aColumns["OBTab"] = columnData;
                var oTable = sap.ui.getCore().byId("OBTab");
                var oModel = this.getOwnerComponent().getModel();
                var IONO = this.getView().getModel("ui").getData().activeIONO;
                var PROCESSCD = this.byId('cboxProcess').getSelectedKey();
                //var usageClass = this.getView().byId("UsageClassCB").getSelectedKey();

                // console.log(this._styleNo, this._styleVer, usageClass);
                oModel.read("/OUTPUTBREAKDOWNSet", {
                    urlParameters: {
                        "$filter": "IONO eq '" + IONO + "' and PROCESSCD eq '"+PROCESSCD+"' and SEQNO eq '"+SEQNO+"'"
                    },
                    success: function (oData, oResponse) {
                        var rowData = oData.results;
                        console.log("rowData",rowData);
                        // console.log(rowData)
                        //Get unique items of BOM by UV
                        var unique = rowData.filter((rowData, index, self) =>
                        index === self.findIndex((t) => (t.COLORCD === rowData.COLORCD)));
                        console.log("unique",unique);
                        //For every unique item
                        for (var i = 0; i < unique.length; i++) {
                            //Set the pivot column for each unique item
                            for (var j = 0; j < rowData.length; j++) {
                                if (rowData[j].COLORDESC !== "") {
                                    if (unique[i].COLORCD === rowData[j].COLORCD && unique[i].COLORDESC === rowData[j].COLORDESC) {
                                        for (var k = 0; k < pivot.length; k++) {
                                            var colname = pivot[k].Custsize;
                                            //console.log("Unique",unique[i]);
                                            //console.log("Rowdata",rowData[j]);
                                            //console.log("colname",colname);
                                            if(rowData[j].SIZECD === colname){
                                                unique[i][colname] = rowData[j].QTY;
                                                unique[i]['COLORCD'] = rowData[j].COLORCD;
                                            }
                                            else{
                                                unique[i][colname] = 0;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        //set the table columns/rows
                        rowData = oData.results;
                        unique.forEach((item, index) => item.ACTIVE = index === 0 ? "X" : "");

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData({
                            results: unique,
                            columns: columnData
                        });

                        console.log("ColumnData",columnData);
                        oTable.setModel(oJSONModel, "DataModel");
                        // oTable.setVisibleRowCount(unique.length);
                        oTable.attachPaste();
                        oTable.bindColumns("DataModel>/columns", function (sId, oContext) {
                            var column = oContext.getObject();
                            var sColumnWidth = column.ColumnWidth;

                            if (sColumnWidth === 0) sColumnWidth = 100;

                            return new sap.ui.table.Column({
                                id: "styleBOMUVCol" + column.ColumnName,
                                label: new sap.m.Text({ text: me.getStyleColumnDesc("OBTab", column) }),
                                template: me.styleColumnTemplate('', column),
                                sortProperty: column.ColumnName,
                                filterProperty: column.ColumnName,
                                width: sColumnWidth + "px",
                                autoResizable: true,
                                visible: column.Visible,
                                sorted: column.Sorted,
                                sortOrder: ((column.Sorted === true) ? column.SortOrder : "Ascending")
                            });
                        });
                        oTable.bindRows("DataModel>/results");
                        console.log("BOM by UV Pivot");
                        console.log(oTable);

                     //   Common.closeLoadingDialog(me);
                    },
                    error: function (err) {
                       // Common.closeLoadingDialog(me);
                    }
                });
            },
            getBOMUVIOTableData: function (columnData, pivot) {
                console.log("Get BOM by UV actual data");
                var me = this;
                this._aColumns["OBTab"] = columnData;
                var oTable = sap.ui.getCore().byId("OBTab");
                var oModel = this.getOwnerComponent().getModel();
                var IONO = this.getView().getModel("ui").getData().activeIONO;
                //var IONO ='8A00286';
                //var usageClass = this.getView().byId("UsageClassCB").getSelectedKey();

                // console.log(this._styleNo, this._styleVer, usageClass);
                oModel.read("/OutputBreakdwonIOSet", {
                    urlParameters: {
                        "$filter": "IONO eq '" + IONO + "'" 
                    },
                    success: function (oData, oResponse) {
                        var rowData = oData.results;
                        console.log("rowData",rowData);
                        // console.log(rowData)
                        //Get unique items of BOM by UV
                        var unique = rowData.filter((rowData, index, self) =>
                        index === self.findIndex((t) => (t.COLORCD === rowData.COLORCD)));
                        console.log("unique",unique);
                        //For every unique item
                        for (var i = 0; i < unique.length; i++) {
                            //Set the pivot column for each unique item
                            for (var j = 0; j < rowData.length; j++) {
                                if (rowData[j].COLORDESC !== "") {
                                    if (unique[i].COLORCD === rowData[j].COLORCD && unique[i].COLORDESC === rowData[j].COLORDESC) {
                                        for (var k = 0; k < pivot.length; k++) {
                                            var colname = pivot[k].Custsize;
                                            //console.log("Unique",unique[i]);
                                            //console.log("Rowdata",rowData[j]);
                                            //console.log("colname",colname);
                                            if(rowData[j].SIZECD === colname){
                                                unique[i][colname] = rowData[j].QTY;
                                                unique[i]['COLORCD'] = rowData[j].COLORCD;
                                            }
                                            else{
                                                unique[i][colname] = 0;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        //set the table columns/rows
                        rowData = oData.results;
                        unique.forEach((item, index) => item.ACTIVE = index === 0 ? "X" : "");

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData({
                            results: unique,
                            columns: columnData
                        });

                        console.log("ColumnData",columnData);
                        oTable.setModel(oJSONModel, "DataModel");
                        // oTable.setVisibleRowCount(unique.length);
                        oTable.attachPaste();
                        oTable.bindColumns("DataModel>/columns", function (sId, oContext) {
                            var column = oContext.getObject();
                            var sColumnWidth = column.ColumnWidth;

                            if (sColumnWidth === 0) sColumnWidth = 100;

                            return new sap.ui.table.Column({
                                id: "styleBOMUVCol" + column.ColumnName,
                                label: new sap.m.Text({ text: me.getStyleColumnDesc("OBTab", column) }),
                                template: me.styleColumnTemplate('', column),
                                sortProperty: column.ColumnName,
                                filterProperty: column.ColumnName,
                                width: sColumnWidth + "px",
                                autoResizable: true,
                                visible: column.Visible,
                                sorted: column.Sorted,
                                sortOrder: ((column.Sorted === true) ? column.SortOrder : "Ascending")
                            });
                        });
                        oTable.bindRows("DataModel>/results");
                        console.log("BOM by UV Pivot");
                        console.log(oTable);

                     //   Common.closeLoadingDialog(me);
                    },
                    error: function (err) {
                       // Common.closeLoadingDialog(me);
                    }
                });
            },
            styleColumnTemplate: function (type, column) {
                //set the column template based on gynamic fields
                var columnName = column.ColumnName;
                var oColumnTemplate;

                oColumnTemplate = new sap.m.Text({ text: "{DataModel>" + columnName + "}", wrapping: false, tooltip: "{DataModel>" + columnName + "}" });
                return oColumnTemplate;
            },

            addColumns(table, columns, model) {
                var aColumns = columns.filter(item => item.showable === true)
                aColumns.sort((a,b) => (a.position > b.position ? 1 : -1));
                /*console.log("add columns "+ table + " - " + model);
                console.log(aColumns)*/

                aColumns.forEach(col => {
                    // console.log(col)
                    if (col.type === "STRING" || col.type === "DATETIME") {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            // id: col.name,
                            width: col.width,
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.Text({text: "{" + model + ">" + col.name + "}"}),
                            visible: col.visible
                        }));
                    }
                    else if (col.type === "NUMBER") {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "End",
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.Text({text: "{" + model + ">" + col.name + "}"}),
                            visible: col.visible
                        }));
                    }
                    else if (col.type === "BOOLEAN" ) {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "Center",
                            sortProperty: col.name,
                            filterProperty: col.name,                            
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.CheckBox({selected: "{" + model + ">" + col.name + "}", editable: false}),
                            visible: col.visible
                        }));
                    }
                })
            },
            setTableColumns: function(arg1, arg2) {
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
                        valueHelp: oColumnLocalProp.length === 0 ? {"show": false} : oColumnLocalProp[0].valueHelp,
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

                aColumns.sort((a,b) => (a.position > b.position ? 1 : -1));
                var aColumnProp = aColumns.filter(item => item.showable === true);

                /*this.createViewSettingsDialog("column", 
                    new JSONModel({
                        items: aColumnProp,
                        rowCount: aColumnProp.length,
                        table: ""
                    })
                );*/

                
                //return { columns: aColumns, sortableColumns: aSortableColumns, filterableColumns: aFilterableColumns };
                return { columns: aColumns};
            },
            getStyleColumnDesc: function (arg1, arg2) {
                var desc;
                var sTabId = arg1;
                var oColumn = arg2;
                /*
                if (oColumn.ColumnType === "SIZECD") 
                    desc = oColumn.ColumnDesc;
                else 
                    desc = this.getView().getModel("ddtext").getData()[oColumn.ColumnName];*/
                
                    desc = oColumn.ColumnDesc;

                return desc;
            },
            showLoadingDialog(arg) {
                if (!this._LoadingDialog) {
                    this._LoadingDialog = sap.ui.xmlfragment("zuiprodoutput.view.LoadingDialog", this);
                    this.getView().addDependent(this._LoadingDialog);
                }
                // jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._LoadingDialog);
                
                this._LoadingDialog.setTitle(arg);
                this._LoadingDialog.open();
            },
            closeLoadingDialog() {
                this._LoadingDialog.close();
            },
            onSave(){
                //alert(this._iMaxSeqNo);
                this.outputBreakdown();
                this.mode='edit';
                var oViewModel;
                oViewModel = new JSONModel({onsave: false,createMode:true,saveBtn:false});
                this.getView().setModel(oViewModel,"mode"); 
            },
            onSaveDtls(){
                this.showLoadingDialog('Loading...');
                var _this =this;
                if(this.editmode === true){
                    var vIONO = this.getView().getModel("ui").getData().activeIONO;
                    var vProcess = this.getView().getModel("ui").getData().process;
                    var aEditedRows = this.getView().getModel("PRDOUTPUTDTL").getData().results.filter(item => item.EDITED === true);
                    if(aEditedRows.length>0){
                        var ctEditSuccess = 0;
                        aEditedRows.forEach(item => {
                            var oModel = _this.getOwnerComponent().getModel();
                            var oEntitySet = "/PRDOUTPUTDTLSet(IONO='" + item["IONO"] +"',PROCESSCD='"+encodeURIComponent(item["PROCESSCD"])+"',SEQNO='"+ item["SEQNO"] +"')";
                            var param={};
                            param["STARTDT"] = sapDateFormat.format(new Date(item["STARTDT"])) + "T00:00:00";
                            param["FINISHDT"] = sapDateFormat.format(new Date(item["FINISHDT"])) + "T00:00:00";
                            param["POSTDT"] = sapDateFormat.format(new Date(item["POSTDT"])) + "T00:00:00";
                            param["QTY"] = item["QTY"];
                            param["REFDOC"] = item["REFDOC"];
                            param["REMARKS"] = item["REMARKS"];
                            param["CANCELLED"] = "";
                            oModel.update(oEntitySet, param, {
                                method: "PUT",
                                success: function(data, oResponse) {
                                    ctEditSuccess++;
                                    if(ctEditSuccess === aEditedRows.length){
                                        _this.closeLoadingDialog();
                                        _this.byId("btnNew").setVisible(true);
                                        _this.byId("btnEdit").setVisible(true);
                                        _this.byId("btnOutputBreakdown").setVisible(true);
                                        _this.byId("btnDelete").setVisible(true);
                                        _this.byId("btnRefreshDtls").setVisible(true);
                                        _this.byId("btnCancel").setVisible(false);
                                        _this.byId("btnSave").setVisible(false);
                                        _this.byId("cboxProcess").setEnabled(true);
                                        _this.byId("btnRefreshMain").setEnabled(true);
                                        _this.byId("btnUploadOutput").setEnabled(true);
                                        _this.setRowReadMode("PRDOUTPUTDTL")
                                        _this.getView().getModel("PRDOUTPUTDTL").setProperty("/", this._oDataBeforeChange);
                                        _this.onRefreshDtls();   
                                    }
                                },
                                error: function(err) {
                                    console.log(err);
                                }
                            });
                        });         
                    }
                }
                else{
                    var aNewRows = this.getView().getModel("PRDOUTPUTDTL").getData().results.filter(item => item.NEW === true);
                    var vProcess = this.byId('cboxProcess').getSelectedKey();
                    var vIONO = this.getView().getModel("ui").getData().activeIONO;
                    var oParamDtls = {
                        "POSTDT": aNewRows[0].POSTDT+ 'T00:00:00',
                        "REFDOC": aNewRows[0].REFDOC,
                        "IONO":vIONO,
                        "PROCESSCD":vProcess,
                        "SEQNO": "",
                        "STARTDT":aNewRows[0].STARTDT+ 'T00:00:00',
                        "FINISHDT": aNewRows[0].FINISHDT+ 'T00:00:00',
                        "QTY": aNewRows[0].QTY,
                        "MBLNR":"",
                        "MJAHR":"",
                        "SOLDTOCUST":"",
                        "CPONO":"",
                        "ASNDOCNO":"",
                        "REMARKS":aNewRows[0].REMARKS,
                        "CANCELLED":""
                    }
                    
                    var oModel1 = this.getOwnerComponent().getModel();
                    oModel1.create("/PRDOUTPUTDTLSet", oParamDtls, {
                        method: "POST",
                        success: function(oResult, oResponse) {
                            _this.byId("btnSave").setVisible(false);
                            _this.closeLoadingDialog();
                            _this.onCancel();
                            _this.onRefreshDtls();
                        }
                    });
                }
                
            },
            outputBreakdown(){
                var oTable = this.byId("detailsTab");
                var aSelRows = oTable.getSelectedIndices();
                if (aSelRows.length === 0) {
                    MessageBox.information("No record(s) have been selected.");
                }
                else {
                    if(aSelRows.length > 1){
                        MessageBox.information("Please select one record only.");
                    }
                    else{
                        aSelRows.forEach(rec => {
                            var oContext = oTable.getContextByIndex(rec);
                            this.mode='read';
                            var oViewModel;
                            oViewModel = new JSONModel({displayMode: true,createMode:false, saveBtn : false});
                            this.getView().setModel(oViewModel,"mode"); 

                            this.getOutputBreakdownSizes(this.IONO,oContext.getObject().SEQNO);
                            if (!this._OutputBreakdownDialog) {
                                this._OutputBreakdownDialog = sap.ui.xmlfragment("zuiprodoutput.view.outputBreakdown",this);
                                this.getView().addDependent(this._OutputBreakdownDialog);
                            }
                            this._OutputBreakdownDialog.open();
                        });
                    }
                }
                
            },
            getOutputBreakdownSizes(IONO,SEQNO) {
                var oModel = this.getOwnerComponent().getModel();
                var _this = this;
                oModel.read('/OutputBreakdownSizesSet',{
                    urlParameters: {
                        "$filter": "Iono eq '" + IONO + "'"
                    },
                    success: function (data, response) {
                        _this.OBSizes = data.results;
                        _this.getStyleBOMUV(SEQNO);
                    },
                    error: function (err) { }
                })
            },
            closeOutputBreakdown(){
                this._OutputBreakdownDialog.close();
            },
            onCellClickHdr: function(oEvent) {
                var vIONO = oEvent.getParameters().rowBindingContext.getObject().IONO;
                var vUOM = oEvent.getParameters().rowBindingContext.getObject().BASEUOM;
                var vPRODPLANT = oEvent.getParameters().rowBindingContext.getObject().PRODPLANT;
                this.getProcess(vIONO);
                this.IONO = vIONO;
                
                this.getFgsloc(vPRODPLANT);
                this.getView().getModel("ui").setProperty("/activeIONO", vIONO);
                this.getView().getModel("ui").setProperty("/activeUOM", vUOM);
                this.getView().getModel("ui").setProperty("/activePRODPLANT", vPRODPLANT);
                
            },
            onProcessChange: function(oEvent) {
                var vProcess = this.byId('cboxProcess').getSelectedKey();
                this.getView().getModel("ui").setProperty("/process", vProcess);
                this.isHasPOB(vProcess);
                if(this.hasPOB === true){
                    this.byId("btnOutputBreakdown").setEnabled(false);
                }
                else{
                    this.byId("btnOutputBreakdown").setEnabled(true);
                }
                this.onRefreshDtls();
                
            },
            isHasPOB(process){
                var _this = this;
                var oModel = this.getOwnerComponent().getModel();
                oModel.read("/OBHASPOBSet", {
                    urlParameters: {
                        "$filter": "PROCESSCD eq '" + process + "'"
                    },
                    success: function (oData, oResponse) {
                        console.log("Process",oData)
                        if (oData.results.length > 0) {
                            _this.hasPOB= oData.results[0].HASPOB === 'X' ? true : false;
                        }
                        else{
                            _this.hasPOB=false;
                        }
                    },
                    error: function (err) { }
                });
            },
            onKeyUp(oEvent) {
                if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows") {
                    alert("Arrow UP");
                }    
            }
        });
    });
