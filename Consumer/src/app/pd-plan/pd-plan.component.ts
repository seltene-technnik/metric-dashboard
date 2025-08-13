import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../services/user.service';
import { AjaxService } from '../services/ajax.service';
import { Subscription } from 'rxjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AcademicYear } from '../academic-year/academic-year.component';

@Component({
  selector: 'app-pd-plan',
  templateUrl: './pd-plan.component.html',
  styleUrls: ['./pd-plan.component.scss']
})
export class PdPlanComponent implements OnInit {

  schoolId: any = null;
  pdPlanArray: any = []
  userData = JSON.parse(localStorage.getItem('CSIPUser') || '{}')
  deleteItem: any = null;
  editable: boolean = false;
  userSubscription: Subscription[] = [];
  defaultADT : string = '';
  additionalADT : any = []
  academicYearId : Number | null = 1;
  academicYear : String = ''

  @ViewChild('mymodal') mymodal: ElementRef | undefined;
  @ViewChild('contentToExport') contentToExport!: ElementRef;

  constructor(private _ajaxService: AjaxService, private _userService: UserService, private _router: Router, private snackbar: MatSnackBar, private modalService: NgbModal, private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.userSubscription.push(this._userService.getSchoolId().subscribe(value => {
      if (value != null) {
        this.schoolId = value
        // this.getPdPlanData();
        // this.getAnnualData();
      } else {
        this._router.navigate(['/dashboard'])
      }
    }))

    this.userSubscription.push(this._userService.getAcademicYearId().subscribe(value => {
      if (value != null) {
        this.academicYearId = value;
        if (this._userService.getAcademicYears().value != null) {
          const academicYears : AcademicYear[] = this._userService.getAcademicYears().value
          const active = academicYears.filter(aca => aca.id == this.academicYearId)
          this.academicYear = active[0].year
        }
        this.getPdPlanData();
        this.getAnnualData();
      }
    }))
  }

  /**
  * @author Gopi
  * @uses To get PDPlan data
  */
  getPdPlanData() {
    let request = {
      "schoolId": this.schoolId,
      "academicYearId" : this.academicYearId
    }
    this._ajaxService.post('pdPlan/getPDPlanData', request).then((response: any) => {
      if (response.statusCode == 200) {
        this.pdPlanArray = response.data;
        this.changeDetector.detectChanges();
      }
    })
  }

  /**
* @author Gopi
* @uses To add row
*/
  addRow() {
    const newRow = {
      assesmentName: "",
      assesmentType: "",
      assessedBy: "",
      dataCollected: "",
      learningTarget: "",
      responsibleMember: "",
      adtCheck : false
    };
    this.pdPlanArray.push(newRow);
    this.editable = true;
    this.changeDetector.detectChanges()
  }

  /**
  * @author Gopi
  * @uses To capture the click on table row
  */
  onRowClick(event: any) {
    const target = event.target as HTMLElement;
    target.contentEditable = 'true';
    target.focus();
  }

  /**
  * @author Gopi
  * @uses To save PDPlan data
  */
  savePDPlanData() {
    const propertiesToCheck = ['pdPlanDate', 'pdPlanTitle', 'flaggingIndicator', 'PdPlanFocusArea', 'pdPlanDescription', 'PdPlanFundingSource', 'pdPlanPrincipalActions'];
    const allPropertiesNotEmpty = this.pdPlanArray.every((obj: any) =>
      propertiesToCheck.every(prop => !this.isEmpty(obj[prop]))
    );
    if (allPropertiesNotEmpty) {
      let request = {
        "pdPlanDataArray": this.pdPlanArray,
        "userId": this.userData.userId,
        "schoolId": this.schoolId,
        "academicYearId" : this.academicYearId
      }
      this._ajaxService.post('pdPlan/savePdPlan', request).then((response: any) => {
        if (response.statusCode == 200) {
          this.editable = false;
          this.snackbar.open("PD Plan saved successfully", "OK", { duration: 3000, panelClass: "success-dialog" });
          this.getPdPlanData();
        }
        else {
          this.snackbar.open("Error while saving data", "OK", { duration: 3000, panelClass: "error-dialog" });
        }
      })
    }
    else {
      this.snackbar.open("Please fill the valid data", "OK", { duration: 3000, panelClass: "error-dialog" });
    }
  }

  /**
  * @author Gopi
  * @uses To check property is empty or not
  */
  isEmpty(value: any) {
    return value === null || value === undefined || value === '';
  }

  /**
  * @author Gopi
  * @uses To edit PDPlan data
  */
  addData(event: any, index: any, position: any) {
    position == 1 ? this.pdPlanArray[index].assesmentName = event.target.value : position == 2 ? this.pdPlanArray[index].assesmentType = event.target.value : position == 3 ? this.pdPlanArray[index].assessedBy = event.target.value : position == 4 ? this.pdPlanArray[index].dataCollected = event.target.value : position == 5 ? this.pdPlanArray[index].learningTarget = event.target.value : this.pdPlanArray[index].responsibleMember = event.target.value
  }

  /**
 * @author Gopi
 * @uses To confirm for deleting PDPlan data
 */
  deleteRow(content: any, data: any, index: any) {
    this.deleteItem = data;
    if (this.deleteItem.id != null && this.deleteItem.id != undefined) {
      this.modalService
        .open(content, { ariaLabelledBy: 'modal-basic-title' })
        .result.then(
          (result) => {
          }, (reason) => {
          });
    }
    else {
      this.pdPlanArray.splice(index, 1);
    }
  }

  /**
* @author Gopi
* @uses To delete PDPlan data
*/
  deletePDPlan() {
    let request = {
      "pdPlanId": this.deleteItem.id,
      "schoolId": this.schoolId
    }
    this._ajaxService.post('pdPlan/deletePDPlan', request).then((response: any) => {
      if (response.statusCode == 200) {
        this.snackbar.open("PDPlan deleted successfully", "OK", { duration: 3000, panelClass: "success-dialog" });
        this.modalService.dismissAll();
        this.deleteItem = null;
        this.getPdPlanData();
      }
      else {
        this.snackbar.open("Error while deleting data", "OK", { duration: 3000, panelClass: "error-dialog" });
      }
    })
  }

  /**
  * @author Gopi
  * @uses To enable/disable PDPlan data
  */
  enableEdit() {
    this.editable = !this.editable;
    this.changeDetector.detectChanges();
  }

  /**
* @author Gopi
* @uses To Convert the HTML Data to PDF
*/
  exportToPDF() {
    if (this.editable) {
      this.snackbar.open(`Export function is unavailable while in edit mode. Please save all your changes before attempting to export.`, "OK", { duration: 6000, panelClass: "error-dialog", });
      return
    }
    const content = this.contentToExport.nativeElement;
    const schools = JSON.parse(localStorage.getItem('schools') || '{}')
    const school = schools.filter((sch: { schoolId: any; }) => sch.schoolId == this.schoolId)[0]
    const headerDiv = document.createElement('div');
    headerDiv.className = 'd-flex flex-row justify-content-between adt-boxer';
    headerDiv.innerHTML = `
      <div class="p-4"><span class="fw-bolder">School : </span>${school.name || ''}</div>
      <div class="p-4"><span class="fw-bolder">School Year : </span> ${this.academicYear || ''}</div>
      <div class="p-4"><span class="fw-bolder">County : </span> ${school.county || ''}</div>
    `;

    // Temporarily add the header div to the DOM but keep it hidden
    headerDiv.style.display = 'none'; // Hide from the actual page
    content.prepend(headerDiv); // Add the header to the content

    // Change the display style for PDF capture
    headerDiv.style.display = 'block';
    html2canvas(content).then(canvas => {
      var imgWidth = 210;
      var pageHeight = 293.8;
      var imgHeight = canvas.height * imgWidth / canvas.width;
      var heightLeft = imgHeight;
      const FILEURI = canvas.toDataURL('image/png')
      let PDF = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      PDF.addImage(FILEURI, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        PDF.addPage();
        PDF.addImage(FILEURI, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      PDF.save('PDPlan.pdf');
      headerDiv.remove();
    });
  }

  getAnnualData() {
    this.additionalADT = [];
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
            const obj = {
              value : adt,
              row : adt.split('\n').length + 2
            }
            this.additionalADT.push(obj)
          })
        }
      }
    })
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.userSubscription.forEach(sub => sub.unsubscribe());
  }
}
