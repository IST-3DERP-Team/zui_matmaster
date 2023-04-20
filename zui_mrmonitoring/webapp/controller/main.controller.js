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
    "../js/Utils",
	'sap/ui/model/type/String',
	'sap/m/ColumnListItem',
	'sap/m/Label',
	'sap/m/SearchField',
	'sap/m/Token',
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageBox, Filter, FilterOperator, Sorter, Device, library, Fragment, jQuery,HashChanger,Utils, typeString, ColumnListItem, Label, SearchField, Token) {
        "use strict";
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "MM/dd/yyyy" });
        return Controller.extend("zuimrmonitoring.controller.main", {
            onInit: function () {
                var _this = this;
                this.getView().setModel(new JSONModel({
                    SBU: '',
                    MVMNTTYPE:'',
                    OPENITEMS:'0',
                    PARTIALLYISSUED:'0',
                    CLOSED:'0'
                }), "ui");

                this._oMultiInput = this.getView().byId("multiInput");

                this.setSmartFilterModel();
                
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_MRM_FILTERS_CDS");
                oModel.read("/ZVB_3DERP_SBU_SH", {
                    success: function (oData, oResponse) {
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(oData);
                        _this.getView().setModel(oJSONModel, "sbuFilter");
                        if (oData.results.length === 1) {
                            _this.getView().getModel("ui").setProperty("/sbu", oData.results[0].SBU);
                        }
                        else {
                            //that.closeLoadingDialog();
                        }
                    },
                    error: function (err) { }
                });
                _this.getView().byId("multiheaderISS").setHeaderSpan([5]);
                _this.getView().byId("multiheaderRCV").setHeaderSpan([5]);
                _this.getView().byId("multiheaderQTY").setHeaderSpan([3]);
            },
            onMovementTypeChange(){
                /*var vMVMNTTYPE = this.getView().getModel("ui").getData().MVMNTTYPE;
                var _this = this;
                var oModel = this.getOwnerComponent().getModel("ZBV_3DERP_MRM_RSVNO_SH_CDS");
                oModel.read("/ZBV_3DERP_MRM_RSVNO_SH", {
                    success: function (oData, oResponse) {
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData({results: oData.results.filter(item => item.sbu === vSBU)});
                        _this.getView().setModel(oJSONModel, "rsvnoFilter");
                    },
                    error: function (err) { }
                });*/
            },
            onSBUChange(){
                var vSBU = this.getView().getModel("ui").getData().sbu;
                var _this = this;
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_MRM_FILTERS_CDS");
                oModel.read("/ZVB_3DERP_MRM_MVMNTYP_SH", {
                    success: function (oData, oResponse) {
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData({results: oData.results.filter(item => item.sbu === vSBU)});
                        _this.getView().setModel(oJSONModel, "mvmntTypeFilter");
                    },
                    error: function (err) { }
                });

                this._oMultiInput = this.getView().byId("multiInput");
                this._oMultiInput.addValidator(this._onMultiInputValidate);
                this.oColModel = new JSONModel({
                    "cols": [
                        {
                            "label": "Plant",
                            "template": "werks",
                            "width": "5rem"
                        },
                        {
                            "label": "Name",
                            "template": "name1"
                        },
                    ]
                }
                );
                
                oModel.read("/ZVB_3DERP_MRM_REQPLANT_SH", {
                    success: function (oData, oResponse) {
                        if(oData.results.length>0){
                            _this.oProductsModel = new JSONModel({results: oData.results.filter(item => item.sbu === vSBU)});
                            _this.getView().setModel(_this.oProductsModel);
                        }
                        else{
                            _this.oProductsModel = new JSONModel({results: []});
                            _this.getView().setModel(_this.oProductsModel);
                        }
                        
                        
                        /*var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData({results: oData.results.filter(item => item.sbu === vSBU)});
                        _this.getView().setModel(oJSONModel, "reqPlantFilter");*/
                    },
                    error: function (err) { }
                });

                oModel.read("/ZVB_3DERP_MRM_RCVMAT_SH", {
                    success: function (oData, oResponse) {
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData({results: oData.results.filter(item => item.sbu === vSBU)});
                        console.log("getModel",_this.getView().getModel().getData());
                        _this.getView().setModel(oJSONModel, "rcvMatFilter");
                    },
                    error: function (err) { }
                });
            },
            onValueHelpRequested: function() {
                var aCols = this.oColModel.getData().cols;
                this._oBasicSearchField = new SearchField({
                    showSearchButton: false
                });
    
                this._oValueHelpDialog = sap.ui.xmlfragment("zuimrmonitoring.view.fragments.ValueHelpDialogInputSuggestions", this);
                this.getView().addDependent(this._oValueHelpDialog);
    
                this._oValueHelpDialog.setRangeKeyFields([{
                    label: "Plant",
                    key: "werks",
                    type: "string",
                    typeInstance: new typeString({}, {
                        maxLength: 7
                    })
                }]);
    
                this._oValueHelpDialog.getFilterBar().setBasicSearch(this._oBasicSearchField);
    
                this._oValueHelpDialog.getTableAsync().then(function (oTable) {
                    oTable.setModel(this.oProductsModel);
                    oTable.setModel(this.oColModel, "columns");
    
                    if (oTable.bindRows) {
                        oTable.bindAggregation("rows", "/results");
                    }
    
                    if (oTable.bindItems) {
                        oTable.bindAggregation("items", "/results", function () {
                            return new ColumnListItem({
                                cells: aCols.map(function (column) {
                                    return new Label({ text: "{" + column.template + "}" });
                                })
                            });
                        });
                    }
    
                    this._oValueHelpDialog.update();
                }.bind(this));
    
                
                this._oValueHelpDialog.setTokens(this._oMultiInput.getTokens());
                this._oValueHelpDialog.open();
            },
    
            onValueHelpOkPress: function (oEvent) {
                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens",aTokens);
                this._oMultiInput.setTokens(aTokens);
                this._oValueHelpDialog.close();
            },
    
            onValueHelpCancelPress: function () {
                this._oValueHelpDialog.close();
            },
    
            onValueHelpAfterClose: function () {
                this._oValueHelpDialog.destroy();
            },
    
            onFilterBarSearch: function (oEvent) {
                var sSearchQuery = this._oBasicSearchField.getValue(),
                    aSelectionSet = oEvent.getParameter("selectionSet");
                var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                    if (oControl.getValue()) {
                        aResult.push(new Filter({
                            path: oControl.getName(),
                            operator: FilterOperator.Contains,
                            value1: oControl.getValue()
                        }));
                    }
    
                    return aResult;
                }, []);
    
                aFilters.push(new Filter({
                    filters: [
                        new Filter({ path: "werks", operator: FilterOperator.Contains, value1: sSearchQuery }),
                        new Filter({ path: "name1", operator: FilterOperator.Contains, value1: sSearchQuery }),
                        //new Filter({ path: "Category", operator: FilterOperator.Contains, value1: sSearchQuery })
                    ],
                    and: false
                }));
    
                this._filterTable(new Filter({
                    filters: aFilters,
                    and: true
                }));
            },
    
            _filterTable: function (oFilter) {
                var oValueHelpDialog = this._oValueHelpDialog;
    
                oValueHelpDialog.getTableAsync().then(function (oTable) {
                    if (oTable.bindRows) {
                        oTable.getBinding("rows").filter(oFilter);
                    }
    
                    if (oTable.bindItems) {
                        oTable.getBinding("items").filter(oFilter);
                    }
    
                    oValueHelpDialog.update();
                });
            },
    
            _onMultiInputValidate: function(oArgs) {
                if (oArgs.suggestionObject) {
                    var oObject = oArgs.suggestionObject.getBindingContext().getObject(),
                        oToken = new Token();
    
                    oToken.setKey(oObject.werks);
                    oToken.setText(oObject.name1 + " (" + oObject.werks + ")");
                    //oToken.setText(oObject.werks);
                }
    
                return null;
            },
            setSmartFilterModel: function () {
                //Model StyleHeaderFilters is for the smartfilterbar
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_MRM_FILTERS_CDS");
                console.log("smartfiltermodel",oModel)
                var oSmartFilter = this.getView().byId("smartFilterBar");
                oSmartFilter.setModel(oModel);
            },
            getMain(){
                var oModel = this.getOwnerComponent().getModel();
                var aFilters = this.getView().byId("smartFilterBar").getFilters();
                var _this = this;
                console.log("aFilters",aFilters);
                oModel.read('/mainSet', {
                    success: function (data, response) {
                        _this.getView().getModel("ui").setProperty("/OPENITEMS", data.results.filter(item => item.DELETED != "X" && item.CLOSED != "X").length);
                        _this.getView().getModel("ui").setProperty("/PARTIALLYISSUED", data.results.filter(item => item.ISSQTY > 0 && item.CLOSED != "X").length);
                        _this.getView().getModel("ui").setProperty("/CLOSED", data.results.filter(item => item.CLOSED == "X").length);
                        data.results.forEach(item => {
                            item.CREATEDDT = dateFormat.format(item.CREATEDDT);
                            item.REQDDT = dateFormat.format(item.REQDDT);
                            item.DELETED = item.DELETED === "X" ? true : false;
                            item.CLOSED = item.CLOSED === "X" ? true : false;
                        })
                        data.results.sort((a, b) => new Date(b.CREATEDDT) - new Date(a.CREATEDDT) || parseInt(b.RSVNO) - parseInt(a.RSVNO) || parseInt(b.ITEM) - parseInt(a.ITEM));
                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "mainHdr");
                        
                        _this.closeLoadingDialog();
                    }
                });
            },
            //export to spreadsheet utility
            onExport: Utils.onExport
            ,
            onRefreshMain(){
                this.showLoadingDialog('Loading...');
                this.getMain();
            },
            onSearch: function () {
                this.showLoadingDialog('Loading...');
                this.getMain();
            },
            showLoadingDialog(arg) {
                if (!this._LoadingDialog) {
                    this._LoadingDialog = sap.ui.xmlfragment("zuimrmonitoring.view.fragments.LoadingDialog", this);
                    this.getView().addDependent(this._LoadingDialog);
                }
                this._LoadingDialog.setTitle(arg);
                this._LoadingDialog.open();
            },
            closeLoadingDialog() {
                this._LoadingDialog.close();
            },        
        });
    });
