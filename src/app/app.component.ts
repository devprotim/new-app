import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'new-app';
  searchForm: FormGroup;
  yearOptions: number[] = [];

  constructor(private fb: FormBuilder) {
    // Initialize the form
    this.searchForm = this.fb.group({
      yearRange: ['', Validators.required],
      fromDate: ['', Validators.required],
      toDate: ['', Validators.required]
    });

    // Generate year options (current year and 10 years back)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 10; year--) {
      this.yearOptions.push(year);
    }
  }

  ngOnInit(): void {
    // Set default values
    this.searchForm.patchValue({
      yearRange: new Date().getFullYear(),
      fromDate: this.formatDate(new Date()),
      toDate: this.formatDate(new Date())
    });
  }

  // Helper method to format date as YYYY-MM-DD for the date input
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Method to handle form submission
  onSearch(): void {
    if (this.searchForm.valid) {
      console.log('Form submitted with values:', this.searchForm.value);
      // Here you would typically call your API service with these values
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.searchForm.controls).forEach(key => {
        const control = this.searchForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  // Method to reset the form
  resetForm(): void {
    this.searchForm.reset();
    this.ngOnInit(); // Reset to default values
  }
}
