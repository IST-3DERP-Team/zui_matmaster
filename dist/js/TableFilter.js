sap.ui.define(["sap/ui/model/json/JSONModel","sap/ui/model/Filter","sap/ui/model/FilterOperator"],function(e,t,l){"use strict";return{updateColumnMenu:function(e,t){var l=this;var r=t;var o=r.byId(e);o.getColumns().forEach(t=>{t.attachColumnMenuOpen(function(o){var a=t.getMenu();var s=new sap.ui.unified.MenuItem({icon:"sap-icon://filter",text:"Filter",select:function(t){l.onColFilter(e,t.getSource().oParent.oParent.getAggregation("label").getProperty("text"),r)}});setTimeout(()=>{var e=false;a.getItems().forEach(t=>{if(t.sId.indexOf("filter")>=0){a.removeItem(t)}if(t.mProperties.text!==undefined&&t.mProperties.text==="Filter"){e=true}});if(!e){a.insertItem(s,2)}a.setPageSize(a.getItems().length)},10)})})},onColFilter:function(t,l,r){var o=r;var a="";if(typeof t==="string"){a=t}else{a=t.getSource().data("TableName")}var s="zuimatmaster.view.fragments.dialog.GenericFilterDialog";if(!o._GenericFilterDialog){o._GenericFilterDialog=sap.ui.xmlfragment(s,o);o._GenericFilterDialog.setModel(new e);o.getView().addDependent(o._GenericFilterDialog)}var i=o.byId(a);var n=o._GenericFilterDialog;var g=n.getModel().getProperty("/items");var d=n.getModel().getProperty("/values");var u=n.getModel().getProperty("/custom");var m=l===undefined?n.getModel().getProperty("/selectedItem"):l;var p=n.getModel().getProperty("/selectedColumn");var c={};var f=[];var C={};var y=false;var P="VLF";var M=[];var I=jQuery.extend(true,[],o._aColumns[a.replace("Tab","")]);I.forEach((e,t)=>{if(!(e.ColumnName==="MANDT"||e.ColumnName==="DOCTYPE"||e.ColumnName==="SHORTTEXT"||e.ColumnName==="INFORECORD"||e.ColumnName==="COMPANY"||e.ColumnName==="PLANMONTH")){M.push(e)}});if(i.getModel()!==undefined){f=jQuery.extend(true,[],i.getModel().getData().rows)}if(o._colFilters[a]!==undefined){g=o._colFilters[a].items;d=o._colFilters[a].values;u=o._colFilters[a].custom;m=o._colFilters[a].selectedItem;p=o._colFilters[a].selectedColumn}else{g=undefined;d=undefined;u=undefined;m="";p=""}if(l!==undefined){m=l}if(u===undefined){u={}}if(g!==undefined){if(g.filter(e=>e.isFiltered===true).length>0){y=true}}if(!y){n.getModel().setProperty("/btnRemoveFilterEnable",false)}else{n.getModel().setProperty("/btnRemoveFilterEnable",true)}M.forEach((e,t)=>{if(e.ColumnName==="CREATEDDT"||e.ColumnName==="UPDATEDDT"){e.DataType="DATETIME"}C[e.ColumnName]=[];f.forEach(t=>{if(t[e.ColumnName]===""||t[e.ColumnName]===null||t[e.ColumnName]===undefined){t[e.ColumnName]="(blank)"}else if(t[e.ColumnName]===true){t[e.ColumnName]="Yes"}else if(t[e.ColumnName]===false){t[e.ColumnName]="No"}if(C[e.ColumnName].findIndex(l=>l.Value===t[e.ColumnName])<0){if(y&&d&&d[e.ColumnName].findIndex(l=>l.Value===t[e.ColumnName])>=0){d[e.ColumnName].forEach(l=>{if(l.Value===t[e.ColumnName]){C[e.ColumnName].push({Value:l.Value,Selected:l.Selected})}})}else{C[e.ColumnName].push({Value:t[e.ColumnName],Selected:true})}}});C[e.ColumnName].sort((t,l)=>(e.DataType==="NUMBER"?+t.Value:e.DataType==="DATETIME"?t.Value==="(blank)"?"":new Date(t.Value):t.Value)>(e.DataType==="NUMBER"?+l.Value:e.DataType==="DATETIME"?l.Value==="(blank)"?"":new Date(l.Value):l.Value)?1:-1);e.selected=false;if(!y){if(l===undefined){if(t===0){p=e.ColumnName;m=e.ColumnLabel;e.selected=true}}else{if(m===e.ColumnLabel){p=e.ColumnName;e.selected=true}}u[e.ColumnName]={Operator:e.DataType==="STRING"?"Contains":"EQ",ValFr:"",ValTo:""};e.filterType="VLF";e.isFiltered=false}else if(y){g.filter(t=>t.ColumnName===e.ColumnName).forEach(t=>{e.filterType=t.filterType;e.isFiltered=t.isFiltered});if(m===e.ColumnLabel){p=e.ColumnName;P=e.filterType;e.selected=true;if(e.isFiltered){n.getModel().setProperty("/btnRemoveFilterEnable",true)}else{n.getModel().setProperty("/btnRemoveFilterEnable",false)}}}e.filterOperator=e.DataType==="STRING"?"Contains":"EQ";c[e.ColumnName]=""});n.getModel().setProperty("/sourceTabId",a);n.getModel().setProperty("/items",M);n.getModel().setProperty("/values",C);n.getModel().setProperty("/currValues",jQuery.extend(true,[],C[p]));n.getModel().setProperty("/rowCount",C[p].length);n.getModel().setProperty("/selectedItem",m);n.getModel().setProperty("/selectedColumn",p);n.getModel().setProperty("/search",c);n.getModel().setProperty("/reset",false);n.getModel().setProperty("/custom",u);n.getModel().setProperty("/customColFilterOperator",u[p].Operator);n.getModel().setProperty("/customColFilterFrVal",u[p].ValFr);n.getModel().setProperty("/customColFilterToVal",u[p].ValTo);n.getModel().setProperty("/searchValue","");n.open();var F=false;var v=-1,V=-1;var b=n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[1].getItems()[0];b.clearSelection();C[p].forEach((e,t)=>{if(e.Selected){if(v===-1)v=t;V=t}if(!e.Selected||t===C[p].length-1){if(v!==-1){if(!F){b.setSelectionInterval(v,V)}else{b.addSelectionInterval(v,V)}F=true;n.getModel().setProperty("/reset",false)}v=-1;V=-1}});n.getModel().setProperty("/reset",true);var D;n.getAggregation("buttons").forEach(e=>{e.getAggregation("customData").forEach(t=>{if(t.getProperty("value")==="Clear"){D=e}})});if(y){D.setEnabled(true)}else{D.setEnabled(false)}n.getContent()[0].getMasterPages()[0].getContent()[0].getItems().forEach(e=>{if(M.filter(t=>t.ColumnLabel===e.getTitle())[0].isFiltered){e.setIcon("sap-icon://filter")}else{e.setIcon("sap-icon://text-align-justified")}});if(P==="UDF"){n.getModel().setProperty("/selectUDF",true);n.getModel().setProperty("/panelVLFVisible",false);n.getModel().setProperty("/panelUDFVisible",true)}else{n.getModel().setProperty("/selectVLF",true);n.getModel().setProperty("/panelVLFVisible",true);n.getModel().setProperty("/panelUDFVisible",false)}var h=M.filter(e=>e.ColumnName===p)[0].DataType;if(h==="BOOLEAN"){n.getModel().setProperty("/rbtnUDFVisible",false);n.getModel().setProperty("/lblUDFVisible",false)}else{n.getModel().setProperty("/rbtnUDFVisible",true);n.getModel().setProperty("/lblUDFVisible",true)}if(h==="NUMBER"){n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[1].setType("Number");n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[1].getItems()[1].setType("Number")}else{n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[1].setType("Text");n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[1].getItems()[1].setType("Text")}if(u[p].Operator==="BT"){n.getModel().setProperty("/panelUDFToVisible",true)}else{n.getModel().setProperty("/panelUDFToVisible",false)}if(h==="DATETIME"){n.getModel().setProperty("/customColFilterFrValVisible",false);n.getModel().setProperty("/customColFilterToValVisible",false);n.getModel().setProperty("/customColFilterFrDateVisible",true);n.getModel().setProperty("/customColFilterToDateVisible",true)}else{n.getModel().setProperty("/customColFilterFrValVisible",true);n.getModel().setProperty("/customColFilterToValVisible",true);n.getModel().setProperty("/customColFilterFrDateVisible",false);n.getModel().setProperty("/customColFilterToDateVisible",false)}if(h!=="STRING"){if(n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].getItems().filter(e=>e.getKey()==="Contains").length>0){n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].removeItem(3);n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].removeItem(2)}}else{if(n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].getItems().filter(e=>e.getKey()==="Contains").length===0){n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].insertItem(new sap.ui.core.Item({key:"Contains",text:"Contains"}),2);n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].insertItem(new sap.ui.core.Item({key:"NotContains",text:"Not Contains"}),3)}}var T={onclick:function(e){if(e.srcControl.data("FilterType")==="UDF"){n.getModel().setProperty("/panelVLFVisible",false);n.getModel().setProperty("/panelUDFVisible",true)}else{n.getModel().setProperty("/panelVLFVisible",true);n.getModel().setProperty("/panelUDFVisible",false)}}};n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[0].getItems()[0].getContent()[3].addEventDelegate(T);n.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[0].getItems()[0].getContent()[6].addEventDelegate(T);o._GenericFilterDialogModel=jQuery.extend(true,[],n.getModel());o._colFilters[a]=jQuery.extend(true,{},n.getModel().getData())},onColFilterClear:function(e,t){var l=t;var r=l._GenericFilterDialog;var o=r.getModel().getProperty("/items");var a=r.getModel().getProperty("/values");var s=r.getModel().getData().sourceTabId;r.close();var i="";o.forEach(e=>{a[e.ColumnName].forEach(e=>e.Selected=true);e.isFiltered=false});l.byId(s).getBinding("rows").filter(i,"Application");r.getContent()[0].getMasterPages()[0].getContent()[0].getItems().forEach(e=>e.setIcon("sap-icon://text-align-justified"));l.byId(s).getColumns().forEach(e=>{e.setProperty("filtered",false)});l._colFilters[s]=jQuery.extend(true,{},r.getModel().getData());l.setActiveRowHighlight(s);if(s==="headerTab"){var n=l.byId(s).getModel().getData().rows.filter((e,t)=>t===0)[0].COSTCOMPCD;if(l.getView().getModel("ui").getProperty("/activeComp")!==n){l.byId(s).getModel().getData().rows.forEach(e=>{if(e.COSTCOMPCD===n){e.ACTIVE="X"}else{e.ACTIVE=""}});l.getView().getModel("ui").setProperty("/activeComp",n);l.getView().getModel("ui").setProperty("/activeCompDisplay",n);l.getDetailData(false)}l.getView().getModel("counts").setProperty("/header",l.byId(s).getBinding("rows").aIndices.length)}else if(s==="detailTab"){l.getView().getModel("counts").setProperty("/detail",l.byId(s).getBinding("rows").aIndices.length)}},onColFilterCancel:function(e,t){var l=t;var r=l._GenericFilterDialogModel;var o=l._GenericFilterDialog;o.getModel().setProperty("/items",r.getData().items);o.getModel().setProperty("/values",r.getData().values);o.getModel().setProperty("/currValues",r.getData().currValues);o.getModel().setProperty("/search",r.getData().search);o.getModel().setProperty("/custom",r.getData().custom);o.getContent()[0].getMasterPages()[0].getContent()[0].getItems().forEach(e=>{var t=r.getData().items.filter(t=>t.ColumnLabel===e.getTitle())[0].isFiltered;if(t){e.setIcon("sap-icon://filter")}else{e.setIcon("sap-icon://text-align-justified")}});l._GenericFilterDialog.close()},onColFilterConfirm:function(l,r){var o=r;var a=o._GenericFilterDialog;var s=a.getModel().getProperty("/items");var i=a.getModel().getProperty("/values");var n=a.getModel().getProperty("/custom");var g=a.getModel().getData().sourceTabId;a.close();var d=[];var u=null;var m=o.byId(g).getColumns();s.forEach(e=>{var l=m.filter(t=>t.getAggregation("label").getProperty("text")===e.ColumnLabel)[0];var r=[];var o=null;if(e.filterType==="VLF"&&i[e.ColumnName].filter(e=>e.Selected===false).length>0){i[e.ColumnName].forEach(l=>{if(l.Selected){if(l.Value==="(blank)"){r.push(new t(e.ColumnName,this.getConnector("EQ"),""));r.push(new t(e.ColumnName,this.getConnector("EQ"),null));r.push(new t(e.ColumnName,this.getConnector("EQ"),undefined))}else if(e.DataType==="BOOLEAN"){if(l.Value==="Yes"){r.push(new t(e.ColumnName,this.getConnector("EQ"),true))}else{r.push(new t(e.ColumnName,this.getConnector("EQ"),false))}}else{r.push(new t(e.ColumnName,this.getConnector("EQ"),l.Value))}}});o=new t(r,false);d.push(new t(o));l.setProperty("filtered",true);e.isFiltered=true}else if(e.filterType==="UDF"&&n[e.ColumnName].ValFr!==""){if(n[e.ColumnName].ValTo!==""){d.push(new t(e.ColumnName,this.getConnector("BT"),n[e.ColumnName].ValFr,n[e.ColumnName].ValTo))}else{d.push(new t(e.ColumnName,this.getConnector(n[e.ColumnName].Operator),n[e.ColumnName].ValFr))}l.setProperty("filtered",true);e.isFiltered=true}else{l.setProperty("filtered",false);e.isFiltered=false}});if(d.length>0){u=new t(d,true)}else{u=""}o.byId(g).getBinding("rows").filter(u,"Application");o._colFilters[g]=jQuery.extend(true,{},a.getModel().getData());if(u!==""){if(g==="headerTab"){if(o.byId(g).getBinding("rows").aIndices.length===0){o.getView().getModel("ui").setProperty("/activeComp","");o.getView().getModel("ui").setProperty("/activeCompDisplay","");o.getView().getModel("counts").setProperty("/header",0);o.getView().getModel("counts").setProperty("/detail",0);o.byId("detailTab").setModel(new e({rows:[]}))}else{var p=o.byId(g).getModel().getData().rows.filter((e,t)=>t===o.byId(g).getBinding("rows").aIndices[0])[0].COSTCOMPCD;if(o.getView().getModel("ui").getProperty("/activeComp")!==p){o.byId(g).getModel().getData().rows.forEach(e=>{if(e.COSTCOMPCD===p){e.ACTIVE="X"}else{e.ACTIVE=""}});o.setActiveRowHighlight(g);o.getView().getModel("ui").setProperty("/activeComp",p);o.getView().getModel("ui").setProperty("/activeCompDisplay",p);o.getDetailData(false)}o.getView().getModel("counts").setProperty("/header",o.byId(g).getBinding("rows").aIndices.length)}}else if(g==="detailTab"){if(o.byId(g).getBinding("rows").aIndices.length===0){o.getView().getModel("counts").setProperty("/detail",0)}else{o.getView().getModel("counts").setProperty("/detail",o.byId(g).getBinding("rows").aIndices.length);o.setActiveRowHighlight(g)}}}else{o.getView().getModel("counts").setProperty("/header",o.byId(g).getModel().getData().rows.length)}},onFilterItemPress:function(e,t){var l=t;var r=l._GenericFilterDialog;var o=r.getModel().getProperty("/items");var a=r.getModel().getProperty("/values");var s=r.getModel().getProperty("/custom");var i=e.getSource().getSelectedItem().getProperty("title");var n="";o.forEach(e=>{if(e.ColumnLabel===i){n=e.ColumnName;if(e.isFiltered){r.getModel().setProperty("/btnRemoveFilterEnable",true)}else{r.getModel().setProperty("/btnRemoveFilterEnable",false)}}});r.getModel().setProperty("/currValues",jQuery.extend(true,[],a[n]));r.getModel().setProperty("/rowCount",a[n].length);r.getModel().setProperty("/selectedItem",i);r.getModel().setProperty("/selectedColumn",n);r.getModel().setProperty("/reset",false);r.getModel().setProperty("/customColFilterOperator",s[n].Operator);r.getModel().setProperty("/customColFilterFrVal",s[n].ValFr);r.getModel().setProperty("/customColFilterToVal",s[n].ValTo);r.getModel().setProperty("/searchValue","");var g=false;var d=-1,u=-1;var m=r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[1].getItems()[0];m.clearSelection();a[n].forEach((e,t)=>{if(e.Selected){if(d===-1)d=t;u=t}if(!e.Selected||t===a[n].length-1){if(d!==-1){if(!g){m.setSelectionInterval(d,u)}else{m.addSelectionInterval(d,u)}g=true;r.getModel().setProperty("/reset",false)}d=-1;u=-1}});var p=o.filter(e=>e.ColumnName===n)[0].filterType;var c=o.filter(e=>e.ColumnName===n)[0].DataType;if(p==="UDF"){r.getModel().setProperty("/selectVLF",false);r.getModel().setProperty("/selectUDF",true);r.getModel().setProperty("/panelVLFVisible",false);r.getModel().setProperty("/panelUDFVisible",true)}else{r.getModel().setProperty("/selectUDF",false);r.getModel().setProperty("/selectVLF",true);r.getModel().setProperty("/panelVLFVisible",true);r.getModel().setProperty("/panelUDFVisible",false)}if(r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].getSelectedKey()==="BT"){r.getModel().setProperty("/panelUDFToVisible",true)}else{r.getModel().setProperty("/panelUDFToVisible",false)}if(c==="BOOLEAN"){r.getModel().setProperty("/rbtnUDFVisible",false);r.getModel().setProperty("/lblUDFVisible",false)}else{r.getModel().setProperty("/rbtnUDFVisible",true);r.getModel().setProperty("/lblUDFVisible",true)}if(c==="NUMBER"){r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[1].setType("Number");r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[1].getItems()[1].setType("Number")}else{r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[1].setType("Text");r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[1].getItems()[1].setType("Text")}if(c==="DATETIME"){r.getModel().setProperty("/customColFilterFrValVisible",false);r.getModel().setProperty("/customColFilterToValVisible",false);r.getModel().setProperty("/customColFilterFrDateVisible",true);r.getModel().setProperty("/customColFilterToDateVisible",true)}else{r.getModel().setProperty("/customColFilterFrValVisible",true);r.getModel().setProperty("/customColFilterToValVisible",true);r.getModel().setProperty("/customColFilterFrDateVisible",false);r.getModel().setProperty("/customColFilterToDateVisible",false)}if(c!=="STRING"){if(r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].getItems().filter(e=>e.getKey()==="Contains").length>0){r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].removeItem(3);r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].removeItem(2)}}else{if(r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].getItems().filter(e=>e.getKey()==="Contains").length===0){r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].insertItem(new sap.ui.core.Item({key:"Contains",text:"Contains"}),2);r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].insertItem(new sap.ui.core.Item({key:"NotContains",text:"Not Contains"}),3)}}r.getModel().setProperty("/reset",true)},onFilterValuesSelectionChange:function(e,t){var l=t;var r=l._GenericFilterDialog;if(r.getModel().getProperty("/reset")){var o=r.getModel().getProperty("/items");var a=r.getModel().getProperty("/values");var s=r.getModel().getProperty("/currValues");var i=r.getModel().getProperty("/selectedColumn");var n=r.getModel().getProperty("/selectedItem");var g=r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[1].getItems()[0];var d=false;s.forEach((e,t)=>{if(g.isIndexSelected(t)){e.Selected=true;a[i].filter(t=>t.Value===e.Value).forEach(e=>e.Selected=true)}else{d=true;e.Selected=false;a[i].filter(t=>t.Value===e.Value).forEach(e=>e.Selected=false)}});if(d){r.getModel().setProperty("/selectVLF",true);r.getModel().setProperty("/panelVLFVisible",true);r.getModel().setProperty("/panelUDFVisible",false);o.forEach(e=>{if(e.ColumnName===i){e.filterType="VLF";e.isFiltered=true}})}else{r.getModel().setProperty("/btnRemoveFilterEnable",false)}var u=o.filter(e=>e.ColumnName===i)[0].filterType;var m=r.getContent()[0].getMasterPages()[0].getContent()[0].getItems().filter(e=>e.getTitle()===n)[0];if(u==="VLF"){if(d){m.setIcon("sap-icon://filter");r.getModel().setProperty("/btnRemoveFilterEnable",true)}else{m.setIcon("sap-icon://text-align-justified");r.getModel().setProperty("/btnRemoveFilterEnable",false)}}}},onSearchFilterValue:function(e,t){var l=t;var r=l._GenericFilterDialog;var o=r.getModel().getProperty("/values");var a=[];var s=r.getModel().getProperty("/search");var i=r.getModel().getProperty("/selectedColumn");var n=r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[1].getItems()[0];var g="";var d=false;var u=-1,m=-1;if(typeof e==="string"){g=e}else{g=e.getParameter("query")}if(g){o[i].forEach(e=>{if(e.Value.toLocaleLowerCase().indexOf(g.toLocaleLowerCase())>=0){a.push(e)}})}else{a=o[i]}s[i]=g;r.getModel().setProperty("/search",s);r.getModel().setProperty("/currValues",a);r.getModel().setProperty("/rowCount",a.length);r.getModel().setProperty("/reset",false);var p=jQuery.extend(true,[],a);n.clearSelection();p.forEach((e,t)=>{if(e.Selected){if(u===-1)u=t;m=t}if(!e.Selected||t===p.length-1){if(u!==-1){if(!d){n.setSelectionInterval(u,m)}else{n.addSelectionInterval(u,m)}d=true;r.getModel().setProperty("/reset",false)}u=-1;m=-1}});r.getModel().setProperty("/reset",true)},onCustomColFilterChange:function(e,t){var l=t;var r=l._GenericFilterDialog;if(!(e.getSource().getSelectedKey()===undefined||e.getSource().getSelectedKey()==="")){if(e.getSource().getSelectedKey()==="BT"){r.getModel().setProperty("/panelUDFToVisible",true)}else{r.getModel().setProperty("/panelUDFToVisible",false)}}var o=r.getModel().getProperty("/items");var a=r.getModel().getProperty("/selectedColumn");var s=r.getModel().getProperty("/selectedItem");var i=r.getModel().getProperty("/custom");var n=r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[0].getSelectedKey();var g=o.filter(e=>e.ColumnName===a)[0].DataType;var d=r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[1].getValue();var u=r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[1].getItems()[1].getValue();if(g==="DATETIME"){d=r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[2].getValue();u=r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[1].getItems()[2].getValue()}i[a].Operator=n;i[a].ValFr=d;i[a].ValTo=u;r.getModel().setProperty("/custom",i);if(d!==""){r.getModel().setProperty("/selectUDF",true);r.getModel().setProperty("/panelVLFVisible",false);r.getModel().setProperty("/panelUDFVisible",true);o.forEach(e=>{if(e.ColumnName===a){e.filterType="UDF";e.isFiltered=true}})}var m=o.filter(e=>e.ColumnName===a)[0].filterType;var p=r.getContent()[0].getMasterPages()[0].getContent()[0].getItems().filter(e=>e.getTitle()===s)[0];if(m==="UDF"){if(d!==""){p.setIcon("sap-icon://filter");r.getModel().setProperty("/btnRemoveFilterEnable",true)}else{p.setIcon("sap-icon://text-align-justified");r.getModel().setProperty("/btnRemoveFilterEnable",false)}}},onSetUseColFilter:function(e,t){var l=t;var r=l._GenericFilterDialog;var o=r.getModel().getProperty("/items");var a=r.getModel().getProperty("/values");var s=r.getModel().getProperty("/selectedColumn");var i=r.getModel().getProperty("/selectedItem");o.forEach(t=>{if(t.ColumnName===s&&e.getParameter("selected")){t.filterType=e.getSource().data("FilterType")}});var n=r.getContent()[0].getMasterPages()[0].getContent()[0].getItems().filter(e=>e.getTitle()===i)[0];if(e.getSource().data("FilterType")==="UDF"){r.getModel().setProperty("/panelVLFVisible",false);r.getModel().setProperty("/panelUDFVisible",true);if(r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[2].getItems()[0].getItems()[1].getValue()!==""&&e.getParameter("selected")){r.getModel().setProperty("/btnRemoveFilterEnable",true);n.setIcon("sap-icon://filter")}else{r.getModel().setProperty("/btnRemoveFilterEnable",false);n.setIcon("sap-icon://text-align-justified")}}else{r.getModel().setProperty("/panelVLFVisible",true);r.getModel().setProperty("/panelUDFVisible",false);if(a[s].filter(e=>e.Selected===false).length>0&&e.getParameter("selected")){r.getModel().setProperty("/btnRemoveFilterEnable",true);n.setIcon("sap-icon://filter")}else{r.getModel().setProperty("/btnRemoveFilterEnable",false);n.setIcon("sap-icon://text-align-justified")}}},onRemoveColFilter:function(e,t){var l=t;var r=l._GenericFilterDialog;var o=r.getModel().getProperty("/items");var a=r.getModel().getProperty("/values");var s=r.getModel().getProperty("/custom");var i=r.getModel().getProperty("/selectedColumn");var n=r.getModel().getProperty("/selectedItem");o.forEach(e=>{if(e.ColumnName===i){e.isFiltered=false}});s[i].ValFr="";s[i].ValTo="";r.getModel().setProperty("/custom",s);r.getModel().setProperty("/customColFilterFrVal","");r.getModel().setProperty("/customColFilterToVal","");a[i].forEach(e=>e.Selected=true);var g=false;var d=-1,u=-1;var m=r.getContent()[0].getDetailPages()[0].getContent()[0].getItems()[1].getItems()[0];r.getModel().setProperty("/reset",false);m.clearSelection();a[i].forEach((e,t)=>{if(e.Selected){if(d===-1)d=t;u=t}if(!e.Selected||t===a[i].length-1){if(d!==-1){if(!g){m.setSelectionInterval(d,u)}else{m.addSelectionInterval(d,u)}g=true;r.getModel().setProperty("/reset",false)}d=-1;u=-1}});r.getModel().setProperty("/reset",true);r.getModel().setProperty("/values",a);r.getModel().setProperty("/currValues",a[i]);r.getContent()[0].getMasterPages()[0].getContent()[0].getItems().forEach(e=>{if(e.getTitle()===n){e.setIcon("sap-icon://text-align-justified")}});r.getModel().setProperty("/btnRemoveFilterEnable",false)},getConnector(e){var t;switch(e){case"EQ":t=sap.ui.model.FilterOperator.EQ;break;case"NE":t=sap.ui.model.FilterOperator.NE;break;case"GT":t=sap.ui.model.FilterOperator.GT;break;case"GE":t=sap.ui.model.FilterOperator.GE;break;case"LT":t=sap.ui.model.FilterOperator.LT;break;case"LE":t=sap.ui.model.FilterOperator.LE;break;case"BT":t=sap.ui.model.FilterOperator.BT;break;case"Contains":t=sap.ui.model.FilterOperator.Contains;break;case"NotContains":t=sap.ui.model.FilterOperator.NotContains;break;case"StartsWith":t=sap.ui.model.FilterOperator.StartsWith;break;case"NotStartsWith":t=sap.ui.model.FilterOperator.NotStartsWith;break;case"EndsWith":t=sap.ui.model.FilterOperator.EndsWith;break;case"NotEndsWith":t=sap.ui.model.FilterOperator.NotEndsWith;break;default:t=sap.ui.model.FilterOperator.Contains;break}return t},applyColFilters:function(l,r){var o=r;var a=o._GenericFilterDialog;if(o._colFilters[l]!==undefined){if(a){var s=o._colFilters[l].items;var i=o._colFilters[l].values;var n=o._colFilters[l].custom;var g=[];var d=null;var u=o.byId(l).getColumns();s.forEach(e=>{var l=u.filter(t=>t.getAggregation("label").getProperty("text")===e.ColumnLabel)[0];var r=[];var o=null;if(e.filterType==="VLF"&&i[e.ColumnName].filter(e=>e.Selected===false).length>0){i[e.ColumnName].forEach(l=>{if(l.Selected){if(l.Value==="(blank)"){r.push(new t(e.ColumnName,this.getConnector("EQ"),""));r.push(new t(e.ColumnName,this.getConnector("EQ"),null));r.push(new t(e.ColumnName,this.getConnector("EQ"),undefined))}else if(e.DataType==="BOOLEAN"){if(l.Value==="Yes"){r.push(new t(e.ColumnName,this.getConnector("EQ"),true))}else{r.push(new t(e.ColumnName,this.getConnector("EQ"),false))}}else{r.push(new t(e.ColumnName,this.getConnector("EQ"),l.Value))}}});o=new t(r,false);g.push(new t(o));l.setProperty("filtered",true);e.isFiltered=true}else if(e.filterType==="UDF"&&n[e.ColumnName].ValFr!==""){if(n[e.ColumnName].ValTo!==""){g.push(new t(e.ColumnName,this.getConnector("BT"),n[e.ColumnName].ValFr,n[e.ColumnName].ValTo))}else{g.push(new t(e.ColumnName,this.getConnector(n[e.ColumnName].Operator),n[e.ColumnName].ValFr))}l.setProperty("filtered",true);e.isFiltered=true}else{l.setProperty("filtered",false);e.isFiltered=false}});if(g.length>0){d=new t(g,true)}else{d=""}o.byId(l).getBinding("rows").filter(d,"Application");if(l==="headerTab"){if(o.byId(l).getBinding("rows").aIndices.length===0){o.getView().getModel("ui").setProperty("/activeComp","");o.getView().getModel("ui").setProperty("/activeCompDisplay","");o.getView().getModel("counts").setProperty("/header",0);o.getView().getModel("counts").setProperty("/detail",0);o.byId("detailTab").setModel(new e({rows:[]}))}else{var m=o.byId(l).getModel().getData().rows.filter((e,t)=>t===o.byId(l).getBinding("rows").aIndices[0])[0].COSTCOMPCD;if(o.getView().getModel("ui").getProperty("/activeComp")!==m){o.byId(l).getModel().getData().rows.forEach(e=>{if(e.COSTCOMPCD===m){e.ACTIVE="X"}else{e.ACTIVE=""}});o.setActiveRowHighlight(l);o.getView().getModel("ui").setProperty("/activeComp",m);o.getView().getModel("ui").setProperty("/activeCompDisplay",m);o.getDetailData(false)}o.getView().getModel("counts").setProperty("/header",o.byId(l).getBinding("rows").aIndices.length)}}else if(l==="detailTab"){if(o.byId(l).getBinding("rows").aIndices.length===0){o.getView().getModel("counts").setProperty("/detail",0)}else{o.getView().getModel("counts").setProperty("/detail",o.byId(l).getBinding("rows").aIndices.length);o.setActiveRowHighlight(l)}}}}},removeColFilters:function(e,t){var l=t;var r=l._GenericFilterDialog;if(l._colFilters[e]!==undefined){if(r){var o=l._colFilters[e].items;var a=l._colFilters[e].values;var s="";o.forEach(e=>{a[e.ColumnName].forEach(e=>e.Selected=true);e.isFiltered=false});l.byId(e).getBinding("rows").filter(s,"Application");r.getContent()[0].getMasterPages()[0].getContent()[0].getItems().forEach(e=>e.setIcon("sap-icon://text-align-justified"));l.byId(e).getColumns().forEach(e=>{e.setProperty("filtered",false)})}}}}});