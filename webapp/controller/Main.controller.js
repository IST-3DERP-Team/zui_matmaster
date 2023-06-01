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
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox, Filter, FilterOperator, Sorter, Device, library, Fragment,jQuery, HashChanger) {
        "use strict";
        // shortcut for sap.ui.table.SortOrder
        var SortOrder = library.SortOrder;
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });

        return Controller.extend("zuimatmaster.controller.Main", {
            onInit: function () {
                this.getAppAction();
                var oModel = this.getOwnerComponent().getModel();
                var _this = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                this.validationErrors = [];
                this.showLoadingDialog('Loading...');
                _this.getView().setModel(new JSONModel({
                    dataMode : 'INIT',
                    activeMaterialNo:'',
                    sbu: ''
                }), "ui");

                this.getSBU();
                //this.setButton("matMaster","load");
                this._oGlobalMMFilter = null;
                this._oSortDialog = null;
                this._oFilterDialog = null;
                this._oViewSettingsDialog = {};
                this._DiscardChangesDialog = null;
                this._columnLoadError = false;

                this._aEntitySet = {
                    matMaster: "MaterialSet", attributes: "MaterialAtrribSet", batch: "MaterialBatchSet", customInfo : "MaterialCusInfoSet", plant : "PlantSet",MatTypeClass: "MatTypeClassSet"
                };

                this._aColumns = {};
                this._aSortableColumns = {};
                this._aFilterableColumns = {};

                this.getColumns();
                
                this._oDataBeforeChange = {};
                this.getView().setModel(new JSONModel({
                    dataMode: 'READ'
                }), "ui");

                var oDelegateKeyUp = {
                    onkeyup: function(oEvent){
                        _this.onKeyUp(oEvent);
                    }
                };

                this.byId("matMasterTab").addEventDelegate(oDelegateKeyUp);

                this._isMMEdited=false;
                this._isCustomInfo=false;
                this._cancelMM = false;

                oRouter.getRoute("RouteMain").attachPatternMatched(this._onPatternMatched, this);
            },

            _onPatternMatched : function (oEvent) {
                this._pSBU =  oEvent.getParameter("arguments").sbu;
                this._pMatno =  oEvent.getParameter("arguments").matno;
                console.log("SBU: " + this._pSBU);
                console.log("MATNO: " + this._pMatno);

                if (this._pMatno !== undefined) {
                    this.getView().getModel("ui").setProperty("/sbu", this._pSBU);
                    this.onSBUChange();
                }
            },

            getAppAction: async function() {
                if (sap.ushell.Container !== undefined) {
                    const fullHash = new HashChanger().getHash(); 
                    const urlParsing = await sap.ushell.Container.getServiceAsync("URLParsing");
                    const shellHash = urlParsing.parseShellHash(fullHash); 
                    const sAction = shellHash.action;

                    this._appAction = sAction;

                    if (sAction === "display") {
                        this.byId("btnAddMM").setVisible(false);
                        this.byId("btnEditMM").setVisible(false);
                        this.byId("btnDeleteMM").setVisible(false);
                        this.byId("btnEditCustomInfo").setVisible(false);
                        this.byId("btnDeleteCustomInfo").setVisible(false);
                        this.byId("btnExtendMat").setVisible(false);
                    }
                    else {
                        this.byId("btnAddMM").setVisible(true);
                        this.byId("btnEditMM").setVisible(true);
                        this.byId("btnDeleteMM").setVisible(true);
                        this.byId("btnEditCustomInfo").setVisible(true);
                        this.byId("btnDeleteCustomInfo").setVisible(true);
                        this.byId("btnExtendMat").setVisible(true);
                    }
                }
            },
            getMatMaster() {
                var oModel = this.getOwnerComponent().getModel();
                var _this = this;

                var oTable = this.byId('attributesTab');
                var oColumns = oTable.getColumns();

                for (var i = 0, l = oColumns.length; i < l; i++) {
                    if (oColumns[i].getFiltered()) {
                        oColumns[i].filter("");
                    }

                    if (oColumns[i].getSorted()) {
                        oColumns[i].setSorted(false);
                    }
                }

                oTable = this.byId('customInfoTab');
                oColumns = oTable.getColumns();

                for (var i = 0, l = oColumns.length; i < l; i++) {
                    if (oColumns[i].getFiltered()) {
                        oColumns[i].filter("");
                    }

                    if (oColumns[i].getSorted()) {
                        oColumns[i].setSorted(false);
                    }
                }

                oTable = this.byId('plantTab');
                oColumns = oTable.getColumns();

                for (var i = 0, l = oColumns.length; i < l; i++) {
                    if (oColumns[i].getFiltered()) {
                        oColumns[i].filter("");
                    }

                    if (oColumns[i].getSorted()) {
                        oColumns[i].setSorted(false);
                    }
                }

                var vSBU = this.getView().getModel("ui").getData().sbu;
                oModel.read('/MaterialSet', {
                    urlParameters: {
                        "$filter": "Sbu eq '" + vSBU + "'"
                    },
                    success: function (data, response) {
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        var oResult = data.results;

                        if (data.results.length > 0) {
                            if (_this._pMatno !== undefined) {
                                oResult = data.results.filter(fItem => fItem.Materialno === _this._pMatno);
                                data["results"] = oResult;
                            }

                            data.results.forEach((item, index) => {
                                item.Hasgmc = item.Hasgmc === "X" ? true : false;
                                item.Deleted = item.Deleted === "X" ? true : false;
    
                                if (item.Createddate !== null)
                                    item.Createddate = dateFormat.format(item.Createddate);
    
                                if (item.Updateddate !== null)
                                    item.Updateddate = dateFormat.format(item.Updateddate);
    
                                if (index === 0) {
                                    item.Active = true;
                                }
                                else {
                                    item.Active = false;
                                }
                            });
    
                            data.results.sort((a,b) => (a.Materialno > b.Materialno ? 1 : -1));
                            
                            oJSONModel.setData(data);
    
                            _this.getView().setModel(new JSONModel({
                                activeMaterialNo: data.results[0].Materialno,
                                sbu:vSBU
                            }), "ui");
                            _this.getAttributes(data.results[0].Materialno);
                            _this.getBatch(data.results[0].Materialno);
                            _this.getCustomInfo(data.results[0].Materialno);
                            _this.getPlant(data.results[0].Materialno);
                        }
                        else{
                            oJSONModel.setData(data);
                            _this.getView().getModel("ui").setProperty("/activeMaterialNo", '');
                            _this.getView().setModel(new JSONModel({
                                results: []
                            }), "matMaster");

                            _this.getView().setModel(new JSONModel({
                                results: []
                            }), "attributes");

                            _this.getView().setModel(new JSONModel({
                                results: []
                            }), "batch");

                            _this.getView().setModel(new JSONModel({
                                results: []
                            }), "customInfo");

                            _this.getView().setModel(new JSONModel({
                                results: []
                            }), "plant");
                            
                        }
                        _this.getView().setModel(oJSONModel, "matMaster");
                        _this.closeLoadingDialog();
                    },
                    error: function (err) { }
                })                
            },
            getSBU(){
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/SBURscSet";
                var _this = this;

                oModel.read(oEntitySet, {
                    success: function (data, response) {
                        if (data.results.length === 1) {
                            _this.getView().getModel("ui").setProperty("/sbu", data.results[0].SBU);
                            _this.getMatMaster();
                        }
                        else {
                            _this.closeLoadingDialog();

                            var oCBoxSBU = _this.byId('cboxSBU');
                            if (!_this._oPopover) {
                                Fragment.load({
                                    name: "zuimatmaster.view.Popover",
                                    controller: this
                                }).then(function(oPopover){
                                    _this._oPopover = oPopover;
                                    _this.getView().addDependent(_this._oPopover);                                    
                                    _this._oPopover.openBy(oCBoxSBU);
                                    _this._oPopover.setTitle("Select SBU");
                                }.bind(_this));
                            } else {
                                this._oPopover.openBy(oCBoxSBU);
                            }   
                                     
                            _this.byId("btnAddMM").setEnabled(false);
                            _this.byId("btnEditMM").setEnabled(false);
                            _this.byId("btnDeleteMM").setEnabled(false);
                            _this.byId("btnRefreshMM").setEnabled(false);
                            _this.byId("btnSortMM").setEnabled(false);
                            _this.byId("btnFilterMM").setEnabled(false);
                            _this.byId("btnFullScreenHdr").setEnabled(false);
                            _this.byId("btnColPropMM").setEnabled(false);
                            _this.byId("searchFieldMM").setEnabled(false);
                            
                        }
                        console.log(data);
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "SBUModel");
                    },
                    error: function (err) { }
                })
            },
            getAttributes(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/MaterialAtrribSet";
                var _this = this;
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "Matno eq '" + arg + "'"
                    },
                    success: function (data, response) {
                        data.results.forEach((item, index) => {
                            if (item.Createddt !== null)
                                item.Createddt = dateFormat.format(item.Createddt);

                            if (item.Updateddt !== null)
                                item.Updateddt = dateFormat.format(item.Updateddt);
                        })
                        // console.log(response)
                        var aFilters = [];

                        if (arg && _this.getView().byId("attributesTab").getBinding("rows")) {
                            aFilters = _this.getView().byId("attributesTab").getBinding("rows").aFilters;
                        }

                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "attributes");

                        if (_this.byId("searchFieldAttr").getProperty("value") !== "" ) {
                            _this.exeGlobalSearch(_this.byId("searchFieldAttr").getProperty("value"), "attributes")
                        }

                        if (arg && aFilters) {
                            _this.onRefreshFilter("attributes", aFilters);
                        }
                    },
                    error: function (err) { }
                })
            },
            getBatch(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/MaterialBatchSet";
                var _this = this;
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "Matno eq '" + arg + "'"
                    },
                    success: function (data, response) {
                        data.results.forEach((item, index) => {
                            if (item.Createddt !== null)
                                item.Createddt = dateFormat.format(item.Createddt);

                            if (item.Updateddt !== null)
                                item.Updateddt = dateFormat.format(item.Updateddt);
                        })
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "batch");
                    },
                    error: function (err) { }
                })
            },
            getCustomInfo(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/MaterialCusInfoSet";
                var _this = this;
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "Matno eq '" + arg + "'"
                    },
                    success: function (data, response) {
                        data.results.forEach((item, index) => {
                            if (item.Createddt !== null)
                                item.Createddt = dateFormat.format(item.Createddt);

                            if (item.Updateddt !== null)
                                item.Updateddt = dateFormat.format(item.Updateddt);
                        })
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "customInfo");
                    },
                    error: function (err) { }
                })
            },
            getPlant(arg) {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/PlantSet";
                var _this = this;
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "Matnr eq '" + arg + "'"
                    },
                    success: function (data, response) {
                        data.results.forEach((item, index) => {
                            if (item.Createddt !== null)
                                item.Createddt = dateFormat.format(item.Createddt);

                            if (item.Updateddt !== null)
                                item.Updateddt = dateFormat.format(item.Updateddt);
                        })
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "plant");
                    },
                    error: function (err) { }
                })
            },
            showLoadingDialog(arg) {
                if (!this._LoadingDialog) {
                    this._LoadingDialog = sap.ui.xmlfragment("zuimatmaster.view.LoadingDialog", this);
                    this.getView().addDependent(this._LoadingDialog);
                } 
                this._LoadingDialog.setTitle(arg);
                this._LoadingDialog.open();
            },
            closeLoadingDialog() {
                this._LoadingDialog.close();
            },
            onSBUChange: function(oEvent) {
                // console.log(this.byId('cboxSBU').getSelectedKey());
                var vSBU = this.byId('cboxSBU').getSelectedKey();
                this.getView().getModel("ui").setProperty("/sbu", vSBU);
                this.showLoadingDialog('Loading...');
                this.setButton("matMaster","selSBU");
                this.getMatMaster();
                this.getView().getModel("ui").setProperty("/dataMode", "READ");
            },
            getColumns: async function() {
                var sPath = jQuery.sap.getModulePath("zuimatmaster", "/model/columns.json");
                var oModelColumns = new JSONModel();
                await oModelColumns.loadData(sPath);
                var oColumns = oModelColumns.getData();
                var oModel = this.getOwnerComponent().getModel();

                oModel.metadataLoaded().then(() => {
                    var oService = oModel.getServiceMetadata().dataServices.schema.filter(item => item.namespace === "ZGW_3DERP_MATMASTER_SRV");
                    
                    var oMetadata = oService[0].entityType.filter(item => item.name === "Material");
                    if (oMetadata.length > 0) { 
                        var aColumns = this.initColumns(oColumns["matMaster"], oMetadata[0]);
                        this._aColumns["matMaster"] = aColumns["columns"];
                        this._aSortableColumns["matMaster"] = aColumns["sortableColumns"];
                        this._aFilterableColumns["matMaster"] = aColumns["filterableColumns"];
                        this.onAddColumns(this.byId("matMasterTab"), aColumns["columns"], "matMaster");
                    }

                    /*
                    var oMetadata = oService[0].entityType.filter(item => item.name === "MatTypeClass");
                    if (oMetadata.length > 0) {
                        console.log('MatTypeClass metadata') ;
                        //console.log(oMetadata);
                        var aColumns = this.initColumns(oColumns["MatTypeClass"], oMetadata[0]);
                        //console.log(aColumns);
                        this._aColumns["MatTypeClass"] = aColumns["columns"];
                        console.log(this._aColumns["columns"]);
                        this.onAddColumns(this.byId("MatTypeClassTab"), aColumns["columns"], "MatTypeClass");
                    }        */           
                    oMetadata = oService[0].entityType.filter(item => item.name === "MaterialAtrrib");
                    if (oMetadata.length > 0) { 
                        var aColumns = this.initColumns(oColumns["attributes"], oMetadata[0]);
                        this._aColumns["attributes"] = aColumns["columns"];
                        this._aSortableColumns["attributes"] = aColumns["sortableColumns"];
                        this._aFilterableColumns["attributes"] = aColumns["filterableColumns"];
                        this.onAddColumns(this.byId("attributesTab"), aColumns["columns"], "attributes");
                    }

                    oMetadata = oService[0].entityType.filter(item => item.name === "MaterialBatch");
                    if (oMetadata.length > 0) { 
                        var aColumns = this.initColumns(oColumns["batch"], oMetadata[0]);
                        this._aColumns["batch"] = aColumns["columns"];
                        this._aSortableColumns["batch"] = aColumns["sortableColumns"];
                        this._aFilterableColumns["batch"] = aColumns["filterableColumns"];
                        this.onAddColumns(this.byId("batchTab"), aColumns["columns"], "batch");
                    }

                    oMetadata = oService[0].entityType.filter(item => item.name === "MaterialCusInfo");
                    if (oMetadata.length > 0) { 
                        var aColumns = this.initColumns(oColumns["customInfo"], oMetadata[0]);
                        this._aColumns["customInfo"] = aColumns["columns"];
                        this._aSortableColumns["customInfo"] = aColumns["sortableColumns"];
                        this._aFilterableColumns["customInfo"] = aColumns["filterableColumns"];
                        this.onAddColumns(this.byId("customInfoTab"), aColumns["columns"], "customInfo");
                    }

                    oMetadata = oService[0].entityType.filter(item => item.name === "Plant");
                    if (oMetadata.length > 0) { 
                        var aColumns = this.initColumns(oColumns["plant"], oMetadata[0]);
                        this._aColumns["plant"] = aColumns["columns"];
                        this._aSortableColumns["plant"] = aColumns["sortableColumns"];
                        this._aFilterableColumns["plant"] = aColumns["filterableColumns"];
                        this.onAddColumns(this.byId("plantTab"), aColumns["columns"], "plant");
                    }
                })
            },
            initColumns: function(arg1, arg2) {
                var oColumn = arg1;
                var oMetadata = arg2;
                
                var aSortableColumns = [];
                var aFilterableColumns = [];
                var aColumns = [];
                
                oMetadata.property.forEach((prop, idx) => {
                    var vCreatable = prop.extensions.filter(item => item.name === "creatable");
                    var vUpdatable = prop.extensions.filter(item => item.name === "updatable");
                    var vSortable = prop.extensions.filter(item => item.name === "sortable");
                    var vFilterable = prop.extensions.filter(item => item.name === "filterable");
                    var vName = prop.extensions.filter(item => item.name === "label")[0].value;
                    var oColumnLocalProp = oColumn.filter(col => col.name === prop.name);
                    var vShowable = oColumnLocalProp.length === 0 ? true :  oColumnLocalProp[0].showable;
                    
                    if (vShowable) {
                        //sortable
                        if (vSortable.length === 0 || vSortable[0].value === "true") {
                            aSortableColumns.push({
                                name: prop.name, 
                                label: vName, 
                                position: oColumnLocalProp.length === 0 ? idx: oColumnLocalProp[0].position, 
                                sorted: oColumnLocalProp.length === 0 ? false : oColumnLocalProp[0].sort === "" ? false : true,
                                sortOrder: oColumnLocalProp.length === 0 ? "" : oColumnLocalProp[0].sort
                            });

                            
                        }

                        //filterable
                        if (vFilterable.length === 0 || vFilterable[0].value === "true") {
                            aFilterableColumns.push({
                                name: prop.name, 
                                label: vName, 
                                position: oColumnLocalProp.length === 0 ? idx : oColumnLocalProp[0].position,
                                value: "",
                                connector: "Contains"
                            });
                        }
                    }

                    //columns
                     aColumns.push({
                        name: prop.name, 
                        label: vName, 
                        position: oColumnLocalProp.length === 0 ? idx : oColumnLocalProp[0].position,
                        type: oColumnLocalProp.length === 0 ? prop.type : oColumnLocalProp[0].type,
                        creatable: vCreatable.length === 0 ? true : vCreatable[0].value === "true" ? true : false,
                        updatable: vUpdatable.length === 0 ? true : vUpdatable[0].value === "true" ? true : false,
                        sortable: vSortable.length === 0 ? true : vSortable[0].value === "true" ? true : false,
                        filterable: vFilterable.length === 0 ? true : vFilterable[0].value === "true" ? true : false,
                        visible: oColumnLocalProp.length === 0 ? true : oColumnLocalProp[0].visible,
                        required: oColumnLocalProp.length === 0 ? false : oColumnLocalProp[0].required,
                        width: oColumnLocalProp.length === 0 ? "150px" : oColumnLocalProp[0].width,
                        sortIndicator: oColumnLocalProp.length === 0 ? "None" : oColumnLocalProp[0].sort,
                        hideOnChange: oColumnLocalProp.length === 0 ? false : oColumnLocalProp[0].hideOnChange,
                        valueHelp: oColumnLocalProp.length === 0 ? {"show": false} : oColumnLocalProp[0].valueHelp,
                        showable: oColumnLocalProp.length === 0 ? true : oColumnLocalProp[0].showable,
                        key: oMetadata.key.propertyRef.filter(item => item.name === prop.name).length === 0 ? false : true,
                        maxLength: prop.maxLength !== undefined ? prop.maxLength : null,
                        precision: prop.precision !== undefined ? prop.precision : null,
                        scale: prop.scale !== undefined ? prop.scale : null
                    })
                })

                aSortableColumns.sort((a,b) => (a.position > b.position ? 1 : -1));
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
                );

                
                aColumns.sort((a,b) => (a.position > b.position ? 1 : -1));
                var aColumnProp = aColumns.filter(item => item.showable === true);

                this.createViewSettingsDialog("column", 
                    new JSONModel({
                        items: aColumnProp,
                        rowCount: aColumnProp.length,
                        table: ""
                    })
                );

                
                return { columns: aColumns, sortableColumns: aSortableColumns, filterableColumns: aFilterableColumns };
            },
            onAddColumns(table, columns, model) {
                var aColumns = columns.filter(item => item.showable === true)

                aColumns.forEach(col => {
                    if (col.type === "Edm.String") {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.Text({text: "{" + model + ">" + col.name + "}"})
                        }));
                    }
                    else if (col.type === "Edm.Decimal") {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "End",
                            sortProperty: col.name,
                            filterProperty: col.name,
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.Text({text: "{" + model + ">" + col.name + "}"})
                        }));
                    }
                    else if (col.type === "Edm.Boolean" ) {
                        table.addColumn(new sap.ui.table.Column({
                            id: model + "Col" + col.name,
                            width: col.width,
                            hAlign: "Center",
                            sortProperty: col.name,
                            filterProperty: col.name,                            
                            label: new sap.m.Text({text: col.label}),
                            template: new sap.m.CheckBox({selected: "{" + model + ">" + col.name + "}", editable: false})
                        }));
                    }
                })
            },
            onTableResize(arg1, arg2) {
                if (arg1 === "Hdr") {
                    if (arg2 === "Max") {
                        //this.byId("fixFlexMM").setProperty("fixContentSize", "99%");
                        this.byId("itbDetail").setVisible(false);
                        this.byId("btnFullScreenHdr").setVisible(false);
                        this.byId("btnExitFullScreenHdr").setVisible(true);
                    }
                    else {
                        //this.byId("fixFlexMM").setProperty("fixContentSize", "50%");
                        this.byId("itbDetail").setVisible(true);
                        this.byId("btnFullScreenHdr").setVisible(true);
                        this.byId("btnExitFullScreenHdr").setVisible(false);
                    }
                }
                else {
                    if (arg2 === "Max") {
                        //this.byId("fixFlexMM").setProperty("fixContentSize", "0%");
                        this.byId("matMasterTab").setVisible(false);
                        this.byId("btnFullScreenAttr").setVisible(false);
                        this.byId("btnExitFullScreenAttr").setVisible(true);
                        this.byId("btnFullScreenMatl").setVisible(false);
                        this.byId("btnExitFullScreenMatl").setVisible(true);
                    }
                    else {
                        //this.byId("fixFlexMM").setProperty("fixContentSize", "50%");
                        this.byId("matMasterTab").setVisible(true);
                        this.byId("btnFullScreenAttr").setVisible(true);
                        this.byId("btnExitFullScreenAttr").setVisible(false);
                        this.byId("btnFullScreenMatl").setVisible(true);
                        this.byId("btnExitFullScreenMatl").setVisible(false);
                    }                    
                }
            },
            onEditMM(){
                if (this._appAction !== "display") {
                    this.byId("cboxSBU").setEnabled(false);
                    this.byId("btnAddMM").setVisible(false);
                    this.byId("btnEditMM").setVisible(false);
                    this.byId("btnSaveMM").setVisible(true);
                    this.byId("btnCancelMM").setVisible(true);
                    this.byId("btnDeleteMM").setVisible(false);
                    this.byId("btnRefreshMM").setVisible(false);
                    this.byId("btnSortMM").setVisible(false);
                    this.byId("btnFilterMM").setVisible(false);
                    this.byId("btnFullScreenHdr").setVisible(false);
                    this.byId("btnColPropMM").setVisible(false);
                    this.byId("searchFieldMM").setVisible(false);
                    this.onTableResize("Hdr","Max");
                    this.byId("btnExitFullScreenHdr").setVisible(false);
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matMaster").getData());
    
                    var oTable = this.byId("matMasterTab");
                    var aSelIndices = oTable.getSelectedIndices();
                    var aData = this.getView().getModel("matMaster").getData().results;
                    var aDataToEdit = [];
    
                    if (aSelIndices.length > 0) {
                        aSelIndices.forEach(item => {
                            aDataToEdit.push(aData.at(item));
                        })
                    }
                    else aDataToEdit = aData;
    
                    aDataToEdit = aDataToEdit.filter(item => item.Deleted === false);
                    
                    this.getView().getModel("matMaster").setProperty("/results", aDataToEdit);
                    this.setRowEditMode("matMaster");
    
                    this.getView().getModel("ui").setProperty("/dataMode", 'EDIT');
                }
            },
            onEditCustomInfo(){
                this.byId("btnEditCustomInfo").setVisible(false);
                this.byId("btnSaveCustomInfo").setVisible(true);
                this.byId("btnCancelCustomInfo").setVisible(true);
                this.byId("btnDeleteCustomInfo").setVisible(false);
                this.byId("btnRefresCustomInfo").setVisible(false);
                this.byId("btnSortCustomInfo").setVisible(false);
                this.byId("btnFilterCustomInfo").setVisible(false);
                this.byId("btnFullScreenHdr").setVisible(false);
                this.byId("btnColPropCustomInfo").setVisible(false);
                this.byId("searchFieldCustomInfo").setVisible(false);
                this.onTableResize("Hdr","Max");
                this.byId("btnExitFullScreenHdr").setVisible(false);
                this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matMaster").getData());

                var oTable = this.byId("customInfoTab");
                var aSelIndices = oTable.getSelectedIndices();
                var aData = this.getView().getModel("customInfo").getData().results;
                var aDataToEdit = [];

                if (aSelIndices.length > 0) {
                    aSelIndices.forEach(item => {
                        aDataToEdit.push(aData.at(item));
                    })
                }
                else aDataToEdit = aData;

                aDataToEdit = aDataToEdit.filter(item => item.Deleted === false);
                
                this.getView().getModel("customInfo").setProperty("/results", aDataToEdit);
                this.setRowEditMode("customInfo");

                this.getView().getModel("ui").setProperty("/dataMode", 'EDIT');
            },
            onCreateMM() {
                if (this._appAction !== "display") {
                    //this.getView().byId("idOfYourComboBox").getSelectedItem().setEnabled(false);
                    this.byId("cboxSBU").setEnabled(false);
                    this.byId("btnAddMM").setVisible(false);
                    this.byId("btnEditMM").setVisible(false);
                    this.byId("btnSaveMM").setVisible(true);
                    this.byId("btnCancelMM").setVisible(true);
                    this.byId("btnDeleteMM").setVisible(false);
                    this.byId("btnRefreshMM").setVisible(false);
                    this.byId("btnSortMM").setVisible(false);
                    this.byId("btnFilterMM").setVisible(false);
                    this.byId("btnFullScreenHdr").setVisible(false);
                    this.byId("btnColPropMM").setVisible(false);
                    this.byId("searchFieldMM").setVisible(false);
                    this.onTableResize("Hdr","Max");
                    this.byId("btnExitFullScreenHdr").setVisible(false);
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("matMaster").getData());
                    this.byId("cboxSBU").setEnabled(false);

                    var aNewRow = [];
                    var oNewRow = {};
                    var oTable = this.byId("matMasterTab");     
                    /*var iCellIndexToFocus = -1;

                    if (oTable.getBinding("rows").aApplicationFilters.length > 0) {
                        this._aMultiFiltersBeforeChange = this._aFilterableColumns["matmaster"].filter(fItem => fItem.value !== "");                   
                        oTable.getBinding("rows").filter("", "Application");
                    }

                    if (oTable.getBinding().aFilters.length > 0) {
                        this._aFiltersBeforeChange = jQuery.extend(true, [], oTable.getBinding().aFilters);
                        oTable.getBinding().aFilters = [];
                    }

                    var oColumns = oTable.getColumns();

                    for (var i = 0, l = oColumns.length; i < l; i++) {
                        var isFiltered = oColumns[i].getFiltered();
                        // console.log(oColumns[i].getFiltered())
                        if (isFiltered) {
                            oColumns[i].filter("");
                        }
                    }*/

                    oTable.getColumns().forEach((col, idx) => {
                        this._aColumns["matMaster"].filter(item => item.label === col.getLabel().getText())
                            .forEach(ci => {
                                console.log(ci.type)
                                if (!ci.hideOnChange && ci.creatable) {
                                    if (ci.type === "Edm.Boolean") {
                                        col.setTemplate(new sap.m.CheckBox({selected: "{matMaster>" + ci.name + "}", editable: true}));
                                    }
                                    else if (ci.valueHelp["show"]) {
                                        col.setTemplate(new sap.m.Input({
                                            // id: "ipt" + ci.name,
                                            type: "Text",
                                            value: "{matMaster>" + ci.name + "}",
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
                                    else if (ci.type === "Edm.Number") {
                                        col.setTemplate(new sap.m.Input({
                                            type: sap.m.InputType.Number,
                                            textAlign: sap.ui.core.TextAlign.Right,
                                            value: "{path:'matMaster>" + ci.name + "}', type:'sap.ui.model.odata.type.Decimal', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
                                            liveChange: this.onNumberLiveChange.bind(this)
                                        }));
                                    }
                                    else {
                                        if (ci.maxLength !== null) {
                                            col.setTemplate(new sap.m.Input({
                                                value: "{matMaster>" + ci.name + "}", 
                                                maxLength: +ci.maxLength,
                                                liveChange: this.onInputLiveChange.bind(this)
                                            }));
                                        }
                                        else {
                                            col.setTemplate(new sap.m.Input({
                                                value: "{matMaster>" + ci.name + "}", 
                                                liveChange: this.onInputLiveChange.bind(this)
                                            }));
                                        }
                                    }
                                } 

                                if (ci.required) {
                                    col.getLabel().addStyleClass("requiredField");
                                }

                                if (ci.type === "Edm.String") oNewRow[ci.name] = "";
                                else if (ci.type === "Edm.Number") oNewRow[ci.name] = 0;
                                else if (ci.type === "Edm.Decimal") oNewRow[ci.name] = 0.0;
                                else if (ci.type === "Edm.Boolean") oNewRow[ci.name] = false;
                            })
                    })
                    oNewRow["New"] = true;
                    aNewRow.push(oNewRow);
                    this.getView().getModel("matMaster").setProperty("/results", aNewRow);
                    this.getView().getModel("ui").setProperty("/dataMode", 'NEW');
                    // console.log(aNewRow)
                    // console.log(this.getView().getModel("gmc"))
                    // console.log(oTable.getBinding())

                    if (oTable.getBinding()) {
                        this._aFiltersBeforeChange = jQuery.extend(true, [], oTable.getBinding().aFilters);

                        // oTable.getBinding().aSorters = null;
                        oTable.getBinding().aFilters = null;
                    }
                    // console.log(this._aFiltersBeforeChange)
                    var oColumns = oTable.getColumns();

                    for (var i = 0, l = oColumns.length; i < l; i++) {
                        var isFiltered = oColumns[i].getFiltered();
                        // console.log(oColumns[i].getFiltered())
                        if (isFiltered) {
                            oColumns[i].filter("");
                        }
                    }

                    oTable.getModel().refresh(true);
                }                
            },
            setRowEditMode(arg) {
                this.getView().getModel(arg).getData().results.forEach(item => item.Edited = false);
                var oTable = this.byId(arg + "Tab");

                oTable.getColumns().forEach((col, idx) => {
                    this._aColumns[arg].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (!ci.hideOnChange && ci.updatable) {
                                if (ci.type === "Edm.Boolean") {
                                    col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", editable: true}));
                                }
                                else if (ci.valueHelp["show"]) {
                                    col.setTemplate(new sap.m.Input({
                                        // id: "ipt" + ci.name,
                                        type: "Text",
                                        value: "{" + arg + ">" + ci.name + "}",
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
                                        liveChange: this.onValueHelpLiveInputChange.bind(this)
                                    }));
                                }
                                else if (ci.type === "Edm.Decimal" || ci.type === "Edm.Double" || ci.type === "Edm.Float" || ci.type === "Edm.Int16" || ci.type === "Edm.Int32" || ci.type === "Edm.Int64" || ci.type === "Edm.SByte" || ci.type === "Edm.Single") {
                                    col.setTemplate(new sap.m.Input({
                                        type: sap.m.InputType.Number,
                                        textAlign: sap.ui.core.TextAlign.Right,
                                        value: "{path:'" + arg + ">" + ci.name + "', type:'sap.ui.model.odata.type.Decimal', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
                                        liveChange: this.onNumberLiveChange.bind(this)
                                    }));
                                }
                                else {
                                    if (ci.maxLength !== null) {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + arg + ">" + ci.name + "}",
                                            maxLength: +ci.maxLength,
                                            liveChange: this.onInputLiveChange.bind(this)
                                        }));
                                    }
                                    else {
                                        col.setTemplate(new sap.m.Input({
                                            value: "{" + arg + ">" + ci.name + "}",
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
            setRowReadMode(arg) {
                var oTable = this.byId(arg + "Tab");

                oTable.getColumns().forEach((col, idx) => {                    
                    this._aColumns[arg].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (ci.type === "Edm.String" || ci.type === "Edm.Decimal") {
                                col.setTemplate(new sap.m.Text({text: "{" + arg + ">" + ci.name + "}"}));
                            }
                            else if (ci.type === "Edm.Boolean") {
                                col.setTemplate(new sap.m.CheckBox({selected: "{" + arg + ">" + ci.name + "}", editable: false}));
                            }

                            if (ci.required) {
                                col.getLabel().removeStyleClass("requiredField");
                            }
                        })
                })
            },
            onValueHelpLiveInputChange: function(oEvent) {
                if (this.validationErrors === undefined) this.validationErrors = [];

                var oSource = oEvent.getSource();
                var isInvalid = !oSource.getSelectedKey() && oSource.getValue().trim();
                oSource.setValueState(isInvalid ? "Error" : "None");

                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var _this = this;
                var oTable = this.byId("matMasterTab");
                this._isMMEdited = true;
                oSource.getSuggestionItems().forEach(item => {
                    // console.log(item.getProperty("key"), oSource.getValue().trim())
                    if (item.getProperty("key") === oSource.getValue().trim()) {
                        isInvalid = false;
                        oSource.setValueState(isInvalid ? "Error" : "None");
                        var vSBU = this.byId('cboxSBU').getSelectedKey();
                        console.log(this.getView().getModel(sModel));
                        if(oSource.getBindingInfo("value").parts[0].path ==="Materialtype"){
                            var et=item.getBindingContext().sPath;
                            if(oSource.getValue().trim()!=''){
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Gmc', ""); 
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Materialgroup', ""); 
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Baseuom', "");
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Grosswt', "0.000");
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Netwt', "0.000");
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Wtuom', "");
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Volume', "0.000");
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Volumeuom', "");
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Custmatcode', "");
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Processcode', "");
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Purchvaluekey', "");
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Uebto', 0.0);
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Untto', 0.0);
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Uebtk', false);
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Hasgmc', item.getBindingContext().getModel().oData[et.slice(1, et.length)].Hasgmc  === "X" ? true : false);
                                if(item.getBindingContext().getModel().oData[et.slice(1, et.length)].Hasgmc  === "X"){
                                    oTable.getColumns().forEach((col, idx) => {
                                        switch(col.getLabel().getText().toUpperCase()) { 
                                            case 'MATERIAL GROUP':
                                            case 'GROSS WEIGHT':
                                            case 'NET WEIGHT':
                                            case 'WEIGHT UOM':
                                            case 'VOLUME':
                                            case 'VOLUME UOM':
                                            case 'CUSTOMER MATERIAL':
                                            case 'PROCESS CODE':
                                            case 'ORDER UNIT':
                                            case 'BASE UOM': { 
                                                oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                               break; 
                                            } 
                                            case 'GMC': { 
                                                oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                                oModel.read('/GMCRscSet', {
                                                    urlParameters: {
                                                        "$filter": "Mattyp eq '"  + item.getProperty("key") + "' and Sbu eq '" + vSBU +"'"
                                                    },
                                                    success: function (data, response) {
                                                        oJSONModel.setData(data);
                                                        _this.getView().setModel(oJSONModel, "gmcField");
                                                        oTable.getRows()[0].getCells()[idx].bindAggregation("suggestionItems",{
                                                            path: "gmcField>/results",
                                                            length: 1000,
                                                            template: new sap.ui.core.ListItem({
                                                                text: "{gmcField>Gmc}",
                                                                key: "{gmcField>Gmc}",
                                                                additionalText:"{gmcField>Descen}"
                                                            })
                                                        });
                                                    }
                                                });
                                                break;
                                            }
                                        }
                                    });
                                }
                                else{
                                    oTable.getColumns().forEach((col, idx) => {
                                        switch(col.getLabel().getText().toUpperCase()) { 
                                            case 'MATERIAL GROUP':
                                            case 'GROSS WEIGHT':
                                            case 'NET WEIGHT':
                                            case 'WEIGHT UOM':
                                            case 'VOLUME':
                                            case 'VOLUME UOM':
                                            case 'CUSTOMER MATERIAL':
                                            case 'PROCESS CODE':
                                            case 'ORDER UNIT':
                                            case 'BASE UOM': { 
                                                oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                               break; 
                                            } 
                                            case 'GMC': { 
                                                oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                               break; 
                                            } 
                                        }
                                    });
                                }
                            }
                            else{
                                this.getView().getModel(sModel).setProperty(sRowPath + '/Hasgmc', false);
                            }
                        }
                        if(oSource.getBindingInfo("value").parts[0].path ==="Gmc"){
                            var et=item.getBindingContext("gmcField").sPath;
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Materialgroup', item.getBindingContext("gmcField").getModel().oData.results[et.slice(1, et.length).replace('results/','')].Matgrpcd);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Processcode', item.getBindingContext("gmcField").getModel().oData.results[et.slice(1, et.length).replace('results/','')].Processcd);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Baseuom', item.getBindingContext("gmcField").getModel().oData.results[et.slice(1, et.length).replace('results/','')].Baseuom);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Grosswt',item.getBindingContext("gmcField").getModel().oData.results[et.slice(1, et.length).replace('results/','')].Grswt);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Netwt', item.getBindingContext("gmcField").getModel().oData.results[et.slice(1, et.length).replace('results/','')].Netwt);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Wtuom', item.getBindingContext("gmcField").getModel().oData.results[et.slice(1, et.length).replace('results/','')].Wtuom);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Volume', item.getBindingContext("gmcField").getModel().oData.results[et.slice(1, et.length).replace('results/','')].Volume);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Volumeuom', item.getBindingContext("gmcField").getModel().oData.results[et.slice(1, et.length).replace('results/','')].Voluom);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Custmatcode', item.getBindingContext("gmcField").getModel().oData.results[et.slice(1, et.length).replace('results/','')].Cusmatcd);
                        }
                        if(oSource.getBindingInfo("value").parts[0].path ==="Purchvaluekey"){
                            var et = item.getBindingContext().sPath;
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Uebto', item.getBindingContext().getModel().oData[et.slice(1, et.length)].Uebto);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Untto', item.getBindingContext().getModel().oData[et.slice(1, et.length)].Untto);
                            this.getView().getModel(sModel).setProperty(sRowPath + '/Uebtk', item.getBindingContext().getModel().oData[et.slice(1, et.length)].Uebtk === "X" ? true : false);
                        }
                    }

                })

                if (isInvalid) this.validationErrors.push(oEvent.getSource().getId());
                else {
                    this.validationErrors.forEach((item, index) => {
                        if (item === oEvent.getSource().getId()) {
                            this.validationErrors.splice(index, 1)
                        }
                    })
                }

                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            },
            onInputLiveChange: function(oEvent) {                
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
                if (sModel === 'matMaster') this._isMMEdited = true;
            },
            onNumberLiveChange: function(oEvent) {
                if (this.validationErrors === undefined) this.validationErrors = [];
                if (oEvent.getParameters().value.split(".").length > 1) {
                    if (oEvent.getParameters().value.split(".")[1].length > 3) {
                        // console.log("invalid");
                        oEvent.getSource().setValueState("Error");
                        oEvent.getSource().setValueStateText("Enter a number with a maximum of 3 decimal places.");
                        this.validationErrors.push(oEvent.getSource().getId());
                    }
                    else {
                        oEvent.getSource().setValueState("None");
                        this.validationErrors.forEach((item, index) => {
                            if (item === oEvent.getSource().getId()) {
                                this.validationErrors.splice(index, 1)
                            }
                        })
                    }
                }
                else {
                    oEvent.getSource().setValueState("None");
                    this.validationErrors.forEach((item, index) => {
                        if (item === oEvent.getSource().getId()) {
                            this.validationErrors.splice(index, 1)
                        }
                    })
                }

                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
                this._isMMEdited = true;
            },
            onCancelMM() {
                if (this._isMMEdited) {
                    this._cancelMM = true;
                    if (!this._DiscardChangesDialog) {
                        this._DiscardChangesDialog = sap.ui.xmlfragment("zuimatmaster.view.DiscardChangesDialog", this);
                        this.getView().addDependent(this._DiscardChangesDialog);
                    }
                    
                    this._DiscardChangesDialog.open();
                }
                else {
                    this.byId("cboxSBU").setEnabled(true);
                    this.byId("btnAddMM").setVisible(true);
                    this.byId("btnEditMM").setVisible(true);
                    this.byId("btnSaveMM").setVisible(false);
                    this.byId("btnCancelMM").setVisible(false);
                    this.byId("btnDeleteMM").setVisible(true);
                    this.byId("btnRefreshMM").setVisible(true);
                    this.byId("btnSortMM").setVisible(true);
                    this.byId("btnFilterMM").setVisible(true);
                    this.byId("btnFullScreenHdr").setVisible(true);
                    this.byId("btnColPropMM").setVisible(true);
                    // this.byId("searchFieldMM").setVisible(true);
                    this.onTableResize("Hdr","Min");
                    this.setRowReadMode("matMaster");
                    this.getView().getModel("matMaster").setProperty("/", this._oDataBeforeChange);

                    if (this.getView().getModel("ui").getData().dataMode === 'NEW') this.setFilterAfterCreate();
                    this.getView().getModel("ui").setProperty("/dataMode", 'READ');
                }
            },
            onCancelCustomInfo() {
                this.byId("btnEditCustomInfo").setVisible(true);
                this.byId("btnSaveCustomInfo").setVisible(false);
                this.byId("btnCancelCustomInfo").setVisible(false);
                this.byId("btnDeleteCustomInfo").setVisible(true);
                this.byId("btnRefreshCustomInfo").setVisible(true);
                this.byId("btnSortCustomInfo").setVisible(true);
                this.byId("btnFilterCustomInfo").setVisible(true);
                this.byId("btnFullScreenHdr").setVisible(true);
                this.byId("btnColPropCustomInfo").setVisible(true);
                // this.byId("searchFieldCustomInfo").setVisible(true);
                this.onTableResize("Hdr","Min");
                this.setRowReadMode("customInfo");
                this.getView().getModel("customInfo").setProperty("/", this._oDataBeforeChange);
                this.getView().getModel("ui").setProperty("/dataMode", 'READ');
            },
            onSave(arg) {
                var aNewRows = this.getView().getModel(arg).getData().results.filter(item => item.New === true);
                var aEditedRows = this.getView().getModel(arg).getData().results.filter(item => item.Edited === true);
                //alert(this.getView().byId('selSBU').getSelectedItem().getText());
                if (this.validationErrors.length === 0)
                {   
                    if (aNewRows.length > 0) {
                        if (aNewRows[0].Materialtype === '' || aNewRows[0].Gmc === '' || aNewRows[0].Materialgroup === '' || aNewRows[0].Baseuom === '') {
                            MessageBox.information("Please input required fields.");
                        }
                        else {
                            var oModel = this.getOwnerComponent().getModel();
                            var oJSONModel = new JSONModel();
                            var _this = this;

                            this.onMaterialTypeClassDialog(aNewRows[0]);

                            oModel.read('/MRPTypeSet', {
                                urlParameters: {
                                    "$filter": "Screencode eq 'BAPI_MATNR' and Mtart eq '" + aNewRows[0].Materialtype + "'"
                                },
                                success: function (data, response) {
                                    oJSONModel.setData(data);
                                    _this.getView().setModel(oJSONModel, "mrpTypeClass");
                                },
                                error: function (err) {
                                    MessageBox.information(err);
                                }
                            })

                            var oModel1 = this.getOwnerComponent().getModel();
                            var oJSONModel1 = new JSONModel();
                            var vSBU = this.getView().getModel("ui").getData().sbu;
                            
                            oModel1.read('/MatPlantSet', {
                                urlParameters: {
                                    "$filter": "Sbu eq '" + vSBU + "'"
                                },
                                success: function (data, response) {
                                    oJSONModel1.setData(data);    
                                    _this.getView().setModel(oJSONModel1, "matPlantClass");
                                },
                                error: function (err) {
                                }
                            })
                        }
                    }
                    else if (aEditedRows.length > 0) {
                        var oModel = this.getOwnerComponent().getModel();
                        var iEdited = 0;
                        var _this = this;
                        
                        aEditedRows.forEach(item => {
                            var entitySet = "/" + this._aEntitySet[arg] + "(";
                            var param = {};
    
                            var iKeyCount = this._aColumns[arg].filter(col => col.key === true).length;
    
                            _this._aColumns[arg].forEach(col => {
                                if (col.updatable) param[col.name] = item[col.name]
    
                                if (iKeyCount === 1) { 
                                    if (col.key) entitySet += "'" + item[col.name] + "'" 
                                }
                                else if (iKeyCount > 1) { 
                                    if (col.key) entitySet += col.name + "='" + item[col.name] + "',"
                                }
                            })
                            
                            if (iKeyCount > 1) entitySet = entitySet.substr(0, entitySet.length - 1);
    
                            entitySet += ")";
     
                            setTimeout(() => {
                                oModel.update(entitySet, param, {
                                    method: "PUT",
                                    success: function(data, oResponse) {
                                        iEdited++;
    
                                        if (iEdited === aEditedRows.length) {
                                            _this.setButton(arg, "save");
    
                                            var oIconTabBar = _this.byId("itbDetail");
                                            oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
    
                                            _this.getView().getModel(arg).getData().forEach((row,index) => {
                                                _this.getView().getModel(arg).setProperty('/results/' + index + '/Edited', false);
                                            })
                                            
                                            _this.getView().getModel("ui").setProperty("/dataMode", 'READ');
                                        }
                                    },
                                    error: function() {
                                        // alert("Error");
                                    }
                                });
                            }, 500)
                        });
                    }
                    else {
                        var bCompact = true;
    
                        MessageBox.information("No data have been modified.",
                            {
                                styleClass: bCompact ? "sapUiSizeCompact" : ""
                            }
                        );
                    }
                }
                else {
                    MessageBox.information("Please check invalid entry on input fields.");
                }
            },
            onCreateMMSave(){
                //alert(this.getView().getModel("mrpTypeClass").getData().results[0].length);
                //alert(this.getView().getModel("mrpTypeClass").getData().results[0].Dismm);
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
                else{
                    var _descen = _aDescen.join(', ');
                    var _desczh = _aDesczh.join(', ');
                    var _param = {};
                    var dismm='';
                    var _MatImportParamSet=[];
                    var aNewRows = this.getView().getModel("matMaster").getData().results.filter(item => item.New === true);
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
                        "Matl_type": aNewRows[0].Materialtype,
                        "Matl_group": aNewRows[0].Materialgroup,
                        "Old_mat_no": aNewRows[0].Oldmaterialno,
                        "Base_uom": aNewRows[0].Baseuom,
                        "Batch_mgmt": "X",
                        "Net_weight": aNewRows[0].Netwt,
                        "Unit_of_wt": aNewRows[0].Wtuom,
                        "Po_unit": aNewRows[0].Orderuom,
                        "Pur_valkey": aNewRows[0].Purchvaluekey,
                        "Plant": this.getView().getModel("matPlantClass").getData().results[0].Plantcd,
                        "Mrp_type": this.getView().getModel("mrpTypeClass").getData().results[0].Dismm,
                        "Period_ind": "M",
                        "Proc_type": "F",
                        "Availcheck": "KP",
                        "Profit_ctr": this.getView().getModel("matPlantClass").getData().results[0].Profitctr,
                        "Val_area": this.getView().getModel("matPlantClass").getData().results[0].Plantcd,
                        "Price_ctrl": (aNewRows[0].Materialgroup === "ACC" || aNewRows[0].Materialgroup === "FAB") ? "V" : "",
                        "Moving_pr": "0",
                        "Price_unit": "1",
                        "Val_class": this.getView().getModel("mrpTypeClass").getData().results[0].Bklas
                    })

                    _param={
                        "Seq": "1",
                        "Mattyp": aNewRows[0].Materialtype,
                        "Gmc": aNewRows[0].Gmc,
                        "Descen": _descen,
                        "Desczh": _desczh,
                        "Processcd": aNewRows[0].Processcode,
                        "Cusmatno": aNewRows[0].Cusmatcd,
                        "Grswt": aNewRows[0].Grosswt,
                        "Volume": aNewRows[0].Volume,
                        "Voluom": aNewRows[0].Volumeuom,
                        "Length": aNewRows[0].Length + '',
                        "Width": aNewRows[0].Width + '',
                        "Height": aNewRows[0].Height + '',
                        "Dimuom": aNewRows[0].Dimensionuom,
                        "Remarks": "",
                        "MatAttribParamSet":_paramAttrib,
                        "MatImportParamSet":_MatImportParamSet,
                        "RetMsgSet": [{ "Seq": "1" }]
                    }
                    //console.log(_param);
                    
                    var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_MATERIAL_SRV");
                    console.log(oModel);
                    oModel.create("/MaterialHdrSet", _param, {
                        method: "POST",
                        success: function(res, oResponse) {
                            console.log("onsaveMM",res);
                            if (res.RetMsgSet.results[0].Type === "S") {
                                _this._oViewSettingsDialog["zuimatmaster.view.MaterialTypeClassDialog"].close();
                                _this.setButton("matMaster", "save");
                                _this.onRefreshMM();
                                _this.getView().getModel("ui").setProperty("/dataMode", 'READ');
                            }

                            MessageBox.information(res.RetMsgSet.results[0].Message);
                        },
                        error: function() {
                            // alert("Error");
                        }
                    });
                }
            },
            createDialog: null,
            onMaterialTypeClassDialog(args) {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var _this = this;
                this.newMattyp = args.Materialtype;
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
                            item.DescInput=item.Attrib === "X" ? false : true;
                        })
                        
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "mtClassModel");

                        _this.createViewSettingsDialog("matTypeClass", 
                            new JSONModel({
                                items: data.results,
                                rowCount: data.results.length
                            })
                        );

                        var oDialog = _this._oViewSettingsDialog["zuimatmaster.view.MaterialTypeClassDialog"];
                        oDialog.getModel().setProperty("/items", data.results);
                        oDialog.getModel().setProperty("/rowCount", data.results.length);
                        oDialog.open();
                    },
                    error: function (err) { }
                })
            },
            setButton(arg1, arg2) {
                var vSBU = this.byId('cboxSBU').getSelectedKey();
                if (arg2 === "save") {
                    if (arg1 === "matMaster") {
                        this.byId("btnAddMM").setVisible(true);
                        this.byId("btnEditMM").setVisible(true);
                        this.byId("btnSaveMM").setVisible(false);
                        this.byId("btnCancelMM").setVisible(false);
                        this.byId("btnDeleteMM").setVisible(true);
                        this.byId("btnRefreshMM").setVisible(true);
                        this.byId("btnSortMM").setVisible(true);
                        this.byId("btnFilterMM").setVisible(true);
                        this.byId("btnFullScreenHdr").setVisible(true);
                        this.byId("btnColPropMM").setVisible(true);
                        // this.byId("searchFieldMM").setVisible(true);
                        this.onTableResize("Hdr","Min");
                    }

                    this.setRowReadMode(arg1);
                    this.setReqColHdrColor(arg1);                    

                    if (arg1 === "matMaster") {
                        this.onRefreshMM();
                    }
                    else {
                        this.resetVisibleCols(arg1);
                    }
                }
                if(arg2==="load"){
                    if(arg1==="matMaster"){
                        if(vSBU===""){
                            this.byId("btnAddMM").setEnabled(false);
                            this.byId("btnEditMM").setEnabled(false);
                            this.byId("btnDeleteMM").setEnabled(false);
                            this.byId("btnRefreshMM").setEnabled(false);
                            this.byId("btnSortMM").setEnabled(false);
                            this.byId("btnFilterMM").setEnabled(false);
                            this.byId("btnFullScreenHdr").setEnabled(false);
                            this.byId("btnColPropMM").setEnabled(false);
                        }
                    }
                }
                if(arg2==="selSBU"){
                    if(arg1==="matMaster"){
                        this.byId("btnAddMM").setEnabled(true);
                        this.byId("btnEditMM").setEnabled(true);
                        this.byId("btnDeleteMM").setEnabled(true);
                        this.byId("btnRefreshMM").setEnabled(true);
                        this.byId("btnSortMM").setEnabled(true);
                        this.byId("btnFilterMM").setEnabled(true);
                        this.byId("btnFullScreenHdr").setEnabled(true);
                        this.byId("btnColPropMM").setEnabled(true);
                        this.byId("searchFieldMM").setEnabled(true);
                    }
                }
            },
            onDeleteMM() {
                if (this._appAction !== "display") {
                    var oModel = this.getOwnerComponent().getModel();
                    var oTable = this.byId("matMasterTab");
                    var aSelRows = oTable.getSelectedIndices();
                    // var iDelCount = 0;
                    // var _this = this;
                    
                    if (aSelRows.length === 0) {
                        MessageBox.information("No record(s) have been selected for deletion.");
                    }
                    else {
                        MessageBox.confirm("Proceed to delete " + aSelRows.length + " record(s)?", {
                            actions: ["Yes", "No"],
                            onClose: function (sAction) {
                                if (sAction === "Yes") {
                                    aSelRows.forEach(rec => {
                                        var oContext = oTable.getContextByIndex(rec);
                                        var oModelMM = oContext.getModel();
                                        var sPath = oContext.getPath();
                                        var vMaterialno = oContext.getObject().Materialno;
                                        var oEntitySet = "/MaterialSet('" + vMaterialno + "')";
                                        var oParam = {
                                            "Deleted": "X"
                                        };
        
                                        setTimeout(() => {
                                            oModel.update(oEntitySet, oParam, {
                                                method: "PUT",
                                                success: function(data, oResponse) {
                                                    oModelMM.setProperty(sPath + '/Deleted', true);
                                                },
                                                error: function() {
                                                    // alert("Error");
                                                }
                                            });
                                        }, 500)
                                    });                            
                                }
                            }
                        });
                    }
                }
            },
            onDeleteCustomInfo() {
                var oModel = this.getOwnerComponent().getModel();
                var oTable = this.byId("customInfoTab");
                var aSelRows = oTable.getSelectedIndices();
                // var iDelCount = 0;
                // var _this = this;
                
                if (aSelRows.length === 0) {
                    MessageBox.information("No record(s) have been selected for deletion.");
                }
                else {
                    MessageBox.confirm("Proceed to delete " + aSelRows.length + " record(s)?", {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction === "Yes") {
                                aSelRows.forEach(rec => {
                                    var oContext = oTable.getContextByIndex(rec);
                                    var oModelMM = oContext.getModel();
                                    var sPath = oContext.getPath();
                                    var vMaterialno = oContext.getObject().Matno;
                                    var oEntitySet = "/MaterialCusInfoSet('" + vMaterialno + "')";
                                    var oParam = {
                                        "Deleted": "X"
                                    };
    
                                    setTimeout(() => {
                                        oModel.update(oEntitySet, oParam, {
                                            method: "PUT",
                                            success: function(data, oResponse) {
                                                oModelMM.setProperty(sPath + '/Deleted', true);
                                            },
                                            error: function() {
                                                // alert("Error");
                                            }
                                        });
                                    }, 500)
                                });                            
                            }
                        }
                    });
                }
            },
            onRefreshMM() {
                this.showLoadingDialog('Loading...');
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });
                var _this = this;
                var vSBU = this.getView().getModel("ui").getData().sbu;
                
                
                oModel.read('/MaterialSet', {
                    urlParameters: {
                        "$filter": "Sbu eq '" + vSBU + "'"
                    },
                    success: function (data, response) {
                        if (data.results.length > 0) {
                            data.results.forEach((item, index) => {
                                item.Hasgmc = item.Hasgmc === "X" ? true : false;
                                item.Deleted = item.Deleted === "X" ? true : false;
    
                                if (item.Createddate !== null)
                                    item.Createddate = dateFormat.format(item.Createddate);
    
                                if (item.Updateddate !== null)
                                    item.Updateddate = dateFormat.format(item.Updateddate);
    
                                if (index === 0) {
                                    item.Active = true;
                                }
                                else {
                                    item.Active = false;
                                }
                            });

                            data.results.sort((a,b) => (a.Materialno > b.Materialno ? 1 : -1));
                            var aFilters = [];
                            if (_this.getView().byId("matMasterTab").getBinding("rows")) {
                                aFilters = _this.getView().byId("matMasterTab").getBinding("rows").aFilters;
                            }
                            oJSONModel.setData(data);
                            _this.getView().setModel(oJSONModel, "matMaster");
                            _this.getView().setModel(new JSONModel({
                                activeMaterialNo: data.results[0].Materialno,
                                sbu:vSBU
                            }), "ui");

                            _this.getAttributes(data.results[0].Materialno);
                            _this.getBatch(data.results[0].Materialno);
                            _this.getCustomInfo(data.results[0].Materialno);
                            _this.getPlant(data.results[0].Materialno);
                            if (_this.byId("searchFieldMM").getProperty("value") !== "" ) {
                                _this.exeGlobalSearch(_this.byId("searchFieldMM").getProperty("value"), "matMaster")
                            }
    
                            if (aFilters) {
                                _this.onRefreshFilter("matMaster", aFilters);
                            }
                        }
                        _this.closeLoadingDialog();
                    },
                    error: function (err) { }
                })    
                
            },
            onCancelDiscardChangesDialog() {
                // console.log(this._DiscardChangesgDialog)
                this._DiscardChangesDialog.close();
            },
            exeGlobalSearch(arg1, arg2) {
                var oFilter = null;
                var aFilter = [];
                
                if (arg1) {
                    //alert("test1")
                    this._aFilterableColumns[arg2].forEach(item => {
                        var sDataType = this._aColumns[arg2].filter(col => col.name === item.name)[0].type;
                        if (sDataType === "Edm.Boolean") aFilter.push(new Filter(item.name, FilterOperator.EQ, arg1));
                        else aFilter.push(new Filter(item.name, FilterOperator.Contains, arg1));
                    })
                    oFilter = new Filter(aFilter, false);
                }
                //this.getView().getModel("ui").setProperty("/dataMode", 'READ');
                this.setRowReadMode("matMaster");
                

                this.byId(arg2 + "Tab").getBinding("rows").filter(oFilter, "Application");

                if (arg1 && arg2 === "matMaster") {
                    var vMaterial = this.getView().getModel("ui").getData().activeMaterialNo;
                    this.getView().getModel("ui").setProperty("/activeMaterialNo", vMaterial);
                    this.getAttributes(vMaterial);
                    this.getBatch(vMaterial);
                    this.getCustomInfo(vMaterial);
                    this.getPlant(vMaterial);
                }
                
            },
            onRefreshFilter(pModel, pFilters) {
                var oTable = this.byId(pModel + "Tab");
                var oColumns = oTable.getColumns();

                pFilters.forEach(item => {
                    oColumns.filter(fItem => fItem.getFilterProperty() === item.sPath)
                        .forEach(col => col.filter(item.oValue1))
                }) 
            },
            setFilterAfterCreate: function(oEvent) {
                if (this._aFiltersBeforeChange.length > 0) {
                    var aFilter = [];
                    var oFilter = null;
                    var oTable = this.byId("matMasterTab");
                    var oColumns = oTable.getColumns();
                    // console.log(oColumns)
                    this._aFiltersBeforeChange.forEach(item => {
                        aFilter.push(new Filter(item.sPath, this.getConnector(item.sOperator), item.oValue1));
                        oColumns.filter(fItem => fItem.getFilterProperty() === item.sPath)
                            .forEach(col => col.filter(item.oValue1))
                    }) 
                }
            },
            onRefreshAttr() {
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;
                this.getAttributes(mmNo);
            },
            onRefreshBatch(){
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;
                this.getBatch(mmNo)
            },
            onRefreshCustomInfo(){
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;
                this.getCustomInfo(mmNo);
            },

            //Start of Extend Material Adjustment
            getDynamicColumns: async function(model, dataSource) {
                var _this = this;
                var modCode = model;
                var tabName = dataSource;

                //get dynamic columns based on saved layout or ZERP_CHECK
                var oJSONColumnsModel = new JSONModel();

                var vSBU = this.byId('cboxSBU').getSelectedKey();

                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                oModel.setHeaders({
                    sbu: vSBU,
                    type: modCode,
                    tabname: tabName
                });

                await new Promise((resolve, reject) => {
                    oModel.read("/ColumnsSet", {
                        success: async function (oData, oResponse) {
                            if (oData.results.length > 0) {
                                _this._columnLoadError = false;
                                if (modCode === 'MMExtend') {
                                    oJSONColumnsModel.setData(oData.results);
                                    _this.getView().setModel(oJSONColumnsModel, "mmExtendTblColumns");
                                    _this.setTableColumnsData(modCode);
                                    resolve();
                                }
                            }else{
                                _this._columnLoadError = true;
                                if (modCode === 'MMExtend') {
                                    _this.getView().setModel(oJSONColumnsModel, "mmExtendTblColumns");
                                    _this.setTableColumnsData(modCode);
                                    resolve();
                                }
                            }
                        },
                        error: function (err) {
                            _this._columnLoadError = true;
                            resolve();
                        }
                    });
                });
            },

            setTableColumnsData(modCode){
                var _this = this;
                var oColumnsModel;
                var oDataModel;

                var oColumnsData;
                var oData;

                if(modCode === "MMExtend"){
                    oColumnsModel = _this.getView().getModel("mmExtendTblColumns");  
                    oDataModel = _this.getView().getModel("mmExtendTblData"); 

                    oData = oDataModel === undefined ? [] :oDataModel.getProperty('/');

                    if(_this._columnLoadError){
                        oData = [];
                    }
                    oColumnsData = oColumnsModel.getProperty('/');
                    _this.addColumns("mmExtendTbl", oColumnsData, oData, "mmExtendTbl");
                }
            },

            addColumns: async function(table, columnsData, data, model) {
                var me = this;
                var oModel = new JSONModel();
                oModel.setData({
                    columns: columnsData,
                    rows: data
                });

                var oTable = this.getView().byId(table);

                oTable.setModel(oModel);

                oTable.bindColumns("/columns", function (index, context) {
                    var sColumnId = context.getObject().ColumnName;
                    var sColumnLabel = context.getObject().ColumnLabel;
                    var sColumnType = context.getObject().DataType;
                    var sColumnVisible = context.getObject().Visible;
                    var sColumnSorted = context.getObject().Sorted;
                    var sColumnSortOrder = context.getObject().SortOrder;
                    var sColumnWidth = context.getObject().ColumnWidth;
                    var sColumnWidth = context.getObject().ColumnWidth;
                    if (sColumnType === "STRING" || sColumnType === "DATETIME"|| sColumnType === "BOOLEAN") {
                        return new sap.ui.table.Column({
                            id: model+"-"+sColumnId,
                            label: sColumnLabel,
                            template: me.columnTemplate(sColumnId),
                            width: sColumnWidth + "px",
                            hAlign: me.columnSize(sColumnId),
                            sortProperty: sColumnId,
                            filterProperty: sColumnId,
                            autoResizable: true,
                            visible: sColumnVisible,
                            sorted: sColumnSorted,
                            sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending" )
                        });
                    }else if (sColumnType === "NUMBER") {
                        return new sap.ui.table.Column({
                            id: model+"-"+sColumnId,
                            label: sColumnLabel,
                            template: new sap.m.Text({ text: "{" + sColumnId + "}", wrapping: false, tooltip: "{" + sColumnId + "}" }), //default text
                            width: sColumnWidth + "px",
                            hAlign: "End",
                            sortProperty: sColumnId,
                            filterProperty: sColumnId,
                            autoResizable: true,
                            visible: sColumnVisible,
                            sorted: sColumnSorted,
                            sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending" )
                        });
                    }

                });

                //bind the data to the table
                oTable.bindRows("/rows");
            },
            columnTemplate: function(sColumnId){
                var oColumnTemplate;
                oColumnTemplate = new sap.m.Text({ text: "{" + sColumnId + "}", wrapping: false, tooltip: "{" + sColumnId + "}" }); //default text
                if (sColumnId === "DELETED") { 
                    //Manage button
                    oColumnTemplate = new sap.m.CheckBox({
                        selected: "{" + sColumnId + "}",
                        editable: false
                    });
                }
                if (sColumnId === "CLOSED") { 
                    //Manage button
                    oColumnTemplate = new sap.m.CheckBox({
                        selected: "{" + sColumnId + "}",
                        editable: false
                    });
                }
                if (sColumnId === "UNLIMITED" || sColumnId === "INVRCPT" || sColumnId === "GRBASEDIV" || sColumnId === "GRIND") { 
                    //Manage button
                    oColumnTemplate = new sap.m.CheckBox({
                        selected: "{" + sColumnId + "}",
                        editable: false
                    });
                }
                if (sColumnId === "INVRCPTIND") { 
                    //Manage button
                    oColumnTemplate = new sap.m.CheckBox({
                        selected: "{" + sColumnId + "}",
                        editable: false
                    });
                }
                if (sColumnId === "GRBASEDIVIND") { 
                    //Manage button
                    oColumnTemplate = new sap.m.CheckBox({
                        selected: "{" + sColumnId + "}",
                        editable: false
                    });
                }
                if (sColumnId === "DELCOMPLETE") { 
                    //Manage button
                    oColumnTemplate = new sap.m.CheckBox({
                        selected: "{" + sColumnId + "}",
                        editable: false
                    });
                }
    
                return oColumnTemplate;
            },
            columnSize: function(sColumnId){
                var oColumnSize;
                if (sColumnId === "DELETED") { 
                    //Manage button
                    oColumnSize = "Center";
                }
                if (sColumnId === "CLOSED") { 
                    //Manage button
                    oColumnSize = "Center";
                }
                if (sColumnId === "UNLIMITED" || sColumnId === "INVRCPT" || sColumnId === "GRBASEDIV" || sColumnId === "GRIND") { 
                    //Manage button
                    oColumnSize = "Center";
                }
                if (sColumnId === "INVRCPTIND") { 
                    //Manage button
                    oColumnSize = "Center";
                }
                if (sColumnId === "GRBASEDIVIND") { 
                    //Manage button
                    oColumnSize = "Center";
                }
                if (sColumnId === "OVERDELTOL") { 
                    //Manage button
                    oColumnSize = "Center";
                }
                if (sColumnId === "UNDERDELTOL") { 
                    //Manage button
                    oColumnSize = "Center";
                }
                return oColumnSize;
            },

            onExtendMaterial: async function(){
                var _this = this;
                var oModel = this.getOwnerComponent().getModel();
                var matNo = _this.getView().getModel("ui").getProperty("/activeMaterialNo");
                var vSBU = this.byId('cboxSBU').getSelectedKey();


                var onExtendMatData = {};
                var oJSONModel = new JSONModel();
                var extendMatJSONModel = new JSONModel();

                var extendMaterialCheck = [];
                var extendMaterialSet = [];
                var matchedPlant = [];
                var extendMaterialList = [];

                await new Promise((resolve, reject)=>{
                    oModel.read("/ExtendMaterialChkSet",{ 
                        urlParameters: {
                            "$filter": "MATNO eq '" + matNo + "'"
                            // "$filter": "VENDORCD eq '0003101604' and PURCHORG eq '1601' and PURCHGRP eq '601' and SHIPTOPLANT eq 'B601' and PURCHPLANT eq 'C600' and DOCTYP eq 'ZMRP'"
                        },success: async function (oData, oResponse) {
                            extendMaterialCheck = oData.results;
                            resolve();
                        },
                        error: function () {
                            resolve();
                        }
                    });
                });

                await new Promise((resolve, reject)=>{
                    oModel.read("/ExtendMaterialSet",{ 
                        urlParameters: {
                            "$filter": "SBU eq '" + vSBU + "'"
                            // "$filter": "VENDORCD eq '0003101604' and PURCHORG eq '1601' and PURCHGRP eq '601' and SHIPTOPLANT eq 'B601' and PURCHPLANT eq 'C600' and DOCTYP eq 'ZMRP'"
                        },success: async function (oData, oResponse) {
                            extendMaterialSet = oData.results;
                            resolve();
                        },
                        error: function () {
                            resolve();
                        }
                    });
                });
                
                await new Promise((resolve, reject)=>{
                    extendMaterialSet.filter(function (el, index){
                        extendMaterialCheck.forEach(item => {
                            if(el.PLANTCD === item.PLANTCD){
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

                onExtendMatData = {
                    Title: "Extend Material",
                };
                extendMatJSONModel.setData(onExtendMatData);

                _this.onExtendMaterialDialog = sap.ui.xmlfragment(_this.getView().getId(), "zuimatmaster.view.fragments.dialog.MMExtendDialog", _this);
                _this.onExtendMaterialDialog.setModel(extendMatJSONModel);
                _this.getView().addDependent(_this.onExtendMaterialDialog);

                var _promiseResult = new Promise((resolve, reject)=>{
                    resolve(this.getDynamicColumns("MMExtend", "ZDV_MMEXTEND"));
                });
                await _promiseResult;

                _this.onExtendMaterialDialog.open();
            },

            onSaveExtendMaterial: async function(){
                var _this = this;
                var oModel = this.getOwnerComponent().getModel();
                var matModel = this.getOwnerComponent().getModel("ZGW_3DERP_MATERIAL_SRV");
                var matNo = _this.getView().getModel("ui").getProperty("/activeMaterialNo");

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
                    this.showLoadingDialog('Loading...');
                    aSelIndices.forEach(item => {
                        oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                    });
                    aSelIndices = oTmpSelectedIndices;
                    for(var item in aSelIndices){
                        await new Promise((resolve, reject)=>{
                            iCounter++;
                            oModel.read("/ExtendMaterialVldMatChkSet",{ 
                                urlParameters: {
                                    "$filter": "MATNO eq '" + matNo + "'"
                                    // "$filter": "VENDORCD eq '0003101604' and PURCHORG eq '1601' and PURCHGRP eq '601' and SHIPTOPLANT eq 'B601' and PURCHPLANT eq 'C600' and DOCTYP eq 'ZMRP'"
                                },success: async function (oData, oResponse) {
                                    if(oData.results.length > 0){
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
                        if(isValid){
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

                            if(oParamData.length > 0){
                                await new Promise((resolve, reject)=>{
                                    matModel.create("/MatExtendSet", oParam, {
                                        method: "POST",
                                        success: function(oData, oResponse){
                                            // if(oData.N_Messtab.results[0].Message !== undefined || oData.N_Messtab.results[0].Message !== "" || oData.N_Messtab.results[0].Message !== null){
                                            if(oData.N_Messtab.results[0].Type === "S"){
                                                MessageBox.information(oData.N_Messtab.results[0].Message);
                                            }
                                            // }
                                            else if(oData.N_Messtab.results[0].Type === "E"){
                                                MessageBox.error(Object.values(oData.N_Messtab.results).pop().Message);
                                            }
                                            resolve();
                                        },error: function(error){
                                            
                                            resolve();
                                        }
                                    });
                                })
                            }else{
                                MessageBox.error("No valid Purchasing Plant found.");
                            }

                        }
                    }
                    
                    _this.closeLoadingDialog();
                    this.onExtendMaterialDialog.destroy(true);
                    this.getPlant(matNo);
                }else{
                    MessageBox.warning("No Selected Record!");
                }

            },

            onCancelExtendMM: async function(){
                this.onExtendMaterialDialog.destroy(true);
            },

            //End of Extend Material Adjustment

            onRefreshPlant(){
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;
                this.getPlant(mmNo)
            },
            onColumnProp: function(oEvent) {
                var aColumns = [];
                var oTable = oEvent.getSource().oParent.oParent;
                
                oTable.getColumns().forEach(col => {
                    aColumns.push({
                        name: col.getProperty("sortProperty"), 
                        label: col.getLabel().getText(),
                        position: col.getIndex(), 
                        selected: col.getProperty("visible")
                    });
                })

                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.ColumnDialog"];
                oDialog.getModel().setProperty("/table", oTable.getBindingInfo("rows").model);
                oDialog.getModel().setProperty("/items", aColumns);
                oDialog.getModel().setProperty("/rowCount", aColumns.length);
                oDialog.open();
            },
            beforeOpenColProp: function(oEvent) {
                oEvent.getSource().getModel().getData().items.forEach(item => {
                    if (item.selected) {
                        oEvent.getSource().getContent()[0].addSelectionInterval(item.position, item.position);
                    }
                    else {
                        oEvent.getSource().getContent()[0].removeSelectionInterval(item.position, item.position);
                    }
                })
            },
            onColumnPropConfirm: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.ColumnDialog"];
                var oDialogTable = oDialog.getContent()[0];
                var aSelRows = oDialogTable.getSelectedIndices();

                if (aSelRows.length === 0) {
                    MessageBox.information("Please select at least one visible column.");
                }
                else {
                    oDialog.close();
                    var sTable = oDialog.getModel().getData().table;
                    var oTable = this.byId(sTable + "Tab");
                    var oColumns = oTable.getColumns();

                    oColumns.forEach(col => {
                        if (aSelRows.filter(item => item === col.getIndex()).length === 0) {
                            col.setVisible(false);
                        }
                        else col.setVisible(true);
                    })
                }
            },
            onColumnPropCancel: function(oEvent) {
                this._oViewSettingsDialog["zuimatmaster.view.ColumnDialog"].close();
            },
            onSorted: function(oEvent) {
                var sColumnName = oEvent.getParameters().column.getProperty("sortProperty");
                var sSortOrder = oEvent.getParameters().sortOrder;
                var bMultiSort = oEvent.getParameters().columnAdded;
                var oSortData = this._aSortableColumns[oEvent.getSource().getBindingInfo("rows").model];

                if (!bMultiSort) {
                    oSortData.forEach(item => {
                        if (item.name === sColumnName) {
                            item.sorted = true;
                            item.sortOrder = sSortOrder;
                        }
                        else {
                            item.sorted = false;
                        } 
                    })
                }
            },
            onColSort: function(oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;               
                var aSortableColumns = this._aSortableColumns[oTable.getBindingInfo("rows").model];
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.SortDialog"];
                oDialog.getModel().setProperty("/table", oTable.getBindingInfo("rows").model);
                oDialog.getModel().setProperty("/items", aSortableColumns);
                oDialog.getModel().setProperty("/rowCount", aSortableColumns.length);
                oDialog.open();
            },
            beforeOpenColSort: function(oEvent) {
                oEvent.getSource().getContent()[0].removeSelectionInterval(0, oEvent.getSource().getModel().getData().items.length - 1);
                oEvent.getSource().getModel().getData().items.forEach(item => {
                    if (item.sorted) {                       
                        oEvent.getSource().getContent()[0].addSelectionInterval(item.position, item.position);
                    }
                })
            },
            onColSortConfirm: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.SortDialog"];
                oDialog.close();

                var sTable = oDialog.getModel().getData().table;
                var oTable = this.byId(sTable + "Tab");
                var oDialogData = oDialog.getModel().getData().items;
                var oDialogTable = oDialog.getContent()[0];
                var aSortSelRows = oDialogTable.getSelectedIndices();

                oDialogData.forEach(item => item.sorted = false);

                if (aSortSelRows.length > 0) {
                    oDialogData.forEach((item, idx) => {
                        if (aSortSelRows.filter(si => si === idx).length > 0) {
                            var oColumn = oTable.getColumns().filter(col => col.getProperty("sortProperty") === item.name)[0];
                            oTable.sort(oColumn, item.sortOrder === "Ascending" ? SortOrder.Ascending : SortOrder.Descending, true);
                            item.sorted = true;
                        }
                    })
                }

                this._aSortableColumns[sTable] = oDialogData;
            },
            onColSortCancel: function(oEvent) {
                this._oViewSettingsDialog["zuimatmaster.view.SortDialog"].close();
            },
            onColFilter: function(oEvent) {
                var oTable = oEvent.getSource().oParent.oParent               
                var aFilterableColumns = this._aFilterableColumns[oTable.getBindingInfo("rows").model];
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.FilterDialog"];
                oDialog.getModel().setProperty("/table", oTable.getBindingInfo("rows").model);
                oDialog.getModel().setProperty("/items", aFilterableColumns);
                oDialog.getModel().setProperty("/rowCount", aFilterableColumns.length);
                oDialog.open();
            },
            onColFilterConfirm: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.FilterDialog"];
                oDialog.close();

                var bFilter = false;
                var aFilter = [];
                var oFilter = null;
                var sTable = oDialog.getModel().getData().table;
                var oDialogData = oDialog.getModel().getData().items;
                oDialogData.forEach(item => {
                    if (item.value !== "") {
                        bFilter = true;
                        aFilter.push(new Filter(item.name, this.getConnector(item.connector), item.value))
                    }
                })
                
                if (bFilter) {
                    oFilter = new Filter(aFilter, true);
                    this.getView().byId("btnFilterMM").addStyleClass("activeFiltering");
                }
                else {
                    oFilter = "";
                    this.getView().byId("btnFilterMM").removeStyleClass("activeFiltering");
                }

                this.byId(sTable + "Tab").getBinding("rows").filter(oFilter, "Application");
                this._aFilterableColumns[sTable] = oDialogData;

                
            },
            onColFilterCancel: function(oEvent) {
                this._oViewSettingsDialog["zuimatmaster.view.FilterDialog"].close();
            },
            onCellClickMM: function(oEvent) {
                var vMaterial = oEvent.getParameters().rowBindingContext.getObject().Materialno;
                this.getView().getModel("ui").setProperty("/activeMaterialNo", vMaterial);
                this.getAttributes(vMaterial);
                this.getBatch(vMaterial);
                this.getCustomInfo(vMaterial);
                this.getPlant(vMaterial);
            },
            filterGlobally: function(oEvent) {
                var oTable = oEvent.getSource().oParent.oParent;
                var sTable = oTable.getBindingInfo("rows").model;
                var sQuery = oEvent.getParameter("query");

                if (sTable === "matMaster") {
                    this.byId("searchFieldAttr").setProperty("value", "");
                }

                this.exeGlobalSearch(sQuery, sTable);
            },
            createViewSettingsDialog: function (arg1, arg2) {
                var sDialogFragmentName = null;

                if (arg1 === "sort") sDialogFragmentName = "zuimatmaster.view.SortDialog";
                else if (arg1 === "filter") sDialogFragmentName = "zuimatmaster.view.FilterDialog";
                else if (arg1 === "column") sDialogFragmentName = "zuimatmaster.view.ColumnDialog";
                else if (arg1 === "matTypeClass") sDialogFragmentName = "zuimatmaster.view.MaterialTypeClassDialog";

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
                else{
                    oViewSettingsDialog.setModel(arg2);
                }
            },
            getConnector(args) {
                var oConnector;

                switch (args) {
                    case "EQ":
                        oConnector = sap.ui.model.FilterOperator.EQ
                        break;
                      case "Contains":
                        oConnector = sap.ui.model.FilterOperator.Contains
                        break;
                      default:
                        // code block
                        break;
                }

                return oConnector;
            },
            handleValueHelp: function(oEvent) {
                var oModel = this.getOwnerComponent().getModel();
                var oSource = oEvent.getSource();
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                var _this = this;
                var vSBU = this.byId('cboxSBU').getSelectedKey();

                this._inputId = oSource.getId();
                this._inputValue = oSource.getValue();
                this._inputSource = oSource;
                this._inputField = oSource.getBindingInfo("value").parts[0].path;
                var aNewRows = this.getView().getModel("matMaster").getData().results.filter(item => item.New === true);
                
                if (sModel === 'mattTypClassModel') {
                    this._inputSourceCtx = oEvent.getSource().getBindingContext("mtClassModel");
                    var _mattypcls = this._inputSourceCtx.getModel().getProperty(this._inputSourceCtx.getPath() + '/Mattypcls');
                    //alert("Mattyp eq '" + aNewRows[0].Materialtype + "' and Mattypcls eq '" + _mattypcls + "'");
                    oModel.read('/MatTypeAttribSet', {
                        urlParameters: {
                            //"$filter": "Mattyp eq '" + aNewRows[0].Materialtype + "' and Mattypcls eq 'ZFABC'"
                            "$filter": "Mattyp eq '" + aNewRows[0].Materialtype + "' and Mattypcls eq '" + _mattypcls + "'"
                        },
                        success: function (data, response) {
                            data.results.forEach(item => {
                                item.VHTitle = item.Attribcd;
                                item.VHDesc = item.Shorttext;
                                item.VHDesc2 = item.Shorttext2;
                                item.VHSelected = (item.Attribcd === _this._inputValue);
                            });

                            data.results.sort((a,b) => (a.VHTitle > b.VHTitle ? 1 : -1));

                            if (!_this._valueHelpDialog) {
                                _this._valueHelpDialog = sap.ui.xmlfragment(
                                    "zuimatmaster.view.ValueHelpDialog",
                                    _this
                                ).setProperty("title", "Select Attribute");
                            
                                _this._valueHelpDialog.setModel(
                                    new JSONModel({
                                        items: data.results,
                                        title: "Attribute"
                                    })
                                )
                                _this.getView().addDependent(_this._valueHelpDialog);
                            }
                            else {
                                _this._valueHelpDialog.setModel(
                                    new JSONModel({
                                        items: data.results,
                                        title: "Attribute"
                                    })
                                )
                            }

                            _this._valueHelpDialog.open();   
                        }
                    });
                }
                else {
                    var vCellPath = this._inputField;
                    var vColProp = this._aColumns[sModel].filter(item => item.name === vCellPath);
                    var vItemValue = vColProp[0].valueHelp.items.value;
                    var vItemDesc = vColProp[0].valueHelp.items.text;
                    var sEntity = vColProp[0].valueHelp.items.path;
                    var oTable = this.byId("matMasterTab");
                    var oJSONModel = new JSONModel();
                    this._inputSourceCtx = oEvent.getSource().getBindingContext(sModel);
                    if (sEntity === '/GMCRscSet'){
                        this.dialogEntity=sEntity;
                        this.getView().getModel("matMaster").getData().results.filter(item => item.New === true).forEach(item => {
                            oModel.read(sEntity, {
                                urlParameters: {
                                    "$filter": "Mattyp eq '"  + item.Materialtype + "' and Sbu eq '" + vSBU +"'"
                                },
                                success: function (data, response) {
                                    data.results.forEach(item => {
                                        item.VHTitle = item[vItemValue];
                                        item.VHDesc = item[vItemDesc];
                                        item.VHSelected = (item[vItemValue] === _this._inputValue);
                                    });
                                    
                                    var oVHModel = new JSONModel({
                                        items: data.results,
                                        title: vColProp[0].label,
                                        table: sModel
                                    });    
                                    
                                    oTable.getColumns().forEach((col, idx) => {
                                        if(col.getLabel().getText().toUpperCase()==="GMC"){
                                            oJSONModel.setData(data);
                                            _this.getView().setModel(oJSONModel, "gmcField");
                                            oTable.getRows()[0].getCells()[idx].bindAggregation("suggestionItems",{
                                                path: "gmcField>/results",
                                                length: 1000,
                                                template: new sap.ui.core.ListItem({
                                                    text: "{gmcField>Gmc}",
                                                    key: "{gmcField>Gmc}",
                                                    additionalText:"{gmcField>Descen}"
                                                })
                                            });
                                        }    
                                    });

                                    // create value help dialog
                                    if (!_this._valueHelpDialog) {
                                        _this._valueHelpDialog = sap.ui.xmlfragment(
                                            "zuimatmaster.view.ValueHelpDialog",
                                            _this
                                        );
                                        _this._valueHelpDialog.setModel(oVHModel);
                                        _this.getView().addDependent(_this._valueHelpDialog);
                                    }
                                    else {
                                        _this._valueHelpDialog.setModel(oVHModel);
                                    }                            
        
                                    _this._valueHelpDialog.open();
                                },
                                error: function (err) { }
                            })
                        });
                    }
                    else{
                        this.dialogEntity=sEntity;
                        oModel.read(sEntity, {
                            success: function (data, response) {
                                data.results.forEach(item => {
                                    item.VHTitle = item[vItemValue];
                                    item.VHDesc = item[vItemDesc];
                                    item.VHSelected = (item[vItemValue] === _this._inputValue);
                                });
                                
                                var oVHModel = new JSONModel({
                                    items: data.results,
                                    title: vColProp[0].label,
                                    table: sModel
                                });                            
    
                                // create value help dialog
                                if (!_this._valueHelpDialog) {
                                    _this._valueHelpDialog = sap.ui.xmlfragment(
                                        "zuimatmaster.view.ValueHelpDialog",
                                        _this
                                    );
                                    _this._valueHelpDialog.setModel(oVHModel);
                                    _this.getView().addDependent(_this._valueHelpDialog);
                                }
                                else {
                                    _this._valueHelpDialog.setModel(oVHModel);
                                }                            
    
                                _this._valueHelpDialog.open();
                            },
                            error: function (err) { }
                        })
                    }
                }
            },
            handleValueHelpSearch : function (oEvent) {
                var sValue = oEvent.getParameter("value");

                var oFilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("VHTitle", sap.ui.model.FilterOperator.Contains, sValue),
                        new sap.ui.model.Filter("VHDesc", sap.ui.model.FilterOperator.Contains, sValue)
                    ],
                    and: false
                });

                oEvent.getSource().getBinding("items").filter([oFilter]);
            },
            handleValueHelpClose : function (oEvent) {
                var aNewRows = this.getView().getModel("matMaster").getData().results.filter(item => item.New === true);
                if (oEvent.sId === "confirm") {
                    var oSelectedItem = oEvent.getParameter("selectedItem");
                    var sTable = this._valueHelpDialog.getModel().getData().table;
                    var oModel = this._inputSourceCtx.getModel();
                    if (oSelectedItem) {
                        this._inputSource.setValue(oSelectedItem.getTitle());
                        if (sTable === 'matMaster') this._isMMEdited = true;
                        if(this._inputId.indexOf("iptAttribcd")>=0){
                            this._valueHelpDialog.getModel().getData().items.filter(item => item.VHTitle === oSelectedItem.getTitle())
                                .forEach(item => {
                                    var oModel = this._inputSourceCtx.getModel();
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Attribcd', item.VHTitle);
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Descen', item.VHDesc);
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Desczh', item.VHDesc2);
                                })
                        }
                        if(this.dialogEntity==="/MatTypeSHSet"){
                            this._valueHelpDialog.getModel().getData().items.filter(item => item.VHTitle === oSelectedItem.getTitle())
                            .forEach(item => {
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Hasgmc', item.Hasgmc === "X" ? true : false); 
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Gmc', ""); 
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Materialgroup', ""); 
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Baseuom', "");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Grosswt', "0.000");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Netwt', "0.000");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Wtuom', "");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Volume', "0.000");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Volumeuom', "");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Custmatcode', "");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Processcode', "");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Uebto', "");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Untto', "");
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Uebtk', false);

                                if(aNewRows[0].Hasgmc){
                                    var oTable = this.byId("matMasterTab");
                                    oTable.getColumns().forEach((col, idx) => {
                                        //console.log(col.getLabel().getText().toUpperCase());
                                        switch(col.getLabel().getText().toUpperCase()) { 
                                            case 'MATERIAL GROUP':
                                            case 'GROSS WEIGHT':
                                            case 'NET WEIGHT':
                                            case 'WEIGHT UOM':
                                            case 'VOLUME':
                                            case 'VOLUME UOM':
                                            case 'CUSTOMER MATERIAL':
                                            case 'PROCESS CODE':
                                            case 'ORDER UNIT':
                                            case 'BASE UOM':
                                            case 'GROSS WEIGHT': { 
                                                oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                               break; 
                                            } 
                                            case 'GMC': { 
                                                oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                               break; 
                                            } 
                                        }
                                        /*if(col.getLabel().getText().toUpperCase() ==="GMC"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                        }
                                        if(col.getLabel().getText().toUpperCase() ==="MATERIAL GROUP"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                        }
                                        if(col.getLabel().getText().toUpperCase() ==="BASE UOM"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                        }*/
                                    })
                                }
                                else{
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Processcode', item.Processcd);
                                    var oTable = this.byId("matMasterTab");
                                    oTable.getColumns().forEach((col, idx) => {
                                        switch(col.getLabel().getText().toUpperCase()) { 
                                            case 'MATERIAL GROUP':
                                            case 'GROSS WEIGHT':
                                            case 'NET WEIGHT':
                                            case 'WEIGHT UOM':
                                            case 'VOLUME':
                                            case 'VOLUME UOM':
                                            case 'CUSTOMER MATERIAL':
                                            case 'PROCESS CODE':
                                            case 'ORDER UNIT':
                                            case 'BASE UOM':
                                            case 'GROSS WEIGHT': { 
                                                oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                               break; 
                                            } 
                                            case 'GMC': { 
                                                oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                               break; 
                                            } 
                                        } 
                                        /*if(col.getLabel().getText().toUpperCase() ==="GMC"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                        }
                                        if(col.getLabel().getText().toUpperCase() ==="MATERIAL GROUP"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                        }
                                        if(col.getLabel().getText().toUpperCase() ==="BASE UOM"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                        }*/
                                    })
                                }
                            })
                        }
                        else if(this.dialogEntity==="/GMCRscSet"){
                        //else if(this._inputId.indexOf("iptGmc")>=0){
                            this._valueHelpDialog.getModel().getData().items.filter(item => item.VHTitle === oSelectedItem.getTitle())
                            .forEach(item => {
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Materialgroup', item.Matgrpcd);
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Baseuom', item.Baseuom);
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Grosswt', item.Grswt);
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Netwt', item.Netwt);
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Wtuom', item.Wtuom);
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Volume', item.Volume);
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Volumeuom', item.Voluom);
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Custmatcode', item.Cusmatcd);
                                if(aNewRows[0].Hasgmc){
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Processcode', item.Processcd);
                                }
                            });
                        }
                        else if(this.dialogEntity==="/PurValKeyRscSet"){
                        //else if(this._inputId.indexOf("iptPurchvaluekey")>=0){
                            this._valueHelpDialog.getModel().getData().items.filter(item => item.VHTitle === oSelectedItem.getTitle())
                            .forEach(item => {
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Uebto', item.Uebto);
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Untto', item.Untto);
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Uebtk', item.Uebtk === "X" ? true : false);
                            });
                        }
                        else {
                            var sRowPath = this._inputSource.getBindingInfo("value").binding.oContext.sPath;
                            if (this._inputValue !== oSelectedItem.getTitle()) {
                                this.getView().getModel(sTable).setProperty(sRowPath + '/Edited', true);
                                if (sTable === 'matMaster') this._isMMEdited = true;
                            }
                        }
                    }

                    this._inputSource.setValueState("None");
                }
                else if (oEvent.sId === "cancel") {
                    // console.log(oEvent.getSource().getBinding("items"));
                    // var source = oEvent.getSource().getBinding("items").oList;
                    // var data = source.filter(item => item.VHSelected === true);
                    // var value = "";

                    // if (data.length > 0) {
                    //     value = data[0].VHTitle;
                    // }

                    // this._inputSource.setValue(value);

                    // if (this._inputValue !== value) {
                    //     var data = this.byId("headerTable").getBinding("items").oList;                           
                    //     data.filter(item => item[this.inputField] === oSelectedItem.getTitle()).forEach(e => e.Edited = true);
                    // }
                }
            },
            onCreateMMCancel: function(oEvent) {
                this._cancelMMCreate = true;
                if (this.getView().getModel("ui").getData().dataMode === 'NEW') this.setFilterAfterCreate();
                if (!this._DiscardChangesDialog) {
                    this._DiscardChangesDialog = sap.ui.xmlfragment("zuimatmaster.view.DiscardChangesDialog", this);
                    this.getView().addDependent(this._DiscardChangesDialog);
                }
                
                this._DiscardChangesDialog.open();
                //this._oViewSettingsDialog["zuimatmaster.view.MaterialTypeClassDialog"].close();
            },
            onCloseDiscardChangesDialog() {
                if (this._cancelMM) {
                    this.byId("cboxSBU").setEnabled(true);
                    this.byId("btnAddMM").setVisible(true);
                    this.byId("btnEditMM").setVisible(true);
                    this.byId("btnSaveMM").setVisible(false);
                    this.byId("btnCancelMM").setVisible(false);
                    this.byId("btnDeleteMM").setVisible(true);
                    this.byId("btnRefreshMM").setVisible(true);
                    this.byId("btnSortMM").setVisible(true);
                    this.byId("btnFilterMM").setVisible(true);
                    this.byId("btnFullScreenHdr").setVisible(true);
                    this.byId("btnColPropMM").setVisible(true);
                    // this.byId("searchFieldMM").setVisible(true);
                    this.onTableResize("Hdr","Min");
                    this.setRowReadMode("matMaster");
                    this.getView().getModel("matMaster").setProperty("/", this._oDataBeforeChange);
                    this.getView().getModel("ui").setProperty("/dataMode", 'READ');
                    this._isMMEdited = false;
                }
                else if (this._cancelAttr) {
                    this.byId("btnEditAttr").setVisible(true);
                    this.byId("btnSaveAttr").setVisible(false);
                    this.byId("btnCancelAttr").setVisible(false);
                    this.byId("btnRefreshAttr").setVisible(true);
                    this.byId("btnSortAttr").setVisible(true);
                    this.byId("btnFilterAttr").setVisible(true);
                    this.byId("btnFullScreenHdr").setVisible(true);
                    this.byId("btnColPropAttr").setVisible(true);
                    // this.byId("searchFieldAttr").setVisible(true);
                    this.onTableResize("Attr","Min");
    
                    this.setRowReadMode("attributes");
                    this.getView().getModel("attributes").setProperty("/", this._oDataBeforeChange);
    
                    var oIconTabBar = this.byId("itbDetail");
                    oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
                    this.getView().getModel("ui").setProperty("/dataMode", 'READ');
                    this._isAttrEdited = false;
                }
                else if (this._cancelMMCreate) {
                    if (this.getView().getModel("ui").getData().dataMode === 'NEW') this.setFilterAfterCreate();
                    this._oViewSettingsDialog["zuimatmaster.view.MaterialTypeClassDialog"].close();

                    this.byId("cboxSBU").setEnabled(true);
                    this.byId("btnAddMM").setVisible(true);
                    this.byId("btnEditMM").setVisible(true);
                    this.byId("btnSaveMM").setVisible(false);
                    this.byId("btnCancelMM").setVisible(false);
                    this.byId("btnDeleteMM").setVisible(true);
                    this.byId("btnRefreshMM").setVisible(true);
                    this.byId("btnSortMM").setVisible(true);
                    this.byId("btnFilterMM").setVisible(true);
                    this.byId("btnFullScreenHdr").setVisible(true);
                    this.byId("btnColPropMM").setVisible(true);
                    // this.byId("searchFieldMM").setVisible(true);
                    this.onTableResize("Hdr","Min");
                    this.setRowReadMode("matMaster");
                    this.getView().getModel("matMaster").setProperty("/", this._oDataBeforeChange);
                    this.getView().getModel("ui").setProperty("/dataMode", 'READ');
                    this._isMMEdited = false;
                }

                this._DiscardChangesDialog.close();
            },
            setReqColHdrColor(arg) {
                var oTable = this.byId(arg + "Tab");

                oTable.getColumns().forEach((col, idx) => {
                    this._aColumns[arg].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (ci.required) {
                                col.getLabel().removeStyleClass("requiredField");
                            }
                        })
                })
            },
            resetVisibleCols(arg) {
                var aData = this.getView().getModel(arg).getData().results;

                this._oDataBeforeChange.results.forEach((item, idx) => {
                    if (item.Deleted) {
                        aData.splice(idx, 0, item)
                    }
                })

                this.getView().getModel(arg).setProperty("/results", aData);
            },
            onColSortCellClick: function (oEvent) {
                this._oViewSettingsDialog["zuimatmaster.view.SortDialog"].getModel().setProperty("/activeRow", (oEvent.getParameters().rowIndex));
            },
            onColSortSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.SortDialog"];               
                oDialog.getContent()[0].addSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },
            onColSortDeSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.SortDialog"];               
                oDialog.getContent()[0].removeSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },
            onColSortRowFirst: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = this._oViewSettingsDialog["zuimatmaster.view.SortDialog"].getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow)
                    .forEach(item => item.position = 0);
                oDialogData.filter((item, index) => index !== iActiveRow)
                    .forEach((item, index) => item.position = index + 1);
                oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow - 1);
            },
            onColSortRowUp: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = oDialog.getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow).forEach(item => item.position = iActiveRow - 1);
                oDialogData.filter((item, index) => index === iActiveRow - 1).forEach(item => item.position = item.position + 1);
                oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow - 1);
            },
            onColSortRowDown: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = oDialog.getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow).forEach(item => item.position = iActiveRow + 1);
                oDialogData.filter((item, index) => index === iActiveRow + 1).forEach(item => item.position = item.position - 1);
                oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow + 1);
            },
            onColSortRowLast: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.SortDialog"];
                var iActiveRow = oDialog.getModel().getData().activeRow;

                var oDialogData = oDialog.getModel().getData().items;
                oDialogData.filter((item, index) => index === iActiveRow)
                    .forEach(item => item.position = oDialogData.length - 1);
                    oDialogData.filter((item, index) => index !== iActiveRow)
                    .forEach((item, index) => item.position = index);
                    oDialogData.sort((a,b) => (a.position > b.position ? 1 : -1));

                oDialog.getModel().setProperty("/items", oDialogData);
                oDialog.getModel().setProperty("/activeRow", iActiveRow - 1);
            },
            onColPropSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.ColumnDialog"];               
                oDialog.getContent()[0].addSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },
            onColPropDeSelectAll: function(oEvent) {
                var oDialog = this._oViewSettingsDialog["zuimatmaster.view.ColumnDialog"];               
                oDialog.getContent()[0].removeSelectionInterval(0, oDialog.getModel().getData().rowCount - 1);
            },
            onSelectTab: function(oEvent) {
                var oSource = oEvent.getSource();
                // console.log(oEvent.getSource())
                // console.log(oEvent.getSource().getItems())
                // console.log(oEvent.getSource().getSelectedKey())
            },
            onAfterRendering() {
                this.getView().byId("matMasterTab").attachBrowserEvent("keydown", function(oEvent) {
                    // console.log("table is click");
                    // console.log(oEvent);

                    // console.log(oEvent.target.querySelectorAll('.sapUiTableTr'));
                    
                });
            },
            onKeyUp(oEvent) {
                var _dataMode = this.getView().getModel("ui").getData().dataMode;
                _dataMode = _dataMode === undefined ? "READ": _dataMode;

                if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows" && _dataMode === "READ") {
                    console.log("onKeyup");
                    console.log(this.byId(oEvent.srcControl.sId));
                    var sRowPath = this.byId(oEvent.srcControl.sId).oBindingContexts["matMaster"].sPath;
                    var oRow = this.getView().getModel("matMaster").getProperty(sRowPath);
                    this.getView().getModel("ui").setProperty("/activeMaterialNo", oRow.Materialno);

                    this.getAttributes(oRow.Materialno);
                    this.getBatch(oRow.Materialno);
                    this.getCustomInfo(oRow.Materialno);
                    this.getPlant(oRow.Materialno);
                }
            },
            onNavBack: function(oEvent) {
                //alert("BACK");
            }
         });
    });
