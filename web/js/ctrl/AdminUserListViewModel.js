"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminUserListViewModel');

/**
 * Shows a list of all users of a company
 * @constructor
 */
tutao.tutanota.ctrl.AdminUserListViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    // @type {}
	this.userGroups = ko.observableArray([]);
	this.editing = ko.observable(null);
	this._selectedDomElements = [];
	this.newViewModel = ko.observable(null);
    this.customerInfo = ko.observable(null);
    this._customerAccountType = ko.observable(null);

    this.buttons = [
        new tutao.tutanota.ctrl.Button("adminUserAdd_action", 10,  this.createAccounts, this.createAccountsPossible, false, "newUserAction", "add", "adminUserAdd_action")
    ];
    this.buttonBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this.buttons, null, tutao.tutanota.gui.measureActionBarEntry);

    this.update();
};

tutao.tutanota.ctrl.AdminUserListViewModel.prototype.editUser = function(userGroup, event) {
	this.newViewModel(null);
	this.editing(new tutao.tutanota.ctrl.AdminEditUserViewModel(this, userGroup));
	tutao.tutanota.gui.unselect(this._selectedDomElements);
	this._selectedDomElements = [event.currentTarget];
	tutao.tutanota.gui.select(this._selectedDomElements);
    tutao.locator.settingsView.showChangeSettingsDetailsColumn();
};


tutao.tutanota.ctrl.AdminUserListViewModel.prototype.removeSelection = function() {
	this.editing(null);
    this.newViewModel(null);
	tutao.tutanota.gui.unselect(this._selectedDomElements);
	this._selectedDomElements = [];
};

tutao.tutanota.ctrl.AdminUserListViewModel.prototype.updateUserGroupInfo = function() {
    if (this.editing()) {
        // update the saved instance in our list
        var self = this;
        tutao.entity.sys.GroupInfo.load(this.editing().userGroupInfo.getId()).then(function(updatedUserGroupInfo) {
            var savedIndex = self.userGroups.indexOf(self.editing().userGroupInfo);
            self.userGroups.splice(savedIndex, 1);
            self.userGroups.splice(savedIndex, 0, updatedUserGroupInfo);

            // Update user group info for the logged in user.
            if (tutao.util.ArrayUtils.arrayEquals( tutao.locator.userController.getUserGroupInfo().getId(),updatedUserGroupInfo.getId()) ){
                tutao.locator.userController.setUserGroupInfo(updatedUserGroupInfo);
            }
            self.editing(null);
        })
    }
};

tutao.tutanota.ctrl.AdminUserListViewModel.prototype.createAccounts = function() {
	this.editing(null);
	this.newViewModel(new tutao.tutanota.ctrl.AdminUserAddViewModel(this));
    tutao.locator.settingsView.showChangeSettingsDetailsColumn();
};

tutao.tutanota.ctrl.AdminUserListViewModel.prototype.update = function () {
    var self = this;
    this._loadUserGroupEntries().then(function(groups) {
        self.userGroups([]);
        self.userGroups(groups);
    });
};

/**
 * Loads all user groups of the logged in users customer.
 * @return {Promise.<Array.<tutao.entity.sys.GroupInfo>>} Resolves to the the list of user group infos when finished, rejected if the rest call failed.
 */
tutao.tutanota.ctrl.AdminUserListViewModel.prototype._loadUserGroupEntries = function() {
    var self = this;
	return tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        self._customerAccountType(customer.getType());
        customer.loadCustomerInfo().then(function(customerInfo){
            self.customerInfo(customerInfo);
        });
        return tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.GroupInfo, customer.getUserGroups(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID);
	});
};

tutao.tutanota.ctrl.AdminUserListViewModel.prototype.createAccountsPossible = function(){
    var addUserAccountTypes = [tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER, tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM, tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_SYSTEM];
    return this.customerInfo() != null && tutao.util.ArrayUtils.contains(addUserAccountTypes, this._customerAccountType()) ;
};

