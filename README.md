# Athena Judge
[![DeepScan grade](https://deepscan.io/api/projects/2668/branches/18208/badge/grade.svg)](https://deepscan.io/dashboard#view=project&pid=2668&bid=18208)
## Setup

1. Run "sudo ./setup.sh".

## Running in development

1. Open three command prompts.
2. In the first command prompt, run "cd backend" then "npm run dev".
3. In the second command promp, run "cd runner" then "npm run dev".
4. In the third command promp, run "cd frontend" then "npm run dev".
5. A browser window should pop up with everything working.

Using this setup, your server will restart whenever you make a change in the backend and your browser will refresh whenever you make a change in the frontend.

Note that the database is restarted everytime the server starts.