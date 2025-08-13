import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../services/user.service'
import { Router } from '@angular/router'
import { AjaxService } from '../services/ajax.service'
import { Subscription } from 'rxjs'
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-goal',
  templateUrl: './goal.component.html',
  styleUrls: ['./goal.component.scss']
})
export class GoalComponent implements OnInit {

  schoolId: number = 0
  priorityType: string = 'mission'
  userSubscription: Subscription[] = []
  priorityAreaForm: FormGroup = this._formBuilder.group({
    areas: this._formBuilder.array([])
  })
  academicYearGuiding: Array<string> = ['Identify a need or benchmark around Mission and Catholic Identity.', 'What are the challenges you currently face in reaching this benchmark (i.e., problem-of-practice)?', 'What steps will you take to achieve your Mission and Catholic Identity benchmark?', 'How will you leverage school resources to accomplish your Mission and Catholic Identity benchmark?']
  catholicIdentityGuiding: Array<string> = ['Identify a need or benchmark around Governance and Leadership.', 'What are the challenges you currently face in reaching this benchmark (i.e., problem-of-practice)?', 'What steps will you take to achieve your Governance and Leadership benchmark?', 'How will you leverage school resources to accomplish your Governance and Leadership benchmark?']
  enrollmentGuiding: Array<string> = ['Identify a need or benchmark around Academic Excellence.', 'What are the challenges you currently face in reaching this benchmark (i.e., problem-of-practice)?', 'What steps will you take to achieve your Academic Excellence benchmark?', 'How will you leverage school resources to accomplish your Academic Excellence benchmark?']
  essentialsGuiding: Array<string> = ['Identify a need or benchmark around Operational Vitality.', 'What are the challenges you currently face in reaching this benchmark (i.e., problem-of-practice)?', 'What steps will you take to achieve your Operational Vitality benchmark?', 'How will you leverage school resources to accomplish your Operational Vitality benchmark?']
  enableMsg: boolean = false;
  priorityAreaId: number = 0
  enableYear: boolean = false;
  academicDate: String = '';
  isActive1: boolean = true;
  isActive2: boolean = false;
  isActive3: boolean = false;
  yearCount: number = 1;
  enableAddYear: boolean = true;

  @ViewChild('mymodal') mymodal: ElementRef | undefined;

  constructor(private _userService: UserService, private _router: Router, private _ajaxService: AjaxService, private _formBuilder: FormBuilder, private modalService: NgbModal, private changeDetector: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.userSubscription.push(this._userService.getSchoolId().subscribe(value => {
      if (value != null) {
        this.schoolId = value
        this.getPlanningItems()
        this.checkAddYearStatus()
      } else {
        this._router.navigate(['/dashboard'])
      }
    }))
  }

  /**
   * @author Nagendra
   * @uses To get planning items
   */
  getPlanningItems() {
    const request = {
      "priorityType": this.priorityType,
      "schoolId": this.schoolId
    }
    this._ajaxService.post("planning/items", request).then((response: any) => {
      if (response.statusCode == 200) {
        if (Object.keys(response.data).length > 0) {
          this.priorityAreaForm = this._formBuilder.group({
            areas: this._formBuilder.array([])
          })
          Object.keys(response.data).forEach((goal: any, goalIndex: number) => {
            this.getAreasArray.push(this._formBuilder.group({
              "id": Number(goal),
              "year1": this._formBuilder.array([]),
              "year2": this._formBuilder.array([]),
              "year3": this._formBuilder.array([])
            }));
            if (goalIndex == 0) {
              if (response.data[goal]['year1'][0]['value'] != '' && response.data[goal]['year1'][0]['value'] != null) {
                this.getCurrentAcademicYear();
                this.enableYear = true;
              }
              if (response.data[goal]['year2'][0]['value'] != '' && response.data[goal]['year2'][0]['value'] != null) {
                this.enableYear = true
                this.yearCount += 1
                if (response.data[goal]['year3'][0]['value'] != '' && response.data[goal]['year3'][0]['value'] != null) {
                  this.yearCount += 1
                }
                this.navigateToYears('year1')
              }
            }
            this.addYear(goalIndex, response.data[goal]['year1'], response.data[goal]['year2'], response.data[goal]['year3'])
          })
        } else {
          this.enableYear = false;
          this.yearCount = 1;
          this.priorityAreaForm = this._formBuilder.group({
            areas: this._formBuilder.array([])
          })
        }
      }
    })
  }

  navigateToYears(year: any) {
    if (year == 'year1') {
      this.reset();
    }
    else if (year == 'year2') {
      this.isActive1 = false;
      this.getNextYearAcademicDate('year1');
      this.isActive2 = true;
      this.isActive3 = false;
    }
    else if (year == 'year3') {
      this.isActive1 = false;
      this.isActive2 = false;
      this.getNextYearAcademicDate('year2');
      this.isActive3 = true;
    }
  }

  joinSplittedValues(positionsToConcat: any, value: any) {
    let result = positionsToConcat.map((position: any) => value[position]).join("");
    return result;
  }

  getCurrentAcademicYear() {
    let currentYear = new Date().getFullYear();
    let nextYear = new Date().getFullYear() + 1;
    let curyear = currentYear.toString();
    let nexYear = nextYear.toString();
    let joinedString = this.joinSplittedValues([2, 3], nexYear)
    this.academicDate = curyear + "-" + joinedString
  }

  getNextYearAcademicDate(year: any) {
    if (year == 'year1') {
      let currentYear = new Date().getFullYear() + 1
      let nextYear = new Date().getFullYear() + 2
      let curyear = currentYear.toString();
      let nexYear = nextYear.toString();
      let joinedString = this.joinSplittedValues([2, 3], nexYear)
      this.academicDate = curyear + "-" + joinedString
    }
    else if (year == 'year2') {
      let currentYear = new Date().getFullYear() + 2
      let nextYear = new Date().getFullYear() + 3
      let curyear = currentYear.toString();
      let nexYear = nextYear.toString();
      let joinedString = this.joinSplittedValues([2, 3], nexYear)
      this.academicDate = curyear + "-" + joinedString
    }
  }

  updateNextYear() {
    if (this.yearCount != 3) {
      this.yearCount++;
    }
    let currentYear = new Date().getFullYear();
    let currentNextYear = new Date().getFullYear() + 1;
    if (this.academicDate.includes(currentYear.toString())) {
      this.isActive1 = false;
      this.getNextYearAcademicDate('year1')
      this.isActive2 = true;
      this.isActive3 = false;
    }
    else if (this.academicDate.includes(currentNextYear.toString())) {
      this.isActive1 = false;
      this.isActive2 = false;
      this.getNextYearAcademicDate('year2');
      this.isActive3 = true;
    }
  }

  /**
   * @author Nagendra
   * @uses To save priority areas
   */
  saveActionItems() {
    const request = {
      "priorityType": this.priorityType,
      "schoolId": this.schoolId,
      "areas": this.priorityAreaForm.value['areas']
    }
    this._ajaxService.post("planning/save", request).then((response: any) => {
      if (response.statusCode == 200) {
        this.enableMsg = true
        setTimeout(() => {
          this.enableMsg = false
        }, 3000)
        this.getPlanningItems();
      }
    })
  }

  /**
   * @author Nagendra
   * @uses To delete priority area
   */
  deletePriorityArea() {
    const request = {
      "schoolId": this.schoolId,
      "priorityAreaId": this.priorityAreaId
    }
    this._ajaxService.post("planning/delete", request).then((response: any) => {
      if (response.statusCode == 200) {
        this.modalService.dismissAll();
        this.getPlanningItems();
      }
    })
  }

  get getAreasArray() {
    return <FormArray>this.priorityAreaForm.get('areas')
  }

  get getAreasControls() {
    return (this.priorityAreaForm.get('areas') as FormArray).controls
  }

  priorityAreaYears(index: number, year: string): FormArray {
    return this.getAreasArray.at(index).get(year) as FormArray;
  }

  priorityAreaObjects(index: number, year: string): FormArray {
    return this.getAreasArray.at(index).get(year) as FormArray;
  }

  addArea() {
    if (this.getAreasArray.status == 'VALID') {
      this.enableYear = true;
      if (this.yearCount == 1) {
        this.getCurrentAcademicYear()
      }
      this.getAreasArray.push(this._formBuilder.group({
        "id": null,
        "isActive1": true,
        "isActive2": false,
        "isActive3": false,
        "year1": this._formBuilder.array([
          this._formBuilder.group({
            "year": "year1",
            "id": [null],
            "value": [""],
            "sequence": [1]
          }),
          this._formBuilder.group({
            "year": "year1",
            "id": [null],
            "value": [""],
            "sequence": [2]
          }),
          this._formBuilder.group({
            "year": "year1",
            "id": [null],
            "value": [""],
            "sequence": [3]
          }),
          this._formBuilder.group({
            "year": "year1",
            "id": [null],
            "value": [""],
            "sequence": [4]
          })
        ]),
        "year2": this._formBuilder.array([
          this._formBuilder.group({
            "year": "year2",
            "id": [null],
            "value": [""],
            "sequence": [1]
          }),
          this._formBuilder.group({
            "year": "year2",
            "id": [null],
            "value": [""],
            "sequence": [2]
          }),
          this._formBuilder.group({
            "year": "year2",
            "id": [null],
            "value": [""],
            "sequence": [3]
          }),
          this._formBuilder.group({
            "year": "year2",
            "id": [null],
            "value": [""],
            "sequence": [4]
          })
        ]),
        "year3": this._formBuilder.array([
          this._formBuilder.group({
            "year": "year3",
            "id": [null],
            "value": [""],
            "sequence": [1]
          }),
          this._formBuilder.group({
            "year": "year3",
            "id": [null],
            "value": [""],
            "sequence": [2]
          }),
          this._formBuilder.group({
            "year": "year3",
            "id": [null],
            "value": [""],
            "sequence": [3]
          }),
          this._formBuilder.group({
            "year": "year3",
            "id": [null],
            "value": [""],
            "sequence": [4]
          })
        ])
      }))
    }
  }

  /**
   * @author Nagendra
   * @uses To update based on select item
   */
  updateAction() {
    this.yearCount = 1;
    this.getPlanningItems();
  }

  getPlaceholder(year: string, index: number) {
    return this.priorityType == 'mission' ? (this.academicYearGuiding[index]).replace('Year 1', year) : (this.priorityType == 'leadership' ? (this.catholicIdentityGuiding[index]).replace('Year 1', year) : this.priorityType == 'excellence' ? (this.enrollmentGuiding[index]).replace('Year 1', year) : this.priorityType == 'vitality' ? (this.essentialsGuiding[index]).replace('Year 1', year) : '');
  }

  addYear(index: number, year1: any, year2: any, year3: any) {
    year1.forEach((year: any) => {
      let rows = year.value.split('\n').length;
      year.rows = rows + 2;
    })
    year1.forEach((year: any) => {
      ((this.priorityAreaForm.get('areas') as FormArray).at(index).get('year1') as FormArray).push(
        this._formBuilder.group({
          "year": [year.year],
          "id": [year.id],
          "value": [year.value],
          "sequence": [year.sequence],
          "rows": [year.rows]
        }));
    })
    year2.forEach((year: any) => {
      let rows = year.value.split('\n').length;
      year.rows = rows + 2;
    })
    year2.forEach((year: any) => {
      ((this.priorityAreaForm.get('areas') as FormArray).at(index).get('year2') as FormArray).push(
        this._formBuilder.group({
          "year": [year.year],
          "id": [year.id],
          "value": [year.value],
          "sequence": [year.sequence],
          "rows": [year.rows]
        }));
    })
    year3.forEach((year: any) => {
      let rows = year.value.split('\n').length;
      year.rows = rows + 2;
    })
    year3.forEach((year: any) => {
      ((this.priorityAreaForm.get('areas') as FormArray).at(index).get('year3') as FormArray).push(
        this._formBuilder.group({
          "year": [year.year],
          "id": [year.id],
          "value": [year.value],
          "sequence": [year.sequence],
          "rows": [year.rows]
        }));
    })
  }

  /**
   * @author Nagendra
   * @param content 
   */
  open(content: any, index: number) {
    this.priorityAreaId = Number((this.getAreasArray.at(index) as FormGroup).controls['id'].value)
    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(
        (result) => { }, (reason) => { });
  }

  reset() {
    this.getCurrentAcademicYear();
    this.isActive1 = true;
    this.isActive2 = false;
    this.isActive3 = false;
  }

  /**
   * @author Manjunath
   * @uses To get Add year status
   */
  checkAddYearStatus() {
    this._ajaxService.get("planning/checkAddYearStatus").then((response: any) => {
      if (response.statusCode == 200 && response.data == 'enable') {
        this.enableAddYear = true;
      }
    })
  }

  ngOnDestroy() {
    this.userSubscription.forEach(value => {
      value.unsubscribe();
    })
  }

}
