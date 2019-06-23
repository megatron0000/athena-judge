/**
 * Acts on behalf of the currently logged-in teacher
 * 
 * For info on where the methods called on gapi come from, see:
 * https://developers.google.com/classroom/reference/rest/
 */
export default class GoogleApi {
  static init(gapiClient) {
    GoogleApi.gapi = gapiClient
  }

  static _assertInitialized() {
    if (!GoogleApi.gapi) {
      throw new Error('Tried to use GoogleApi object without calling GoogleApi.init(...) beforehand')
    }
  }

  /**
   * @returns {Promise<any[]>}
   */
  static listCourses() {
    GoogleApi._assertInitialized()

    let courses = []
    let nextPageToken = ''
    function fetchSome() {
      return GoogleApi.gapi.client.classroom.courses.list({ teacherId: 'me', pageToken: nextPageToken })
        .then(res => res.body)
        .then(JSON.parse)
        .then(obj => {
          courses = courses.concat(obj.courses || [])

          if (!obj.nextPageToken) {
            return courses
          }

          nextPageToken = obj.nextPageToken
          return fetchSome()
        })
    }

    return fetchSome()
  }

  /**
   * 
   * @param {string} courseId 
   * @returns {Promise<any[]>}
   */
  static listAssignments(courseId) {
    GoogleApi._assertInitialized()

    let assignments = []
    let nextPageToken = ''
    function fetchSome() {
      return GoogleApi.gapi.client.classroom.courses.courseWork.list({ courseId, courseWorkStates: ['DRAFT', 'PUBLISHED'], pageToken: nextPageToken })
        .then(res => res.body)
        .then(JSON.parse)
        .then(obj => {
          assignments = assignments.concat(obj.courseWork || [])

          if (!obj.nextPageToken) {
            return assignments
          }

          nextPageToken = obj.nextPageToken
          return fetchSome()
        })
    }

    return fetchSome()


  }

  /**
   * @returns {Promise<{code: string}>}
   */
  static giveOfflinePermissions() {
    return GoogleApi.gapi.auth2.getAuthInstance().grantOfflineAccess()
  }
}
