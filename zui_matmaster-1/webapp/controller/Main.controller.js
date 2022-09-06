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
        // shortcut for sap.ui.table.SortOrder
        var SortOrder = library.SortOrder;
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });

        return Controller.extend("zuimatmaster.controller.Main", {
            onInit: function () {
                var oModel = this.getOwnerComponent().getModel();
                var _this = this;
                this.validationErrors = [];

                oModel.read('/MaterialSet', {
                    success: function (data, response) {
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
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);

                        _this.getView().setModel(new JSONModel({
                            activeMaterialNo: data.results[0].Materialno
                        }), "ui");
                        
                        _this.getView().setModel(oJSONModel, "matMaster");

                        _this.getAttributes(data.results[0].Materialno);
                        _this.getBatch(data.results[0].Materialno);
                        _this.getCustomInfo(data.results[0].Materialno);
                        _this.getPlant(data.results[0].Materialno);
                    },
                    error: function (err) { }
                })
                this._oGlobalMMFilter = null;
                this._oSortDialog = null;
                this._oFilterDialog = null;
                this._oViewSettingsDialog = {};

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
            },
            getAttributes() {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/MaterialAtrribSet";
                var _this = this;
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "Matno eq '" + mmNo + "'"
                    },
                    success: function (data, response) {
                        data.results.forEach((item, index) => {
                            if (item.Createddt !== null)
                                item.Createddt = dateFormat.format(item.Createddt);

                            if (item.Updateddt !== null)
                                item.Updateddt = dateFormat.format(item.Updateddt);
                        })
                        // console.log(response)
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "attributes");
                    },
                    error: function (err) { }
                })
            },
            getBatch() {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/MaterialBatchSet";
                var _this = this;
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "Matno eq '" + mmNo + "'"
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
            getCustomInfo() {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/MaterialCusInfoSet";
                var _this = this;
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "Matno eq '" + mmNo + "'"
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
            getPlant() {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/PlantSet";
                var _this = this;
                var mmNo = this.getView().getModel("ui").getData().activeMaterialNo;

                oModel.read(oEntitySet, {
                    urlParameters: {
                        "$filter": "Matnr eq '" + mmNo + "'"
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
                        this.byId("fixFlexMM").setProperty("fixContentSize", "99%");
                        this.byId("btnFullScreenHdr").setVisible(false);
                        this.byId("btnExitFullScreenHdr").setVisible(true);
                    }
                    else {
                        this.byId("fixFlexMM").setProperty("fixContentSize", "50%");
                        this.byId("btnFullScreenHdr").setVisible(true);
                        this.byId("btnExitFullScreenHdr").setVisible(false);
                    }
                }
                else {
                    if (arg2 === "Max") {
                        this.byId("fixFlexMM").setProperty("fixContentSize", "0%");
                        this.byId("btnFullScreenAttr").setVisible(false);
                        this.byId("btnExitFullScreenAttr").setVisible(true);
                        this.byId("btnFullScreenMatl").setVisible(false);
                        this.byId("btnExitFullScreenMatl").setVisible(true);
                    }
                    else {
                        this.byId("fixFlexMM").setProperty("fixContentSize", "50%");
                        this.byId("btnFullScreenAttr").setVisible(true);
                        this.byId("btnExitFullScreenAttr").setVisible(false);
                        this.byId("btnFullScreenMatl").setVisible(true);
                        this.byId("btnExitFullScreenMatl").setVisible(false);
                    }                    
                }
            },
            onEditMM(){
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
                
                var aNewRow = [];
                var oNewRow = {};
                var oTable = this.byId("matMasterTab");                
                
                /*var oTable = this.byId("matMasterTab");
                oTable.getColumns().forEach((col, idx) => {
                    if(col.getLabel().getText().toUpperCase() ==="GMC"){
                        oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                    }
                    if(col.getLabel().getText().toUpperCase() ==="MATERIAL GROUP"){
                        oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                    }
                    if(col.getLabel().getText().toUpperCase() ==="BASE UNIT"){
                        oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                    }
                })*/


                oTable.getColumns().forEach((col, idx) => {
                    this._aColumns["matMaster"].filter(item => item.label === col.getLabel().getText())
                        .forEach(ci => {
                            if (!ci.hideOnChange && ci.creatable) {
                                col.setTemplate();
                                if (ci.type === "Edm.Boolean") {
                                    col.setTemplate(new sap.m.CheckBox({selected: "{matMaster>" + ci.name + "}", editable: true}));
                                }
                                else if (ci.valueHelp["show"]) {
                                    col.setTemplate(new sap.m.Input({
                                        //id: "ipt" + ci.name,
                                        type: "Text",
                                        value: "{matMaster>" + ci.name + "}",
                                        maxLength: +ci.maxLength,
                                        showValueHelp: true,
                                        valueHelpRequest: this.handleValueHelp.bind(this),
                                        showSuggestion: true,
                                        suggestionItems: {
                                            path: ci.valueHelp["suggestionItems"].path,
                                            length: 1000,
                                            template: new sap.ui.core.Item({
                                                key: ci.valueHelp["suggestionItems"].text,
                                                text: ci.valueHelp["suggestionItems"].text
                                            }),
                                            templateShareable: false
                                        },
                                        change: this.onValueHelpLiveInputChange.bind(this)
                                    }));
                                }
                                else if (ci.type === "Edm.Decimal" || ci.type === "Edm.Double" || ci.type === "Edm.Float" || ci.type === "Edm.Int16" || ci.type === "Edm.Int32" || ci.type === "Edm.Int64" || ci.type === "Edm.SByte" || ci.type === "Edm.Single") {
                                    col.setTemplate(new sap.m.Input({
                                        type: sap.m.InputType.Number,
                                        textAlign: sap.ui.core.TextAlign.Right,
                                        value: "{path:'{matMaster>" + ci.name + "}', type:'sap.ui.model.odata.type.Decimal', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
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
                            else if (ci.type === "Edm.Decimal") oNewRow[ci.name] = 0;
                            else if (ci.type === "Edm.Boolean") oNewRow[ci.name] = false;
                        })
                }) 
                oNewRow["New"] = true;
                aNewRow.push(oNewRow);
                //console.log(aNewRow);
                this.getView().getModel("matMaster").setProperty("/results", aNewRow);
                this.getView().getModel("ui").setProperty("/dataMode", 'NEW');
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
                                        suggestionItems: {
                                            path: ci.valueHelp["items"].path, //ci.valueHelp.model + ">/items", //ci.valueHelp["suggestionItems"].path,
                                            length: 1000,
                                            template: new sap.ui.core.Item({
                                                key: "{" + ci.valueHelp["items"].value + "}", //"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}",
                                                text: "{" + ci.valueHelp["items"].value + "}" //"{" + ci.valueHelp.model + ">" + ci.valueHelp["items"].value + "}", //ci.valueHelp["suggestionItems"].text
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

                if (!oSource.getSelectedKey()) {
                    oSource.getSuggestionItems().forEach(item => {
                        // console.log(item.getProperty("key"), oSource.getValue().trim())
                        if (item.getProperty("key") === oSource.getValue().trim()) {
                            isInvalid = false;
                            oSource.setValueState(isInvalid ? "Error" : "None");
                        }
                    })
                }

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
                console.log(sRowPath)
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
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
            },
            onCancelMM() {
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
                this.byId("searchFieldMM").setVisible(true);
                this.onTableResize("Hdr","Min");
                this.setRowReadMode("matMaster");
                this.getView().getModel("matMaster").setProperty("/", this._oDataBeforeChange);
                this.getView().getModel("ui").setProperty("/dataMode", 'READ');
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
                this.byId("searchFieldCustomInfo").setVisible(true);
                this.onTableResize("Hdr","Min");
                this.setRowReadMode("customInfo");
                this.getView().getModel("customInfo").setProperty("/", this._oDataBeforeChange);
                this.getView().getModel("ui").setProperty("/dataMode", 'READ');
            },
            onSave(arg) {
                var aNewRows = this.getView().getModel(arg).getData().results.filter(item => item.New === true);
                var aEditedRows = this.getView().getModel(arg).getData().results.filter(item => item.Edited === true);
                if (this.validationErrors.length === 0)
                {
                    if (aNewRows.length > 0) {
                        if (aNewRows[0].Materialtype === '' || (aNewRows[0].Hasgmc===true && aNewRows[0].Gmc === '') || aNewRows[0].Materialgroup === '' || aNewRows[0].Baseuom === '') {
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
                                }
                            })

                            var oModel1 = this.getOwnerComponent().getModel();
                            var oJSONModel1 = new JSONModel();

                            oModel1.read('/MatPlantSet', {
                                urlParameters: {
                                    "$filter": "Sbu eq 'VER'"
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
                        "Mrp_type":this.getView().getModel("mrpTypeClass").getData().results[0].Dismm,
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
                        "Cusmatno": "",
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
                    console.log(_param);
                    
                    var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_MATERIAL_SRV");
                    console.log(oModel);
                    oModel.create("/MaterialHdrSet", _param, {
                        method: "POST",
                        success: function(res, oResponse) {
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
                        this.byId("searchFieldMM").setVisible(true);
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
            },
            onDeleteMM() {
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
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });
                var _this = this;
                
                if(this.getView().byId("searchFieldMM").getValue()===""){
                    oModel.read('/MaterialSet', {
                        success: function (data, response) {
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
                            var oJSONModel = new sap.ui.model.json.JSONModel();
                            oJSONModel.setData(data);
    
                            _this.getView().setModel(new JSONModel({
                                activeMaterialNo: data.results[0].Materialno
                            }), "ui");
                            
                            _this.getView().setModel(oJSONModel, "matMaster");
    
                            _this.getAttributes(data.results[0].Materialno);
                            _this.getBatch(data.results[0].Materialno);
                            _this.getCustomInfo(data.results[0].Materialno);
                            _this.getPlant(data.results[0].Materialno);
                        },
                        error: function (err) { }
                    })
                }
                else{
                    var oModel = this.getOwnerComponent().getModel();
                    var binding = oModel.getBinding(this.getView().byId("searchFieldMM").getValue());
                    binding.filter();
                }
                
            },
            onRefreshAttr() {
                this.getAttributes();
            },
            onRefreshBatch(){
                this.getBatch()
            },
            onRefreshCustomInfo(){
                this.getCustomInfo();
            },
            onRefreshPlant(){
                this.getPlant()
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
                var oFilter = null;
                var aFilter = [];

                if (sQuery) {
                    this._aFilterableColumns[sTable].forEach(item => {
                        var sDataType = this._aColumns[sTable].filter(col => col.name === item.name)[0].type;

                        if (sDataType === "Edm.Boolean") aFilter.push(new Filter(item.name, FilterOperator.EQ, sQuery));
                        else aFilter.push(new Filter(item.name, FilterOperator.Contains, sQuery));
                    })

                    oFilter = new Filter(aFilter, false);

                    // oFilter = new Filter([
                    //     new Filter("Gmc", FilterOperator.Contains, sQuery),
                    //     new Filter("Mattyp", FilterOperator.Contains, sQuery)
                    // ], false);
                }
    
                this.byId(sTable + "Tab").getBinding("rows").filter(oFilter, "Application");
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
                    this._inputSourceCtx = oEvent.getSource().getBindingContext(sModel);
                    if (sEntity === '/GMCRscSet'){
                        this.dialogEntity=sEntity;
                        this.getView().getModel("matMaster").getData().results.filter(item => item.New === true).forEach(item => {
                            oModel.read(sEntity, {
                                urlParameters: {
                                    "$filter": "Mattyp eq '"  + item.Materialtype + "'"
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
                        if(this._inputId.indexOf("iptAttribcd")>=0){
                            this._valueHelpDialog.getModel().getData().items.filter(item => item.VHTitle === oSelectedItem.getTitle())
                                .forEach(item => {
                                    var oModel = this._inputSourceCtx.getModel();
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Attribcd', item.VHTitle);
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Descen', item.VHDesc);
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Desczh', item.VHDesc2);
                                })
                        }
                        if(this.dialogEntity==="/MatTypeRscSet"){
                        //if (this._inputId.indexOf("iptMaterialtype") >= 0) {
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
                                        if(col.getLabel().getText().toUpperCase() ==="GMC"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                        }
                                        if(col.getLabel().getText().toUpperCase() ==="MATERIAL GROUP"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                        }
                                        if(col.getLabel().getText().toUpperCase() ==="BASE UNIT"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                        }
                                    })
                                }
                                else{
                                    oModel.setProperty(this._inputSourceCtx.getPath() + '/Processcode', item.Processcd);
                                    var oTable = this.byId("matMasterTab");
                                    oTable.getColumns().forEach((col, idx) => {
                                        if(col.getLabel().getText().toUpperCase() ==="GMC"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",false);
                                        }
                                        if(col.getLabel().getText().toUpperCase() ==="MATERIAL GROUP"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                        }
                                        if(col.getLabel().getText().toUpperCase() ==="BASE UNIT"){
                                            oTable.getRows()[0].getCells()[idx].setProperty("enabled",true);
                                        }
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
                                oModel.setProperty(this._inputSourceCtx.getPath() + '/Uebtk', item.Uebtk);
                            });
                        }
                        else {
                            if (this._inputValue !== oSelectedItem.getTitle()) {
                                var sRowPath = this._inputSource.getBindingInfo("value").binding.oContext.sPath;
                                this.getView().getModel(sTable).setProperty(sRowPath + '/Edited', true);
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
                this._oViewSettingsDialog["zuimatmaster.view.MaterialTypeClassDialog"].close();
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
                    var sRowPath = this.byId(oEvent.srcControl.sId).oBindingContexts["matMaster"].sPath;
                    var oRow = this.getView().getModel("matMaster").getProperty(sRowPath);
                    this.getView().getModel("ui").setProperty("/activeMaterialNo", oRow.Materialno);

                    this.getAttributes(oRow.Materialno);
                    this.getBatch(oRow.Materialno);
                    this.getCustomInfo(oRow.Materialno);
                    this.getPlant(oRow.Materialno);
                }
            },
         });
    });
