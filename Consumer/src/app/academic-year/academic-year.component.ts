import { Component, Input, OnInit } from '@angular/core';
import { UserService } from '../services/user.service'
import { AjaxService } from '../services/ajax.service';


export interface AcademicYear {
  id : Number;
  year : String;
  showInDashboard: boolean;
}

@Component({
  selector: 'app-academic-year',
  templateUrl: './academic-year.component.html',
  styleUrls: ['./academic-year.component.scss']
})

export class AcademicYearComponent implements OnInit {

  @Input() fromComponent: string = '';

  acdemicYearId: number | null = 1;
  academicYears: AcademicYear[] = [];
  filteredAcademicYears: AcademicYear[] = [];

  constructor(private _userService : UserService, private _ajaxService : AjaxService) { }

  async ngOnInit(): Promise<void> {
    await this.getAcademicYears()
  }

  async getAcademicYears() {
    this._ajaxService.get("dashboard/getAcademicYears").then(async (response: any) => {
      this.academicYears = response;
      this._userService.setAcademicYears(response) ;
      const idx = response.length;
      this.filterAcademicYears();
      if (this._userService.getAcademicYearId().value != null) {
        const acdemicYearId = this._userService.getAcademicYearId().value;
        if (this.fromComponent === 'dashboard') {

          const isShowInDashboard = response.find((year: any) => year.id == acdemicYearId)?.showInDashboard;
          
          if (isShowInDashboard) {
            this.acdemicYearId = acdemicYearId;
          }
          else {
            const lastVisibleYear = [...response].reverse().find(year => year.showInDashboard);
            if (lastVisibleYear) {
              this.acdemicYearId = lastVisibleYear.id;
              this._userService.setAcademicYearId(lastVisibleYear.id);
            } else if (response.length > 0) {
              // fallback: if no year has showInDashboard=true, just pick the last available one
              this.acdemicYearId = response[response.length - 1].id;
              this._userService.setAcademicYearId(response[response.length - 1].id);
            }
          }
        } else {
          this.acdemicYearId = acdemicYearId;
        }
      } else {
        // this.acdemicYearId = response[idx - 1]['id']
        // this._userService.setAcademicYearId(response[idx - 1]['id'])

        const lastVisibleYear = [...response].reverse().find(year => year.showInDashboard);

        if (lastVisibleYear) {
          this.acdemicYearId = lastVisibleYear.id;
          this._userService.setAcademicYearId(lastVisibleYear.id);
        } else if (response.length > 0) {
          // fallback: if no year has showInDashboard=true, just pick the last available one
          this.acdemicYearId = response[response.length - 1].id;
          this._userService.setAcademicYearId(response[response.length - 1].id);
        }
      }
      // await this.getSchoolsList();
      // if (this._userService.getSchoolId().value != null) {
      //   let index = this.schools.findIndex((school: any) => school.schoolId == this._userService.getSchoolId().value);
      //   this.selectSchool(this.schools[index])
      // } else {
      //   this.selectSchool(this.schools[0]);
      // };
  
    });
  }

  selectAcademicYearId(e : any) {
    if (e) {
      this.acdemicYearId = parseInt(e.target.value);
      this._userService.setAcademicYearId(e.target.value)
      // this.loadWorkbook();
    }
  }

  filterAcademicYears() {
    if (this.fromComponent === 'dashboard') {
      this.filteredAcademicYears = this.academicYears.filter(year => year.showInDashboard);
    } else {
      this.filteredAcademicYears = this.academicYears;
    }
  }

}
