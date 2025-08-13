import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { AjaxService } from '../services/ajax.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademicYear } from '../academic-year/academic-year.component';

@Component({
  selector: 'app-data-target',
  templateUrl: './data-target.component.html',
  styleUrls: ['./data-target.component.scss']
})
export class DataTargetComponent implements OnInit {

  dataForm : FormGroup;
  schoolId: number = 0;
  userSubscription: Subscription[] = [];
  defaultADT : string = ''
  rows: number[] = [];
  academicYearId : Number | null = 1;
  academicYears: AcademicYear[] = [];
  academicYear : String = ''

  constructor(private fb : FormBuilder, private _userService: UserService, private _router: Router, private _ajaxService: AjaxService, private _snackbar: MatSnackBar,) {
    this.dataForm = this.fb.group({
      inputDataArray: this.fb.array([])
    });
  }

  ngOnInit() {
    if (this._userService.getAcademicYearId().value != null) {
      this.academicYearId = this._userService.getAcademicYearId().value
    }
    if (this._userService.getAcademicYears().value != null) {
      this.academicYears = this._userService.getAcademicYears().value
    }
    this.userSubscription.push(this._userService.getSchoolId().subscribe(value => {
      if (value != null) {
        this.schoolId = value;
        // this.getAnnualData();
      } else {
        this._router.navigate(['/dashboard'])
      }
    }))
    this.userSubscription.push(this._userService.getAcademicYearId().subscribe(value => {
      if (value != null) {
        this.academicYearId = value;
        const active = this.academicYears.filter(aca => aca.id == this.academicYearId)
        this.academicYear = active[0].year
        this.getAnnualData();
      }
    }))
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.userSubscription.forEach(sub => sub.unsubscribe());
  }

  get inputDataArray(): FormArray {
    return this.dataForm.get('inputDataArray') as FormArray;
  }

  getAnnualData() {
    this.inputDataArray.clear();
    this.dataForm.reset();
    let request = {
      "schoolId": this.schoolId,
      "academicYearId" : this.academicYearId
    }
    this._ajaxService.post('annualData/annualDataTarget', request).then((response: any) => {
      if (response.statusCode == 200) {
        if (response.data.length > 0 && response.data[0].defaultADT) this.defaultADT = response.data[0].defaultADT;
        if (response.data.length > 0 && response.data[0].additionalADT) {
          const updatedData = response.data[0].additionalADT.replace(/\n/g, "\\n");
          JSON.parse(updatedData).map((adt : any) => {
            this.inputDataArray.push(this.fb.control(adt))
            let row = adt.split('\n').length;
            this.rows.push(row+2)
          })
        }
      }
    })
  }

  addInput() {
    this.inputDataArray.push(this.fb.control(''));
    this.rows.push(1)
  }

  removeItem(idx: number): void {
    this.inputDataArray.removeAt(idx);
    this.rows = this.rows.filter((row, index) => index !== idx)
    this.saveData();
  }

  validateAndSanitizeData(data: string): string {
    // Replace any problematic characters, escape quotes, etc.
    return data.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

  saveData() {
    let sanitizedDataArray = this.dataForm.value.inputDataArray.map((data: string) => this.validateAndSanitizeData(data));
    let request = {
      "schoolId": this.schoolId,
      "additionalADT" : sanitizedDataArray,
      "academicYearId" : this.academicYearId
    }
    this._ajaxService.post('annualData/saveAdditonalData', request).then((response: any) => {
      if (response.statusCode == 200) {
        // this.getAnnualData();
        this._snackbar.open("Annual Data Target Updated Successfully", "OK", { duration: 3000, panelClass: "warning-success" });
      }
    })
  }


}
