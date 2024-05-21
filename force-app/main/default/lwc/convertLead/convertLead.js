import { LightningElement, wire, track, api } from 'lwc';
import { CloseActionScreenEvent } from "lightning/actions";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getLeadRecords from '@salesforce/apex/convertController.getLeadRecords';
import updateLead from '@salesforce/apex/convertController.updateLead';
import submitAccount from '@salesforce/apex/convertController.submitAccount';
import submitContact from '@salesforce/apex/convertController.submitContact';
import submitOpportunity from '@salesforce/apex/convertController.submitOpportunity';
import searchAccounts from '@salesforce/apex/convertController.searchAccounts';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import ACCOUNT_NAME_FIELD from '@salesforce/schema/Account.Name';
import searchContacts from '@salesforce/apex/convertController.searchContacts';
import searchOpty from '@salesforce/apex/convertController.searchOpty';
import OPPORTUNITY_OBJECT from '@salesforce/schema/Opportunities__c';
import CONTACT_OBJECT from '@salesforce/schema/Contact';
import LEAD_OBJECT from '@salesforce/schema/Leads__c';

console.log('90');

const FIELDS = [ACCOUNT_NAME_FIELD];
export default class ConvertLead extends LightningElement {

  activeSectionMessage = '';

  salutationsList = [
    { label: 'Mr.', value: 'Mr.' },
    { label: 'Ms.', value: 'Ms.' },
    { label: 'Mrs.', value: 'Mrs.' },
    { label: 'Dr.', value: 'Dr.' },
    { label: 'Prof.', value: 'Prof.' },
  ];

  get salutationOptions() {
    return this.salutationsList;
  }

  @api recordId;

  selectedValue;
  @track selectedOption;
  isExistingRecordSearch = false;

  value = 'Closed - Converted';
  @track isCreateNew = true;
  @track SkipContact = false;
  @track SkipOpportunity = false;
  accountName = '';
  opportunityName = '';
  contactName = '';
  contactFirstName = '';
  contactLastName = '';
  salutation ='';
  OwnerName = '';

  @track actName = '';
  @track accountList = [];
  @track objectApiName = 'Account';
  @track accountId;
  @track isShow = false;
  @track messageResult = false;
  @track isShowResult = true;
  @track showSearchedValues = false;

  @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
  accountObjectInfo;

  // Contact Search Functionality
  @track conName = '';
  @track contactList = [];
  @track objectApiName = 'Contact';
  @track contactId;
  @wire(getObjectInfo, { objectApiName: CONTACT_OBJECT })
  contactObjectInfo;

  // Opportunity Search
  @track oppName = '';
  @track opportunityList = [];
  @track objectApiName = 'Opportunities__c';
  @track opportunityId;
  @wire(getObjectInfo, { objectApiName: OPPORTUNITY_OBJECT })
  opportunityObjectInfo;

  handleToggleSection(event) {
    this.activeSectionMessage =
      'Open section name:  ' + event.detail.openSections;
  }

  get options() {
    return [
      { label: 'Closed - Converted', value: 'Closed - Converted' },
    ];
  }

  connectedCallback() {
    setTimeout(() => {
      getLeadRecords({ LeadId: this.recordId })
        .then(data => {
          console.log('Lead Id: ', this.recordId);
          this.accountName = data.Company__c;
          this.opportunityName = data.Company__c;
          this.contactName = data.FirstName__c + ' ' + data.LastName__c;
          this.contactFirstName = data.FirstName__c;
          this.contactLastName = data.LastName__c;
          this.salutation = data.Salutation__c;
          this.OwnerName = data.Owner.Name;
          console.log(data);
        });
    }, 10);
  }

  closeAction() {
    this.dispatchEvent(new CloseActionScreenEvent());
  }

  handleCheckboxChange(event) {
    const checkboxName = event.target.label;
    const isChecked = event.target.checked;

    if (checkboxName === 'Skip Contact') {
      this.SkipContact = isChecked;
    } else if (checkboxName === 'Skip Opportunity') {
      this.SkipOpportunity = isChecked;
    }
  }

  handleRadioChange(event) {
    this.selectedOption = event.target.value;
    console.log('testRadio', event.target.value);

    if (this.selectedOption === 'radio-61') {
      this.isCreateNew = true;
      this.isExistingRecordSearch = false;
      this.isShowResult = false;
    } else if (this.selectedOption === 'radio-62') {
      this.isCreateNew = false;
      this.isExistingRecordSearch = true;
      this.isShowResult = true;
    }
  }

  handleAccountNameChange(event) {
    this.accountName = event.target.value;
    if (this.selectedOption === 'radio-61') {
      this.accountName = event.target.value;
      this.accountRecordId = '';
    }
  }

  handleConNameChange(event) {
    this.salutation = event.detail.salutation;
    this.contactFirstName = event.detail.firstName;
    this.contactLastName = event.detail.lastName;
  }

  handleOppNameChange(event) {
    this.opportunityName = event.target.value;
    if (this.selectedOption === 'radio-61') {
      this.opportunityName = event.target.value;
      this.accountRecordId = '';
    }
  }

  @wire(searchAccounts, { searchTerm: '$actName' })
  retrieveAccounts({ error, data }) {
    this.messageResult = false;
    if (data) {
      console.log('data## ' + data.length);
      if (data.length > 0 && this.isShowResult) {
        this.accountList = data;
        this.showSearchedValues = true;
        this.messageResult = false;
      } else if (data.length === 0) {
        this.accountList = [];
        this.showSearchedValues = false;
        if (this.actName !== '') {
          this.messageResult = true;
        }
      } else if (error) {
        this.accountId = '';
        this.actName = '';
        this.accountList = [];
        this.showSearchedValues = false;
        this.messageResult = true;
      }
    }
  }

  searchHandleAccountClick(event) {
    this.isShowResult = true;
    this.messageResult = false;
  }

  searchHandleAccountKeyChange(event) {
    this.messageResult = false;
    this.actName = event.target.value;
  }

  parentHandleAccountAction(event) {
    this.showSearchedValues = false;
    this.isShowResult = false;
    this.messageResult = false;
    this.accountId = event.target.dataset.value;
    this.actName = event.target.dataset.label;
    console.log('accountId::' + this.accountId);
    const selectedEvent = new CustomEvent('selected', { detail: this.accountId });
    this.dispatchEvent(selectedEvent);
  }

  handleAccountSelection(event) {
    this.accountRecordId = event.target.value;
  }

  // Contact Search
  @wire(searchContacts, { searchTerm: '$conName' })
  retrieveContacts({ error, data }) {
    this.messageResult = false;
    if (data) {
      if (data.length > 0 && this.isShowResult) {
        this.contactList = data;
        this.showSearchedValues = true;
        this.messageResult = false;
      } else if (data.length === 0) {
        this.contactList = [];
        this.showSearchedValues = false;
        if (this.conName !== '') {
          this.messageResult = true;
        }
      }
    } else if (error) {
      this.contactId = '';
      this.conName = '';
      this.contactList = [];
      this.showSearchedValues = false;
      this.messageResult = true;
      console.error('Error retrieving contacts:', error);
    }
  }

  searchHandleContactClick(event) {
    this.isShowResult = true;
    this.messageResult = false;
  }

  searchHandleContactKeyChange(event) {
    this.messageResult = false;
    this.conName = event.target.value;
  }

  parentHandleContactAction(event) {
    this.showSearchedValues = false;
    this.isShowResult = false;
    this.messageResult = false;
    this.contactId = event.target.dataset.value;
    this.conName = event.target.dataset.label;
    const selectedEvent = new CustomEvent('selected', { detail: this.contactId });
    this.dispatchEvent(selectedEvent);
  }

  // Opportunity Search
  @wire(searchOpty, { searchTerm: '$oppName' })
  retrieveOpportunities({ error, data }) {
    this.messageResult = false;
    if (data) {
      console.log('data## ' + data.length);
      if (data.length > 0 && this.isShowResult) {
        this.opportunityList = data;
        this.showSearchedValues = true;
        this.messageResult = false;
      } else if (data.length === 0) {
        this.opportunityList = [];
        this.showSearchedValues = false;
        if (this.oppName != '') {
          this.messageResult = true;
        }
      } else if (error) {
        this.opportunityId = '';
        this.oppName = '';
        this.opportunityList = [];
        this.showSearchedValues = false;
        this.messageResult = true;
      }
    }
  }

  searchHandleOpportunityClick(event) {
    this.isShowResult = true;
    this.messageResult = false;
  }

  searchHandleOpportunityKeyChange(event) {
    this.messageResult = false;
    this.oppName = event.target.value;
  }

  parentHandleOpportunityAction(event) {
    this.showSearchedValues = false;
    this.isShowResult = false;
    this.messageResult = false;
    this.opportunityId = event.target.dataset.value;
    this.oppName = event.target.dataset.label;
    const selectedEvent = new CustomEvent('selected', { detail: this.opportunityId });
    this.dispatchEvent(selectedEvent);
  }

  handleAccountSelection(event) {
    this.accountRecordId = event.target.value;
  }

  handleOpportunityNameChange(event) {
    this.opportunityName = event.target.value;
  }

  convertLead(event) {
    console.log('Lead Id ::', this.recordId);
    console.log('Acc Name::', this.accountName);
    console.log('First Name::', this.contactFirstName);
    console.log('Last Name::', this.contactLastName);
    this.CreateAccount()
      .then(() => {
        return this.leadupdate();
      })
      .then(() => {
        return this.CreateContact();
      })
      .then(() => {
        return this.CreateOpportunity();
      })
      .catch(error => {
        console.error('Error creating records:', error);
        this.showToast('Error', 'An error occurred', 'error');
      });
  }

  leadupdate() {
    return updateLead({ leadId: this.recordId, skpCon: this.SkipContact, skpOpp: this.SkipOpportunity })
      .then(result => {
        console.log('lead is updated', result);
        this.leadId = result.Id;
      });
  }

  CreateAccount() {
    return submitAccount({ LeadCompany: this.accountName })
      .then(result => {
        console.log('acc is created', result);
        this.accId = result.Id;
        const toastEvent = new ShowToastEvent({
          title: 'Success',
          message: 'Lead Converted Successfully',
          variant: 'success',
          mode: 'dismissable'
        });
        this.dispatchEvent(toastEvent);
        this.updateRecordView();
      });
  }

  CreateContact() {
    if (!this.SkipContact) {
      return submitContact({ Salutation: this.Salutation, FirstName: this.contactFirstName, LastName: this.contactLastName, AccId: this.accId })
        .then(result => {
          console.log('con is created', result);
          this.conId = result.Id;
          const toastEvent = new ShowToastEvent({
            title: 'Success',
            message: 'Lead Converted Successfully',
            variant: 'success',
            mode: 'dismissable'
          });
          this.dispatchEvent(toastEvent);
          this.updateRecordView();
        });
    }
  }

  CreateOpportunity() {
    if (!this.SkipOpportunity) {
      return submitOpportunity({ LeadCompany: this.opportunityName, AccId: this.accId })
        .then(result => {
          console.log('opp is created', result);
          this.oppId = result.Id;
          const toastEvent = new ShowToastEvent({
            title: 'Success',
            message: 'Lead Converted Successfully',
            variant: 'success',
            mode: 'dismissable'
          });
          this.dispatchEvent(toastEvent);
          this.updateRecordView();
          window.location.href = '/lightning/o/Leads__c/list';
        });
    }
  }

  updateRecordView() {
    setTimeout(() => {
      eval("$A.get('e.force:refreshView').fire();");
    }, 600);
  }
}