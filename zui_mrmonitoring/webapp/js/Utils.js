sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
], function (MessageToast, JSONModel, Spreadsheet) {
    "use strict";

    var that = this;

    return {
        onExport: function (oEvent) {
            var oButton = oEvent.getSource();
            var tabName = oButton.data('TableName')
            var oTable = this.getView().byId(tabName);
            // var oExport = oTable.exportData();

            var aCols = [], aRows, oSettings, oSheet;
            var aParent, aChild;
            var fileName;

            var columns = oTable.getColumns();
            console.log(oTable.getModel())
            for (var i = 0; i < columns.length; i++) {
                aCols.push({
                    label: columns[i].mProperties.filterProperty,
                    property: columns[i].mProperties.filterProperty,
                    type: 'string'
                })
            }

            var property;

            if (tabName === 'styleDetldBOMTab') {
                property = '/results/items';
                aParent = oTable.getModel('DataModel').getProperty(property);

                aRows = [];

                for (var i = 0; i < aParent.length; i++) {
                    aRows.push(aParent[i]);
                    try {
                        for (var j = 0; j < aParent[i].items.length; j++) {
                            aChild = aParent[i].items[j];
                            aRows.push(aChild);

                            try {
                                for (var k = 0; k < aChild.items.length; k++) {
                                    aChild = aParent[i].items[j].items[k];
                                    aRows.push(aChild);
                                }
                            } catch(err) {}
                        }
                    } catch(err) {}
                }
                
            } 
            else if (tabName === "styleMatListTab" || tabName === "ioMatListTab") {
                property = '/rows';
                aRows = oTable.getModel().getProperty(property);
            }
            else {
                property = '/results';
                aRows = oTable.getModel('mainHdr').getProperty(property);
            }

            var date = new Date();
            fileName = "MR_Monitoring_" + date.toLocaleDateString('en-us', { year: "numeric", month: "short", day: "numeric" });

            oSettings = {
                fileName: fileName,
                workbook: { columns: aCols },
                dataSource: aRows
            };

            oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .then(function () {
                    MessageToast.show('Spreadsheet export has finished');
                })
                .finally(function () {
                    oSheet.destroy();
                });
        }

    }
});