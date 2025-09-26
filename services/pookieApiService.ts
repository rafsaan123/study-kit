// Pookie Backend API Service for Study Aid
// Handles integration with the pookie-backend result API

export interface PookieApiResponse {
  success: boolean;
  time: string;
  roll: string;
  regulation: string;
  exam: string;
  instituteData: {
    code: string;
    name: string;
    district: string;
  };
  resultData: Array<{
    publishedAt: string;
    semester: string;
    result: string | {
      gpa: string;
      ref_subjects: string[];
    };
    passed: boolean;
    gpa?: string;
  }>;
  cgpaData: Array<{
    semester: string;
    cgpa: string;
    publishedAt: string;
  }>;
  source?: string;
  found_in_project?: string;
  projects_searched?: string[];
}

export interface StudyAidResultData {
  exam: string;
  roll: number;
  regulation: number;
  otherRegulations: string[];
  institute: {
    code: number;
    name: string;
    district: string;
  };
  current_reffereds: Array<{
    subject_semester: number;
    subject_code: number;
    subject_name: string;
    reffered_type: string;
    passed: boolean;
  }>;
  semester_results: Array<{
    semester: number;
    exam_results: Array<{
      date: string;
      instituteCode: number;
      gpa?: number;
      reffereds: Array<{
        subject_semester: number;
        subject_code: number;
        subject_name: string;
        reffered_type: string;
        passed: boolean;
      }>;
    }>;
  }>;
  latest_result: {
    date: string;
    instituteCode: number;
    gpa?: number;
    reffereds: Array<{
      subject_semester: number;
      subject_code: number;
      subject_name: string;
      reffered_type: string;
      passed: boolean;
    }>;
  } | null;
}

export class PookieApiService {
  private static readonly BASE_URL = 'https://pookie-backend.vercel.app';
  private static readonly TIMEOUT = 15000; // 15 seconds

  /**
   * Search for student results using pookie-backend API
   */
  static async searchStudentResult(
    rollNo: string,
    regulation: string = '2022',
    program: string = 'Diploma in Engineering'
  ): Promise<{ data: StudyAidResultData | null; error: string | null }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(`${this.BASE_URL}/api/search-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Study-Aid-Web/1.0',
        },
        body: JSON.stringify({
          rollNo,
          regulation,
          program
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return { data: null, error: 'Student not found' };
        }
        return { data: null, error: `API request failed with status: ${response.status}` };
      }

      const apiData: PookieApiResponse = await response.json();

      if (apiData.success) {
        const transformedData = this.transformPookieResponse(apiData);
        return { data: transformedData, error: null };
      } else {
        return { data: null, error: 'Student not found' };
      }

    } catch (error: any) {
      console.error('Pookie API Service Error:', error);

      if (error.name === 'AbortError') {
        return { data: null, error: 'Request timed out. Please try again.' };
      } else if (error.message && error.message.includes('fetch')) {
        return { data: null, error: 'Unable to connect to server. Please check your internet connection.' };
      } else {
        return { data: null, error: error.message || 'An unexpected error occurred. Please try again.' };
      }
    }
  }

  /**
   * Transform pookie-backend response to study-aid expected format
   */
  private static transformPookieResponse(apiData: PookieApiResponse): StudyAidResultData {
    // Extract current referred subjects from all semesters
    const currentReferreds: Array<{
      subject_semester: number;
      subject_code: number;
      subject_name: string;
      reffered_type: string;
      passed: boolean;
    }> = [];

    // Process semester results
    const semesterResults = apiData.resultData.map((result) => {
      const semester = parseInt(result.semester);
      const examResult = {
        date: result.publishedAt,
        instituteCode: parseInt(apiData.instituteData.code),
        gpa: result.passed ? parseFloat(result.gpa || '0') : undefined,
        reffereds: [] as Array<{
          subject_semester: number;
          subject_code: number;
          subject_name: string;
          reffered_type: string;
          passed: boolean;
        }>
      };

      // Handle referred subjects
      if (result.result && typeof result.result === 'object' && result.result.ref_subjects) {
        examResult.reffereds = result.result.ref_subjects.map((subject: string) => {
          const subjectCode = parseInt(subject.split('(')[0]);
          const referredSubject = {
            subject_semester: semester,
            subject_code: subjectCode,
            subject_name: subject,
            reffered_type: 'T',
            passed: false
          };

          // Add to current referreds if not already there
          if (!currentReferreds.some(ref => ref.subject_code === subjectCode)) {
            currentReferreds.push(referredSubject);
          }

          return referredSubject;
        });
      }

      return {
        semester,
        exam_results: [examResult]
      };
    });

    // Sort semesters in descending order
    semesterResults.sort((a, b) => b.semester - a.semester);

    // Create latest result
    const latestResult = semesterResults.length > 0 ? {
      date: semesterResults[0].exam_results[0].date,
      instituteCode: semesterResults[0].exam_results[0].instituteCode,
      gpa: semesterResults[0].exam_results[0].gpa,
      reffereds: semesterResults[0].exam_results[0].reffereds
    } : null;

    return {
      exam: apiData.exam,
      roll: parseInt(apiData.roll),
      regulation: parseInt(apiData.regulation),
      otherRegulations: [],
      institute: {
        code: parseInt(apiData.instituteData.code),
        name: apiData.instituteData.name,
        district: apiData.instituteData.district
      },
      current_reffereds: currentReferreds,
      semester_results: semesterResults,
      latest_result: latestResult
    };
  }

  /**
   * Check if the pookie-backend API is healthy
   */
  static async checkHealth(): Promise<{ isHealthy: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout for health check
      });

      if (response.ok) {
        const data = await response.json();
        return { isHealthy: data.status === 'healthy' };
      } else {
        return { isHealthy: false, error: `Health check failed with status: ${response.status}` };
      }
    } catch (error: any) {
      return { isHealthy: false, error: error.message || 'Health check failed' };
    }
  }
}
