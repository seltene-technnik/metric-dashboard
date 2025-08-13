import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AjaxService } from '../services/ajax.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-grades',
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.scss']
})
export class GradesComponent implements OnInit {

  constructor(private _activeroute: ActivatedRoute, private _ajaxService: AjaxService, private _userService: UserService,) { }
  proficiency: Boolean = false;
  changeInNCE: Boolean = false;
  ark: Boolean = false;
  enrollment: Boolean = false;
  tableData:any[] = [];
  dataToDisplay: string = ''
  academicYearId : Number | null = 1;

  ngOnInit(): void {
    this._activeroute.params.subscribe(params => {
      const receivedData = params['data'];
      this.dataToDisplay = receivedData
      if (receivedData === 'ProficiencyGrade') {
        this.proficiency = true;
      } else if (receivedData === 'NCEChange') {
        this.changeInNCE = true;
      } else if (receivedData === 'enrollment') {
        this.enrollment = true;
      } else if (receivedData === 'ark') {
        this.ark = true;
      }
    });
    if (this._userService.getAcademicYearId().value != null) {
      this.academicYearId = this._userService.getAcademicYearId().value
    }
    this.getGradesDataOnSchoolId();
  }

  /**
   * @author Manjunath
   * @uses to format data for Proficiency Grade and NCE Change table.
   */
  formatData(data:any[]) {
    const transformedData:any[] = [];
    data.forEach((entry: { [x: string]: any; hasOwnProperty: (arg0: string) => any; }) => {
      for (const key in entry) {
        if (entry.hasOwnProperty(key) && key.endsWith("Math")) {
          const grade = key.substring(0, key.length - 4); // Extract the grade from the key
          const transformedEntry = {
            grade,
            read: entry[`${grade}Read`],
            math: entry[key]
          };
          transformedData.push(transformedEntry);
        }
      }
    });
    return transformedData
  }

  /**
   * @author Manjunath
   * @uses to get data for grades.
   */
  getGradesDataOnSchoolId() {
    const request = { "schoolId": this._userService.getSchoolId().value,  academicYearId : this.academicYearId}
    switch(this.dataToDisplay) {
      case 'ProficiencyGrade' :
        this._ajaxService.post("dashboard/getProficiencyByGrade", request).then((response: any) => {
          if(response.statusCode == 200) {
            this.tableData = this.formatData(response.data)
          }
        })
        break;

      case 'NCEChange' :
        this._ajaxService.post("dashboard/getChangeInNCEByGrade", request).then((response: any) => {
          if(response.statusCode == 200) {
            this.tableData = this.formatData(response.data)
          }
        })
        break;

      case 'enrollment' :
        this._ajaxService.post("dashboard/getenrollmentByGrade", request).then((response: any) => {
          if(response.statusCode == 200) {
            const transformedData:any[] = [];
            const keysNotToInclude = ['id', 'schoolId', 'createdAt', 'updatedAt', 'isDeleted', 'academicYearId']
            response.data.forEach((entry: { [x: string]: any; hasOwnProperty: (arg0: string) => any; }) => {
                for (const key in entry) {
                    if (entry.hasOwnProperty(key) && !keysNotToInclude.includes(key)) {
                      const UpdatedKey = `EL-${key.toUpperCase().split('EL')[1]}`
                      transformedData.push({ grade: UpdatedKey, count: entry[key] });
                    }
                }
            });
            this.tableData = transformedData
          }
        })
        break;

      case 'ark' :
        this._ajaxService.post("dashboard/getARKproficiencyByGrade", request).then((response: any) => {
          if(response.statusCode == 200) {
            const transformedData:any[] = [];
            response.data.forEach((entry: { [x: string]: any; hasOwnProperty: (arg0: string) => any; }) => {
              for (const key in entry) {
                if (entry.hasOwnProperty(key) && key.endsWith("High")) {
                  const grade = key.substring(5, key.length - 4); // Extract the grade from the key
                  const transformedEntry: any = {};
                  transformedEntry.grade = `G${grade}`;
                  transformedEntry.high = entry[key];
                  transformedEntry.med = entry[`Grade${grade}Med`];
                  transformedEntry.low = entry[`Grade${grade}Low`];
                  transformedData.push(transformedEntry);
                }
              }
            });
            this.tableData = transformedData
          }
        })
        break;
        
      default:
        break
    }
    
  }
}
