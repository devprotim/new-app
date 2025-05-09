import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from './services/api.service';
import { CashReceipt } from './models/cash-receipt.model';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'new-app';
  searchForm: FormGroup;
  yearOptions: number[] = [];
  cashReceiptData: CashReceipt[] = [];
  displayData: CashReceipt[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private apiService: ApiService) {
    this.searchForm = this.fb.group({
      yearRange: ['', Validators.required],
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required]
    });

    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 10; year--) {
      this.yearOptions.push(year);
    }
  }

  ngOnInit(): void {
    this.searchForm.patchValue({
      yearRange: new Date().getFullYear(),
      fromDate: this.formatDate(new Date()),
      toDate: this.formatDate(new Date())
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      this.fetchCashReceiptData();
    } else {
      Object.keys(this.searchForm.controls).forEach(key => {
        this.searchForm.get(key)?.markAsTouched();
      });
    }
  }

  fetchCashReceiptData(): void {
    const formValues = this.searchForm.value;
    this.isLoading = true;
    this.errorMessage = '';
    this.cashReceiptData = [];
    this.displayData = [];

    const fromDateISO = new Date(formValues.fromDate).toISOString();
    const toDateISO = new Date(formValues.toDate).toISOString();

    this.apiService.getCashReceiptData(fromDateISO, toDateISO).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.processHierarchicalData(response.data);
        } else {
          this.errorMessage = response.message || 'Failed to fetch data';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred while fetching data.';
      }
    });
  }

  processHierarchicalData(data: CashReceipt[]): void {
    if (!data || data.length === 0) {
      this.errorMessage = 'No data returned from the server';
      return;
    }

    this.cashReceiptData = data;
    this.cashReceiptData.forEach(item => {
      item.expanded = false;
      item.visible = item.levels === 1;
    });
    this.updateDisplayData();
  }

  updateDisplayData(): void {
    this.displayData = this.cashReceiptData.filter(item => item.visible);
  }

  toggleExpand(item: CashReceipt): void {
    item.expanded = !item.expanded;

    if (item.expanded) {
      this.cashReceiptData.forEach(child => {
        if (child.parentLevels === item.levels &&
          this.getParentLink(child) === this.getItemIdentifier(item)) {
          child.visible = true;
        }
      });
    } else {
      this.hideDescendants(item);
    }
    this.updateDisplayData();
  }

  hideDescendants(item: CashReceipt): void {
    const directChildren = this.cashReceiptData.filter(
      child => child.parentLevels === item.levels &&
        this.getParentLink(child) === this.getItemIdentifier(item)
    );
    directChildren.forEach(child => {
      child.visible = false;
      child.expanded = false;
      this.hideDescendants(child);
    });
  }

  getItemIdentifier(item: CashReceipt): string {
    switch (item.levels) {
      case 1: return item.transactionDate;
      case 2: return item.billManager;
      case 3: return item.counterType;
      case 4: return item.counterName;
      default: return '';
    }
  }

  getParentLink(item: CashReceipt): string {
    return item.parentLink;
  }

  isExpandable(item: CashReceipt): boolean {
    return item.heading === 'Y';
  }

  getExpandIcon(item: CashReceipt): string {
    if (!this.isExpandable(item)) return '';
    return item.expanded ? 'fas fa-minus-circle' : 'fas fa-plus-circle';
  }

  resetForm(): void {
    this.searchForm.reset();
    this.ngOnInit();
    this.cashReceiptData = [];
    this.displayData = [];
    this.errorMessage = '';
  }

  viewReceiptDetails(receipt: CashReceipt): void {
    alert(`Viewing details for ${receipt.counterName} on ${receipt.transactionDate}`);
  }

  approveReceipt(receipt: CashReceipt): void {
    alert(`Receipt for ${receipt.counterName} has been approved`);
    receipt.status = 'Approved';
  }

  rejectReceipt(receipt: CashReceipt): void {
    const reason = prompt('Please enter a reason for rejection:');
    if (reason) {
      alert(`Receipt for ${receipt.counterName} has been rejected. Reason: ${reason}`);
      receipt.status = 'Rejected';
      receipt.Remarks = reason;
    }
  }

  editReceipt(receipt: CashReceipt): void {
    alert(`Editing receipt for ${receipt.counterName}`);
  }

  formatCurrency(value: string): string {
    if (!value) return '0.00';
    const numValue = parseFloat(value.replace(/,/g, ''));
    return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
  }

  exportToExcel(): void {
    if (this.cashReceiptData.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = this.prepareDataForExport();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cash Receipts');
    const fileName = `CashReceipts_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  exportToPDF(): void {
    if (this.cashReceiptData.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = this.prepareDataForExport();
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text('Cash Receipt Data', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    autoTable(doc, {
      head: [['Date', 'Bill Manager', 'Counter Type', 'Counter Name', 'User Sessions',
        'Users', 'User Session Status', 'System Cash Closing Balance',
        'Cash Received Amount', 'Variance', 'Status', 'Remarks']],
      body: exportData.map(item => [
        item.Date, item.BillManager, item.CounterType, item.CounterName,
        item.UserSessions, item.Users, item.UserSessionStatus,
        item.SystemCashClosingBalance, item.CashReceivedAmount,
        item.Variance, item.Status, item.Remarks
      ]),
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    const fileName = `CashReceipts_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }

  private prepareDataForExport(): any[] {
    const leafNodes = this.cashReceiptData.filter(item => item.heading === 'N');
    return leafNodes.map(item => ({
      Date: new Date(item.transactionDate).toLocaleDateString(),
      BillManager: this.findParentValue(item, 2, 'billManager'),
      CounterType: this.findParentValue(item, 3, 'counterType'),
      CounterName: this.findParentValue(item, 4, 'counterName'),
      UserSessions: item.userSession,
      Users: item.users,
      UserSessionStatus: item.userSessionStatus,
      SystemCashClosingBalance: `$${this.formatCurrency(item.sysCashClosingBalance)}`,
      CashReceivedAmount: `$${this.formatCurrency(item.cashRcvAmt)}`,
      Variance: `$${this.formatCurrency(item.varience)}`,
      Status: item.status,
      Remarks: item.Remarks
    }));
  }

  private findParentValue(item: CashReceipt, level: number, property: string): string {
    if (item.levels === level) {
      return this.getPropertyValue(item, property);
    }

    const parent = this.cashReceiptData.find(
      p => p.levels === level && this.isParentOf(p, item)
    );

    return parent ? this.getPropertyValue(parent, property) : '';
  }

  private getPropertyValue(item: CashReceipt, property: string): string {
    switch (property) {
      case 'billManager': return item.billManager;
      case 'counterType': return item.counterType;
      case 'counterName': return item.counterName;
      case 'userSession': return item.userSession;
      case 'users': return item.users;
      case 'userSessionStatus': return item.userSessionStatus;
      default: return '';
    }
  }

  private isParentOf(parent: CashReceipt, child: CashReceipt): boolean {
    if (child.levels <= parent.levels) {
      return false;
    }

    if (child.parentLevels === parent.levels) {
      return this.getParentLink(child) === this.getItemIdentifier(parent);
    }

    const directParent = this.cashReceiptData.find(
      p => p.levels === child.parentLevels &&
        this.getParentLink(child) === this.getItemIdentifier(p)
    );

    return directParent ? this.isParentOf(parent, directParent) : false;
  }
}
