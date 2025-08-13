import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { AjaxService } from '../services/ajax.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { AbstractControl, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface DataRow {
  [key: string]: any;
}

interface ParentColumn {
  name: string;
  childColumns: string[];
  data: DataRow[];
}

export interface AcademicYear {
  id : Number;
  year : String;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  academicYearName = new FormControl('', [Validators.required, this.academicYearValidator]);
  excelFileRead = false;
  errorHeaders = [{ text: "" }];
  @ViewChild('myModal') myModal: any;
  excelErrorList = [{ text: "" }];
  excelfile: any;
  adminUserDataForTable: any[] = [];
  schoolUserDataForTable: any[] = [];
  guestUserDataForTable: any[] = [];
  constructor(private _ajaxService: AjaxService, private snackbar: MatSnackBar, private _userService: UserService, private _router: Router, private modalService: NgbModal) { }
  columns: any;
  schoolNames: any = [];
  schoolIds: any = [];
  firstName: any = [];
  lastName: any = [];
  emails: any = [];
  alternateEmail: any = [];
  authProvider: any = [];
  regionsData: any = [];
  enableUsersData: boolean = true;
  uploadType: String = 'usersData';
  csipWorksheet: any = null;
  csipData: any = [];
  csipDataDuplicate: any = [];
  tableData: ParentColumn[] = [];
  csipDataForTable: any = [];
  copyOfCsipDataForTable: any = [];
  enrollmentSummary: any = [];
  blueRibbonCalculator: any = [];
  csipDataSchools: any = [];
  linkColumns: any = [];
  columnsToCalculate: any = [];
  currentPage = 1;
  itemsPerPage = 10;
  adminUserData: any[] = [];
  schoolUserData: any[] = [];
  userTableData: any[] = [];
  copyOfUserTableData: any[] = [];
  userTableColumnOrder: any[] = ['First Name', 'Last Name', 'Email', 'School Id', 'Role Id', 'Alternate Email'];
  otherExcelData: { [key: string]: any }[] = [];
  selectedValues: string[] = [];
  searchText = ''
  academicYears: AcademicYear[] = [];
  academicYearId = 1;
  submitted = false;

  @ViewChild('inptExcel') inptExcel: ElementRef | undefined;
  @ViewChild('input') input: ElementRef | undefined;

  ngOnInit(): void {
    // this.getSchoolData();
    this.getAllUsers()
    this.getAcademicYears();
    this._userService.getUserDetails().subscribe((value: any) => {
      if (value != undefined && Object.keys(value).length > 0) {
        if (value.roleId != 1) {
          this._router.navigate(['/dashboard'])
        }
      }
    });
  }

  academicYearValidator(control: AbstractControl): ValidationErrors | null {
    const pattern = /^[0-9]{4}-[0-9]{2}$/;
    return pattern.test(control.value) ? null : { invalidAcademicYear: true };
  }

  /**
   * @author Manjunath
   * @uses to filter the CSIP table.
   */
  applyFilter(event: Event | null, applyFilterOn : string) {
    // const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    let filterValue = ''
    if (event === null || event === undefined) {
      filterValue = this.searchText.trim().toLowerCase();
    } else {
      filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    }
    this.searchText = filterValue
    if (filterValue != null && filterValue != '' && filterValue != undefined) {
      if (applyFilterOn === 'csip') {
        this.csipDataForTable = this.copyOfCsipDataForTable;
        const filteredData:any[] = [];
        this.csipDataForTable.filter((school: any) => {
          if (school['School Name'].trim().toLowerCase().includes(filterValue)) {
            filteredData.push(school);
          }
        })
        this.csipDataForTable = filteredData
      } else {
        this.userTableData = this.copyOfUserTableData;
        const filteredData:any[] = [];
        this.userTableData.filter((user: any) => {
          if (user['First Name'].trim().toLowerCase().includes(filterValue) || user['Last Name'].trim().toLowerCase().includes(filterValue) || user['Email'].trim().toLowerCase().includes(filterValue)) {
            filteredData.push(user);
          }
        })
        if (filteredData.length == 0) {
          this.selectedValues = []
        };
        this.userTableData = filteredData;
      }
    } else {
      this.csipDataForTable = this.copyOfCsipDataForTable;
      this.userTableData = this.copyOfUserTableData;
    }
  }

  /**
   * @author Manjunath
   * @uses to filter the user table
   * @param event 
   */
  filterForUserTable(event: any | null) {
    if (event != null) {
      const value = event.target.value;
      if (event.target.checked) {
        this.selectedValues.push(value);
      } else {
        const index = this.selectedValues.indexOf(value);
        if (index !== -1) {
          this.selectedValues.splice(index, 1);
        }
      }
    } else {
      this.selectedValues = [];
    }
    const fil: { [key: string]: any[] } = {
      'Admin': this.adminUserDataForTable,
      'Principal': this.schoolUserDataForTable,
      'Guest': this.guestUserDataForTable,
    };
    let count = 0;
    for(const value in fil){
      if (this.selectedValues.length > 0){
        if(this.selectedValues.includes(value)) {
          count == 0 ? this.userTableData = [...fil[value]] : this.userTableData = [...this.userTableData, ...fil[value]]
          count == 0 ? this.copyOfUserTableData = [...fil[value]] : this.copyOfUserTableData = [...this.copyOfUserTableData, ...fil[value]]
          count++
          if (this.searchText != '' && this.searchText) {
            this.applyFilter(null, 'user');
          }
        }
      } else {
        this.userTableData = [...this.adminUserDataForTable, ...this.schoolUserDataForTable, ...this.guestUserDataForTable]
        this.copyOfUserTableData = [...this.adminUserDataForTable, ...this.schoolUserDataForTable, ...this.guestUserDataForTable];
        if (this.searchText != '' && this.searchText) {
          this.applyFilter(null, 'user');
        }
      }
      
    }
  }

  /**
   * @author Gopi
   * @uses to upload the excel data
   */
  uploadExcelFile(uploadType: any) {
    if (!this.excelfile) {
      this.snackbar.open("Please upload the Excel template.", "OK", { duration: 3000, panelClass: "warning-dialog" });
      return;
    }
    else {
      if (uploadType === 'usersData') {
        const schools = this.schoolNames.map((item: any, index: any) => ({ ...item, ...this.schoolIds[index] }));
        const userNames = this.firstName.map((item: any, index: any) => ({ ...item, ...this.lastName[index] }));
        const emails = userNames.map((item: any, index: any) => ({ ...item, ...this.emails[index] }));
        const authProvider = emails.map((item: any, index: any) => ({ ...item, ...this.authProvider[index] }));
        const users = authProvider.map((item: any, index: any) => ({ ...item, ...schools[index] }));
        const updatedUser = [...this.adminUserData, ...this.schoolUserData]
        let request = {
          "users": updatedUser,
          "schools": schools,
        }
        this._ajaxService.post('admin/saveExcelData', request).then((response: any) => {
          if (response.statusCode == 200) {
            this.excelfile = null;
            if (this.inptExcel) this.inptExcel.nativeElement.value = '';
            if(this.input?.nativeElement.value != undefined) this.input.nativeElement.value = null
            this.getAllUsers();
            this.setPage(1);
            this.snackbar.open("Excel file uploaded successfully", "OK", { duration: 3000, panelClass: "success-dialog" });
          }
          else if (response.statusCode == 400) {
            this.snackbar.open("Error while uploading excel file", "OK", { duration: 3000, panelClass: "warning-dialog" })
          }
          else if (response.statusCode == 401) {
            this.snackbar.open("Schools data cann't be empty", "OK", { duration: 3000, panelClass: "warning-dialog" })
          } else {
            this.snackbar.open("Error while uploading excel file", "OK", { duration: 3000, panelClass: "warning-dialog" })
          }
        })
      }
      else {
        let request: { [key: string]: any } = {
          'schools': this.csipDataSchools,
          'enrollmentSummary': this.enrollmentSummary,
          // 'blueRibbonCalculator': this.blueRibbonCalculator,
          'academicYearId' : this.academicYearId,
          // 'ARK Proficiency by Grade' : [] // need to remove. A temp solution
        };
        this.otherExcelData.forEach((obj) => {
          const key = Object.keys(obj)[0]
          const value = Object.values(obj)[0]
          request[key] = value;
        })
        
        this._ajaxService.post('admin/saveCSIPData', request).then((response: any) => {
          if (response.statusCode == 200) {
            this._ajaxService.post('admin/saveCSIPDataTwo', request).then((response: any) => {
              if (response.statusCode == 200) {
                this.snackbar.open("Data uploaded successfully", "OK", { duration: 3000, panelClass: "success-dialog" });
                this.excelfile = null;
                if (this.inptExcel) this.inptExcel.nativeElement.value = '';
                if(this.input?.nativeElement.value != undefined) this.input.nativeElement.value = null
                this.getSchoolData();
                this.resetCSIPdata();
                this.setPage(1);
              } else {
                this.snackbar.open("Error while uploading data", "OK", { duration: 3000, panelClass: "warning-dialog" })
              }
            })
          }
          else {
            this.snackbar.open("Error while uploading data", "OK", { duration: 3000, panelClass: "warning-dialog" })
          }
        })
      }
    }
  }

  /**
   * @author Manjunath
   * @uses to format regional and school level user data
   */
  tansformSchoolUserData(usersData: any[]) {
    const transformedData = Object.values(usersData.reduce((acc, curr) => {
      const { Email, 'First Name': firstName, 'Last Name': lastName, 'Alternate Email': alternateEmail, ...schoolDetails } = curr;
      if (!acc[Email]) {
        acc[Email] = { Email, 'First Name': firstName, 'Last Name': lastName, 'Alternate Email': alternateEmail, SchoolDetails: [schoolDetails] };
      } else {
        acc[Email].SchoolDetails.push(schoolDetails);
      }
      return acc;
    }, {}));
    return transformedData;
  }

  /**
   * @author Manjunath
   * @uses to format regional and school level user data
   */
  updateUserData(userData: any[], userColumns: any[], type: string) {
    const fomattedData: any[] = [];
    if (userData.length > 0) {
      userData.forEach((user: any) => {
        let roleId: number = type == 'admin' ? 2 : 3;
        if (user.some((cell: string | null | undefined) => cell !== undefined && cell !== null && cell !== '')) {
          const rowData: { [key: string]: unknown } = {};
          for (let i = 0; i < userColumns.length; i++) {
            const colName = userColumns[i];
            const colVal = user[i];
            rowData[colName] = colVal
          }
          if (roleId == 2 && rowData['Email'] == 'hal@silverlininglearning.com') {
            roleId = 1
          }
          if (rowData['Email'] || rowData['Alternate Email']) {
            rowData['roleId'] = roleId
            fomattedData.push(rowData)
          }
        }
      })
    }
    return fomattedData
  }

  /**
   * @author Gopi
   * @uses to read the excel data
   */
  onFileChange(event: any, fileType: any) {
    const file = event.target.files[0];
    this.excelfile = file
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      if (fileType === 'usersData') {
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const superAdminData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const worksheetOne = workbook.Sheets[workbook.SheetNames[0]];
        const regionalDirectorData = XLSX.utils.sheet_to_json(worksheetOne, { header: 1 });
        const worksheetTwoData = workbook.Sheets[workbook.SheetNames[1]];
        const schoolLevelData = XLSX.utils.sheet_to_json(worksheetTwoData, { header: 1 });
        this.formatExcelData(superAdminData, 'superAdmin');
        this.adminUserData = this.updateUserData(regionalDirectorData.slice(1), regionalDirectorData[0] as string[], 'admin')
        this.schoolUserData = this.updateUserData(schoolLevelData.slice(1), schoolLevelData[0] as string[], 'principle')
      }
      else {
        const sheetName: string = workbook.SheetNames[0];
        const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const columnNames = jsonData[1] as string[];
        const dataRows: any[][] = jsonData.slice(2);
        // const finalData: { [key: string]: any }[] = [];
        workbook.SheetNames.forEach((sheet) => {
          if (sheet !== '') {
            const worksheet: XLSX.WorkSheet = workbook.Sheets[sheet];
            Object.keys(worksheet).forEach((key) => {
              // const k = Object.keys(worksheet[key])
              if (worksheet[key]['t'] == 'e') {
                // console.log(worksheet[key])
                worksheet[key]['t'] = 's'
                if (sheet === 'ARK Proficiency by Grade' || sheet === 'School Capacity by Grade') {
                  worksheet[key]['v'] = 0
                } else {
                  worksheet[key]['v'] = worksheet[key]['w']
                }
              }
            })
            const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
            const parentColumn = jsonData[0] as string[];
            const childColumn = jsonData[1] as string[];
            const dataRows: any[][] = jsonData.slice(2);
            const results = this.extractData(dataRows, parentColumn, childColumn)  
            const calculated = this.calculatePercentageCellValues(results)
            // finalData.push({ [sheet] : calculated });
            this.otherExcelData.push({ [sheet]: calculated });
            if (sheet === 'Dashboard Data Summary') this.csipData = calculated
          }
        })
        dataRows.forEach((school: any) => {
          if (school.some((cell: string | null | undefined) => cell !== undefined && cell !== null && cell !== '')) {
            const rowData: { [key: string]: unknown } = {};
            for (let i = 0; i < columnNames.length; i++) {
              const columnName = columnNames[i];
              const cellValue = school[i];
              rowData[columnName] = cellValue;
            }
            if (rowData['School ID'] != undefined && rowData['School ID'] != null && rowData['School ID'] != '') this.csipDataDuplicate.push(rowData)
          }
        })        
        if (this.csipData.length != 0) {
          this.fomatCsipDataFile()
        }
      }
    };
    fileReader.readAsArrayBuffer(file);
  }

  /**
   * @author Manjunath
   * @uses to extract data from excel sheets. 
   * @requires An excel sheet with 2 rows of header.
   */
  extractData(dataRows: any[], parentColumn: any[], childColumn: any[]) {
    const finalData: any[] = [];
    dataRows.forEach((school: any) => {
      let lastkey: string | null = null
      if (school.some((cell: string | null | undefined) => cell !== undefined && cell !== null && cell !== '')) {
        const response: { [key: string]: any } = {};
        for (let i = 0; i < school.length; i++) {
          if (parentColumn[i] == undefined) {
            const obj = {
              [childColumn[i]]: school[i]
            };
            // const lastItemKey = Object.keys(response).pop();
            if (lastkey !== null) {
              response[lastkey] = { ...response[lastkey], ...obj };
            } else {
              // response[childColumn[i]] = obj;
              response[childColumn[i]] = school[i];
            }
          } else {
            if (childColumn[i] !== undefined) {
              const obj = {
                [childColumn[i]]: school[i],
              };
              response[parentColumn[i]] = obj;
              lastkey = parentColumn[i]
            } else {
              response[parentColumn[i]] = school[i];
              lastkey = parentColumn[i]
            }

          }
        }
        if (response['School ID'] != undefined && response['School ID'] != null && response['School ID'] != '') finalData.push(response)
      }
      else {
        lastkey = null;
      }
    })
    return finalData
  }

  /**
   * @author Manjunath
   * @uses to calculate the pecentage value of excel sheet with type percentage.
   */
  calculatePercentageCellValues(finalData: any[]) {
    const columnsToCalculate = ['Reading Proficiency by Grade', 'Math Proficiency by Grade', 'ARK Proficiency by Grade', 'Percent of Grade Levels Meeting BR Criteria', 'Catholic', 'Ethnicity Breakdown', 'Racial Breakdown', 'Learning Modications and Supports']
    // const parentColumn = Object.keys(finalData[0])
    if(finalData.length > 0) {
      finalData.forEach((row) => {
        for (const key in row) {
          if (row.hasOwnProperty(key) && columnsToCalculate.includes(key)) {
            if (typeof row[key] === 'object') {
              for (const subKey in row[key]) {
                if (row[key].hasOwnProperty(subKey)) {
                  row[key][subKey] = row[key][subKey] ? Number((row[key][subKey] * 100).toFixed(2)) : 0;
                }
              }
            } else {
              row[key] = row[key] ? Number((row[key] * 100).toFixed(2)) : 0;
            }
          }
        }
      });
    }
    return finalData;
  }

  getAdtGoal(obj: { [key: string]: string }): string {
    for (const key in obj) {
      if (obj[key] === "yes" || obj[key] === "Yes") {
        return key;
      }
    }
    return "N/A"; // Return "N/A" if no key has value "yes"
  }

  /**
   * @author Manjunath
   * @uses to format CSIP data file
   */
  fomatCsipDataFile() {
    this.csipData.forEach((school: any) => {
      const schools = {
        'schoolName': school['School Name'],
        'schoolId': Number(school['School ID']),
        'readingProficencyOverall': school['Academic Performance Summary']['Reading % Proficency Overall'] != undefined && school['Academic Performance Summary']['Reading % Proficency Overall'] != 'N/A' && school['Academic Performance Summary']['Reading % Proficency Overall'] != '#N/A' ? Number((school['Academic Performance Summary']['Reading % Proficency Overall'] * 100).toFixed(2)) : 0,
        'mathProficencyOverall': school['Academic Performance Summary']['Math % Proficency Overall'] != undefined && school['Academic Performance Summary']['Math % Proficency Overall'] != 'N/A' && school['Academic Performance Summary']['Math % Proficency Overall'] != '#N/A' ? Number((school['Academic Performance Summary']['Math % Proficency Overall'] * 100).toFixed(2)) : 0,
        'readingAvgChangeInNCE': school['Academic Performance Summary']['Reading Avg Change in NCE'] != undefined && school['Academic Performance Summary']['Reading Avg Change in NCE'] != 'N/A' && school['Academic Performance Summary']['Reading Avg Change in NCE'] != '#N/A' ? Number(school['Academic Performance Summary']['Reading Avg Change in NCE'].toFixed(2)) : 0,
        'mathAvgChangeInNCE': school['Academic Performance Summary']['Math Avg Change in NCE'] != undefined && school['Academic Performance Summary']['Math Avg Change in NCE'] != 'N/A' && school['Academic Performance Summary']['Math Avg Change in NCE'] != '#N/A' ? Number(school['Academic Performance Summary']['Math Avg Change in NCE'].toFixed(2)) : 0,
        'ELAGrowthPercent': school['Academic Performance Summary']['MAP ELA Growth'] != undefined && school['Academic Performance Summary']['MAP ELA Growth'] != 'N/A' && school['Academic Performance Summary']['MAP ELA Growth'] != '#N/A' ? Number((school['Academic Performance Summary']['MAP ELA Growth'] * 100).toFixed(2)) : 0,
        'MathGrowthPercent': school['Academic Performance Summary']['MAP Math Growth'] != undefined && school['Academic Performance Summary']['MAP Math Growth'] != 'N/A' && school['Academic Performance Summary']['MAP Math Growth'] != '#N/A' ? Number((school['Academic Performance Summary']['MAP Math Growth'] * 100).toFixed(2)) : 0,
        'ELAAvgOrBetter': school['Academic Performance Summary']['MAP ELA % of Avg or Better'] != undefined && school['Academic Performance Summary']['MAP ELA % of Avg or Better'] != 'N/A' && school['Academic Performance Summary']['MAP ELA % of Avg or Better'] != '#N/A' ? Number(school['Academic Performance Summary']['MAP ELA % of Avg or Better'].toFixed(2)) : 0,
        'MathAvgOrBetter': school['Academic Performance Summary']['MAP Math % Avg or Better'] != undefined && school['Academic Performance Summary']['MAP Math % Avg or Better'] != 'N/A' && school['Academic Performance Summary']['MAP Math % Avg or Better'] != '#N/A' ? Number(school['Academic Performance Summary']['MAP Math % Avg or Better'].toFixed(2)) : 0,
        'ARKHigh': school['ARK Performance Summary']['% ARK Proficency High'] != undefined && school['ARK Performance Summary']['% ARK Proficency High'] != 'N/A' && school['ARK Performance Summary']['% ARK Proficency High'] != '#N/A' ? Number((school['ARK Performance Summary']['% ARK Proficency High'] * 100).toFixed(2)) : 0,
        'ARKModerate': school['ARK Performance Summary']['% ARK proficency Med'] != undefined && school['ARK Performance Summary']['% ARK proficency Med'] != 'N/A' && school['ARK Performance Summary']['% ARK proficency Med'] != '#N/A' ? Number((school['ARK Performance Summary']['% ARK proficency Med'] * 100).toFixed(2)) : 0,
        'ARKLow': school['ARK Performance Summary']['% ARK Proficency Low'] != undefined && school['ARK Performance Summary']['% ARK Proficency Low'] != 'N/A' && school['ARK Performance Summary']['% ARK Proficency Low'] != '#N/A' ? Number((school['ARK Performance Summary']['% ARK Proficency Low'] * 100).toFixed(2)) : 0,
        // 'MathAvgOrBetter': school['Student Demographic Information']['% of Students in Poverty'] != undefined && school['% of Students in Poverty'] != 'N/A' && school['% of Students in Poverty'] != '#N/A' ? Number((school['% of Students in Poverty'] * 100).toFixed(2)) : 0,
        // 'ELAAvgOrBetter': school['Student Demographic Information']['% of students on Plan'] != undefined && school['% of students on Plan'] != 'N/A' && school['% of students on Plan'] != '#N/A' ? Number((school['% of students on Plan'] * 100).toFixed(2)) : 0,
        // 'MathGrowthPercent': school['Student Demographic Information']['% of students on scholarship'] != undefined && school['% of students on scholarship'] != 'N/A' && school['% of students on scholarship'] != '#N/A' ? Number((school['% of students on scholarship'] * 100).toFixed(2)) : 0,
        // 'ELAGrowthPercent': school['Academic Performance Summary']['MAP ELA Growth'] != undefined && school['% of students on scholarship'] != 'N/A' && school['% of students on scholarship'] != '#N/A' ? Number((school['% of students on scholarship'] * 100).toFixed(2)) : 0,
        'readingProficient<50': school['Flag Reading Overall Proficency']['Percent Proficient is <50%'],
        'mathProficient<50': school['Flag Math Overall Proficency']['Percent Proficient is <50%'],
        'negativeChangeInReadingNCE': school['NCE Reading Flag']['Negative Change in Reading NCE'],
        'NegativeChangeInMathNCE': school['NCE Math Flag']['Negative Change in Math NCE'],
        "studentsScoreLowOnARK": school['ARK Proficiency Flag']['>50% of students scored "Low" on ARK'],
        'Enrollment<240': school['Enrollment Flag']['Enrollment is <240'],
        'AvgEnrollment<20': school['K-2 Enrollment Flag ']['Avg. K-2 Enrollment is <20'],
        // "percentOfCapacity": school['Enrollment Capacity Flag']['% of Capacity'] != undefined && school['Enrollment Capacity Flag']['% of Capacity'] != 'N/A' ? Number((school['Enrollment Capacity Flag']['% of Capacity'] * 100).toFixed(2)) : 0,
        // "schoolIsUnderCapacity": school['Enrollment Capacity Flag']['School is Under Capacity'],
        "defaultADT" : this.getAdtGoal(school["ADT Goal"]),
        "blueRibbonCalculator" : school["Blue Ribbon Calculator"],
        "County" : school["County"]
      }
      this.csipDataSchools.push(schools)
    })
    this.getEnrollmentSummary();
  }

  /**
   * @author Gopi
   * @uses to format the excel data
   */
  formatExcelData(excelData: any, type: String) {
    excelData.forEach((data: any, index: any) => {
      if (index != 0) {
        data.forEach((userData: any, userIndex: any) => {
          userIndex == 0 ? this.schoolNames.push({
            "index": index,
            "schoolName": userData
          }) : userIndex == 1 ? this.schoolIds.push({
            "index": index,
            "schoolId": userData
          }) : userIndex == 2 ? this.firstName.push({
            "index": index,
            "firstName": userData,
            "roleId": type === 'superAdmin' ? 1 : type === 'regional' ? 2 : 3
          }) : userIndex == 3 ? this.lastName.push({
            "index": index,
            "lastName": userData,
          }) : userIndex == 4 ? this.emails.push({
            "index": index,
            "email": userData,
          }) : userIndex == 5 ? this.alternateEmail.push({
            "index": index,
            "alternateEmail": ''
          }) : userIndex == 6 ? this.authProvider.push({
            "index": index,
            "authProvider": userData,
          }) : ''
        })
      }
    })
  }

  /**
  * @author Gopi
  * @uses to change the upload data
  */
  changeDataUpload() {
    this.searchText = '';
    this.setPage(1);
    this.csipDataForTable = this.copyOfCsipDataForTable;
    this.filterForUserTable(null)
    if (this.uploadType === 'usersData') {
      this.enableUsersData = true;
      this.resetCSIPdata();
    }
    else {
      this.enableUsersData = false;
    }
  }

  /**
  * @author Manjunath
  * @uses to get enrollment summary from uploaded csip data file
  */
  getEnrollmentSummary() {
    const regex = /FY\d{2}/;
    if (this.csipData.length !== 0) {
      this.enrollmentSummary = this.csipDataDuplicate.reduce((acc: any[], obj: any) => {
        const matchingKeys = Object.keys(obj).filter((key) => regex.test(key));
        if (matchingKeys.length > 0) {
          const filteredObj: any = {};
          matchingKeys.forEach((key) => {
            const updatedKey = key.split('Y');
            const year = parseInt(updatedKey[1], 10);
            const value = obj[key];
            filteredObj['year'] = Number('20' + year);
            filteredObj['value'] = value == 'N/A' || value == 'n/a' || value == null ? null : value;
            if (obj.hasOwnProperty('School ID')) {
              filteredObj['schoolId'] = obj['School ID'];
            }
            if (obj.hasOwnProperty('K-2 Total Enrollment')) {
              filteredObj.avgEnrollment = obj['K-2 Total Enrollment'] == 'N/A' || obj['K-2 Total Enrollment'] == 'n/a' || obj['K-2 Total Enrollment'] == null ? null : Number(obj['K-2 Total Enrollment'].toFixed(2));
            }
            acc.push({ ...filteredObj });
          });
        }
        return acc;
      }, []);
    }
  }

  /**
   * @author Manjunath
   * @uses to get blue ribbon calculator data from uploaded csip data file
   */
  getBlueRibbonCal() {
    const regex = /BRC (Spring|Fall) \d{4}/;
    if (this.csipData.length != 0) {
      this.blueRibbonCalculator = this.csipData.reduce((acc: { [key: string]: string }[], obj: any) => {
        const matchingKeys = Object.keys(obj).filter(key => regex.test(key));
        if (matchingKeys.length > 0) {
          const filteredObj = matchingKeys.reduce((filtered, key) => {
            try {
              const updatedKey = key.split(' ')
              filtered[updatedKey[1]] = obj[key] as string;
              filtered['year'] = updatedKey[2]
            } catch {
              filtered[key] = obj[key] as string;
              filtered['year'] = key
            }
            return filtered;
          }, {} as { [key: string]: string });
          if (obj.hasOwnProperty("School ID")) {
            filteredObj["schoolId"] = obj["School ID"] as string;
          }
          acc.push(filteredObj);
        }
        return acc;
      }, []);
    }
  }

  /**
   * @author Manjunath
   * @uses to slice data for a page
   */
  getPaginatedData(name: string): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    if (name === 'csip') {
      return this.csipDataForTable.slice(startIndex, endIndex);
    } else {
      return this.userTableData.slice(startIndex, endIndex);
    }
  }

  /**
   * @author Manjunath
   * @uses to update page number
   */
  setPage(pageNumber: number) {
    this.currentPage = pageNumber;
  }

  /**
   * @author Manjunath
   * @uses to get numbers of pages
   */
  getPageNumbers(name: string): number[] {
    if (name === 'csip') {
      const totalPages = Math.ceil(this.tableData[0]?.data.length / this.itemsPerPage);
      return Array(totalPages).fill(0).map((_, index) => index + 1);
    } else {
      const totalPages = Math.ceil(this.userTableData.length / this.itemsPerPage);
      return Array(totalPages).fill(0).map((_, index) => index + 1);
    }
  }

  /**
   * @author Manjunath
   * @uses to set css class in CSIP table
   */
  getCellClass(cellData: any): any {
    if (cellData === 'Organized') {
      return 'organized';
    } else if (cellData === 'Well-Organized') {
      return 'well-organized';
    } else if (cellData === 'Partially Organized') {
      return 'partially'
    } else if (cellData === 'Moderately Organized') {
      return 'moderate'
    } else if (cellData === 'Not Yet Organized') {
      return 'notyet'
    }
    return null;
  }

  /**
   * @author Manjunath
   * @uses to update cell value of CSIP data
   */
  updateCellValue(columnName: string, cellData: any): any {
    if (this.linkColumns.includes(columnName)) {
      if (cellData !== undefined && cellData != null && cellData != '') {
        return `<a href="${cellData}" target="_blank">link</a>`;
      } else {
        return cellData;
      };
    } else if (this.columnsToCalculate.includes(columnName)) {
      if (cellData !== undefined && cellData != null && cellData != '' && cellData != 'N/A') {
        return (Number(cellData)).toFixed(2);
      } else {
        return 0;
      };
    };
    return cellData;
  }

  /**
   * @author Manjunath
   * @uses to Reset CSIP data arrays
   */
  resetCSIPdata() {
    this.csipData = [];
    this.enrollmentSummary = [];
    this.blueRibbonCalculator = [];
    this.csipDataSchools = [];
  }

  /**
   * @author Manjunath
   * @uses to merge different arrays on schoolId
   */
  combineArrays(...arrays: any[][]): any[] {
    const combinedMap = new Map<number, any>();
    arrays.forEach(arr => {
      arr.forEach((obj: any) => {
        const schoolId = obj.schoolId;
        if (!combinedMap.has(schoolId)) {
          combinedMap.set(schoolId, { schoolId });
        }
        combinedMap.set(schoolId, { ...combinedMap.get(schoolId), ...obj });
      });
    });
    return Array.from(combinedMap.values());
  }

  /**
   * @author Manjunath
   * @uses to update key names to display in table
   */
  updateKeys(schoolsArray: any[]): any[] {
    const keyConfig: { [key: string]: string } = {
      'schoolId': 'School Id',
      'name': 'School Name',
      'readingProficencyOverall': 'Reading % Proficency Overall',
      'mathProficencyOverall': 'Math % Proficency Overall',
      'readingAvgChange': 'Reading Avg Change in NCE',
      'mathAvgChange': 'Math Avg Change in NCE',

      // studentsPovertyPercent	studentsPlanPercent	studentsScholarShipPercent
      'studentsPovertyPercent': '% of Students in Poverty',
      'studentsPlanPercent': '% of students on Plan',
      'studentsScholarShipPercent': '% of students on scholarship',
      'ProficencyHigh': '%ARK ProficencyHigh',
      'ProficencyModerate': '%ARK ProficencyModerate',
      'ProficencyLow': '%ARK ProficencyLow',

      // ReadingproficientPercentLessThan50	MathproficientPercentLessThan50	ReadingnegativeChangeInNce	MathnegativeChangeInNce	greaterThan50PercentScored	enrollmentLessThan240	averageEnrollment	capacitypercent	schoolUnderCapacity
      'capacitypercent': '% of Capacity',
      'schoolUnderCapacity': 'School is Under Capacity',
      'averageEnrollment': 'Avg. K-2 Enrollment is <20',
      'ReadingproficientPercentLessThan50': 'Reading Percent Proficient is <50%',
      'MathproficientPercentLessThan50': 'Math Percent Proficient is <50%',
      'ReadingnegativeChangeInNce': 'Negative Change in Reading NCE',
      'MathnegativeChangeInNce': 'Negative Change in Math NCE',
      'greaterThan50PercentScored': '>50% of students scored "Low" on ARK',
      'enrollmentLessThan240': 'Enrollment is <240',

      'ambitiousInstruction': 'Ambitious Instruction',
      'essentialsWeakOrVeryWeakRating': '5-Essentials Overall Rating = Weak or Very Weak',
      'essentialsLowResponseConcern': 'Low Response Rate Concern',
      'lessThan3OutOf5EssentialsCategorizedAsStrong': '<  3 out of 5 Essentials categorized as Strong',
      'enrollmentDropFromFY22-23 >5%': 'Enrollment Drop from FY22-23 >5%',
      
    };

    this.tableData.forEach(parentColumn => {
      parentColumn.childColumns = parentColumn.childColumns.map(oldColumn => keyConfig[oldColumn] || oldColumn);
    });

    return schoolsArray.map(school => {
      const updatedSchool: any = {};

      Object.keys(school).forEach(oldKey => {
        const newKey = keyConfig[oldKey];
        updatedSchool[newKey || oldKey] = school[oldKey];
      });

      return updatedSchool;
    });
  }

  /**
   * @author Manjunath
   * @uses to sort Enrollment Summary by year
   */
  customSort(item: any) {
    return item.startsWith('FY') ? 0 : 1;
  }

  /**
   * @author Manjunath
   * @uses to format data to display in table CSIP data
   */
  transformData(data: any): ParentColumn[] {
    const transformedData: ParentColumn[] = [];

    for (const parentColumnName in data) {
      if (data.hasOwnProperty(parentColumnName)) {
        let filteredChildColumns: any[] = [];
        let filteredData: any[] = [];
        try {
          const childColumns = Object.keys(data[parentColumnName][0]);
          if (childColumns.length > 0) {
            if (parentColumnName === 'School ID') {
              filteredChildColumns = ['schoolId', ...childColumns.filter(col => col !== 'schoolId')];
            } else if (parentColumnName === 'Enrollment Summary') {
              const nonSchoolIdColumns = childColumns.filter(col => col !== 'schoolId');
              const sortedColumns = nonSchoolIdColumns.sort((a, b) => this.customSort(a) - this.customSort(b) || a.localeCompare(b));
              filteredChildColumns = sortedColumns;
            } else {
              filteredChildColumns = childColumns.filter(col => col !== 'schoolId');
            }

            filteredData = data[parentColumnName].map((row: DataRow) => {
              const filteredRow: DataRow = {};
              for (const col of filteredChildColumns) {
                filteredRow[col] = row[col];
              }
              return filteredRow;
            });

            const parentColumn: ParentColumn = {
              name: parentColumnName,
              childColumns: filteredChildColumns,
              data: filteredData
            };
            transformedData.push(parentColumn);
          }
        } catch {
          let dummyText = `Data Not Found For ${parentColumnName}`
          filteredChildColumns = [dummyText]
        }
      }
    }
    return transformedData;
  }

  /**
   * @author Manjunath
   * @uses to update key Values for User Table
   */
  updateKeysOfUserTable(userArray: any[]): any[] {
    const keyConfig: { [key: string]: string } = {
      'schoolId': 'School Id',
      'email': 'Email',
      'firstName': 'First Name',
      'lastName': 'Last Name',
      'alternateEmail': 'Alternate Email',
      'roleId': 'Role Id',
    }
    return userArray.map(user => {
      const updatedSchool: any = {};

      Object.keys(user).forEach(oldKey => {
        const newKey = keyConfig[oldKey];
        updatedSchool[newKey || oldKey] = user[oldKey];
      });
      if (updatedSchool['Role Id'] == 1) updatedSchool['Role Id'] = 'Super Admin'
      if (updatedSchool['Role Id'] == 2) updatedSchool['Role Id'] = 'Admin'
      if (updatedSchool['Role Id'] == 3) updatedSchool['Role Id'] = 'Principal'
      if (updatedSchool['Role Id'] == 4) updatedSchool['Role Id'] = 'Guest'
      return updatedSchool;
    });

  }
  /**
   * @author Manjunath
   * @uses to get All Users
   */
  getAllUsers() {
    this._ajaxService.get('admin/getHierarchyDataForAdmin').then((response: any) => {
      if (response.statusCode == 200) {
        this.adminUserDataForTable = this.updateKeysOfUserTable(response.data['superAdmins']);
        this.schoolUserDataForTable = this.updateKeysOfUserTable(response.data['schoolLevelUsers'])
        this.guestUserDataForTable = this.updateKeysOfUserTable(response.data['guestUsers'])
        this.userTableData = [...this.adminUserDataForTable, ...this.schoolUserDataForTable, ...this.guestUserDataForTable];
        this.copyOfUserTableData = [...this.adminUserDataForTable, ...this.schoolUserDataForTable, ...this.guestUserDataForTable];
        this.getPaginatedData('user');
      }
    });
  }

  /**
   * @author Manjunath
   * @uses to get data of every school
   */
  getSchoolData() {
    this._ajaxService.get(`admin/getAllSchoolsData?academicYearId=${this.academicYearId}`).then((response: any) => {
      if (response.statusCode == 200) {
        if (response.data['Schools'].length > 0) {
          this.tableData = this.transformData(response.data);
          const combinedArray: any[] = this.combineArrays(response.data['Schools'],
            response.data['School ID'],
            response.data['Academic Performance Summary'],
            response.data['Student Demographic Information'],
            response.data['ARK Performance Summary'],
            response.data['Enrollment Summary'],
            response.data['Flag Reading Overall Proficency'],
            response.data['Flag Math Overall Proficency'],
            response.data['NCE Reading Flag'],
            response.data['NCE Math Flag'],
            response.data['ARK Proficiency Flag'],
            response.data['Enrollment Flag'],
            response.data['K-2 Enrollment Flag'],
            response.data['Enrollment Capacity Flag'],
          );
          this.csipDataForTable = this.updateKeys(combinedArray);
          this.copyOfCsipDataForTable = this.updateKeys(combinedArray);
        }
      }
    })
  }

  validateExcel(event: any) {
    if (event.target.files[0].type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      this.excelfile = event.target.files[0];
    } else {
      this.snackbar.open("Please select .xlsx Excel files only.", "OK", { duration: 3000, panelClass: "error-dialog" });
      if (this.inptExcel) this.inptExcel.nativeElement.value = '';
    }
  }

  openModal() {
    this.modalService.open(this.myModal);
  }

  async getAcademicYears() {
    this._ajaxService.get("dashboard/getAcademicYears").then(async (response: any) => {
      this.academicYears = response;
      const idx = response.length;
      this.academicYearId = response[idx - 1]['id']
      this.getSchoolData();
    });
  }

  createAcademicYear() {
    this.submitted = true;
    if (this.academicYearName.value.trim()) {
      if (!this.academicYearName.valid) return
      const request = {acdemicYear : this.academicYearName.value.trim()}
      this._ajaxService.post("admin/createAcademicYear", request).then(async (response: any) => {
        this.submitted = false;
        this.modalService.dismissAll()
        this.snackbar.open(`Academic Year Created Successfully`, "OK", { duration: 3000, panelClass: "warning-dialog" })
      }).catch(error => {
        let message = error.error.code == 'ER_DUP_ENTRY' ? 'Academic Year Already Exist.' : 'Something Went Wrong'
        this.snackbar.open(`${message}`, "OK", { duration: 3000, panelClass: "warning-dialog" })
      });
    } else {
      this.snackbar.open("Academic Year Can't be empty", "OK", { duration: 3000, panelClass: "warning-dialog" })
    }
  }

}
