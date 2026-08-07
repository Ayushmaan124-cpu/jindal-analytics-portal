JINDAL STEEL HSM ANALYTICS PORTAL

Hot Strip Mill Production Monitoring & Reporting System



1. Project Overview

The JSPL HSM Analytics Portal is a web-based dashboard developed for monitoring and analyzing Hot Strip Mill (HSM) production data.

The application connects directly to the production database and provides real-time dashboards for production monitoring, KPI tracking, SGF analysis, furnace analysis, slab analysis, rejection monitoring, reports, and quality analysis.

The objective of this project is to replace manual report preparation with a centralized analytics portal.



2. Technologies Used

Frontend

* React.js
* Vite
* HTML5
* CSS3
* JavaScript
* Chart.js / Recharts (depending on project)

Backend

* Python
* Flask
* Flask-CORS
* SQLAlchemy
* Pandas
* PyODBC

Database

* Microsoft SQL Server

Other Libraries

* Axios
* dotenv
* OpenPyXL
* NumPy



3. Software Requirements

Install the following software before running the project.

* Python:

Download from

https://python.org

Recommended Version

Python 3.11+


* Node.js:
Download from

https://nodejs.org

Recommended Version

Latest LTS



* Visual Studio Code:

Download from

https://code.visualstudio.com


* Microsoft SQL Server:

Ensure SQL Server is installed or the system has access to the JSPL production database.



* SQL Server ODBC Driver:

Install

ODBC Driver 17 or 18 for SQL Server

4. Installing the Project

* Open Command Prompt.
* Navigate to project folder.
* e.g. PS C:\Users\Admin\Downloads\jspl_hsm_react_premium_CHARTS_UPDATED>

5. Install Backend Liabraries
* Open the command terminal.
* type cd jsp1, then cd jsp, then cd backend.
* Run pip install -r requirements.txt
* Wait until all packages are installed.

6. Install Frontend Liabraries
* open new command terminal and type cd jsp1, and then jsp.
* Now type npm install OR npm.cmd install
(This installs all react projects);

7. Database Configuration
* inside backend folder and go to .env file.
* Update it according to the SQL Server.
* e.g. DB_SERVER=SERVERNAME
       DB_DATABASE=DATABASE_NAME
       DB_USERNAME=USERNAME
       DB_PASSWORD=PASSWORD
       DB_DRIVER=ODBC Driver 17 for SQL Server

* if database credentials change, then only modify this file.

8. Running the Backend
* Open command terminal and navigate to backend folder(cd backend).
* Run python app.py
* If running successfully, it will show a link like http://127.0.0.1:5000
* In order to check whether the databse is connected successfully search http://127.0.0.1:5000/api/database-production 

* Keep this terminal open and open another new terminal.
* Navigate to jsp using cd jsp1 and then cd jsp
* Run npm.cmd run dev OR npm run dev
* The output will be 
   Local: http://localhost:5173

* Open this URL in browser.

9. Login:
* Use-> Username: admin
        password: jspl123

10. Click on use Database data and it will be connected to the database server and it will keep on updating every 30 seconds.
