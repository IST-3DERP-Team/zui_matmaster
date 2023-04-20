sap.ui.define([
    'sap/ui/comp/library',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/type/String',
	'sap/m/ColumnListItem',
	'sap/m/Label',
	'sap/m/SearchField',
	'sap/m/Token',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (compLibrary, Controller, JSONModel, typeString, ColumnListItem, Label, SearchField, Token, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("smartfiltervaluehelpdialog.controller.main", {
            onInit: function () {
                this._oMultiInput = this.getView().byId("multiInput");
                //this._oMultiInput.setTokens(this._getDefaultTokens());
                this._oMultiInput.addValidator(this._onMultiInputValidate);
                this.oColModel = new JSONModel({
                    "cols": [
                        {
                            "label": "HU Type",
                            "template": "Hutyp",
                            "width": "5rem"
                        },
                        {
                            "label": "ShortText",
                            "template": "Shorttext"
                        },
                    ]
                }
                );
                var _this = this;
                var oModel = this.getOwnerComponent().getModel();
                oModel.read('/HUTypeSHSet', {
                    success: function (data, response) {
                        _this.oProductsModel = new JSONModel(data);
                        _this.getView().setModel(_this.oProductsModel);
                    }
                });

                
            },
            onValueHelpRequested: function() {
                var aCols = this.oColModel.getData().cols;
                this._oBasicSearchField = new SearchField({
                    showSearchButton: false
                });
    
                this._oValueHelpDialog = sap.ui.xmlfragment("smartfiltervaluehelpdialog.view.ValueHelpDialogInputSuggestions", this);
                this.getView().addDependent(this._oValueHelpDialog);
    
                this._oValueHelpDialog.setRangeKeyFields([{
                    label: "HU Type",
                    key: "Hutyp",
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
                alert("1");
                var aTokens = oEvent.getParameter("tokens");
                console.log("aTokens",aTokens);
                this._oMultiInput.setTokens(aTokens);
                this._oValueHelpDialog.close();
            },
    
            onValueHelpCancelPress: function () {
                alert("2");
                this._oValueHelpDialog.close();
            },
    
            onValueHelpAfterClose: function () {
                alert("3");
                this._oValueHelpDialog.destroy();
            },
    
            onFilterBarSearch: function (oEvent) {
                alert("4");
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
                        new Filter({ path: "Hutyp", operator: FilterOperator.Contains, value1: sSearchQuery }),
                        new Filter({ path: "Shorttext", operator: FilterOperator.Contains, value1: sSearchQuery }),
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
                alert("6");
                var oValueHelpDialog = this._oValueHelpDialog;
    
                oValueHelpDialog.getTableAsync().then(function (oTable) {
                    if (oTable.bindRows) {
                        oTable.getBinding("rows").filter(oFilter);
                    }
    
                    if (oTable.bindItems) {
                        alert("test");
                        oTable.getBinding("items").filter(oFilter);
                    }
    
                    oValueHelpDialog.update();
                });
            },
    
            _onMultiInputValidate: function(oArgs) {
                alert("7");
                if (oArgs.suggestionObject) {
                    var oObject = oArgs.suggestionObject.getBindingContext().getObject(),
                        oToken = new Token();
    
                    oToken.setKey(oObject.ProductId);
                    oToken.setText(oObject.Name + " (" + oObject.ProductId + ")");
                }
    
                return null;
            },
    
            _getDefaultTokens: function () {
                var ValueHelpRangeOperation = compLibrary.valuehelpdialog.ValueHelpRangeOperation;
                var oToken1 = new Token({
                    key: "HT-1001",
                    text: "Notebook Basic 17 (HT-1001)"
                });
    
                var oToken2 = new Token({
                    key: "range_0",
                    text: "!(=HT-1000)"
                }).data("range", {
                    "exclude": true,
                    "operation": ValueHelpRangeOperation.EQ,
                    "keyField": "ProductId",
                    "value1": "HT-1000",
                    "value2": ""
                });
    
                return [oToken1, oToken2];
            }
        });
    });
    