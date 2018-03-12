sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/BusyIndicator"
], function(Controller, MessageToast, MessageBox, JSONModel, ODataModel, Filter, FilterOperator, BusyIndicator) {
	"use strict";
	return Controller.extend("ZADDORDER.controller.View1", {

		onInit: function() {
			var config = this.getOwnerComponent().getManifest();
			var sServiceUrl = config["sap.app"].dataSources.ZALL_PLANTS_SRV.uri;
			var oData = new ODataModel(sServiceUrl, true);
			var query = "/AddOrderCheckSet";
			BusyIndicator.show();
			oData.read(query, null, null, true, function(response) {
				if (response.results[0].Message !== 'OK') {
					MessageBox.show(response.results[0].Message, {
						icon: MessageBox.Icon.INFORMATION,
						onClose: function() {
							window.history.go(-1);
						}
					});
				}
			}, function(error) {
				MessageBox.error(JSON.parse(error.response.body).error.message.value, {
					title: "Error"
				});
			});
			this.GetData();
		},

		getContextByIndexn: function(oEvent) {
			var self = this;
			var promise = $.Deferred();
			var selectedGroup = oEvent.getSource().getBindingContext("itemModel").getObject();
			var material = selectedGroup.Gtin;
			this.GetData(material, "-");
		},

		getContextByIndexp: function(oEvent) {
			var self = this;
			var promise = $.Deferred();
			var selectedGroup = oEvent.getSource().getBindingContext("itemModel").getObject();
			var material = selectedGroup.Gtin;
			this.GetData(material, "p");
		},

		ClearBox: function() {
			var oView = this.getView();
			var URL = "/sap/opu/odata/sap/ZPREPARE_FLUX_SRV/ItemsSet(Zfilter='T" + "07" + "')";
			debugger;
			BusyIndicator.show();
			OData.read(URL, function(response) {
				BusyIndicator.hide();
				if (response.Message !== "" && response.EZtype === "O") {
					var oController = oView.getController();
					oController.getView().byId("TOOL_BAR").setVisible(false);
					oController.getView().byId("table1").setVisible(false);
					var model = new JSONModel();
					oController.getView().setModel(model, "itemModel");
					MessageBox.show(response.Message, {
						icon: MessageBox.Icon.INFORMATION,
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {
							if (oAction === "OK") {
								jQuery.sap.delayedCall(500, this, function() {
									oView.byId("SearchArt").focus();
								});
							}
						}
					});
				}
			}, function(error) {
				BusyIndicator.hide();
				console.log("Error: " + error.response.body.toString());
				//promise.reject();
			});
		},
		searchArt: function() {
			var oView = this.getView();
			var oController = oView.getController();
			var material = oView.byId("SearchArt").getValue();
			var URL2 = "/sap/opu/odata/sap/ZCHECK_VALUE_SCAN_SRV/MessageSet(PValue='12" + material + "')";
			debugger;
			BusyIndicator.show();
			OData.read(URL2, function(response2) {
				BusyIndicator.hide();
				if (response2.EMessage !== "" && response2.EZtype === "E") {
					var path = $.sap.getModulePath("Press_Shop_Fiori", "/audio");
					var aud = new Audio(path + "/MOREINFO.png");
					aud.play();
					oView.byId("SearchArt").setValue("");
					MessageBox.show(response2.EMessage, {
						icon: MessageBox.Icon.ERROR,
						onClose: function() {
							jQuery.sap.delayedCall(500, this, function() {
								oView.byId("SearchArt").focus();
							});
						}
					});
				} else {
					var oTable = oView.byId("table1");
					oTable.setVisible(true);
					oController.GetData(material);
				}
			}, function(error) {
				BusyIndicator.hide();
				console.log("Error: " + error.response.body.toString());
				//promise.reject();
			});
		},
		GetData: function(material, from, number) {
			var oView = this.getView();
			debugger;
			if (number != undefined) {
				searchString = "M" + "/" + material + "/" + "07" + "/" + number;
			} else {
				if (from == undefined) {
					from = "+";
					var searchString = "A" + material + "/" + "07" + from;
				} else {
					var searchString = "A" + material + "/" + "07" + from;
				}
			}
			material = oView.byId("SearchArt").setValue("");
			var URL = "/sap/opu/odata/sap/ZPREPARE_FLUX_SRV/ItemsSet?$filter=Zfilter " + "%20eq%20" + "%27" + searchString + "%27&$format=json";
			debugger;
			BusyIndicator.show();
			OData.read(URL, function(response) {
				BusyIndicator.hide();
				var newArray = response.results;
				var lines = newArray.length;
				if (response.results[0] != null) {
					var oTable = oView.byId("table1");
					oTable.setVisible(true);
					oView.byId("TOOL_BAR").setVisible(true);
					var sum = parseInt(response.results[0].Menge);
					for (var i = 1; i < response.results.length; i++) {
						if (i < response.results.length) {
							sum = parseInt(response.results[i].Menge) + sum;
						}
					}
					var model2 = new JSONModel({
						"Sum": sum,
						"Products": lines
					});
					oView.setModel(model2, "Model2");
					var model = new JSONModel({
						"items": newArray
					});
					model.setSizeLimit(100);
					oView.setModel(model, "itemModel");
				}
				jQuery.sap.delayedCall(500, this, function() {
					oView.byId("SearchArt").focus();
				});
			}, function(error) {
				BusyIndicator.hide();
				console.log("Error: " + error.response.body.toString());
				//promise.reject();
			});
		},

		Validate: function() {
			var oView = this.getView();
			var oController = oView.getController();
			var ocon = oView.byId("CONFIRM").getText();
			var oyes = oView.byId("YES").getText();
			var ono = oView.byId("NO").getText();
			MessageBox.show(
				ocon, {
					//icon: MessageBox.Icon.INFORMATION,
					actions: [oyes, ono],
					onClose: function(oAction) {
						if (oAction === oyes) {
							oController.SaveData();
						}
					}
				});
		},

		SaveData: function() {
			var oView = this.getView();
			var URL = "/sap/opu/odata/sap/ZPREPARE_FLUX_SRV/ItemsSet(Zfilter='S07')";
			BusyIndicator.show();
			OData.read(URL, function(response) {
				BusyIndicator.hide();
				if (response.Message !== "" && response.EZtype === "O") {
					oView.byId("TOOL_BAR").setVisible(false);
					oView.byId("table1").setVisible(false);
					var model = new JSONModel();
					oView.setModel(model, "itemModel");
					MessageBox.show(response.Message, {
						icon: MessageBox.Icon.INFORMATION,
						onClose: function() {
							jQuery.sap.delayedCall(500, this, function() {
								oView.byId("SearchArt").focus();
							});
						}
					});
				} else {
					var path = $.sap.getModulePath("Press_Shop_Fiori", "/audio");
					var aud = new Audio(path + "/MOREINFO.png");
					aud.play();
					MessageBox.show(response.Message, {
						icon: MessageBox.Icon.ERROR,
						onClose: function() {
							jQuery.sap.delayedCall(500, this, function() {
								oView.byId("SearchArt").focus();
							});
						}
					});
				}
			}, function(error) {
				BusyIndicator.hide();
				console.log("Error: " + error.response.body.toString());
				//promise.reject();
			});
		},

		update: function(evt) {
			var oView = this.getView();
			var oArticle_input = oView.byId("SearchArt");
			var id = evt.mParameters.id;
			debugger;
			var number = evt.mParameters.selectedItem.getKey();
			id = id.replace("oSelect", "gtin");
			var gtin = oView.byId(id).getText();
			if (!isNaN(number) && number > 0) {
				this.GetData(gtin, undefined, number);
				jQuery.sap.delayedCall(500, this, function() {
					oArticle_input.focus();
				});
			} else {
				var path = $.sap.getModulePath("Press_Shop_Fiori2", "/audio");
				var aud = new Audio(path + "/MOREINFO.png");
				aud.play();
				var infoMsg = oView.getModel("i18n").getResourceBundle().getText("numerical");
				MessageBox.show(infoMsg, {
					icon: MessageBox.Icon.ERROR,
					onClose: function() {
						jQuery.sap.delayedCall(500, this, function() {
							oArticle_input.focus();
						});
					}
				});
			}
		}
	});
});