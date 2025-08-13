import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Chart, TooltipItem, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { map, startWith, Subscription } from 'rxjs';
import { AjaxService } from '../services/ajax.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { Align, Anchor } from 'chartjs-plugin-datalabels/types/options';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

export interface AcademicYear {
  id: Number;
  year: String;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  enableFilter: boolean = false;
  schools = JSON.parse(localStorage.getItem('schools') || '{}');
  searchText = new FormControl();
  filteredSchools: any;
  flagAcademics: any = [];

  //For NCE Growth Summary
  avgChangeInNCEData: any = {
    reading: 0,
    math: 0,
  };


  academicGrowthSummaryData: any = {
    reading: 0,
    math: 0,
  };

  academicPerformanceSummaryData: any = {
    AvgELA: 0,
    Avgmath: 0,
  };

  //For Academic Performance Summary
  TNProficiencies: any = {
    reading: 0,
    math: 0,
  };
  catholic: any = {
    high: 0,
    moderate: 0,
    low: 0,
  };
  'enrollment': any = {
    '2012': 0,
    '2013': 0,
    '2014': 0,
    '2015': 0,
    '2016': 0,
    '2017': 0,
    '2018': 0,
    '2019': 0,
    '2020': 0,
    '2021': 0,
    '2022': 0,
  };
  'essentials': any = {
    overallPerformance: '',
    effectiveLeaders: '',
    collaborativeTeachers: '',
    involvedFamilies: '',
    supportiveEnvironment: '',
    ambitiousInstruction: '',
  };
  catholicIdentity: any = {};
  academicFlags: any = {};
  essentialsFlags: any = {};
  enrollmentOperationsFlag: any = {};
  averageEnrollment: number = 0;
  nceChart: any;
  OverallTNProficienciesChart: any;
  acadmicPerformanceSummaryChart: any;
  acadmicGrowthSummaryChart: any;
  catholicChart: any;
  enrollChart: any;
  schoolId: number = 0;
  flags: any = {
    academics: 0,
    NCEChangeFlags: 0,
    proficienciFlags: 0,
    essentials: 0,
    catholicIdentity: 0,
    enrollment: 0,
  };
  CIScorecards: string = '';
  blueRibbon: any = {};
  academicYears: AcademicYear[] = [];
  acdemicYearId: number | null = 1;
  nceAvgValue: any = {
    1: { read: 0.8, math: 1.58 },
    2: { read: 0.07, math: 1.44 },
    5: { read: 3.06, math: 1.14 },
  };
  userSubscription: Subscription[] = [];

  @ViewChild('avgChangeInNCE') avgChangeInNCE: any;
  @ViewChild('OverallTNProficiencies') OverallTNProficiencies: any;
  @ViewChild('enrollmentChart') enrollmentChart: any;
  @ViewChild('identityChart') identityChart: any;
  @ViewChild('academicPerformanceSummary') academicPerformanceSummary: any;
  @ViewChild('academicGrowthSummary') academicGrowthSummary: any;
  @ViewChild('searchInput') searchInput: ElementRef<any> | undefined;
  @ViewChild('mymodal') mymodal: ElementRef | undefined;

  constructor(
    private _ajaxService: AjaxService,
    private _userService: UserService,
    private _router: Router,
    private modalService: NgbModal
  ) {
    this.filteredSchools = this.searchText.valueChanges.pipe(
      startWith(null),
      map((text: string | null) =>
        text
          ? this._filter(text)
          : this.schools.map((value: any) => ({ ...value }))
      )
    );
    Chart.register(...registerables);
    Chart.register(ChartDataLabels);
  }

  ngOnInit(): void {
    this.getSchoolsList();
    // this.getAcademicYears()
    if (this._userService.getSchoolId().value != null) {
      let index = this.schools.findIndex(
        (school: any) =>
          school.schoolId == this._userService.getSchoolId().value
      );
      this.selectSchool(this.schools[index]);
    } else {
      this.selectSchool(this.schools[0]);
    }

    this.userSubscription.push(
      this._userService.getAcademicYearId().subscribe((value) => {
        if (value != null) {
          this.acdemicYearId = value;
          this.loadWorkbook();
        }
      })
    );
  }

  ngAfterViewInit() {
    this.drawNCEChart();
    this.drawOverallTNProficienciesChart();
    this.drawEnrollChart();
    // this.drawAcademicGrowthSummaryChart();
    // this.drawacademicPerformanceSummaryChart();
    // this.drawCatholicChart()
  }

  ngOnDestroy(): void {
    this.userSubscription.forEach((sub) => sub.unsubscribe());
  }

  getAcademicYearData(yearId: number) {
    return this.nceAvgValue[yearId] || { read: 0, math: 0 };
  }

  //Academic Growth Summary
  drawNCEChart() {
    const layoutOptions = {
      padding: {
        top: 30,
        bottom: 30,
      },
    };
    let canvas = this.avgChangeInNCE.nativeElement;
    let ctx = canvas.getContext('2d');
    this.nceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Reading', 'Math'],
        datasets: [
          {
            barPercentage: 0.7,
            // label: 'Very Weak',
            backgroundColor: ['#56B1F6', '#0c4b78'],
            data: [this.avgChangeInNCEData.reading, this.avgChangeInNCEData.math],
          },
          {
            barPercentage: 0.7,
            // label: 'Weak',
            backgroundColor: ['#F6D72D', '#F6D72D'],
            data: [
              this.getAcademicYearData(this.acdemicYearId || 0).read,
              this.getAcademicYearData(this.acdemicYearId || 0).math,
            ],
          },
        ],
      },
      options: {
        layout: layoutOptions,
        responsive: true,
        scales: {
          xAxis: {
            display: false,
            grid: {
              display: true,
            },
          },
          y: {
            title: {
              display: true,
              text: 'Change in NCE',
            },
            ticks: {
              stepSize: 1,
            },
            grid: {
              color: (context: any) => {
                const Zero = context.tick.value;
                const res = Zero === 0 ? '#666' : '#ffffff';
                return res;
              },
            },
          },
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            formatter: (value, ctx) => {
              return value;
            },
            color: 'black',
            anchor: (context) => {
              const dataset = context.dataset.data;
              const index = context.dataIndex;
              let res: Anchor = 'end';
              if (dataset[index] != null) {
                if (Number(dataset[index]) > 0) {
                  res = res;
                } else {
                  res = 'start';
                }
              }
              return res;
            },
            align: (context) => {
              const dataset = context.dataset.data;
              const index = context.dataIndex;
              let res: Align = 'center';
              if (dataset[index] != null) {
                if (Number(dataset[index]) > 0) {
                  res = 'top';
                } else {
                  res = 'bottom';
                }
              }
              return res;
            },
            padding: {
              top: 1,
            },
            labels: {
              title: {
                font: {
                  weight: 'bold',
                },
              },
            },
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            callbacks: {
              title: (tooltipItems: any) => {
                const tooltipsLabel = [
                  'Reading',
                  'Avg. Reading',
                  'Math',
                  'Avg. Math',
                ];
                let index = 0;
                const label = tooltipItems[0].label;
                if (label == 'Math') {
                  if (tooltipItems[0].element.active) {
                    index = 2;
                  } else {
                    index = 3;
                  }
                } else {
                  if (tooltipItems[0].element.active) {
                    index = 0;
                  } else {
                    index = 1;
                  }
                }
                return tooltipsLabel[index];
              },
              label: (Item) => {
                let value;
                if (Item.element.active) {
                  value = Item.formattedValue;
                  return `${value}%`;
                } else {
                  return '';
                }
              },
            },
          },
        },
      },
    });
  }

  //Academic Performance Summary
  drawOverallTNProficienciesChart() {
    let canvas = this.OverallTNProficiencies.nativeElement;
    let ctx = canvas.getContext('2d');
    this.OverallTNProficienciesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Reading', 'Math'],
        datasets: [
          {
            label: '% Students',
            data: [this.TNProficiencies.reading, this.TNProficiencies.math],
            backgroundColor: ['#56B1F6', '#0c4b78'],
            borderColor: ['#56B1F6', '#0c4b78'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          xAxis: {
            title: {
              display: true,
              text: 'Subject',
            },
            grid: {
              display: false,
            },
          },
          y: {
            title: {
              display: true,
              text: 'Proficient',
            },
            ticks: {
              stepSize: 10,
            },
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          title: {
            display: false,
            text: 'Students Scoring Avg. or Better on NWEA',
          },
          legend: { display: false },
          datalabels: {
            formatter: (value, ctx) => {
              return value + '%';
            },
            color: 'white',
            labels: {
              title: {
                font: {
                  weight: 'bold',
                },
              },
            },
          },
        },
      },
    });
  }

  drawEnrollChart() {
    let canvas = this.enrollmentChart.nativeElement;
    let ctx = canvas.getContext('2d');
    let chartLables = [];
    try {
      chartLables = Object.keys(this.enrollment);
    } catch {
      chartLables = [
        '2013',
        '2014',
        '2015',
        '2016',
        '2017',
        '2018',
        '2019',
        '2020',
        '2021',
        '2022',
        '2023',
      ];
    }
    if (chartLables.length > 11) {
      chartLables = chartLables.slice(chartLables.length - 11);
    }
    this.enrollChart = new Chart(ctx, {
      type: 'bar',
      data: {
        // labels: ['FY 2013', 'FY 2014', 'FY 2015', 'FY 2016', 'FY 2017', 'FY 2018', 'FY 2019', 'FY 2020', 'FY 2021', 'FY 2022', 'FY 2023'],
        labels: chartLables,
        datasets: [
          {
            label: 'Enrollment',
            // data: [this.enrollment['2013'], this.enrollment['2014'], this.enrollment['2015'], this.enrollment['2016'], this.enrollment['2017'], this.enrollment['2018'], this.enrollment['2019'], this.enrollment['2020'], this.enrollment['2021'], this.enrollment['2022'], this.enrollment['2023']],
            data: chartLables.map((key) => this.enrollment[key]),
            backgroundColor: ['#56B1F6'],
            borderColor: ['#56B1F6'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          xAxis: {
            grid: {
              display: false,
            },
          },
          y: {
            grid: {
              display: false,
            },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  drawCatholicChart() {
    let canvas = this.identityChart.nativeElement;
    let ctx = canvas.getContext('2d');
    this.catholicChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          {
            barPercentage: 0.5,
            label: 'Low',
            backgroundColor: '#FF0F10',
            data: [this.catholic.low],
          },
          {
            barPercentage: 0.5,
            label: 'Moderate',
            backgroundColor: '#fdff00',
            data: [this.catholic.moderate],
          },
          {
            barPercentage: 0.5,
            label: 'High',
            backgroundColor: '#4fa716',
            data: [this.catholic.high],
          },
        ],
      },
      plugins: [ChartDataLabels],
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          xAxis: {
            stacked: true,
            title: {
              display: true,
              text: '% of Students in Score Category',
            },
            ticks: {
              stepSize: 10,
              callback: function (value, index, ticks) {
                return value + '%';
              },
            },
            grid: {
              display: true,
            },
          },
          yAxis: {
            stacked: true,
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          title: {
            display: false,
            text: 'I believe that God is present in my life',
          },
          legend: { display: false },
          datalabels: {
            // formatter: (value, ctx) => {
            //   return value + "%";
            // },
            color: 'black',
            labels: {
              title: {
                font: {
                  weight: 'bold',
                },
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (Item) => {
                return `${Item.dataset.label}: ${Item.formattedValue}%`;
              },
            },
          },
        },
      },
    });
  }

  //Academic Growth Summary
  drawAcademicGrowthSummaryChart() {
    let canvas = this.academicGrowthSummary.nativeElement;
    let ctx = canvas.getContext('2d');
    this.acadmicGrowthSummaryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Reading ', 'Math'],
        datasets: [
          {
            label: '% Progress',
            data: [this.academicGrowthSummaryData.reading, this.academicGrowthSummaryData.math],
            backgroundColor: ['#56B1F6', '#0c4b78'],
            borderColor: ['#56B1F6', '#0c4b78'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          xAxis: {
            title: {
              display: true,
              text: 'Subject',
            },
            ticks: {
              stepSize: 10,
            },
            grid: {
              display: false,
            },
          },
          y: {
            title: {
              display: true,
              text: '%  Progress',
            },
            ticks: {
              stepSize: 10,
            },
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            formatter: (value, ctx) => {
              return value + '%';
            },
            color: 'white',
            labels: {
              title: {
                font: {
                  weight: 'bold',
                },
              },
            },
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            callbacks: {
              title: (tooltipItems: TooltipItem<'bar'>[]) => {
                const tooltipsLabel = ['Reading 100+ Met', 'Math 100+ Met'];
                const index = tooltipItems[0].dataIndex;
                return tooltipsLabel[index];
              },
            },
          },
        },
      },
    });
  }

  //Academic Performance Summary
  drawacademicPerformanceSummaryChart() {
    let canvas = this.academicPerformanceSummary.nativeElement;
    let ctx = canvas.getContext('2d');
    this.acadmicPerformanceSummaryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Reading', 'Math'],
        datasets: [
          {
            label: '% Students',
            data: [this.academicPerformanceSummaryData.AvgELA, this.academicPerformanceSummaryData.Avgmath],
            // data: [0, 0],
            backgroundColor: ['#56B1F6', '#0c4b78'],
            borderColor: ['#56B1F6', '#0c4b78'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          xAxis: {
            title: {
              display: true,
              text: 'Subject',
            },
            grid: {
              display: false,
            },
          },
          y: {
            title: {
              display: true,
              text: '%  Students',
            },
            ticks: {
              stepSize: 10,
            },
            grid: {
              display: false,
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: 'Students Scoring Avg. or Better on NWEA',
          },
          legend: { display: false },
          datalabels: {
            formatter: (value, ctx) => {
              return value + '%';
            },
            color: 'white',
            labels: {
              title: {
                font: {
                  weight: 'bold',
                },
              },
            },
          },
        },
      },
    });
  }

  private _filter(value: string): string[] {
    const filterValue = String(value).toLowerCase();
    return this.schools.filter((school: any) =>
      school.name.toLowerCase().includes(filterValue)
    );
  }

  selectSchool(school: any) {
    if (school != undefined || school != null) {
      this.searchText.setValue(school.name);
      this.schoolId = school.schoolId;
      this._userService.setSchoolId(this.schoolId);
      school.users === true
        ? this._userService.setUserMenu(true)
        : this._userService.setUserMenu(false);
      this.closeOptions();
      this.loadWorkbook();
    }
  }

  closeOptions() {
    this.enableFilter = false;
    this.searchInput?.nativeElement.blur();
  }

  loadWorkbook() {
    this.avgChangeInNCEData.reading = 0;
    this.avgChangeInNCEData.math = 0;
    this.academicGrowthSummaryData.reading = 0;
    this.academicPerformanceSummaryData.AvgELA = 0, 
    this.academicPerformanceSummaryData.Avgmath = 0,
    this.academicGrowthSummaryData.math = 0;
    this.TNProficiencies.reading = 0;
    this.TNProficiencies.math = 0;
    this.averageEnrollment = 0;
    this.essentials = {};
    this.academicFlags = {};
    this.essentialsFlags = {};
    this.catholicIdentity = {};
    this.enrollmentOperationsFlag = {};
    this.flags = {
      academics: 0,
      NCEChangeFlags: 0,
      proficienciFlags: 0,
      essentials: 0,
      catholicIdentity: 0,
      enrollment: 0,
    };
    this.CIScorecards = '';
    this.blueRibbon = {};
    const request = {
      schoolId: this.schoolId,
      acdemicYearId: this.acdemicYearId,
    };
    this._ajaxService
      .post('dashboard/loadWorkbook', request)
      .then((response: any) => {
        if (response.statusCode == 200) {
          if (Object.keys(response.data).length > 0) {
            const info = response.data;
            //Avg Change in NCE
            this.avgChangeInNCEData.reading = Number(
              info['performance']['readingAvgChange']
            );
            this.avgChangeInNCEData.math = Number(
              info['performance']['mathAvgChange']
            );
            

            this.academicGrowthSummaryData.reading = Number(
              info['performance']['ELAGrowthPercent']
            );
            this.academicGrowthSummaryData.math = Number(
              info['performance']['MathGrowthPercent']
            );
            
            
            this.academicPerformanceSummaryData.AvgELA = Number(
              info['performance']['ELAAvgOrBetter']
            );
            this.academicPerformanceSummaryData.Avgmath = Number(
              info['performance']['MathAvgOrBetter']
            );
            

            //Overall TN Performance Summary
            this.TNProficiencies.reading = Number(
              info['performance']['reading']
            );
            this.TNProficiencies.math = Number(info['performance']['math']);
            
            //Catholic Identity
            this.catholic.high = Number(info['catholic']['high']);
            this.catholic.moderate = Number(info['catholic']['moderate']);
            this.catholic.low = Number(info['catholic']['low']);
            // this.catholicChart.destroy();
            // this.drawCatholicChart()
            //Enrollment
            this.enrollment = info['enrollment'];
            
            //Essentials
            this.averageEnrollment = info['avgEnrollment'];
            this.averageEnrollment = this.averageEnrollment
              ? Math.round(this.averageEnrollment)
              : this.averageEnrollment;
            this.essentials = info['essentials'];
            //Flag Notifications
            this.academicFlags = info['academicFlags'];
            this.essentialsFlags = info['essentialsFlags'];
            this.catholicIdentity = info['catholicIdentity'];
            this.enrollmentOperationsFlag = info['enrollmentOperationsFlag'];
            //Enable green/red mark based on flag 'Y'
            Object.keys(this.academicFlags).forEach((key, value) => {
              if (
                this.academicFlags[key] == 'Y' ||
                this.academicFlags[key] == 'yes'
              ) {
                this.flags['academics']++;
                if (
                  key == 'Negative Change in Reading NCE' ||
                  key == 'Negative Change in Math NCE'
                ) {
                  this.flags['NCEChangeFlags']++;
                } else {
                  this.flags['proficienciFlags']++;
                }
              }
            });
            Object.keys(this.essentialsFlags).forEach((key, value) => {
              if (this.essentialsFlags[key] == 'Y') {
                this.flags['essentials']++;
              }
            });
            Object.keys(this.catholicIdentity).forEach((key, value) => {
              if (
                this.catholicIdentity[key] == 'Y' ||
                this.catholicIdentity[key] == 'yes'
              ) {
                this.flags['catholicIdentity']++;
              }
            });
            Object.keys(this.enrollmentOperationsFlag).forEach((key, value) => {
              if (
                this.enrollmentOperationsFlag[key] == 'Y' ||
                this.enrollmentOperationsFlag[key] == 'yes'
              ) {
                this.flags['enrollment']++;
              }
            });
            // this.CIScorecards = info['CIScorecards'];
            this.blueRibbon = {
              year: info.blueRibbon['year'],
              Spring: info.blueRibbon['Spring'],
              Fall: info.blueRibbon['Fall'],
            };
            this.enrollChart.destroy();
            this.drawEnrollChart();
            this.OverallTNProficienciesChart.destroy();
            this.drawOverallTNProficienciesChart();
            // this.acadmicPerformanceSummaryChart.destroy();
            // this.drawacademicPerformanceSummaryChart();
            // this.acadmicGrowthSummaryChart.destroy();
            // this.drawAcademicGrowthSummaryChart();
            this.nceChart.destroy();
            this.drawNCEChart();
          } else {
            this.nceChart.destroy();
            this.drawNCEChart();
            this.OverallTNProficienciesChart.destroy();
            this.drawOverallTNProficienciesChart();
            // this.catholicChart.destroy();
            // this.drawCatholicChart();
            this.enrollChart.destroy();
            this.drawEnrollChart();
            this.flags = {
              academics: 0,
              essentials: 0,
              catholicIdentity: 0,
              enrollment: 0,
            };
            this.CIScorecards = '';
            this.blueRibbon = {};
          }
        }
      });
  }

  getSchoolsList() {
    this._userService.getUserDetails().subscribe((value: any) => {
      if (value != undefined && Object.keys(value).length > 0) {
        const request = {
          email: value.email,
        };
        this._ajaxService.post('users/login', request).then((response: any) => {
          if (response.statusCode == 200) {
            const user = {
              firstName: response.data['firstName'],
              lastName: response.data['lastName'],
              email: response.data['email'],
              roleId: response.data['roleId'],
              userId: response.data['userId'],
            };
            localStorage.setItem('CSIPUser', JSON.stringify(user));
            localStorage.setItem(
              'schools',
              JSON.stringify(response.data['schools'])
            );
          }
        });
      }
    });
  }

  /**
   * @author Gopi
   * @uses to open the Flag Academics data
   */
  openFlagAcademics(content: any) {
    this._ajaxService
      .post('dashboard/loadFlagNotificationAcademics', {})
      .then((response: any) => {
        if (response.statusCode == 200) {
          this.flagAcademics = response.data;
          this.modalService
            .open(content, {
              ariaLabelledBy: 'modal-basic-title',
              windowClass: 'modelpp-my',
            })
            .result.then(
              (result) => {},
              (reason) => {}
            );
        }
      });
  }

  async getAcademicYears() {
    this._ajaxService
      .get('dashboard/getAcademicYears')
      .then(async (response: any) => {
        this.academicYears = response;
        const idx = response.length;
        if (this._userService.getAcademicYearId().value != null) {
          this.acdemicYearId = this._userService.getAcademicYearId().value;
        } else {
          this.acdemicYearId = response[idx - 1]['id'];
          this._userService.setAcademicYearId(response[idx - 1]['id']);
        }
        await this.getSchoolsList();
        if (this._userService.getSchoolId().value != null) {
          let index = this.schools.findIndex(
            (school: any) =>
              school.schoolId == this._userService.getSchoolId().value
          );
          this.selectSchool(this.schools[index]);
        } else {
          this.selectSchool(this.schools[0]);
        }
      });
  }

  selectAcademicYearId(e: any) {
    if (e) {
      this.acdemicYearId = parseInt(e.target.value);
      this._userService.setAcademicYearId(e.target.value);
      this.loadWorkbook();
    }
  }
}
